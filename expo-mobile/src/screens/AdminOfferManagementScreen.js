import React, { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    ScrollView,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import showMessage from '../utils/Toast';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import BottomMenu from '../components/BottomMenu';
import CustomLoader from '../components/CustomLoader';

export default function AdminOfferManagementScreen({ navigation }) {
    const { user: currentUser } = useContext(AuthContext);
    const canWrite = !currentUser?.admin_permissions || currentUser?.admin_permissions?.can_write === true || currentUser?.admin_permissions?.can_write === 1;
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: {
            shops: 1,
            products: 10,
            clients: 10,
            alerts: false,
            stats: false
        },
        prices: [], // This will be generated, not directly edited
        basePrice: '' // New base price field
    });
    const [submitting, setSubmitting] = useState(false);
    const isEditing = !!selectedOffer;
    const [pricingRules, setPricingRules] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);
    const [pricingRulesModalVisible, setPricingRulesModalVisible] = useState(false);
    const [showRules, setShowRules] = useState(false);
    const [newRule, setNewRule] = useState({ duration_months: '', discount_percentage: '' });
    const [notificationType, setNotificationType] = useState('error'); // 'error' or 'success'

    const showNotification = (message, type = 'error') => {
        setErrorMsg(message);
        setNotificationType(type);
        // Auto hide after 3 seconds
        setTimeout(() => setErrorMsg(null), 3000);
    };

    useFocusEffect(
        useCallback(() => {
            fetchOffers();
            fetchPricingRules();
        }, [])
    );

    // ... (keep existing useEffects and functions)

    const handleSaveRule = async () => {
        if (!newRule.duration_months || !newRule.discount_percentage) {
            showNotification('Veuillez remplir la durée et la réduction', 'error');
            return;
        }
        try {
            const payload = {
                duration_months: parseInt(newRule.duration_months),
                discount_percentage: parseInt(newRule.discount_percentage)
            };
            console.log('Sending rule:', payload);

            await axios.post(`${Config.API_URL}/pricing-rules`, payload);
            setNewRule({ duration_months: '', discount_percentage: '' });
            fetchPricingRules();
            showNotification('Règle ajoutée', 'success');
        } catch (error) {
            console.error('Error saving rule:', error.response?.data || error);
            const msg = error.response?.data?.message || 'Erreur lors de l\'ajout';
            showNotification(msg, 'error');
        }
    };

    const handleDeleteRule = async (id) => {
        try {
            await axios.delete(`${Config.API_URL}/pricing-rules/${id}`);
            fetchPricingRules();
            showNotification('Règle supprimée', 'success');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Erreur lors de la suppression';
            showNotification(msg, 'error');
        }
    };




    const fetchOffers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${Config.API_URL}/offers`);
            setOffers(response.data);
        } catch (error) {
            console.error('Fetch offers error:', error);
            showMessage('Impossible de charger les offres', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPricingRules = async () => {
        try {
            const response = await axios.get(`${Config.API_URL}/pricing-rules`);
            if (Array.isArray(response.data)) {
                setPricingRules(response.data);
            } else {
                setPricingRules([]);
            }
        } catch (error) {
            console.error('Fetch pricing rules error:', error);
            // Don't show error to user excessively, might be just network or empty
        }
    };

    // Recalculer les prix automatiquement quand le prix de base change
    const generatePricesFromRules = (basePrice) => {
        const base = parseFloat(basePrice) || 0;
        if (base <= 0) return [];

        // Utiliser une Map pour éviter les doublons (clé = durability_months)
        const pricesMap = new Map();

        // 1. Ajouter le prix de base (1 mois) par défaut
        pricesMap.set(1, {
            duration_months: 1, // Store for sorting
            duration_value: '1',
            duration_unit: 'month',
            discount_percentage: '0',
            price: base.toString()
        });

        // 2. Ajouter les règles globales (écrase le défaut si une règle 1 mois existe)
        if (Array.isArray(pricingRules)) {
            pricingRules.forEach(rule => {
                const durationMonths = rule.duration_months;
                const discount = rule.discount_percentage;

                let unit = 'month';
                let value = durationMonths.toString();

                if (durationMonths >= 12 && durationMonths % 12 === 0) {
                    unit = 'year';
                    value = (durationMonths / 12).toString();
                }

                const rawPrice = base * durationMonths;
                const finalPrice = Math.round(rawPrice * (1 - discount / 100));

                pricesMap.set(durationMonths, {
                    duration_months: durationMonths,
                    duration_value: value,
                    duration_unit: unit,
                    discount_percentage: discount.toString(),
                    price: finalPrice.toString()
                });
            });
        }

        // Convertir en tableau et trier par durée croissante
        return Array.from(pricesMap.values()).sort((a, b) => a.duration_months - b.duration_months);
    };

    const handleSaveOffer = async () => {
        setErrorMsg(null);
        if (!formData.name || !formData.basePrice) {
            setErrorMsg('Nom et Prix de base sont requis');
            return;
        }

        setSubmitting(true);
        try {
            // Seule le prix de base est nécessaire
            const payload = {
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
                base_price: formData.basePrice,
                is_free_temporary: formData.is_free_temporary || false
            };

            if (selectedOffer) {
                const response = await axios.put(`${Config.API_URL}/offers/${selectedOffer.id}`, payload);
                setOffers(offers.map(o => o.id === selectedOffer.id ? response.data : o));
                showMessage('Offre mise à jour avec succès');
            } else {
                const response = await axios.post(`${Config.API_URL}/offers`, payload);
                setOffers([...offers, response.data]);
                showMessage('Offre créée avec succès');
            }
            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data && error.response.data.errors) {
                const errors = Object.values(error.response.data.errors).flat().join('\n');
                setErrorMsg(errors);
            } else {
                setErrorMsg(error.response?.data?.message || 'Enregistrement échoué');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', permissions: { shops: 1, alerts: false, stats: false }, prices: [], basePrice: '', is_free_temporary: false });
        setSelectedOffer(null);
        setErrorMsg(null);
        setShowRules(false);
    };

    const renderOfferItem = ({ item }) => {
        // Affichage intelligent des prix
        let priceDisplay = '';
        if (item.prices && item.prices.length > 0) {
            // Trier pour afficher le plus petit
            const sorted = [...item.prices].sort((a, b) => a.price - b.price);
            // Assuming first one is 1 month
            // Ou on affiche le prix de base
            const baseP = item.base_price || item.price; // Fallback legacy
            priceDisplay = `${parseFloat(baseP).toLocaleString()} XOF / mois`;
        } else {
            priceDisplay = `${item.price?.toLocaleString()} XOF / mois`;
        }

        return (
            <View style={styles.offerItem}>
                <View style={styles.offerInfo}>
                    <Text style={styles.offerName}>{item.name}</Text>
                    <Text style={styles.offerPrice}>{priceDisplay}</Text>
                    {item.prices && item.prices.length > 1 && (
                        <Text style={{ fontSize: 12, color: Colors.textLight, marginTop: 2 }}>
                            {item.prices.length} formules (1 mois, 1 an...)
                        </Text>
                    )}
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => {
                    setSelectedOffer(item);

                    // Reconstruction du state "Frontend"
                    // On utilise le base_price directement
                    const detectedBasePrice = item.base_price ? item.base_price.toString() : (item.price ? item.price.toString() : '');

                    const perms = (typeof item.permissions === 'string')
                        ? JSON.parse(item.permissions)
                        : (item.permissions || { shops: 1, alerts: false, stats: false });

                    setFormData({
                        name: item.name,
                        description: item.description || '',
                        permissions: perms,
                        prices: [],
                        basePrice: detectedBasePrice,
                        is_free_temporary: item.is_free_temporary || false
                    });
                    setModalVisible(true);
                }}>
                    <Ionicons name="pencil" size={20} color={Colors.primary} />
                </TouchableOpacity>
            </View>
        )
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Offres Plateforme</Text>
                <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <CustomLoader />
            ) : (
                <FlatList
                    data={offers}
                    renderItem={renderOfferItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                />
            )}



            {/* Modal Premium Offre */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.fullModal}>
                    <View style={styles.modalTopBar}>
                        <View style={styles.modalDragHandle} />
                        <View style={styles.modalHeaderContent}>
                            <Text style={styles.modalTitleLarge}>{isEditing ? 'Modifier' : 'Nouvelle'} Offre</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>



                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                    >
                        {showRules ? (
                            <ScrollView style={styles.modalForm} contentContainerStyle={{ paddingBottom: 50 }}>
                                <TouchableOpacity onPress={() => setShowRules(false)} style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                                    <Text style={{ color: Colors.primary, marginLeft: 10, fontWeight: '700', fontSize: 16 }}>Retour à l'offre</Text>
                                </TouchableOpacity>

                                <Text style={styles.sectionTitle}>Règles de Réduction Globales</Text>
                                <Text style={{ marginBottom: 20, color: Colors.textLight }}>
                                    Ces règles s'appliquent automatiquement à toutes les offres dès qu'un prix de base est défini.
                                </Text>

                                {Array.isArray(pricingRules) && pricingRules.map((rule, index) => (
                                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F8FAFC', marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: '#EDF2F7' }}>
                                        <View>
                                            <Text style={{ fontWeight: '700', color: Colors.text, fontSize: 16 }}>
                                                {rule.duration_months >= 12 && rule.duration_months % 12 === 0
                                                    ? `${rule.duration_months / 12} An(s)`
                                                    : `${rule.duration_months} Mois`}
                                            </Text>
                                            <Text style={{ color: Colors.primary, fontWeight: '600', marginTop: 4 }}>- {rule.discount_percentage}% de réduction</Text>
                                        </View>
                                        {canWrite && (
                                            <TouchableOpacity onPress={() => handleDeleteRule(rule.id)} style={{ padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8 }}>
                                                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}

                                <View style={{ marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                                    <Text style={{ fontWeight: '700', marginBottom: 15, color: Colors.text, fontSize: 16 }}>Ajouter une nouvelle règle</Text>
                                    <View style={{ flexDirection: 'row', gap: 15 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, color: Colors.textLight, marginBottom: 8, fontWeight: '600' }}>Durée (Mois)</Text>
                                            <TextInput
                                                style={[styles.inputFlex, { borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 12, height: 50, paddingHorizontal: 15, backgroundColor: '#fff' }]}
                                                placeholder="Ex: 6"
                                                keyboardType="numeric"
                                                value={newRule.duration_months}
                                                onChangeText={t => setNewRule({ ...newRule, duration_months: t })}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, color: Colors.textLight, marginBottom: 8, fontWeight: '600' }}>Réduction (%)</Text>
                                            <TextInput
                                                style={[styles.inputFlex, { borderWidth: 1, borderColor: '#EDF2F7', borderRadius: 12, height: 50, paddingHorizontal: 15, backgroundColor: '#fff' }]}
                                                placeholder="Ex: 20"
                                                keyboardType="numeric"
                                                value={newRule.discount_percentage}
                                                onChangeText={t => setNewRule({ ...newRule, discount_percentage: t })}
                                            />
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.saveButtonLarge, { marginTop: 20 }]}
                                        onPress={handleSaveRule}
                                    >
                                        <Ionicons name="add-circle-outline" size={22} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.saveButtonTextLarge}>Ajouter la règle</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        ) : (
                            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                                <View style={styles.formSection}>
                                    <Text style={styles.label}>Nom de l'offre</Text>
                                    <View style={styles.inputContainer}>
                                        <View style={styles.inputIcon}>
                                            <Ionicons name="ribbon-outline" size={20} color={Colors.textLight} />
                                        </View>
                                        <TextInput
                                            style={styles.inputFlex}
                                            value={formData.name}
                                            onChangeText={t => setFormData({ ...formData, name: t })}
                                            placeholder="Ex: Pack Premium"
                                        />
                                    </View>
                                </View>

                                <View style={styles.formSection}>
                                    <Text style={styles.label}>Prix de Base (1 Mois)</Text>
                                    <View style={styles.inputContainer}>
                                        <View style={styles.inputIcon}>
                                            <Ionicons name="cash-outline" size={20} color={Colors.textLight} />
                                        </View>
                                        <TextInput
                                            style={styles.inputFlex}
                                            keyboardType="numeric"
                                            value={formData.basePrice}
                                            onChangeText={t => setFormData({ ...formData, basePrice: t })}
                                            placeholder="Ex: 5000"
                                        />
                                        <Text style={{ color: Colors.textLight, fontSize: 12, marginRight: 5 }}>F</Text>
                                    </View>
                                </View>

                                <View style={styles.formSection}>
                                    <Text style={styles.label}>Tarifs calculés automatiquement</Text>
                                    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#EDF2F7' }}>
                                        {formData.basePrice ? (
                                            generatePricesFromRules(formData.basePrice).map((p, index) => (
                                                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
                                                    <Text style={{ color: Colors.text, fontWeight: '500' }}>
                                                        {p.duration_value} {p.duration_unit === 'year' ? (parseFloat(p.duration_value) > 1 ? 'Ans' : 'An') : 'Mois'}
                                                        {parseFloat(p.discount_percentage) > 0 && <Text style={{ color: Colors.primary, fontSize: 12 }}> (-{p.discount_percentage}%)</Text>}
                                                    </Text>
                                                    <Text style={{ fontWeight: 'bold', color: Colors.text }}>
                                                        {parseInt(p.price).toLocaleString()} XOF
                                                    </Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={{ color: Colors.textLight, fontStyle: 'italic', textAlign: 'center' }}>Entrez un prix de base pour voir les tarifs</Text>
                                        )}
                                    </View>
                                    <Text style={{ marginTop: 10, alignSelf: 'center', color: Colors.textLight, fontSize: 12 }}>
                                        Basé sur les règles de tarification globale
                                    </Text>
                                    <TouchableOpacity
                                        style={{ marginTop: 10, alignSelf: 'center' }}
                                        onPress={() => setShowRules(true)}
                                    >
                                        <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' }}>Modifier les règles globales</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formSection}>
                                    <Text style={styles.label}>Description</Text>
                                    <TextInput
                                        style={styles.textArea}
                                        multiline
                                        numberOfLines={4}
                                        value={formData.description}
                                        onChangeText={t => setFormData({ ...formData, description: t })}
                                        placeholder="Détails de l'offre..."
                                    />
                                </View>
                                {/* Permissions section continues below... */}

                                <Text style={styles.sectionTitle}>Permissions</Text>
                                <View style={styles.switchRow}>
                                    <Text>Nombre max boutiques</Text>
                                    <TextInput
                                        style={[styles.input, { width: 60, marginBottom: 0 }]}
                                        keyboardType="numeric"
                                        value={formData.permissions?.shops?.toString() || ''}
                                        onChangeText={t => setFormData({ ...formData, permissions: { ...formData.permissions, shops: parseInt(t) || 0 } })}
                                    />
                                </View>
                                <View style={styles.switchRow}>
                                    <Text>Nombre max produits</Text>
                                    <TextInput
                                        style={[styles.input, { width: 60, marginBottom: 0 }]}
                                        keyboardType="numeric"
                                        value={formData.permissions?.products?.toString() || ''}
                                        onChangeText={t => setFormData({ ...formData, permissions: { ...formData.permissions, products: parseInt(t) || 0 } })}
                                    />
                                </View>
                                <View style={styles.switchRow}>
                                    <Text>Nombre max clients</Text>
                                    <TextInput
                                        style={[styles.input, { width: 60, marginBottom: 0 }]}
                                        keyboardType="numeric"
                                        value={formData.permissions?.clients?.toString() || ''}
                                        onChangeText={t => setFormData({ ...formData, permissions: { ...formData.permissions, clients: parseInt(t) || 0 } })}
                                    />
                                </View>

                                <TouchableOpacity style={styles.checkRow} onPress={() => setFormData({ ...formData, permissions: { ...formData.permissions, stock_alerts: !formData.permissions.stock_alerts } })}>
                                    <Ionicons name={formData.permissions.stock_alerts ? "checkbox" : "square-outline"} size={22} color={Colors.primary} />
                                    <Text style={{ marginLeft: 10 }}>Alertes Stock (critique)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.checkRow} onPress={() => setFormData({ ...formData, permissions: { ...formData.permissions, alerts: !formData.permissions.alerts } })}>
                                    <Ionicons name={formData.permissions.alerts ? "checkbox" : "square-outline"} size={22} color={Colors.primary} />
                                    <Text style={{ marginLeft: 10 }}>Alertes Avancées (Dettes)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.checkRow} onPress={() => setFormData({ ...formData, permissions: { ...formData.permissions, invoices: !formData.permissions.invoices } })}>
                                    <Ionicons name={formData.permissions.invoices ? "checkbox" : "square-outline"} size={22} color={Colors.primary} />
                                    <Text style={{ marginLeft: 10 }}>Factures PDF</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.checkRow} onPress={() => setFormData({ ...formData, permissions: { ...formData.permissions, stats: !formData.permissions.stats } })}>
                                    <Ionicons name={formData.permissions.stats ? "checkbox" : "square-outline"} size={22} color={Colors.primary} />
                                    <Text style={{ marginLeft: 10 }}>Stats avancées</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.checkRow} onPress={() => setFormData({ ...formData, permissions: { ...formData.permissions, export_excel: !formData.permissions.export_excel } })}>
                                    <Ionicons name={formData.permissions.export_excel ? "checkbox" : "square-outline"} size={22} color={Colors.primary} />
                                    <Text style={{ marginLeft: 10 }}>Export Excel (Produits/Ventes/Stats)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.saveButtonLarge} onPress={handleSaveOffer} disabled={submitting}>
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 10 }} />
                                            <Text style={styles.saveButtonTextLarge}>Enregistrer l'offre</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <View style={{ height: 50 }} />
                            </ScrollView>
                        )}
                    </KeyboardAvoidingView>

                    {errorMsg && (
                        <View style={[styles.toastContainer, { backgroundColor: notificationType === 'success' ? '#4CAF50' : '#FF5252' }]}>
                            <Text style={styles.toastText}>{errorMsg}</Text>
                        </View>
                    )}
                </SafeAreaView>
            </Modal >
            <BottomMenu navigation={navigation} activeTab="AdminOffers" isAdmin={true} />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    loadingContainer: { flex: 1, justifyContent: 'center' },
    listContent: { padding: 20, paddingBottom: 110 },
    offerItem: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 22,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1
    },
    offerName: { fontSize: 17, fontWeight: '800', color: Colors.text },
    offerPrice: { color: Colors.primary, marginTop: 4, fontWeight: '700', fontSize: 15 },
    fullModal: { flex: 1, backgroundColor: '#F8FAFC' },
    modalTopBar: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 15, paddingTop: Platform.OS === 'android' ? 10 : 0 },
    modalDragHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 15 },
    modalHeaderContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25 },
    modalTitleLarge: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    modalForm: { padding: 25 },
    formSection: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, height: 60, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EDF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5 },
    inputIcon: { width: 35, alignItems: 'center' },
    inputFlex: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '600', paddingLeft: 5 },
    textArea: { backgroundColor: '#fff', borderRadius: 16, padding: 15, fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: '#EDF2F7', height: 120, textAlignVertical: 'top' },
    saveButtonLarge: {
        backgroundColor: Colors.primary,
        height: 50,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
        marginTop: 20,
        alignSelf: 'center',
        paddingHorizontal: 30,
        minWidth: 200
    },
    saveButtonTextLarge: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' },
    // Existing styles that were part of the modal but are now outside the new modal structure
    // modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 }, // Replaced by modalTopBar, modalHeaderContent
    // modalTitle: { fontSize: 20, fontWeight: 'bold' }, // Replaced by modalTitleLarge
    input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#EDF2F7', textAlign: 'center', fontSize: 16, fontWeight: '600', color: Colors.text },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 25, marginBottom: 15 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    saveButton: { backgroundColor: Colors.primary, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 30 }, // This seems to be an old save button, kept for now as it's not explicitly removed
    saveButtonText: { color: '#fff', fontWeight: 'bold' }, // Related to old save button
    editButton: { padding: 5 },
    toastContainer: {
        position: 'absolute',
        top: 80,
        alignSelf: 'center',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        zIndex: 9999, // Increased zIndex drastically
        elevation: 100, // Increased elevation drastically for Android
        maxWidth: '90%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    toastText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
    inputSmall: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        height: 40
    },
    toggleSmall: {
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        maxHeight: '80%',
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text
    },
    confirmButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});
