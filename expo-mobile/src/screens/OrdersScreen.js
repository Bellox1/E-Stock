import React, { useState, useEffect } from 'react';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
    Image,
    Alert,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import CustomLoader from '../components/CustomLoader';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

export default function OrdersScreen({ navigation, route }) {
    const { getPermission } = useContext(AuthContext);
    const { selectedShop } = useContext(ShopContext);
    const isFocused = useIsFocused();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const clientId = route.params?.clientId;
    const orderId = route.params?.orderId;
    const [statusFilter, setStatusFilter] = useState('all'); // all, paid, debt

    useEffect(() => {
        if (isFocused && selectedShop) {
            fetchOrders();
        }
    }, [clientId, orderId, isFocused, statusFilter, selectedShop]);

    const fetchOrders = async () => {
        if (!selectedShop) return;

        try {
            const url = `${Config.API_URL}/orders?shop_id=${selectedShop.id}${orderId ? `&order_id=${orderId}` : ''}`;
            const ordersRes = await axios.get(url);

            let filteredOrders = ordersRes.data;
            if (clientId) {
                filteredOrders = filteredOrders.filter(order => order.client_id === clientId);
            }
            // Note: If orderId is passed, the backend might already filter or we filter here
            if (orderId) {
                filteredOrders = filteredOrders.filter(order => order.id == orderId);
            }

            // Appliquer le filtre de statut (seulement si on ne cherche pas une commande/client spécifique)
            if (!orderId && !clientId) {
                if (statusFilter === 'paid') {
                    filteredOrders = filteredOrders.filter(order => order.status === 'paid');
                } else if (statusFilter === 'debt') {
                    filteredOrders = filteredOrders.filter(order => order.status === 'partial' || order.status === 'credit');
                }
            }

            setOrders(filteredOrders);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Fetch orders error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setLoading(true);
        fetchOrders();
    };

    const handleMarkAsPaid = async (order) => {
        const remaining = order.total_amount - order.paid_amount;
        if (remaining <= 0) return;

        Alert.alert(
            "Confirmer le règlement",
            `Voulez-vous marquer cette commande comme entièrement payée (${remaining.toLocaleString()} XOF) ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await axios.patch(`${Config.API_URL}/orders/${order.id}/payment`, {
                                added_amount: remaining
                            });
                            showMessage('Commande réglée !');
                            fetchOrders();
                        } catch (error) {
                            console.error('Mark as paid error:', error);
                            showMessage('Erreur lors du règlement');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleExportCSV = async () => {
        if (!getPermission('export_excel')) {
            Alert.alert('Accès refusé', "Votre offre ne permet pas l'export Excel.");
            return;
        }

        try {
            showMessage("Préparation de l'export...");
            const authHeader = axios.defaults.headers.common['Authorization'];
            if (!authHeader) return;

            const url = `${Config.API_URL}/export/orders?shop_id=${selectedShop?.id}`;
            const fileUri = FileSystem.documentDirectory + `ventes_${selectedShop?.name || 'export'}_${Date.now()}.csv`;

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

    const handleDownloadPDF = async (orderId) => {
        try {
            const authHeader = axios.defaults.headers.common['Authorization'];
            if (!authHeader) {
                showMessage('Session expirée. Veuillez vous reconnecter.');
                return;
            }

            showMessage('Téléchargement en cours...');

            // Nettoyage et encodage du token pour l'URL
            const token = authHeader.replace('Bearer ', '');
            const encodedToken = encodeURIComponent(token);
            const url = `${Config.API_URL}/orders/${orderId}/invoice?token=${encodedToken}`;
            const fileUri = `${FileSystem.documentDirectory}facture_${orderId}.pdf`;

            const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
                headers: {
                    'Authorization': authHeader
                }
            });

            if (downloadResult.status === 200) {
                // Ouverture directe du menu de partage sans alerte intermédiaire
                await Sharing.shareAsync(downloadResult.uri);
            } else {
                showMessage(`Impossible de generer le PDF (Statut: ${downloadResult.status})`);
            }
        } catch (error) {
            console.error('Erreur PDF:', error);
            showMessage('Connexion au serveur impossible.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return '#10B981';
            case 'partial': return '#F59E0B';
            case 'credit': return '#EF4444';
            default: return Colors.textLight;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'paid': return 'Payé';
            case 'partial': return 'Partiel';
            case 'credit': return 'Crédit';
            default: return status;
        }
    };

    const renderOrderItem = ({ item, index }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View style={styles.orderIdBox}>
                    <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
                    <Text style={styles.orderId}>#{orders.length - index}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                            {getStatusLabel(item.status)}
                        </Text>
                    </View>
                    {item.status !== 'paid' && (
                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={() => handleMarkAsPaid(item)}
                        >
                            <Ionicons name="checkmark-done-circle-outline" size={20} color="#10B981" />
                        </TouchableOpacity>
                    )}
                    {getPermission('invoices', false) && (
                        <TouchableOpacity
                            style={styles.pdfButton}
                            onPress={() => handleDownloadPDF(item.id)}
                        >
                            <Ionicons name="download-outline" size={20} color="#10B981" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => navigation.navigate('Sales', {
                            editOrder: item,
                            shopId: item.shop_id
                        })}
                    >
                        <Ionicons name="create-outline" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.orderBody}>
                <View style={styles.orderRow}>
                    <Ionicons name="person-outline" size={16} color={Colors.textLight} />
                    <Text style={styles.orderLabel}>Client:</Text>
                    <Text style={styles.orderValue}>{item.client?.name || 'Client anonyme'}</Text>
                </View>

                <View style={styles.orderRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.textLight} />
                    <Text style={styles.orderLabel}>Date:</Text>
                    <Text style={styles.orderValue}>
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {item.payment_date && (
                    <View style={styles.orderRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={[styles.orderLabel, { color: '#10B981' }]}>Réglé le:</Text>
                        <Text style={[styles.orderValue, { color: '#10B981', fontWeight: 'bold' }]}>
                            {new Date(item.payment_date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </Text>
                    </View>
                )}

                {(item.status !== 'paid' && (item.payment_due_date || item.debt_notes)) && (
                    <View style={{ marginTop: 8, gap: 5 }}>
                        {item.payment_due_date && (
                            <View style={styles.orderRow}>
                                <Ionicons name="calendar" size={14} color="#EF4444" />
                                <Text style={[styles.orderLabel, { color: '#EF4444', fontSize: 12 }]}>Échéance:</Text>
                                <Text style={[styles.orderValue, { color: '#EF4444', fontSize: 12 }]}>
                                    {new Date(item.payment_due_date).toLocaleDateString('fr-FR')}
                                </Text>
                            </View>
                        )}
                        {item.debt_notes && (
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <Ionicons name="document-text-outline" size={14} color={Colors.textLight} style={{ marginTop: 2 }} />
                                <Text style={[styles.orderLabel, { fontSize: 12 }]}>Note:</Text>
                                <Text style={[styles.orderValue, { fontSize: 12, fontStyle: 'italic', color: Colors.text }]}>
                                    {item.debt_notes}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.itemsList}>
                    {item.items?.map((orderItem, index) => (
                        <View key={index} style={styles.itemRow}>
                            {orderItem.product?.image_url ? (
                                <Image source={{ uri: orderItem.product.image_url }} style={styles.itemImage} />
                            ) : (
                                <View style={styles.itemImagePlaceholder}>
                                    <Ionicons name="image-outline" size={14} color={Colors.textLight} />
                                </View>
                            )}
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName} numberOfLines={1}>{orderItem.product?.name}</Text>
                                <Text style={styles.itemQty}>x{orderItem.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>
                                {Math.floor(orderItem.unit_price * orderItem.quantity).toLocaleString()} XOF
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.orderFooter}>
                <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Total</Text>
                    <Text style={styles.amountValue}>{Math.floor(item.total_amount || 0).toLocaleString()} XOF</Text>
                </View>
                <View style={styles.amountBox}>
                    <Text style={styles.amountLabel}>Payé</Text>
                    <Text style={[styles.amountValue, { color: '#10B981' }]}>
                        {Math.floor(item.paid_amount || 0).toLocaleString()} XOF
                    </Text>
                </View>
                {item.status !== 'paid' && (
                    <View style={styles.amountBox}>
                        <Text style={styles.amountLabel}>Reste</Text>
                        <Text style={[styles.amountValue, { color: Colors.error }]}>
                            {Math.floor((item.total_amount || 0) - (item.paid_amount || 0)).toLocaleString()} XOF
                        </Text>
                    </View>
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
                <Text style={styles.headerTitle}>Commandes</Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    {getPermission('export_excel') && (
                        <TouchableOpacity
                            onPress={handleExportCSV}
                            style={[styles.headerIconBtn, { backgroundColor: '#F0FDF4' }]}
                        >
                            <Ionicons name="download-outline" size={24} color="#16A34A" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Sales')}
                        style={[styles.headerIconBtn, { backgroundColor: '#F0FDF4' }]}
                    >
                        <Ionicons name="add" size={28} color="#10B981" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.filterScrollContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity
                        style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
                        onPress={() => setStatusFilter('all')}
                    >
                        <Text style={[styles.filterChipText, statusFilter === 'all' && styles.filterChipTextActive]}>Toutes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, statusFilter === 'paid' && styles.filterChipActive]}
                        onPress={() => setStatusFilter('paid')}
                    >
                        <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                        <Text style={[styles.filterChipText, statusFilter === 'paid' && styles.filterChipTextActive]}>Payées</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterChip, statusFilter === 'debt' && styles.filterChipActive]}
                        onPress={() => setStatusFilter('debt')}
                    >
                        <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={[styles.filterChipText, statusFilter === 'debt' && styles.filterChipTextActive]}>Dettes / Partiels</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {(clientId || orderId) && (
                <View style={styles.filterBanner}>
                    <Ionicons name="filter" size={16} color={Colors.primary} />
                    <Text style={styles.filterText}>
                        {clientId ? 'Commandes du client sélectionné' : `Commande #${orderId}`}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.setParams({ clientId: null, orderId: null })}>
                        <Text style={styles.clearFilter}>Effacer</Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={onRefresh}
                        tintColor="transparent"
                        colors={['transparent']}
                        progressViewOffset={-500}
                    />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={60} color={Colors.textLight} />
                            <Text style={styles.emptyText}>Aucune commande enregistrée</Text>
                        </View>
                    )
                }
            />
            {loading && <CustomLoader />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    filterBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', marginHorizontal: 20, marginBottom: 15, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' },
    filterText: { flex: 1, fontSize: 13, color: Colors.primary, marginLeft: 8, fontWeight: '600' },
    clearFilter: { fontSize: 13, color: Colors.error, fontWeight: 'bold', paddingLeft: 10 },
    filterScrollContainer: { marginBottom: 5 },
    filterScroll: { paddingHorizontal: 20, paddingBottom: 10, gap: 10 },
    filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterChipText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
    filterChipTextActive: { color: '#fff', fontWeight: 'bold' },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    listContent: { padding: 20, paddingTop: 10 },
    orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#EDF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    orderIdBox: { flexDirection: 'row', alignItems: 'center' },
    orderId: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginLeft: 6 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
    pdfButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
    payButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
    editButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },

    orderBody: { marginBottom: 15 },
    orderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    orderLabel: { fontSize: 13, color: Colors.textLight, marginLeft: 8, marginRight: 6 },
    orderValue: { fontSize: 13, color: Colors.text, fontWeight: '600', flex: 1 },
    itemsList: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
    itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    itemImage: { width: 32, height: 32, borderRadius: 6, marginRight: 10, backgroundColor: '#F1F5F9' },
    itemImagePlaceholder: { width: 32, height: 32, borderRadius: 6, marginRight: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    itemDetails: { flex: 1 },
    itemName: { fontSize: 13, fontWeight: '600', color: Colors.text },
    itemQty: { fontSize: 12, color: Colors.textLight },
    itemPrice: { fontSize: 13, fontWeight: 'bold', color: Colors.text },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    amountBox: { alignItems: 'center' },
    amountLabel: { fontSize: 10, color: Colors.textLight, marginBottom: 4, textTransform: 'uppercase' },
    amountValue: { fontSize: 14, fontWeight: 'bold', color: Colors.text },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textLight, marginTop: 10, fontSize: 14 }
});
