import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import BottomMenu from '../components/BottomMenu';

export default function AdminTeamScreen({ navigation }) {
    const { user: currentUser } = useContext(AuthContext);
    const canWrite = !currentUser?.admin_permissions || currentUser?.admin_permissions?.can_write === true || currentUser?.admin_permissions?.can_write === 1;
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchAdmins();
        }, [])
    );

    const fetchAdmins = async () => {
        try {
            const response = await axios.get(`${Config.API_URL}/admin/users`);
            // Filtrer uniquement les admins
            const onlyAdmins = response.data.filter(u => u.is_admin === true || u.is_admin === 1);
            setAdmins(onlyAdmins);
        } catch (error) {
            console.error('Fetch admins error:', error);
            showMessage('Impossible de charger l\'équipe', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone) => {
        if (!phone) {
            showMessage('Indisponible', 'error');
            return;
        }
        Linking.openURL(`tel:${phone}`);
    };

    const handleDeleteAdmin = (admin) => {
        Alert.alert(
            'Supprimer',
            `Voulez-vous vraiment supprimer ${admin.name} de l'équipe ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await axios.delete(`${Config.API_URL}/admin/sub-admins/${admin.id}`);
                            showMessage('Administrateur supprimé');
                            fetchAdmins();
                        } catch (error) {
                            const msg = error.response?.data?.message || 'Erreur lors de la suppression';
                            showMessage(msg, 'error');
                        }
                    }
                }
            ]
        );
    };

    const renderAdminItem = ({ item }) => (
        <View style={styles.userItem}>
            <View style={styles.userAvatar}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            </View>
            <View style={styles.userInfo}>
                <View style={styles.userNameContainer}>
                    <Text style={styles.userName}>
                        {item.name} {item.id === currentUser?.id && '(Moi)'}
                    </Text>
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>
                            {!item.admin_permissions
                                ? 'SUPER ADMIN'
                                : item.admin_permissions.can_write
                                    ? 'LECTURE / ÉCRITURE'
                                    : 'LECTURE SEULE'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userPhone}>{item.phone || 'Pas de numéro'}</Text>
            </View>
            <View style={styles.userActions}>
                {item.id !== currentUser?.id ? (
                    <>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#E1F5FE' }]}
                            onPress={() => handleCall(item.phone)}
                        >
                            <Ionicons name="call" size={18} color="#0288D1" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#F3E5F5' }]}
                            onPress={() => navigation.navigate('AdminCreateSubAdmin', { admin: item })}
                        >
                            <Ionicons name="create" size={18} color="#9C27B0" />
                        </TouchableOpacity>
                        {canWrite && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
                                onPress={() => handleDeleteAdmin(item)}
                            >
                                <Ionicons name="trash" size={18} color="#D32F2 XOF" />
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#F5F5F5' }]}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Ionicons name="person" size={18} color={Colors.textLight} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Équipe Admin</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AdminCreateSubAdmin')}>
                    <Ionicons name="person-add" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={admins}
                    renderItem={renderAdminItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="shield-outline" size={60} color={Colors.textLight} />
                            <Text style={styles.emptyText}>Aucun autre administrateur</Text>
                        </View>
                    }
                />
            )}

            <BottomMenu navigation={navigation} activeTab="AdminUsers" isAdmin={true} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
    loadingContainer: { flex: 1, justifyContent: 'center' },
    listContent: { padding: 20, paddingTop: 10, paddingBottom: 110 },
    userItem: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EBF0FF'
    },
    userAvatar: { width: 45, height: 45, borderRadius: 12, backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    userInfo: { flex: 1 },
    userNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
    userName: { fontSize: 15, fontWeight: '800', color: Colors.text },
    adminBadge: { backgroundColor: '#EAB30815', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    adminBadgeText: { fontSize: 8, color: '#EAB308', fontWeight: '900' },
    userEmail: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
    userPhone: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
    userActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textLight, marginTop: 10, fontSize: 15, fontWeight: '600' }
});
