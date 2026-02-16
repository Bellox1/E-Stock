import React, { useState, useEffect, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Alert,
    Image,
    FlatList as FlatListRN,
    Modal,
    Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import showMessage from '../utils/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { AuthContext } from '../context/AuthContext';
import { ShopContext } from '../context/ShopContext';
import ShopSelector from '../components/ShopSelector';
import CustomLoader from '../components/CustomLoader';
import BottomMenu from '../components/BottomMenu';
import axios from 'axios';
import Config from '../constants/Config';
import { useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const {
        user,
        logout,
        appConfig,
        fetchAppConfig,
        isFirstLogin,
        setIsFirstLogin,
        getPermission,
        refreshUser
    } = useContext(AuthContext);

    const { selectedShop, loading: shopLoading, shops, selectShop, showAllShops, setShowAllShops } = useContext(ShopContext);
    const [stats, setStats] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bannerIndex, setBannerIndex] = useState(0);
    const [shopSelectorVisible, setShopSelectorVisible] = useState(false);
    const [period, setPeriod] = useState('month'); // default to 'month' (Ce mois)
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('startDate'); // startDate or endDate
    const [tempStart, setTempStart] = useState(new Date());
    const [tempEnd, setTempEnd] = useState(new Date());
    const flatListRef = useRef(null);
    const isFocused = useIsFocused();

    const handleExportOptions = () => {
        if (!getPermission('export_excel')) {
            Alert.alert('Accès refusé', "Votre offre ne permet pas l'export Excel.");
            return;
        }

        Alert.alert(
            'Exporter les données',
            'Choisissez le type de données à exporter en Excel (CSV)',
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Produits (Stock)', onPress: () => exportData('products') },
                { text: 'Ventes (Commandes)', onPress: () => exportData('orders') }
            ]
        );
    }

    const exportData = async (type) => {
        try {
            showMessage("Préparation de l'export...");
            const authHeader = axios.defaults.headers.common['Authorization'];
            if (!authHeader) return;

            const url = `${Config.API_URL}/export/${type}?shop_id=${selectedShop?.id}`;
            const fileUri = FileSystem.documentDirectory + `${type}_${selectedShop?.name || 'export'}_${Date.now()}.csv`;

            const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
                headers: { 'Authorization': authHeader }
            });

            if (downloadRes.status === 200) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadRes.uri);
                } else {
                    Alert.alert('Succès', 'Fichier téléchargé : ' + downloadRes.uri);
                }
            } else {
                throw new Error('Erreur téléchargement');
            }
        } catch (error) {
            console.error(error);
            showMessage("Erreur lors de l'export", "error");
        }
    };

    useEffect(() => {
        if (isFocused) {
            refreshUser();
        }
    }, [isFocused]);

    useEffect(() => {
        if (isFocused && selectedShop) {
            fetchStats();
        }
    }, [isFocused, selectedShop, showAllShops, period, startDate, endDate, JSON.stringify(user?.permissions)]);


    // Auto-scroll pour les bannières
    useEffect(() => {
        if (announcements.length > 1) {
            const timer = setInterval(() => {
                let nextIndex = (bannerIndex + 1) % announcements.length;
                setBannerIndex(nextIndex);
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [bannerIndex, announcements]);

    const fetchStats = async (isSilent = false) => {
        if (!selectedShop) return;
        if (!isSilent) setLoading(true);

        try {
            let statsUrl = showAllShops
                ? `${Config.API_URL}/stats/merchant?period=${period}`
                : `${Config.API_URL}/stats/merchant?shop_id=${selectedShop.id}&period=${period}`;

            if (period === 'custom' && startDate && endDate) {
                statsUrl += `&start_date=${startDate}&end_date=${endDate}`;
            }

            const [statsRes, annRes] = await Promise.all([
                axios.get(statsUrl),
                axios.get(`${Config.API_URL}/announcements`)
            ]);
            setStats(statsRes.data);
            setAnnouncements(annRes.data);
            // Reload basic app config to ensure logo is fresh
            await fetchAppConfig();
        } catch (error) {
            console.error('Fetch stats error:', error);
            if (error.response?.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setLoading(true);
        fetchStats();
    };

    const renderChart = () => {
        if (!stats?.chart_data || stats.chart_data.length === 0) return (
            <View style={styles.emptyChart}>
                <Text style={styles.emptyChartText}>Aucune donnée disponible pour cette période</Text>
            </View>
        );

        const maxVal = Math.max(...stats.chart_data.map(d => d.total), 1);

        return (
            <View style={styles.chartWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chartBars}>
                        {stats.chart_data.map((d, i) => (
                            <View key={i} style={[styles.chartBarContainer, { width: stats.chart_data.length > 7 ? 40 : (width - 80) / stats.chart_data.length }]}>
                                <View style={styles.chartBarOuter}>
                                    <View style={[styles.chartBarInner, { height: `${(d.total / maxVal) * 100}%` }]} />
                                </View>
                                <Text style={styles.chartDayLabel}>
                                    {period === 'all' || period === 'month' || period === 'last_month'
                                        ? new Date(d.date).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()
                                        : new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
                                </Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    {appConfig.app_logo_url ? (
                        <Image source={{ uri: appConfig.app_logo_url }} style={styles.headerLogo} resizeMode="contain" />
                    ) : (
                        <Text style={styles.headerAppTitle}>{appConfig.app_name || 'E-STOCK'}</Text>
                    )}
                </View>

                <View style={styles.headerIcons}>
                    {getPermission('export_excel') && (
                        <TouchableOpacity
                            style={[styles.faqIconContainer, { marginRight: 12 }]}
                            onPress={handleExportOptions}
                        >
                            <Ionicons name="download-outline" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.faqIconContainer, { marginRight: 12 }]}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Ionicons name="notifications-outline" size={24} color={Colors.text} />
                        {stats?.unread_notifications_count > 0 && (
                            <View style={styles.notifBadge}>
                                <Text style={styles.notifBadgeText}>
                                    {stats.unread_notifications_count > 9 ? '9+' : stats.unread_notifications_count}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.faqIconContainer}
                        onPress={() => navigation.navigate('FAQ')}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={onRefresh}
                        tintColor="transparent"
                        colors={['transparent']}
                        progressViewOffset={-500}
                    />
                }
            >
                {/* Bannières Publicitaires */}
                {announcements.length > 0 && (
                    <View style={styles.bannerContainer}>
                        <FlatListRN
                            ref={flatListRef}
                            data={announcements}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={item => item.id.toString()}
                            onMomentumScrollEnd={(e) => {
                                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                setBannerIndex(index);
                            }}
                            renderItem={({ item }) => (
                                <View style={styles.bannerSlide}>
                                    <View style={styles.bannerImageContainer}>
                                        {item.image_url ? (
                                            <Image source={{ uri: item.image_url }} style={styles.bannerImage} />
                                        ) : (
                                            <View style={[styles.bannerImage, { backgroundColor: Colors.primary }]} />
                                        )}
                                    </View>
                                    {(item.title || item.content) && (
                                        <View style={styles.bannerInfo}>
                                            {item.title && <Text style={styles.bannerTitle}>{item.title}</Text>}
                                            {item.content && <Text style={styles.bannerSubtitle} numberOfLines={1}>{item.content}</Text>}
                                        </View>
                                    )}
                                </View>
                            )}
                        />
                        {announcements.length > 1 && (
                            <View style={styles.bannerIndicators}>
                                {announcements.map((_, i) => (
                                    <View key={i} style={[styles.indicatorDot, i === bannerIndex && styles.activeDot]} />
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Salutation */}
                <View style={styles.greetingSection}>
                    <View>
                        <Text style={styles.welcomeLabel}>Bonjour,</Text>
                        <Text style={styles.userNameText}>{user?.name} 👋</Text>
                    </View>
                    {selectedShop && (
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => setShopSelectorVisible(true)}
                        >
                            <Ionicons name={showAllShops ? "grid" : "business"} size={18} color={Colors.primary} />
                            <Text style={styles.shopButtonText} numberOfLines={1}>
                                {showAllShops ? "Toutes les boutiques" : selectedShop.name}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Navigation Rapide */}
                <View style={[styles.sectionHeader, { marginTop: 25 }]}>
                    <Text style={styles.sectionTitlePro}>Accès rapide</Text>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.quickNavScroll}
                >
                    <TouchableOpacity style={styles.quickNavItem} onPress={() => navigation.navigate('Orders')}>
                        <View style={[styles.quickNavIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="receipt" size={28} color="#3B82F6" />
                        </View>
                        <Text style={styles.quickNavLabel}>Commandes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickNavItem} onPress={() => navigation.navigate('Offers')}>
                        <View style={[styles.quickNavIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="sparkles" size={28} color="#3B82F6" />
                        </View>
                        <Text style={styles.quickNavLabel}>Offres</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickNavItem} onPress={() => navigation.navigate('Products')}>
                        <View style={[styles.quickNavIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="cube" size={28} color="#3B82F6" />
                        </View>
                        <Text style={styles.quickNavLabel}>Inventaire</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickNavItem} onPress={() => navigation.navigate('Sales')}>
                        <View style={[styles.quickNavIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="cart" size={28} color="#3B82F6" />
                        </View>
                        <Text style={styles.quickNavLabel}>Ventes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickNavItem} onPress={() => navigation.navigate('Clients')}>
                        <View style={[styles.quickNavIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="people" size={28} color="#3B82F6" />
                        </View>
                        <Text style={styles.quickNavLabel}>Clients</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* Sélecteur de période */}
                <View style={styles.periodScrollContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodSelector}>
                        <TouchableOpacity
                            style={[styles.periodButton, period === 'all' && styles.periodButtonActive]}
                            onPress={() => setPeriod('all')}
                        >
                            <Text style={[styles.periodButtonText, period === 'all' && styles.periodButtonTextActive]}>
                                Tout
                            </Text>
                        </TouchableOpacity>

                        {['day', 'week'].map((p) => (
                            <TouchableOpacity
                                key={p}
                                style={[styles.periodButton, period === p && styles.periodButtonActive]}
                                onPress={() => setPeriod(p)}
                            >
                                <Text style={[styles.periodButtonText, period === p && styles.periodButtonTextActive]}>
                                    {p === 'day' ? 'Jour' : 'Semaine'}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
                            onPress={() => {
                                if (!getPermission('stats')) {
                                    Alert.alert(
                                        'Offre insuffisante',
                                        'La vue mensuelle fait partie des statistiques avancées. Veuillez passer à une offre supérieure pour y accéder.',
                                        [
                                            { text: 'Plus tard', style: 'cancel' },
                                            { text: 'Voir les offres', onPress: () => navigation.navigate('Offers') }
                                        ]
                                    );
                                    return;
                                }
                                setPeriod('month');
                            }}
                        >
                            <Text style={[styles.periodButtonText, period === 'month' && styles.periodButtonTextActive]}>
                                Ce mois
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.periodButton, period === 'last_month' && styles.periodButtonActive]}
                            onPress={() => {
                                if (!getPermission('stats')) {
                                    Alert.alert(
                                        'Offre insuffisante',
                                        'Les statistiques avancées font partie de l\'offre Pro. Veuillez passer à une offre supérieure pour y accéder.',
                                        [
                                            { text: 'Plus tard', style: 'cancel' },
                                            { text: 'Voir les offres', onPress: () => navigation.navigate('Offers') }
                                        ]
                                    );
                                    return;
                                }
                                setPeriod('last_month');
                            }}
                        >
                            <Text style={[styles.periodButtonText, period === 'last_month' && styles.periodButtonTextActive]}>
                                Mois dernier
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.periodButton, period === 'custom' && styles.periodButtonActive]}
                            onPress={() => {
                                if (!getPermission('stats')) {
                                    Alert.alert(
                                        'Offre insuffisante',
                                        'Le filtrage par date personnalisée fait partie des statistiques avancées. Veuillez passer à une offre supérieure pour y accéder.',
                                        [
                                            { text: 'Plus tard', style: 'cancel' },
                                            { text: 'Voir les offres', onPress: () => navigation.navigate('Offers') }
                                        ]
                                    );
                                    return;
                                }
                                setCalendarModalVisible(true);
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="calendar-outline" size={14} color={period === 'custom' ? '#fff' : Colors.textLight} />
                                <Text style={[styles.periodButtonText, period === 'custom' && styles.periodButtonTextActive]}>
                                    {period === 'custom' ? 'Filtré' : 'Calendrier'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* Dashboard Scope Info */}
                <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <Ionicons name="information-circle-outline" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 11, color: Colors.textLight, flex: 1 }}>
                            Toutes les statistiques ci-dessous correspondent à : <Text style={{ fontWeight: 'bold', color: Colors.primary }}>{
                                period === 'day' ? "Aujourd'hui" :
                                    period === 'week' ? "Cette semaine" :
                                        period === 'month' ? "Ce mois-ci" :
                                            period === 'last_month' ? "Le mois dernier" :
                                                period === 'all' ? "Tout l'historique" :
                                                    "Période personnalisée"
                            }</Text>
                        </Text>
                    </View>
                </View>

                {/* Performance Highlights */}
                <View style={[styles.sectionHeader, { marginTop: 25 }]}>
                    <Text style={styles.sectionTitlePro}>Aperçu de l'activité</Text>
                </View>
                <View style={styles.statsSummaryGrid}>
                    <View style={[styles.simpleCardPro, { alignItems: 'center' }]}>
                        <View style={[styles.proIconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="wallet" size={22} color="#3B82F6" />
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.proLabel, { textAlign: 'center' }]}>Revenus ({period === 'all' ? 'total' : period === 'day' ? 'jour' : period === 'week' ? 'semaine' : period === 'month' ? 'ce mois' : period === 'last_month' ? 'mois dernier' : 'période'})</Text>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.proValue}>
                                    {getPermission('stats') ? Math.floor(stats?.revenue || 0).toLocaleString() : '****'}
                                </Text>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: Colors.textLight, marginTop: -2 }}>XOF</Text>
                            </View>
                        </View>
                    </View>
                    <View style={[styles.simpleCardPro, { alignItems: 'center' }]}>
                        <View style={[styles.proIconBox, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="calendar" size={22} color="#F59E0B" />
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.proLabel, { textAlign: 'center' }]}>Dettes {period === 'all' ? 'cumulées' : period === 'day' ? 'du jour' : period === 'month' ? 'de ce mois' : period === 'last_month' ? 'du mois dernier' : 'période'}</Text>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.proValue}>
                                    {getPermission('stats') ? Math.floor(stats?.credit || 0).toLocaleString() : '****'}
                                </Text>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#F59E0B', marginTop: -2 }}>XOF</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Valeur du Stock / CA Potentiel */}
                <View style={{ paddingHorizontal: 20, marginTop: 15 }}>
                    <View style={[styles.simpleCardPro, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7', alignItems: 'center' }]}>
                        <View style={[styles.proIconBox, { backgroundColor: '#DCFCE7' }]}>
                            <Ionicons name="stats-chart" size={24} color="#16A34A" />
                        </View>
                        <View style={{ alignItems: 'center', marginTop: 5 }}>
                            <Text style={[styles.proLabel, { textAlign: 'center', marginBottom: 5 }]}>Valeur Marchande du Stock (CA Potentiel)</Text>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={[styles.proValue, { color: '#16A34A', fontSize: 24 }]}>
                                    {getPermission('stats') ? Math.floor(stats?.inventory_value || 0).toLocaleString() : '****'}
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#16A34A', marginTop: -4 }}>XOF</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Breakdown par boutique si "Tout" est sélectionné */}
                {showAllShops && stats?.shops_inventory?.length > 0 && (
                    <View style={[styles.listCard, { marginTop: 10 }]}>
                        <View style={styles.sectionBadge}>
                            <Text style={styles.sectionBadgeText}>V. Marchande par boutique</Text>
                        </View>
                        {stats.shops_inventory.map((item, index) => (
                            <View key={item.shop_id} style={[styles.listItem, index === stats.shops_inventory.length - 1 && styles.lastItem]}>
                                <View style={styles.itemInfo}>
                                    <View style={[styles.itemIcon, { backgroundColor: '#F0FDF4' }]}>
                                        <Ionicons name="business" size={18} color="#16A34A" />
                                    </View>
                                    <Text style={styles.itemName}>{item.shop_name}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.itemAmount, { color: '#16A34A' }]}>{Math.floor(item.inventory_value).toLocaleString()}</Text>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#16A34A', marginTop: -4 }}>XOF</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}



                {/* Stock Alerts (Replacé ici pour être plus visible) */}
                {stats?.low_stock_products?.length > 0 && getPermission('stock_alerts', true) && (
                    <View style={styles.alertSection}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <Ionicons name="warning" size={20} color={Colors.error} style={{ marginRight: 8 }} />
                                <Text style={[styles.sectionTitle, { color: Colors.error }]}>Stocks Critiques ({stats.low_stock_count})</Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Products', { showLowStock: true })}>
                                <Text style={styles.seeAll}>Gérer</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.lowStockList}>
                            {stats.low_stock_products.slice(0, 3).map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.lowStockItem}
                                    onPress={async () => {
                                        // Si le produit appartient à une autre boutique, on bascule avec confirmation
                                        if (item.shop_id !== selectedShop?.id) {
                                            const targetShop = shops.find(s => s.id === item.shop_id);
                                            if (targetShop) {
                                                Alert.alert(
                                                    'Changer de boutique',
                                                    `Ce produit appartient à la boutique "${targetShop.name}". Voulez-vous y basculer pour modifier le stock ?`,
                                                    [
                                                        { text: 'Annuler', style: 'cancel' },
                                                        {
                                                            text: 'Basculer',
                                                            onPress: async () => {
                                                                await selectShop(targetShop);
                                                                navigation.navigate('Products', { editId: item.id });
                                                            }
                                                        }
                                                    ]
                                                );
                                                return;
                                            }
                                        }
                                        navigation.navigate('Products', { editId: item.id });
                                    }}
                                >
                                    <View style={[styles.lowStockIcon, item.image_url && { backgroundColor: 'transparent', padding: 0 }]}>
                                        {item.image_url ? (
                                            <Image source={{ uri: item.image_url }} style={styles.lowStockImage} />
                                        ) : (
                                            <Ionicons name="cube" size={18} color={Colors.error} />
                                        )}
                                    </View>
                                    <View style={styles.lowStockInfo}>
                                        <Text style={styles.lowStockName}>{item.name}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <Text style={styles.lowStockCat}>{item.category?.name || 'Général'}</Text>
                                            <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: 'bold' }}>• {shops.find(s => s.id === item.shop_id)?.name}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.lowStockQtyBox}>
                                        <Text style={[styles.lowStockQty, { color: Colors.error }]}>{item.stock_quantity}</Text>
                                        <Text style={styles.lowStockLabel}>Restant</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={[styles.chartMainCard, { marginTop: 15 }]}>
                    <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Ventes journalières</Text>
                    </View>
                    {getPermission('stats') ? renderChart() : (
                        <View style={[styles.emptyChart, { padding: 20 }]}>
                            <Ionicons name="lock-closed" size={30} color={Colors.textLight} style={{ marginBottom: 10 }} />
                            <Text style={styles.emptyChartText}>Passez à l'offre Pro pour voir vos graphiques de performance</Text>
                        </View>
                    )}
                </View>

                {/* Section Clients */}
                <View style={styles.statsColumn}>
                    <TouchableOpacity
                        style={[styles.fullWidthCard, { backgroundColor: '#3B82F6' }]}
                        onPress={() => navigation.navigate('Clients')}
                    >
                        <View style={styles.cardInfo}>
                            <View style={styles.simpleIconBox}>
                                <Ionicons name="people" size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.simpleLabel}>Nos Meilleurs Clients ({period === 'all' ? 'Historique' : 'Période'})</Text>
                                <Text style={styles.simpleValue}>{getPermission('stats') ? (stats?.total_clients || 0) : '****'}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>

                {stats?.top_clients?.length > 0 && (
                    <View style={styles.listCard}>
                        <View style={styles.sectionBadge}>
                            <Text style={styles.sectionBadgeText}>Top Clients</Text>
                        </View>
                        {getPermission('stats') ? stats.top_clients.map((client, index) => (
                            <View key={client.id} style={[styles.listItem, index === stats.top_clients.length - 1 && styles.lastItem]}>
                                <View style={styles.itemInfo}>
                                    <View style={styles.itemIcon}>
                                        <Ionicons name="person" size={20} color={Colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.itemName}>{client.name}</Text>
                                        <Text style={styles.itemSubtext}>{client.phone || client.email}</Text>
                                    </View>
                                </View>
                                <View style={styles.itemValue}>
                                    <Text style={styles.itemAmount}>{Math.floor(client.orders_sum_total_amount || 0).toLocaleString()} XOF</Text>
                                    <Text style={styles.itemCount}>{client.orders_count} commandes</Text>
                                </View>
                            </View>
                        )) : (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <Ionicons name="lock-closed" size={24} color={Colors.textLight} />
                                <Text style={{ color: Colors.textLight, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                                    Passez à l'offre Pro pour voir vos meilleurs clients
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Section Commandes */}
                <View style={[styles.statsColumn, { marginTop: 25 }]}>
                    <TouchableOpacity
                        style={[styles.fullWidthCard, { backgroundColor: '#1E40AF' }]}
                        onPress={() => navigation.navigate('Orders')}
                    >
                        <View style={styles.cardInfo}>
                            <View style={styles.simpleIconBox}>
                                <Ionicons name="receipt" size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.simpleLabel}>Dernières Commandes ({period === 'all' ? 'Historique' : 'Période'})</Text>
                                <Text style={styles.simpleValue}>{getPermission('stats') ? (stats?.total_orders || 0) : '****'}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>

                {/* Top Orders */}
                {stats?.top_orders?.length > 0 && (
                    <View style={styles.listCard}>
                        <View style={styles.sectionBadge}>
                            <Text style={styles.sectionBadgeText}>Top Commandes</Text>
                        </View>
                        {getPermission('stats') ? stats.top_orders.map((order, index) => (
                            <View key={order.id} style={[styles.listItem, index === stats.top_orders.length - 1 && styles.lastItem]}>
                                <View style={styles.itemInfo}>
                                    <View style={styles.itemIcon}>
                                        <Ionicons name="receipt" size={20} color={Colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.itemName}>Commande #{order.id}</Text>
                                        <Text style={styles.itemSubtext}>{order.client?.name || 'Client anonyme'}</Text>
                                    </View>
                                </View>
                                <View style={styles.itemValue}>
                                    <Text style={styles.itemAmount}>{Math.floor(order.total_amount || 0).toLocaleString()} XOF</Text>
                                    <Text style={styles.itemSubtext}>
                                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                                    </Text>
                                </View>
                            </View>
                        )) : (
                            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                <Ionicons name="lock-closed" size={24} color={Colors.textLight} />
                                <Text style={{ color: Colors.textLight, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                                    Passez à l'offre Pro pour voir vos meilleures commandes
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Bouton Voir tout en bas avant création */}
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={styles.seeAllOrdersBtn}
                        onPress={() => navigation.navigate('Orders')}
                    >
                        <Ionicons name="list" size={18} color={Colors.primary} />
                        <Text style={styles.seeAllOrdersText}>Voir toutes les commandes</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Navigation Premium */}
            <BottomMenu navigation={navigation} activeTab="Dashboard" />

            {/* Modal de Bienvenue (Cadre) */}
            <Modal
                visible={isFirstLogin}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.welcomeOverlay}>
                    <View style={styles.welcomeCard}>

                        <Text style={styles.welcomeTitle}>Bienvenue, {user?.name} !</Text>
                        <Text style={styles.welcomeText}>
                            Nous sommes ravis de vous compter parmi nos partenaires. Commencez à gérer vos stocks et vos ventes en toute simplicité.
                        </Text>
                        <TouchableOpacity
                            style={styles.welcomeButton}
                            onPress={async () => {
                                setIsFirstLogin(false);
                                await AsyncStorage.removeItem('is_new_registration');
                            }}
                        >
                            <Text style={styles.welcomeButtonText}>C'est parti !</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ShopSelector
                visible={shopSelectorVisible}
                onClose={() => setShopSelectorVisible(false)}
                showAllOption={shops.length > 1}
                onSelectAll={() => setShowAllShops(true)}
                isAllSelected={showAllShops}
            />

            {/* Modal Calendrier Personnalisé */}
            <Modal
                visible={calendarModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setCalendarModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Sélectionner une période</Text>
                            <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSub}>Options rapides</Text>
                        <View style={styles.modalGrid}>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    const now = new Date();
                                    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                                    setStartDate(start); setEndDate(end); setPeriod('custom');
                                    setCalendarModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>Ce mois</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalOption}
                                onPress={() => {
                                    const now = new Date();
                                    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                                    const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                                    setStartDate(start); setEndDate(end); setPeriod('custom');
                                    setCalendarModalVisible(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>Mois dernier</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalSub, { marginTop: 20 }]}>Intervalle personnalisé</Text>
                        <View style={styles.dateInputs}>
                            <TouchableOpacity
                                style={styles.flexInput}
                                onPress={() => { setPickerMode('startDate'); setShowPicker(true); }}
                            >
                                <Text style={styles.inputLabel}>Début</Text>
                                <View style={styles.dateInputDisplay}>
                                    <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                                    <Text style={styles.dateInputText}>{tempStart.toLocaleDateString('fr-FR')}</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.flexInput}
                                onPress={() => { setPickerMode('endDate'); setShowPicker(true); }}
                            >
                                <Text style={styles.inputLabel}>Fin</Text>
                                <View style={styles.dateInputDisplay}>
                                    <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                                    <Text style={styles.dateInputText}>{tempEnd.toLocaleDateString('fr-FR')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {showPicker && (
                            <DateTimePicker
                                value={pickerMode === 'startDate' ? tempStart : tempEnd}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowPicker(Platform.OS === 'ios');
                                    if (selectedDate) {
                                        if (pickerMode === 'startDate') setTempStart(selectedDate);
                                        else setTempEnd(selectedDate);
                                    }
                                }}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.applyBtn}
                            onPress={() => {
                                setStartDate(tempStart.toISOString().split('T')[0]);
                                setEndDate(tempEnd.toISOString().split('T')[0]);
                                setPeriod('custom');
                                setCalendarModalVisible(false);
                            }}
                        >
                            <Text style={styles.applyBtnText}>Appliquer le filtre</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {(loading || shopLoading || refreshing) && <CustomLoader />}
        </SafeAreaView >
    );

}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: 15,
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    headerTitleContainer: { flex: 1 },
    headerAppTitle: { fontSize: 22, fontFamily: 'Poppins_900Black', color: Colors.primary, letterSpacing: 0.5 },
    headerLogo: { width: 120, height: 40, alignSelf: 'flex-start' },
    headerIcons: { flexDirection: 'row', alignItems: 'center' },

    faqIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative'
    },
    notifBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    notifBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'Poppins_700Bold',
        lineHeight: 12,
    },
    bannerContainer: { marginTop: 15, height: 240 },
    bannerSlide: { width: width, paddingHorizontal: 20 },
    bannerImageContainer: { width: '100%', height: 180, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
    bannerImage: { width: '100%', height: '100%' },
    bannerInfo: { marginTop: 12, paddingHorizontal: 4 },
    bannerTitle: { color: Colors.text, fontFamily: 'Poppins_700Bold', fontSize: 18 },
    bannerSubtitle: { color: Colors.textLight, fontSize: 13, marginTop: 4, fontFamily: 'Poppins_400Regular' },
    bannerIndicators: { flexDirection: 'row', justifyContent: 'center', marginTop: -15 },
    indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E0', marginHorizontal: 3 },
    activeDot: { backgroundColor: Colors.primary, width: 15 },
    greetingSection: { paddingHorizontal: 20, marginTop: 10, marginBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    welcomeLabel: { fontSize: 14, color: Colors.textLight, fontFamily: 'Poppins_400Regular' },
    userNameText: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: Colors.text },
    shopButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6, maxWidth: 150 },
    shopButtonText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: Colors.primary, flex: 1 },
    scrollContent: { paddingBottom: 20, paddingTop: 10 },
    alertSection: { marginTop: 15 },
    sectionHeader: { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontFamily: 'Poppins_900Black', color: Colors.text },

    warningIconBox: { backgroundColor: Colors.error, width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    seeAll: { fontSize: 12, color: Colors.primary, fontFamily: 'Poppins_700Bold' },
    lowStockList: { marginHorizontal: 20, backgroundColor: '#FEF2F2', borderRadius: 24, padding: 8, borderWidth: 1, borderColor: '#FECACA', shadowColor: '#991B1B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    lowStockItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#FEE2E2' },
    lowStockIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    lowStockInfo: { flex: 1, marginLeft: 12 },
    lowStockName: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: Colors.text },
    lowStockCat: { fontSize: 11, color: Colors.textLight, marginTop: 1, fontFamily: 'Poppins_400Regular' },
    lowStockQtyBox: { alignItems: 'center', minWidth: 60 },
    lowStockQty: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: Colors.error, textAlign: 'center' },
    lowStockLabel: { fontSize: 9, color: Colors.textLight, fontFamily: 'Poppins_400Regular', textAlign: 'center' },
    lowStockImage: { width: '100%', height: '100%', borderRadius: 12 },
    editAlertBtn: { padding: 8, marginLeft: 10, backgroundColor: '#F1F5F9', borderRadius: 10 },
    quickNavScroll: { paddingLeft: 20, paddingRight: 5, paddingVertical: 10 },
    quickNavItem: { alignItems: 'center', marginRight: 15 },
    quickNavIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    quickNavLabel: { fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: Colors.text, textAlign: 'center' },
    statsSummaryGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 15, marginTop: 10 },
    sectionTitlePro: { fontSize: 13, fontFamily: 'Poppins_900Black', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1 },

    // Nouveau style Premium pour les petites cartes
    simpleCardPro: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        flexDirection: 'column',
        gap: 12
    },
    proIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    proValue: { fontSize: 17, fontFamily: 'Poppins_900Black', color: Colors.text },
    proLabel: { fontSize: 11, color: Colors.textLight, fontFamily: 'Poppins_600SemiBold' },

    periodScrollContainer: { marginTop: 15 },
    periodSelector: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, paddingBottom: 5 },
    periodButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    periodButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    periodButtonText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: Colors.textLight },
    periodButtonTextActive: { color: '#fff' },

    statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 15 },
    statsColumn: { paddingHorizontal: 20, marginTop: 15 },
    fullWidthCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
    cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    simpleIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    simpleValue: { fontSize: 20, fontFamily: 'Poppins_900Black', color: '#fff' },
    simpleLabel: { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontFamily: 'Poppins_600SemiBold' },

    listCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, padding: 20, borderRadius: 28, borderWidth: 1, borderColor: '#EDF2F7' },
    listTitle: { fontSize: 16, fontFamily: 'Poppins_900Black', color: Colors.text, marginBottom: 15 },
    sectionBadge: { backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 15 },
    sectionBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },
    listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
    lastItem: { borderBottomWidth: 0 },
    itemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    itemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    itemName: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: Colors.text },
    itemSubtext: { fontSize: 12, color: Colors.textLight, marginTop: 2, fontFamily: 'Poppins_400Regular' },
    itemValue: { alignItems: 'flex-end' },
    itemAmount: { fontSize: 14, fontFamily: 'Poppins_900Black', color: Colors.primary },
    itemCount: { fontSize: 11, color: Colors.textLight, marginTop: 2, fontFamily: 'Poppins_400Regular' },

    chartMainCard: { backgroundColor: Colors.white, marginHorizontal: 20, padding: 20, borderRadius: 28, borderWidth: 1, borderColor: '#EDF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 10, elevation: 1 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    chartTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: Colors.text },
    toggleContainer: { flexDirection: 'row', backgroundColor: '#F7FAFC', borderRadius: 8, padding: 2 },
    toggleButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    toggleButtonActive: { backgroundColor: Colors.primary },
    toggleText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: Colors.textLight },
    toggleTextActive: { color: '#fff' },
    chartWrapper: { height: 120 },
    chartBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    chartBarContainer: { alignItems: 'center' },
    chartBarOuter: { height: 80, width: 8, backgroundColor: '#F1F5F9', borderRadius: 4, justifyContent: 'flex-end' },
    chartBarInner: { width: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
    chartDayLabel: { fontSize: 8, color: '#A0AEC0', marginTop: 8, fontFamily: 'Poppins_700Bold' },
    emptyChart: { height: 80, justifyContent: 'center', alignItems: 'center' },
    emptyChartText: { color: Colors.textLight, fontSize: 12, fontFamily: 'Poppins_400Regular' },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    tabItem: { alignItems: 'center' },
    tabLabel: { fontSize: 10, marginTop: 4, fontFamily: 'Poppins_600SemiBold', color: Colors.textLight },
    addBtnContainer: { width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: -40, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    welcomeOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 25 },
    welcomeCard: { backgroundColor: '#fff', borderRadius: 35, padding: 30, alignItems: 'center', width: '100%', maxWidth: 350, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 15 },
    welcomeIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 25, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
    welcomeTitle: { fontSize: 26, fontFamily: 'Poppins_900Black', color: Colors.text, marginBottom: 15, textAlign: 'center' },
    welcomeText: { fontSize: 16, color: Colors.textLight, textAlign: 'center', lineHeight: 24, marginBottom: 30, fontFamily: 'Poppins_400Regular' },
    welcomeButton: { backgroundColor: Colors.primary, paddingVertical: 18, paddingHorizontal: 40, borderRadius: 20, width: '100%', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    welcomeButtonText: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_700Bold' },
    calendarModal: { width: '100%', backgroundColor: '#fff', borderRadius: 28, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text },
    modalSub: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: Colors.textLight, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    modalGrid: { flexDirection: 'row', gap: 10 },
    modalOption: { flex: 1, backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    modalOptionText: { fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: Colors.text },
    dateInputs: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    flexInput: { flex: 1 },
    inputLabel: { fontSize: 11, color: Colors.textLight, marginBottom: 6, fontFamily: 'Poppins_600SemiBold' },
    dateInputDisplay: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 },
    dateInputText: { fontSize: 13, color: Colors.text, fontFamily: 'Poppins_600SemiBold' },
    applyBtn: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    applyBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins_700Bold' },

    footerActions: { paddingHorizontal: 20, marginTop: 10, alignItems: 'center' },
    seeAllOrdersBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 15, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' },
    seeAllOrdersText: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: Colors.primary }
});

