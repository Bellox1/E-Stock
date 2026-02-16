import React, { useContext, useState, useEffect } from 'react';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Config from '../constants/Config';
import CustomLoader from '../components/CustomLoader';
import BottomMenu from '../components/BottomMenu';

export default function ProfileScreen({ navigation }) {
    const { user, logout, setUser, appConfig } = useContext(AuthContext);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [otpModalVisible, setOtpModalVisible] = useState(false);

    // Form states for profile editing
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [otpCode, setOtpCode] = useState('');
    const [editingField, setEditingField] = useState(null);
    const [loading, setLoading] = useState(false);

    // Sync input fields when user data changes
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Déconnexion', style: 'destructive', onPress: logout }
            ]
        );
    };

    const handlePrepareUpdate = async () => {
        if (!name || !email) {
            showMessage('Le nom et l\'email sont obligatoires');
            return;
        }

        // Si l'un des champs sensibles a changé, on demande un OTP
        if (email !== user.email || phone !== user.phone) {
            setLoading(true);
            try {
                const response = await axios.post(`${Config.API_URL}/user/request-profile-otp`);
                showMessage(response.data.message);
                setOtpModalVisible(true);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                showMessage(error.response?.data?.message || 'Impossible d\'envoyer le code');
            } finally {
                setLoading(false);
            }
        } else {
            // Sinon on met à jour directement le nom
            performUpdate();
        }
    };

    const performUpdate = async () => {
        setLoading(true);
        try {
            const data = { name, email, phone };
            if (otpCode) data.otp_code = otpCode;

            const response = await axios.put(`${Config.API_URL}/user/profile`, data);

            setUser(response.data.user);
            showMessage('Profil mis à jour avec succès');
            setProfileModalVisible(false);
            setOtpModalVisible(false);
            setOtpCode('');
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            showMessage(error.response?.data?.message || 'Erreur lors de la mise à jour');
        } finally {
            setLoading(false);
        }
    };

    const getRemainingDays = () => {
        if (!user?.active_subscription?.ends_at) return null;
        const now = new Date();
        const end = new Date(user.active_subscription.ends_at);
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const formatRemainingTime = () => {
        const totalDays = getRemainingDays();
        if (totalDays === null) return null;
        if (totalDays === 0) return 'Expire aujourd\'hui';

        if (totalDays >= 30) {
            const months = Math.floor(totalDays / 30);
            const days = totalDays % 30;
            if (days === 0) {
                return months === 1 ? '1 mois restant' : `${months} mois restants`;
            }
            const monthStr = months === 1 ? '1 mois' : `${months} mois`;
            const dayStr = days === 1 ? '1 jour' : `${days} jours`;
            return `${monthStr} et ${dayStr} restants`;
        }

        if (totalDays === 1) return '1 jour restant';
        return `${totalDays} jours restants`;
    };

    const openEdit = (field) => {
        setEditingField(field);
        setName(user?.name || '');
        setEmail(user?.email || '');
        setPhone(user?.phone || '');
        setProfileModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Paramètres Profil</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.headerCardWrapper}>
                    <View style={styles.headerCard}>
                        <View>
                            <View style={styles.bigAvatarCircle}>
                                <Text style={styles.bigAvatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
                            </View>
                            <View style={styles.crownBadge}>
                                <MaterialCommunityIcons name="crown" size={22} color="#FFD700" />
                            </View>
                        </View>

                        <View style={styles.headerInfoText}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                <Text style={styles.headerName}>{user?.name || 'Utilisateur'}</Text>
                                {user?.active_subscription?.offer && (
                                    <View style={styles.planBadge}>
                                        <Ionicons name="star" size={10} color="#fff" />
                                        <Text style={styles.planBadgeText}>{user.active_subscription.offer.name}</Text>
                                    </View>
                                )}
                            </View>
                            {user?.active_subscription && (
                                <View style={styles.remainingTimeBox}>
                                    <Ionicons name="time-outline" size={12} color={Colors.primary} />
                                    <Text style={styles.remainingTimeText}>{formatRemainingTime()}</Text>
                                </View>
                            )}
                            <Text style={styles.headerSubText}>{user?.email || 'email@exemple.com'}</Text>
                            <Text style={styles.headerSubText}>{user?.phone || 'Aucun téléphone'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.listSection}>
                    <Text style={styles.sectionLabel}>Détails du compte</Text>

                    <TouchableOpacity style={styles.nakedRow} onPress={() => openEdit('name')}>
                        <View style={styles.nakedIconBox}><Ionicons name="person-outline" size={22} color="#64748B" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabelText}>Nom complet</Text>
                            <Text style={styles.rowValueText}>{user?.name || 'Non défini'}</Text>
                        </View>
                        <Ionicons name="pencil-outline" size={18} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nakedRow} onPress={() => openEdit('email')}>
                        <View style={styles.nakedIconBox}><Ionicons name="mail-outline" size={22} color="#64748B" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabelText}>Adresse Email</Text>
                            <Text style={styles.rowValueText}>{user?.email || 'Non défini'}</Text>
                        </View>
                        <Ionicons name="pencil-outline" size={18} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nakedRow} onPress={() => openEdit('phone')}>
                        <View style={styles.nakedIconBox}><Ionicons name="call-outline" size={22} color="#64748B" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowLabelText}>Téléphone</Text>
                            <Text style={styles.rowValueText}>{user?.phone || 'Non défini'}</Text>
                        </View>
                        <Ionicons name="pencil-outline" size={18} color="#94A3B8" />
                    </TouchableOpacity>

                    <Text style={[styles.sectionLabel, { marginTop: 30 }]}>Sécurité & Services</Text>

                    <TouchableOpacity style={styles.nakedRow} onPress={() => navigation.navigate('Shops')}>
                        <View style={styles.nakedIconBox}><Ionicons name="business-outline" size={22} color="#64748B" /></View>
                        <Text style={styles.nakedMenuText}>Gérer mes boutiques</Text>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nakedRow} onPress={() => navigation.navigate('Privacy')}>
                        <View style={styles.nakedIconBox}><Ionicons name="lock-closed-outline" size={22} color="#64748B" /></View>
                        <Text style={styles.nakedMenuText}>Sécurité</Text>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.nakedRow} onPress={() => navigation.navigate('Offers')}>
                        <View style={styles.nakedIconBox}><Ionicons name="card-outline" size={22} color="#64748B" /></View>
                        <Text style={styles.nakedMenuText}>Mon Abonnement</Text>
                        <Ionicons name="chevron-forward" size={18} color="#CBD5E0" />
                    </TouchableOpacity>


                    <TouchableOpacity style={[styles.nakedRow, { marginTop: 20 }]} onPress={handleLogout}>
                        <View style={styles.nakedIconBox}><Ionicons name="log-out-outline" size={22} color={Colors.error} /></View>
                        <Text style={[styles.nakedMenuText, { color: Colors.error }]}>Déconnexion</Text>
                    </TouchableOpacity>
                </View>

                {appConfig?.by_logo_url && (
                    <View style={styles.poweredByContainer}>
                        <Text style={styles.poweredByText}>Powered by</Text>
                        <Image
                            source={{ uri: appConfig.by_logo_url }}
                            style={styles.poweredByLogo}
                            resizeMode="contain"
                        />
                    </View>
                )}
                <View style={{ height: 60 }} />
            </ScrollView>

            {/* MODAL EDIT FIELD */}
            <Modal visible={profileModalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setProfileModalVisible(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Mise à jour</Text>
                            <TouchableOpacity onPress={() => setProfileModalVisible(false)}><Ionicons name="close" size={26} color={Colors.text} /></TouchableOpacity>
                        </View>

                        {!otpModalVisible ? (
                            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>
                                        {editingField === 'name' ? 'Votre nom complet' :
                                            editingField === 'email' ? 'Nouvelle adresse email' :
                                                'Numéro de téléphone'}
                                    </Text>
                                    <View style={styles.inputWithIcon}>
                                        <Ionicons
                                            name={editingField === 'name' ? "person-outline" : editingField === 'email' ? "mail-outline" : "call-outline"}
                                            size={20} color="#64748B" style={{ marginRight: 10 }}
                                        />
                                        <TextInput
                                            style={styles.flexInput}
                                            value={editingField === 'name' ? name : editingField === 'email' ? email : phone}
                                            onChangeText={editingField === 'name' ? setName : editingField === 'email' ? setEmail : setPhone}
                                            keyboardType={editingField === 'email' ? 'email-address' : editingField === 'phone' ? 'phone-pad' : 'default'}
                                            autoFocus
                                        />
                                    </View>
                                </View>
                                {(() => {
                                    const isModified = name !== (user?.name || '') || email !== (user?.email || '') || phone !== (user?.phone || '');
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                styles.mainBtn,
                                                (loading || !isModified) && { opacity: 0.6, backgroundColor: '#94A3B8' }
                                            ]}
                                            onPress={handlePrepareUpdate}
                                            disabled={loading || !isModified}
                                        >
                                            <Text style={styles.mainBtnText}>Suivant</Text>
                                        </TouchableOpacity>
                                    );
                                })()}
                            </ScrollView>
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <Text style={styles.otpSubtitle}>Veuillez saisir le code de confirmation envoyé à votre email actuel.</Text>
                                <View style={styles.inputGroup}>
                                    <View style={styles.inputWithIcon}>
                                        <Ionicons name="key-outline" size={20} color="#64748B" style={{ marginRight: 10 }} />
                                        <TextInput
                                            style={styles.flexInput}
                                            placeholder="Code à 6 chiffres"
                                            value={otpCode}
                                            onChangeText={setOtpCode}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            autoFocus
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity style={[styles.mainBtn, loading && { opacity: 0.6 }]} onPress={performUpdate} disabled={loading}>
                                    <Text style={styles.mainBtnText}>Confirmer</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ marginTop: 15, alignItems: 'center' }} onPress={() => setOtpModalVisible(false)}>
                                    <Text style={{ color: '#64748B', fontWeight: '600' }}>Retour</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <Modal transparent visible={loading} animationType="fade">
                <CustomLoader />
            </Modal>
            <BottomMenu navigation={navigation} activeTab="Profile" isAdmin={user?.is_admin} />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { paddingBottom: 110 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
    headerBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
    headerCardWrapper: { paddingHorizontal: 20, marginTop: 20 },
    headerCard: { flexDirection: 'row', alignItems: 'center', paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    bigAvatarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.white, borderWidth: 3, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 20 },
    bigAvatarText: { fontSize: 40, fontWeight: '800', color: Colors.primary },
    crownBadge: {
        position: 'absolute',
        top: -5,
        right: 15,
        backgroundColor: '#fff',
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3
    },


    headerInfoText: { flex: 1 },
    headerName: { fontSize: 22, fontWeight: '800', color: Colors.text },
    planBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginLeft: 8, gap: 4, height: 20 },
    planBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    remainingTimeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: '#DBEAFE'
    },
    remainingTimeText: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: 'bold',
        marginLeft: 4
    },
    headerSubText: { fontSize: 13, color: '#64748B', marginTop: 2 },
    listSection: { paddingHorizontal: 20, marginTop: 20 },
    sectionLabel: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 1 },
    nakedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    nakedIconBox: { width: 40, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
    rowLabelText: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
    rowValueText: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 2 },
    nakedMenuText: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 30, paddingBottom: Platform.OS === 'ios' ? 50 : 30, width: '100%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 20, fontWeight: '900', color: Colors.text },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 10, marginLeft: 5 },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: '#E2E8F0' },
    flexInput: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text, height: '100%' },
    mainBtn: { backgroundColor: '#3B82F6', borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 10 },
    mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    otpSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 20 },
    poweredByContainer: { alignItems: 'center', marginTop: 30, opacity: 0.7 },
    poweredByText: { fontSize: 10, color: Colors.textLight, marginBottom: 2 },
    poweredByLogo: { width: 80, height: 25 }
});
