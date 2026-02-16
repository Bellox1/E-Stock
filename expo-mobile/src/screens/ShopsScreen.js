import React, { useState, useEffect, useContext } from 'react';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Config from '../constants/Config';
import CustomLoader from '../components/CustomLoader';
import { ShopContext } from '../context/ShopContext';

export default function ShopsScreen({ navigation }) {
    const { getPermission } = useContext(AuthContext);
    const { shops, selectShop, refreshShops, loading: contextLoading, selectedShop: activeShop, showAllShops, setShowAllShops } = useContext(ShopContext);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', address: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [selectedShop, setSelectedShop] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        refreshShops();
    }, []);

    const handleSelectShop = async (shop) => {
        try {
            setLoading(true);
            await selectShop(shop);
            navigation.navigate('Dashboard');
        } catch (error) {
            console.error('Select shop error:', error);
            showMessage('Erreur lors de la sélection');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveShop = async () => {
        if (!formData.name) {
            showMessage('Le nom est obligatoire');
            return;
        }

        setSubmitting(true);
        try {
            if (isEditing) {
                const response = await axios.put(`${Config.API_URL}/shops/${selectedShop.id}`, formData);
                showMessage('Boutique modifiée');
            } else {
                const response = await axios.post(`${Config.API_URL}/shops`, formData);
                showMessage('Boutique créée');
            }
            await refreshShops();
            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error('Save shop error:', error);
            if (error.response && error.response.status === 403) {
                const message = error.response.data.message || 'Action non autorisée';

                // Vérifie si le message parle de limite (envoyé par le backend)
                if (message.toLowerCase().includes('limite')) {
                    showMessage('Limite atteinte !');
                    setModalVisible(false);
                    navigation.navigate('Offers');
                } else {
                    showMessage(message, 'error');
                }
            } else {
                showMessage('L\'opération a échoué', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteShop = (shop) => {
        if (shops.length <= 1) {
            showMessage('Vous devez garder au moins une boutique.');
            return;
        }

        Alert.alert('Suppression', `Voulez-vous supprimer la boutique "${shop.name}" ? Tous les produits liés seront inaccessibles.`, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${Config.API_URL}/shops/${shop.id}`);
                        await refreshShops();
                        showMessage('Boutique supprimée');
                    } catch (error) {
                        showMessage('Impossible de supprimer cette boutique');
                    }
                }
            }
        ]);

    };

    const resetForm = () => {
        setFormData({ name: '', address: '', description: '' });
        setSelectedShop(null);
        setIsEditing(false);
    };

    const openEditModal = (shop) => {
        setSelectedShop(shop);
        setFormData({
            name: shop.name,
            address: shop.address || '',
            description: shop.description || ''
        });
        setIsEditing(true);
        setModalVisible(true);
    };

    const renderShopItem = ({ item }) => (
        <View style={[styles.shopCard, (activeShop?.id === item.id && !showAllShops) && styles.activeShopCard]}>
            <TouchableOpacity style={styles.shopCardMain} onPress={() => handleSelectShop(item)}>
                <View style={[styles.shopIconBox, (activeShop?.id === item.id && !showAllShops) && styles.activeShopIconBox]}>
                    <Ionicons name="business" size={24} color={Colors.white} />
                </View>
                <View style={styles.shopTitleBox}>
                    <Text style={styles.shopName}>{item.name} {(activeShop?.id === item.id && !showAllShops) && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}</Text>
                    <Text style={styles.shopAddress} numberOfLines={1}>{item.address || 'Adresse non spécifiée'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <View style={styles.shopCardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
                    <Ionicons name="pencil" size={18} color={Colors.primary} />
                    <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Modifier</Text>
                </TouchableOpacity>
                {shops.length > 1 && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteShop(item)}>
                        <Ionicons name="trash" size={18} color={Colors.error} />
                        <Text style={[styles.actionBtnText, { color: Colors.error }]}>Supprimer</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        const limit = getPermission('shops', 1);
                        if (shops.length >= limit) {
                            Alert.alert(
                                'Limite atteinte',
                                `Votre offre actuelle est limitée à ${limit} boutique(s). Veuillez passer à une offre supérieure pour en ajouter d'autres.`,
                                [
                                    { text: 'Plus tard', style: 'cancel' },
                                    { text: 'Voir les offres', onPress: () => navigation.navigate('Offers') }
                                ]
                            );
                            return;
                        }
                        resetForm();
                        setModalVisible(true);
                    }}
                    style={styles.headerIconBtn}
                >
                    <Ionicons name="add" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={shops}
                ListHeaderComponent={shops.length > 1 ? (
                    <TouchableOpacity
                        style={[styles.shopCard, showAllShops && styles.activeShopCard, { marginBottom: 20, backgroundColor: showAllShops ? '#EFF6FF' : '#F8FAFC', borderStyle: 'dashed' }]}
                        onPress={() => {
                            setShowAllShops(true);
                            navigation.navigate('Dashboard');
                        }}
                    >
                        <View style={styles.shopCardMain}>
                            <View style={[styles.shopIconBox, showAllShops && styles.activeShopIconBox, { backgroundColor: showAllShops ? Colors.primary : '#475569' }]}>
                                <Ionicons name="grid" size={24} color={Colors.white} />
                            </View>
                            <View style={styles.shopTitleBox}>
                                <Text style={[styles.shopName, showAllShops && { color: Colors.primary }]}>Toutes les boutiques {showAllShops && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}</Text>
                                <Text style={styles.shopAddress}>Vue d'ensemble combinée</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                        </View>
                    </TouchableOpacity>
                ) : null}
                renderItem={renderShopItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="storefront-outline" size={80} color={Colors.textLight} />
                            <Text style={styles.emptyText}>Aucune boutique enregistrée</Text>
                        </View>
                    )
                }
            />

            {(loading || contextLoading) && <CustomLoader />}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{isEditing ? 'Modifier' : 'Nouvelle'} Boutique</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={Colors.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Nom de la boutique *</Text>
                                    <TextInput style={styles.modalInput} placeholder="Ex: Ma Boutique Bio" value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} />
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Adresse</Text>
                                    <TextInput style={styles.modalInput} placeholder="Ex: Abidjan, Cocody" value={formData.address} onChangeText={t => setFormData({ ...formData, address: t })} />
                                </View>
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Description</Text>
                                    <TextInput style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]} placeholder="Petite description..." multiline value={formData.description} onChangeText={t => setFormData({ ...formData, description: t })} />
                                </View>
                                <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.7 }]} onPress={handleSaveShop} disabled={submitting}>
                                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{isEditing ? 'Sauvegarder' : 'Créer la boutique'}</Text>}
                                </TouchableOpacity>
                                <View style={{ height: 20 }} />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    headerTitle: { display: 'none' },
    headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    loadingContainer: { flex: 1, justifyContent: 'center' },
    listContent: { padding: 20 },
    shopCard: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
    activeShopCard: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
    shopCardMain: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    shopIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    activeShopIconBox: { backgroundColor: Colors.primary },
    shopTitleBox: { flex: 1, marginLeft: 15 },
    shopName: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.text },
    shopAddress: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontFamily: 'Poppins_400Regular' },
    shopCardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: '#FAFBFC' },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 5 },
    actionBtnText: { fontSize: 12, fontFamily: 'Poppins_700Bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold' },
    formGroup: { marginBottom: 15 },
    label: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', marginBottom: 8, color: Colors.textLight },
    modalInput: { backgroundColor: '#f3f4f6', borderRadius: 12, height: 55, paddingHorizontal: 15, fontSize: 16, fontFamily: 'Poppins_400Regular' },
    submitButton: { backgroundColor: Colors.primary, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    submitButtonText: { color: '#fff', fontFamily: 'Poppins_700Bold', fontSize: 16 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textLight, marginTop: 10, fontSize: 16, fontFamily: 'Poppins_400Regular' }

});
