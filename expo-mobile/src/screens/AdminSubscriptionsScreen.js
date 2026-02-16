import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import showMessage from '../utils/Toast';
import BottomMenu from '../components/BottomMenu';

export default function AdminSubscriptionsScreen({ navigation }) {
    const [subscriptions, setSubscriptions] = useState([]);
    const [filteredSubs, setFilteredSubs] = useState([]);
    const [offers, setOffers] = useState([]);
    const [selectedOfferId, setSelectedOfferId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const [subsRes, offersRes] = await Promise.all([
                axios.get(`${Config.API_URL}/admin/subscriptions`),
                axios.get(`${Config.API_URL}/offers`)
            ]);
            setSubscriptions(subsRes.data);
            setOffers(offersRes.data);
            applyFilters(subsRes.data, search, selectedOfferId);
        } catch (error) {
            console.error('Fetch data error:', error);
            showMessage('Erreur lors du chargement des données', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = (allSubs, searchTerm, offerId) => {
        let filtered = allSubs;

        // Filtre par texte
        if (searchTerm.trim() !== '') {
            const lowerText = searchTerm.toLowerCase();
            filtered = filtered.filter(sub =>
                sub.user?.name?.toLowerCase().includes(lowerText) ||
                sub.user?.email?.toLowerCase().includes(lowerText) ||
                sub.offer?.name?.toLowerCase().includes(lowerText)
            );
        }

        // Filtre par offre
        if (offerId) {
            filtered = filtered.filter(sub => sub.offer_id === offerId);
        }

        setFilteredSubs(filtered);
    };

    const handleSearch = (text) => {
        setSearch(text);
        applyFilters(subscriptions, text, selectedOfferId);
    };

    const handleSelectOffer = (id) => {
        const newId = selectedOfferId === id ? null : id;
        setSelectedOfferId(newId);
        applyFilters(subscriptions, search, newId);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchSubscriptions();
    };

    const getStatusColor = (status, endsAt) => {
        const now = new Date();
        const end = new Date(endsAt);

        if (status !== 'active') return '#9CA3AF'; // Gris
        if (end < now) return '#EF4444'; // Rouge
        return '#10B981'; // Vert
    };

    const getStatusText = (status, endsAt) => {
        const now = new Date();
        const end = new Date(endsAt);

        if (status !== 'active') return 'Inactif';
        if (end < now) return 'Expiré';
        return 'Actif';
    };

    const renderItem = ({ item }) => (
        <View style={styles.subCard}>
            <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.user?.name || 'Inconnu'}</Text>
                    <Text style={styles.userEmail}>{item.user?.email}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, item.ends_at) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status, item.ends_at) }]}>
                        {getStatusText(item.status, item.ends_at)}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="ribbon-outline" size={16} color={Colors.textLight} />
                    <Text style={styles.offerName}>{item.offer?.name} - {item.paid_price?.toLocaleString()} XOF</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textLight} />
                    <Text style={styles.dateLabel}>Du {new Date(item.started_at).toLocaleDateString()} au {new Date(item.ends_at).toLocaleDateString()}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Historique Abonnements</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.filterBar}>
                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color={Colors.textLight} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un marchand..."
                            value={search}
                            onChangeText={handleSearch}
                        />
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.offersFilterList}
                >
                    <TouchableOpacity
                        style={[styles.offerFilterBtn, !selectedOfferId && styles.activeOfferFilter]}
                        onPress={() => handleSelectOffer(null)}
                    >
                        <Text style={[styles.offerFilterText, !selectedOfferId && styles.activeOfferFilterText]}>Tous</Text>
                    </TouchableOpacity>
                    {offers.map(offer => (
                        <TouchableOpacity
                            key={offer.id}
                            style={[styles.offerFilterBtn, selectedOfferId === offer.id && styles.activeOfferFilter]}
                            onPress={() => handleSelectOffer(offer.id)}
                        >
                            <Text style={[styles.offerFilterText, selectedOfferId === offer.id && styles.activeOfferFilterText]}>
                                {offer.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredSubs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="card-outline" size={60} color={Colors.textLight} />
                            <Text style={styles.emptyText}>Aucun abonnement trouvé</Text>
                        </View>
                    }
                />
            )}

            <BottomMenu navigation={navigation} activeTab="AdminDashboard" isAdmin={true} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 70,
        backgroundColor: '#F8F9FE', // Remplacé le blanc pur par une teinte perle
        borderBottomWidth: 1,
        borderBottomColor: '#EBF0FF',
    },
    backBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
    filterBar: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchContainer: {
        padding: 15,
        paddingBottom: 10,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 45,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: Colors.text,
    },
    offersFilterList: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        gap: 8,
    },
    offerFilterBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeOfferFilter: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    offerFilterText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textLight,
    },
    activeOfferFilterText: {
        color: '#fff',
    },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15, paddingBottom: 100 },
    subCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 12,
        marginBottom: 12,
    },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700', color: Colors.text },
    userEmail: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    cardBody: { gap: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    offerName: { fontSize: 14, fontWeight: '600', color: Colors.text },
    dateLabel: { fontSize: 13, color: Colors.textLight },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: Colors.textLight, marginTop: 15, fontWeight: '600' },
});
