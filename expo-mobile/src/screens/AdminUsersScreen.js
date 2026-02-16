import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Linking,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import BottomMenu from '../components/BottomMenu';
import CustomLoader from '../components/CustomLoader';

export default function AdminUsersScreen({ navigation }) {
    const { user: currentUser } = useContext(AuthContext);
    const canWrite = !currentUser?.admin_permissions || currentUser?.admin_permissions?.can_write === true || currentUser?.admin_permissions?.can_write === 1;
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'inactive', 'admins'

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, activeFilter, users]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${Config.API_URL}/admin/users`);
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (error) {
            console.error('Fetch users error:', error);
            showMessage('Impossible de charger les marchands', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        // Uniquement les MARCHANDS (non-admins)
        let result = users.filter(u => u.is_admin === false || u.is_admin === 0 || u.is_admin === null);

        // Filtre par recherche
        if (searchQuery) {
            result = result.filter(u =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.phone && u.phone.includes(searchQuery)) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filtre par abonnement
        if (activeFilter === 'active') {
            result = result.filter(u => u.active_subscription !== null);
        } else if (activeFilter === 'inactive') {
            result = result.filter(u => u.active_subscription === null);
        }

        setFilteredUsers(result);
    };

    const handleCall = (phone) => {
        if (!phone) {
            showMessage('Indisponible', 'error');
            return;
        }
        Linking.openURL(`tel:${phone}`);
    };

    const renderUserItem = ({ item }) => (
        <View style={styles.userItem}>
            <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
                <View style={styles.userNameContainer}>
                    <Text style={styles.userName}>{item.name}</Text>
                    {item.is_admin ? (
                        <View style={styles.adminBadge}>
                            <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                    ) : item.active_subscription && (
                        <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>{item.active_subscription.offer?.name || 'Abonné'}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.userEmail}>{item.email}</Text>
                <Text style={styles.userPhone}>{item.phone || 'Pas de numéro'}</Text>
                <Text style={styles.userShops}>{item.shops_count} boutique(s)</Text>
            </View>
            <View style={styles.userActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#E1F5FE' }]}
                    onPress={() => handleCall(item.phone)}
                >
                    <Ionicons name="call" size={20} color="#0288D1" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#F5F5F5' }]}
                    onPress={() => showMessage(`Membre depuis: ${new Date(item.created_at).toLocaleDateString()}`)}
                >
                    <Ionicons name="information-circle" size={20} color={Colors.textLight} />
                </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Gestion Marchands</Text>
                <TouchableOpacity onPress={fetchUsers} style={styles.headerIcon}>
                    <Ionicons name="refresh" size={22} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <CustomLoader />
            ) : (
                <>
                    <View style={styles.searchBox}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={Colors.textLight} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher un marchand..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    <View style={styles.filterBar}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                            <TouchableOpacity
                                style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]}
                                onPress={() => setActiveFilter('all')}
                            >
                                <Text style={[styles.filterBtnText, activeFilter === 'all' && styles.filterBtnTextActive]}>Tout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterBtn, activeFilter === 'active' && styles.filterBtnActive]}
                                onPress={() => setActiveFilter('active')}
                            >
                                <Text style={[styles.filterBtnText, activeFilter === 'active' && styles.filterBtnTextActive]}>Abonnés</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterBtn, activeFilter === 'inactive' && styles.filterBtnActive]}
                                onPress={() => setActiveFilter('inactive')}
                            >
                                <Text style={[styles.filterBtnText, activeFilter === 'inactive' && styles.filterBtnTextActive]}>Non Abonnés</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    <FlatList
                        data={filteredUsers}
                        renderItem={renderUserItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={60} color={Colors.textLight} />
                                <Text style={styles.emptyText}>Aucun marchand trouvé</Text>
                            </View>
                        }
                    />
                </>
            )}

            <BottomMenu navigation={navigation} activeTab="AdminUsers" isAdmin={true} />
        </SafeAreaView>
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
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    headerIcon: { marginLeft: 15 },
    searchBox: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#ffffff' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FE', paddingHorizontal: 12, height: 45, borderRadius: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: Colors.text },
    filterBar: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12 },
    filterScroll: { paddingHorizontal: 15 },
    filterBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#EBF0FF' },
    filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterBtnText: { fontSize: 13, color: Colors.textLight, fontWeight: '600' },
    filterBtnTextActive: { color: '#fff' },
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
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1
    },
    userAvatar: { width: 45, height: 45, borderRadius: 12, backgroundColor: Colors.primary + '10', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    avatarText: { color: Colors.primary, fontWeight: 'bold', fontSize: 18 },
    userInfo: { flex: 1 },
    userNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userName: { fontSize: 15, fontWeight: '800', color: Colors.text },
    activeBadge: { backgroundColor: '#10B98115', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    activeBadgeText: { fontSize: 9, color: '#10B981', fontWeight: 'bold' },
    adminBadge: { backgroundColor: '#EAB30815', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    adminBadgeText: { fontSize: 9, color: '#EAB308', fontWeight: 'bold' },
    userEmail: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
    userPhone: { fontSize: 11, color: Colors.textLight, marginTop: 1 },
    userShops: { fontSize: 11, color: Colors.primary, marginTop: 4, fontWeight: '700' },
    userActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textLight, marginTop: 10, fontSize: 15, fontWeight: '600' }
});
