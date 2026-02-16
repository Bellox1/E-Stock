import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useIsFocused } from '@react-navigation/native';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    FlatList,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import CustomLoader from '../components/CustomLoader';

export default function NotificationsScreen({ navigation }) {
    const { shops, selectedShop, selectShop } = useContext(ShopContext);
    const isFocused = useIsFocused();
    const [notifications, setNotifications] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [alertSummary, setAlertSummary] = useState(null);
    const [debtStats, setDebtStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' ou 'notifications'

    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused]);

    const fetchData = async () => {
        try {
            // Récupérer les alertes de paiement
            const alertsRes = await axios.get(`${Config.API_URL}/alerts/payments`);
            setAlerts(alertsRes.data.alerts || []);
            setAlertSummary(alertsRes.data.summary || {});

            // Récupérer les statistiques de dette
            const statsRes = await axios.get(`${Config.API_URL}/alerts/debt-stats`);
            setDebtStats(statsRes.data);

            // Récupérer les notifications
            const notifRes = await axios.get(`${Config.API_URL}/notifications`);
            setNotifications(notifRes.data);

        } catch (error) {
            console.error('Fetch data error:', error);
            if (error.response?.status === 403) {
                Alert.alert(
                    'Offre insuffisante',
                    'Cette fonctionnalité est réservée aux offres supérieures. Veuillez passer à une offre supérieure pour accéder à vos alertes et notifications.',
                    [
                        { text: 'Plus tard', style: 'cancel', onPress: () => navigation.goBack() },
                        { text: 'Voir les offres', onPress: () => navigation.navigate('Offers') }
                    ]
                );
            } else {
                showMessage('Erreur lors du chargement des données');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setLoading(true);
        fetchData();
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#EF4444';
            case 'high': return '#F59E0B';
            case 'medium': return '#F59E0B';
            case 'low': return '#6B7280';
            default: return Colors.textLight;
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return 'alert-circle';
            case 'high': return 'warning';
            case 'medium': return 'time';
            case 'low': return 'information-circle';
            default: return 'notifications';
        }
    };

    const handleAlertPress = (item) => {
        if (selectedShop && item.shop_id !== selectedShop.id) {
            Alert.alert(
                'Changer de boutique',
                `Cette commande appartient à la boutique "${item.shop_name}". Voulez-vous y basculer pour voir les détails ?`,
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Basculer',
                        onPress: async () => {
                            const newShop = shops.find(s => s.id === item.shop_id);
                            if (newShop) {
                                await selectShop(newShop);
                                navigation.navigate('Orders', { orderId: item.order_id });
                            }
                        }
                    }
                ]
            );
        } else {
            navigation.navigate('Orders', { orderId: item.order_id });
        }
    };

    const renderAlert = ({ item }) => (
        <TouchableOpacity
            style={styles.alertCardSimple}
            onPress={() => handleAlertPress(item)}
        >
            <View style={styles.alertInfo}>
                <View style={styles.alertTopRow}>
                    <Text style={styles.clientNameSimple}>{item.client_name}</Text>
                    <Text style={styles.amountSimple}>{item.remaining_amount.toLocaleString()} XOF</Text>
                </View>
                <Text style={styles.messageSimple} numberOfLines={1}>{item.message}</Text>
                <View style={styles.alertBottomRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.dateSimple}>
                            <Ionicons name="calendar-outline" size={12} /> {new Date(item.payment_due_date).toLocaleDateString('fr-FR')}
                        </Text>
                        {shops.length > 1 && (
                            <View style={styles.shopBadge}>
                                <Ionicons name="business-outline" size={10} color={Colors.primary} />
                                <Text style={styles.shopBadgeText}>{item.shop_name}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.orderIdSimple}>#{item.order_id}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>
    );

    const renderNotification = (item) => (
        <View key={item.id} style={[styles.notificationCard, !item.is_read && styles.unreadCard]}>
            <View style={styles.contentBox}>
                <View style={styles.row}>
                    <Text style={[styles.notifTitle, !item.is_read && styles.unreadText]}>
                        {item.title}
                    </Text>
                    <Text style={styles.notifTime}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <Text style={styles.notifContent}>{item.content}</Text>
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
                <Text style={styles.headerTitle}>Alertes & Notifications</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Statistiques de dette */}
            {debtStats && debtStats.total_unpaid_orders > 0 && (
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{debtStats.total_unpaid_orders || 0}</Text>
                        <Text style={styles.statLabel}>Commandes impayées</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.statValue, { color: '#EF4444' }]}>
                                {(debtStats.total_debt || 0).toLocaleString()}
                            </Text>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#EF4444', marginTop: -2 }}>XOF</Text>
                        </View>
                        <Text style={styles.statLabel}>Dette totale</Text>
                    </View>
                    {debtStats.overdue_count > 0 && (
                        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                            <Text style={[styles.statValue, { color: '#EF4444' }]}>{debtStats.overdue_count}</Text>
                            <Text style={[styles.statLabel, { color: '#991B1B' }]}>En retard</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Onglets */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
                    onPress={() => setActiveTab('alerts')}
                >
                    <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
                        Alertes {alertSummary && alertSummary.total > 0 && `(${alertSummary.total})`}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
                    onPress={() => setActiveTab('notifications')}
                >
                    <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
                        Notifications
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Contenu */}
            {activeTab === 'alerts' ? (
                <FlatList
                    data={alerts}
                    renderItem={renderAlert}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={onRefresh}
                            tintColor="transparent"
                            colors={['transparent']}
                            progressBackgroundColor="transparent"
                            progressViewOffset={-1000}
                        />
                    }
                    ListEmptyComponent={
                        !loading && (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="checkmark-circle-outline" size={60} color="#10B981" />
                                <Text style={styles.emptyText}>Aucune alerte de paiement</Text>
                                <Text style={styles.emptySubtext}>Tous les paiements sont à jour !</Text>
                            </View>
                        )
                    }
                />
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={onRefresh}
                            tintColor="transparent"
                            colors={['transparent']}
                            progressBackgroundColor="transparent"
                            progressViewOffset={-1000}
                        />
                    }
                >
                    {notifications.length === 0 && !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-off-outline" size={60} color={Colors.textLight} />
                            <Text style={styles.emptyText}>Aucune notification</Text>
                        </View>
                    ) : (
                        notifications.map(renderNotification)
                    )}
                </ScrollView>
            )}

            {loading && <CustomLoader />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 70,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.text },

    // Statistiques
    statsContainer: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 4,
        textAlign: 'center',
    },

    // Onglets
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textLight,
    },
    activeTabText: {
        color: Colors.primary,
    },

    // Alertes
    // Nouvelles Alertes Simples
    listContent: { paddingVertical: 10 },
    alertCardSimple: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    severityIndicator: {
        width: 4,
        height: '80%',
        borderRadius: 2,
        marginRight: 15,
    },
    alertInfo: {
        flex: 1,
        marginRight: 10,
    },
    alertTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    clientNameSimple: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    amountSimple: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EF4444',
    },
    messageSimple: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 6,
    },
    alertBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateSimple: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    orderIdSimple: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    shopBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4
    },
    shopBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.primary,
        textTransform: 'uppercase'
    },

    // Notifications
    scrollContent: { padding: 0 },
    notificationCard: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    unreadCard: {
        backgroundColor: '#f9f9f9',
    },
    contentBox: { flex: 1 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    notifTitle: { fontSize: 15, fontWeight: '500', color: '#333', flex: 1, marginRight: 10 },
    unreadText: { fontWeight: '700', color: '#000' },
    notifContent: { fontSize: 14, color: '#666', lineHeight: 20 },
    notifTime: { fontSize: 12, color: '#999' },

    // Empty state
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, color: '#888', marginTop: 12, fontWeight: '600' },
    emptySubtext: { fontSize: 14, color: '#AAA', marginTop: 4 },
});
