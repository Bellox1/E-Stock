import showMessage from '../utils/Toast';
import React, { useState, useEffect, useContext } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Dimensions,
    Image
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Config from '../constants/Config';
import { BarChart, PieChart } from "react-native-chart-kit";
import BottomMenu from '../components/BottomMenu';
import CustomLoader from '../components/CustomLoader';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
    const { logout, appConfig, user: currentUser } = useContext(AuthContext);
    const canWrite = !currentUser?.admin_permissions || currentUser?.admin_permissions?.can_write === true || currentUser?.admin_permissions?.can_write === 1;
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats = async () => {
        try {
            const response = await axios.get(`${Config.API_URL}/admin/stats`);
            console.log('Admin Stats Data:', response.data);
            setStats(response.data);
        } catch (error) {
            console.error('Fetch admin stats error:', error);
            showMessage('Erreur de chargement des stats', 'error');
            if (error.response?.status === 401) logout();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Déconnexion', 'Voulez-vous quitter la session Admin ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Quitter', onPress: logout, style: 'destructive' }
        ]);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAdminStats();
    };

    if (loading && !refreshing) {
        return (
            <CustomLoader />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    {appConfig.app_logo_url ? (
                        <Image source={{ uri: appConfig.app_logo_url }} style={styles.headerLogo} resizeMode="contain" />
                    ) : (
                        <Text style={styles.headerAppTitle}>{appConfig.app_name || 'E-STOCK'}</Text>
                    )}
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.teamButton}
                        onPress={() => navigation.navigate('AdminTeam')}
                    >
                        <View style={styles.teamIconContainer}>
                            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                            <Text style={styles.teamLabel}>Équipe</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="people" size={28} color="#1976D2" />
                        <Text style={styles.statValue}>{stats?.total_merchants || 0}</Text>
                        <Text style={styles.statLabel}>Marchands</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
                        <Ionicons name="business" size={28} color="#7B1FA2" />
                        <Text style={styles.statValue}>{stats?.total_shops || 0}</Text>
                        <Text style={styles.statLabel}>Boutiques</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E0F2F1' }]}>
                        <Ionicons name="cube" size={28} color="#00796B" />
                        <Text style={styles.statValue}>{stats?.total_products || 0}</Text>
                        <Text style={styles.statLabel}>Total Produits</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFFDE7' }]}>
                        <Ionicons name="person-add" size={28} color="#FBC02D" />
                        <Text style={styles.statValue}>{stats?.total_clients || 0}</Text>
                        <Text style={styles.statLabel}>Total Clients</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="wallet" size={28} color="#388E3C" />
                        <Text style={styles.statValue}>{(stats?.total_subscriptions_earnings || 0).toLocaleString()} XOF</Text>
                        <Text style={styles.statLabel}>CA Plat.</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
                        <Ionicons name="cart" size={28} color="#F57C00" />
                        <Text style={styles.statValue}>{stats?.total_orders || 0}</Text>
                        <Text style={styles.statLabel}>Commandes</Text>
                    </View>
                </View>

                {/* Section Graphiques */}
                <Text style={styles.sectionTitle}>Performance des Offres</Text>

                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Ionicons name="stats-chart" size={18} color={Colors.primary} />
                        <Text style={styles.chartTitle}>Ventes par Offre</Text>
                    </View>
                    {stats?.offers_performance?.length > 0 ? (() => {
                        const salesValues = stats.offers_performance.map(o => o.sales);
                        const maxVal = Math.max(...salesValues, 0);

                        return (
                            <BarChart
                                data={{
                                    labels: stats.offers_performance.map(o => o.name),
                                    datasets: [{
                                        data: salesValues
                                    }]
                                }}
                                width={width - 70}
                                height={220}
                                yAxisLabel=""
                                yAxisSuffix=""
                                fromZero={true}
                                fromNumber={Math.max(maxVal, 5)} // Force au moins 5 pour avoir [0,1,2,3,4,5]
                                segments={5} // 5 segments de 1 unité chacun
                                chartConfig={{
                                    backgroundColor: "#ffffff",
                                    backgroundGradientFrom: "#ffffff",
                                    backgroundGradientTo: "#ffffff",
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `#0000FF`, // Bleu Pur
                                    fillShadowGradient: "#0000FF", // Bleu Pur
                                    fillShadowGradientOpacity: 1, // Opacité totale pour un rendu solide
                                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForLabels: { fontSize: 10, fontWeight: '600' },
                                    barPercentage: 0.8,
                                }}
                                style={{ marginVertical: 8, borderRadius: 16, marginLeft: -10 }}
                                withInnerLines={false} // Retire les lignes en pointillés (grille)
                                showBarTops={false}
                            />
                        );
                    })() : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>Aucune donnée disponible</Text>
                        </View>
                    )}
                </View>

                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Ionicons name="pie-chart" size={18} color="#10B981" />
                        <Text style={styles.chartTitle}>Répartition des Marchands</Text>
                    </View>
                    {stats?.subscription_distribution && stats.subscription_distribution.length > 0 ? (
                        <PieChart
                            data={stats.subscription_distribution.map(d => ({
                                name: d.label || '?',
                                population: Number(d.count) || 0,
                                color: d.color || '#ccc',
                                legendFontColor: "#4B5563",
                                legendFontSize: 11
                            }))}
                            width={width - 70}
                            height={180}
                            chartConfig={{
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            }}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"0"}
                            center={[5, 0]}
                            absolute
                        />
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>Aucune donnée de répartition</Text>
                        </View>
                    )}
                </View>

                {/* Backup Table for Performance */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Ionicons name="list" size={18} color="#FF9800" />
                        <Text style={styles.chartTitle}>Détails Financiers</Text>
                    </View>
                    <View style={styles.performanceList}>
                        {stats?.offers_performance?.map((offer, index) => (
                            <View key={index} style={[styles.performanceRow, index === stats.offers_performance.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={styles.perfMain}>
                                    <Text style={styles.performanceName}>{offer.name}</Text>
                                    <View style={styles.salesBadge}>
                                        <Text style={styles.salesText}>{offer.sales} {offer.sales > 1 ? 'ventes' : 'vente'}</Text>
                                    </View>
                                </View>
                                <View style={styles.performanceStats}>
                                    <Text style={styles.performanceRevenue}>{offer.revenue.toLocaleString()} XOF</Text>
                                    <Text style={styles.revenueLabel}>Revenu total</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Gestion Plateforme</Text>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('AdminOffers')}>
                    <View style={[styles.actionIcon, { backgroundColor: Colors.primary }]}>
                        <Ionicons name="ribbon" size={24} color={Colors.white} />
                    </View>
                    <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>Offres & Tarifs</Text>
                        <Text style={styles.actionSubtitle}>Modifier les packs d'abonnement</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('AdminAnnouncements')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#FF5722' }]}>
                        <Ionicons name="megaphone" size={24} color={Colors.white} />
                    </View>
                    <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>Affiches & Annonces</Text>
                        <Text style={styles.actionSubtitle}>Gérer les bannières du dashboard</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('AdminUsers')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#607D8B' }]}>
                        <Ionicons name="people-circle" size={24} color={Colors.white} />
                    </View>
                    <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>Utilisateurs</Text>
                        <Text style={styles.actionSubtitle}>Voir la liste des marchands</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('AdminSubscriptions')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
                        <Ionicons name="calendar-outline" size={24} color={Colors.white} />
                    </View>
                    <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>Abonnements</Text>
                        <Text style={styles.actionSubtitle}>{stats?.active_subscriptions || 0} actifs actuellement</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('AdminSettings')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#4B5563' }]}>
                        <Ionicons name="settings-outline" size={24} color={Colors.white} />
                    </View>
                    <View style={styles.actionText}>
                        <Text style={styles.actionTitle}>Réglages Généraux</Text>
                        <Text style={styles.actionSubtitle}>Conditions par défaut & App</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Navigation Premium */}
            <BottomMenu navigation={navigation} activeTab="AdminDashboard" isAdmin={true} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 20,
        height: 70,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    headerTitleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    teamButton: {
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.primary + '20'
    },
    teamIconContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    teamLabel: { fontSize: 11, fontWeight: 'bold', color: Colors.primary },
    headerAppTitle: { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 },
    headerLogo: { width: 120, height: 40 },
    adminBadge: { backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    adminBadgeText: { fontSize: 10, fontWeight: 'bold', color: Colors.primary },
    title: { fontSize: 24, fontWeight: 'bold', color: Colors.text },
    logoutButton: { padding: 5 },
    scrollContent: { padding: 20, paddingTop: 30 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
    statCard: { width: (width - 55) / 2, padding: 20, borderRadius: 24, marginBottom: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statValue: { fontSize: 18, fontWeight: '800', marginTop: 10, color: Colors.text },
    statLabel: { fontSize: 11, color: Colors.textLight, marginTop: 4, fontWeight: '600' },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 20, letterSpacing: -0.5 },
    actionItem: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 22, marginBottom: 15, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
    actionIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    actionText: { flex: 1 },
    actionTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
    actionSubtitle: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 10,
    },
    chartTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
    },
    noDataContainer: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        fontSize: 12,
        color: Colors.textLight,
        fontStyle: 'italic',
    },
    performanceList: {
        marginTop: 5,
    },
    performanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    performanceName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    performanceStats: {
        alignItems: 'flex-end',
    },
    performanceValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    performanceRevenue: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 2,
    },
});
