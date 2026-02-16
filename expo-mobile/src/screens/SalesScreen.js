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
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../constants/Colors';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import Config from '../constants/Config';
import CustomLoader from '../components/CustomLoader';
import BottomMenu from '../components/BottomMenu';

import { useIsFocused } from '@react-navigation/native';

export default function SalesScreen({ navigation, route }) {
    const { selectedShop, loading: shopLoading } = useContext(ShopContext);
    const isFocused = useIsFocused();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paidAmount, setPaidAmount] = useState('');
    const [dueDate, setDueDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [debtNotes, setDebtNotes] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [clientSearch, setClientSearch] = useState('');

    // Mode édition
    const editOrder = route.params?.editOrder;
    const isEditMode = !!editOrder;

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const filteredProducts = products
        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    const filteredClients = clients
        .filter(c =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            (c.phone && c.phone.includes(clientSearch))
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        if (selectedShop && isFocused) {
            fetchData();
        }
    }, [selectedShop, isFocused]);

    // Charger les données de la commande en mode édition
    useEffect(() => {
        if (isEditMode && editOrder && products.length > 0 && clients.length > 0) {
            loadOrderData();
        }
    }, [isEditMode, editOrder, products, clients]);

    const loadOrderData = () => {
        // Charger le panier avec les produits de la commande
        const orderCart = editOrder.items.map(item => {
            const product = products.find(p => p.id === item.product_id);
            return {
                ...product,
                quantity: item.quantity
            };
        }).filter(item => item.id); // Filtrer les produits non trouvés

        setCart(orderCart);
        setPaidAmount(editOrder.paid_amount.toString());
        setDebtNotes(editOrder.debt_notes || '');
        if (editOrder.payment_due_date) {
            setDueDate(new Date(editOrder.payment_due_date));
        }

        // Sélectionner le client si présent
        if (editOrder.client_id) {
            const client = clients.find(c => c.id === editOrder.client_id);
            setSelectedClient(client || null);
        }
    };

    const fetchData = async () => {
        if (!selectedShop) return;

        try {
            const [productsRes, clientsRes] = await Promise.all([
                axios.get(`${Config.API_URL}/products?shop_id=${selectedShop.id}`),
                axios.get(`${Config.API_URL}/clients`)
            ]);
            setProducts(productsRes.data);
            setClients(clientsRes.data);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculer le stock disponible en temps réel (stock DB - quantité dans le panier)
    const getAvailableStock = (productId) => {
        const product = products.find(p => p.id === productId);
        const cartItem = cart.find(item => item.id === productId);
        if (!product) return 0;
        return product.stock_quantity - (cartItem?.quantity || 0);
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        const availableStock = getAvailableStock(product.id);

        if (existing) {
            if (availableStock <= 0) {
                showMessage(`Stock insuffisant: il ne reste que ${product.stock_quantity} unités`);
                return;
            }
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            if (availableStock < 1) {
                showMessage('Rupture de stock');
                return;
            }
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId) => {
        const existing = cart.find(item => item.id === productId);
        if (existing.quantity > 1) {
            setCart(cart.map(item =>
                item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
            ));
        } else {
            setCart(cart.filter(item => item.id !== productId));
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        const finalPaid = paidAmount === '' ? total : parseFloat(paidAmount);

        // Validation : montant payé ne peut pas dépasser le total
        if (finalPaid > total) {
            showMessage(`Montant invalide: le montant payé (${finalPaid.toLocaleString()} XOF) ne peut pas dépasser le total`);
            return;
        }

        if (finalPaid < total && !selectedClient) {
            showMessage('Veuillez sélectionner un client pour les ventes à crédit');
            return;
        }

        setSubmitting(true);
        try {
            const orderData = {
                shop_id: selectedShop.id,
                client_id: selectedClient?.id,
                items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
                paid_amount: finalPaid,
                payment_due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
                debt_notes: debtNotes
            };

            if (isEditMode) {
                // Mode édition : PUT
                await axios.put(`${Config.API_URL}/orders/${editOrder.id}`, orderData);
                showMessage('Commande mise à jour !');
                navigation.goBack(); // Retour à la liste des commandes
            } else {
                // Mode création : POST
                await axios.post(`${Config.API_URL}/orders`, orderData);
                showMessage('Vente enregistrée !');
                setCart([]);
                setPaidAmount('');
                setSelectedClient(null);
                fetchData(); // Refresh stock
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Impossible d\'enregistrer la vente');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ventes</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Orders')}
                    style={[styles.headerIconBtn, { backgroundColor: '#EFF6FF' }]}
                >
                    <Ionicons name="list" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {!loading && !shopLoading && products.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateTitle}>Aucun produit disponible</Text>
                        <Text style={styles.emptyStateText}>
                            Vous n'avez pas encore de produit ni client pour créer une commande.
                        </Text>
                        <TouchableOpacity
                            style={styles.createProductBtn}
                            onPress={() => navigation.navigate('Products', { createMode: true })}
                        >
                            <Ionicons name="add-circle" size={18} color="#fff" />
                            <Text style={styles.createProductBtnText}>Créer votre premier produit</Text>
                        </TouchableOpacity>

                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.productSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionLabel}>Produits disponible</Text>
                                <View style={styles.searchBarContainer}>
                                    <Ionicons name="search" size={16} color={Colors.textLight} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Rechercher un produit..."
                                        value={productSearch}
                                        onChangeText={setProductSearch}
                                    />
                                </View>
                            </View>
                            <FlatList
                                data={filteredProducts}
                                keyExtractor={item => item.id.toString()}
                                renderItem={({ item }) => {
                                    const availableStock = getAvailableStock(item.id);
                                    const isOutOfStock = availableStock === 0;
                                    return (
                                        <TouchableOpacity
                                            style={[styles.productItem, isOutOfStock && { opacity: 0.5 }]}
                                            onPress={() => addToCart(item)}
                                            disabled={isOutOfStock}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                {item.image_url ? (
                                                    <Image source={{ uri: item.image_url }} style={styles.productImage} />
                                                ) : (
                                                    <View style={[styles.productImage, { backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }]}>
                                                        <Ionicons name="image-outline" size={16} color={Colors.textLight} />
                                                    </View>
                                                )}
                                                <View style={styles.productInfo}>
                                                    <Text style={styles.productName}>{item.name}</Text>
                                                    <Text style={[styles.productStock, availableStock <= item.stock_threshold && { color: Colors.error }]}>
                                                        Disp: {availableStock}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={styles.productPrice}>{Math.floor(item.price).toLocaleString()} XOF</Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>

                        <View style={styles.cartSection}>
                            <View style={styles.cartHeader}>
                                <Text style={styles.sectionLabel}>Panier ({cart.length})</Text>
                                <TouchableOpacity onPress={() => setCart([])}>
                                    <Text style={{ color: Colors.error, fontSize: 12 }}>Vider</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
                                <View style={styles.cartItemsContainer}>
                                    {cart.length === 0 ? (
                                        <View style={styles.emptyCart}>
                                            <Ionicons name="cart-outline" size={40} color={Colors.textLight} />
                                            <Text style={styles.emptyCartText}>Panier vide</Text>
                                        </View>
                                    ) : (
                                        cart.map(item => (
                                            <View key={item.id} style={styles.cartItem}>
                                                <View style={styles.cartItemInfo}>
                                                    {item.image_url && (
                                                        <Image source={{ uri: item.image_url }} style={styles.cartItemImage} />
                                                    )}
                                                    <View>
                                                        <Text style={styles.cartItemName}>{item.name}</Text>
                                                        <Text style={styles.cartItemPrice}>{Math.floor(item.price).toLocaleString()} XOF x {item.quantity}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.cartItemActions}>
                                                    <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                                                        <Ionicons name="remove-circle-outline" size={24} color={Colors.error} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => addToCart(item)}>
                                                        <Ionicons name="add-circle-outline" size={24} color={Colors.success} />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>

                                <View style={styles.checkoutForm}>
                                    <View style={styles.totalRow}>
                                        <Text style={styles.totalLabel}>Total</Text>
                                        <Text style={styles.totalValue}>{Math.floor(total).toLocaleString()} XOF</Text>
                                    </View>

                                    <View style={styles.clientSelectionSection}>
                                        <View style={styles.sectionHeader}>
                                            <Text style={styles.inputLabel}>Attribuer à un client</Text>
                                            <View style={[styles.searchBarContainer, { marginBottom: 10, height: 36 }]}>
                                                <Ionicons name="search" size={14} color={Colors.textLight} />
                                                <TextInput
                                                    style={[styles.searchInput, { fontSize: 13 }]}
                                                    placeholder="Rechercher un client..."
                                                    value={clientSearch}
                                                    onChangeText={setClientSearch}
                                                />
                                            </View>
                                        </View>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clientList}>
                                            {filteredClients.map(client => (
                                                <TouchableOpacity
                                                    key={client.id}
                                                    style={[
                                                        styles.clientChip,
                                                        selectedClient?.id === client.id && styles.selectedClientChip
                                                    ]}
                                                    onPress={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                                                >
                                                    <Text style={[
                                                        styles.clientChipText,
                                                        selectedClient?.id === client.id && styles.selectedClientChipText
                                                    ]}>{client.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                            <TouchableOpacity
                                                style={styles.addClientChip}
                                                onPress={() => navigation.navigate('Clients')}
                                            >
                                                <Ionicons name="add" size={16} color={Colors.primary} />
                                                <Text style={styles.addClientText}>Nouveau</Text>
                                            </TouchableOpacity>
                                        </ScrollView>
                                    </View>

                                    <Text style={styles.inputLabel}>Montant payé par le client</Text>
                                    <TextInput
                                        style={styles.amountInput}
                                        placeholder={`Montant total: ${Math.floor(total).toLocaleString()} XOF`}
                                        keyboardType="numeric"
                                        value={paidAmount}
                                        onChangeText={setPaidAmount}
                                    />
                                    {paidAmount !== '' && parseFloat(paidAmount) < total && (
                                        <View>
                                            <View style={styles.debtInfo}>
                                                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                                                <Text style={styles.debtText}>
                                                    Dette restante: {Math.floor(total - parseFloat(paidAmount || 0)).toLocaleString()} XOF
                                                </Text>
                                            </View>

                                            <Text style={styles.inputLabel}>Date limite de règlement</Text>
                                            <TouchableOpacity
                                                style={styles.dateSelector}
                                                onPress={() => setShowDatePicker(true)}
                                            >
                                                <Ionicons name="calendar-outline" size={20} color={Colors.text} />
                                                <Text style={styles.dateSelectorText}>
                                                    {dueDate ? dueDate.toLocaleDateString('fr-FR') : 'Définir une date (Optionnel)'}
                                                </Text>
                                            </TouchableOpacity>

                                            {showDatePicker && Platform.OS === 'ios' && (
                                                <Modal
                                                    transparent={true}
                                                    animationType="fade"
                                                >
                                                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                                                        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20 }}>
                                                            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' }}>Sélectionner une date</Text>
                                                            <DateTimePicker
                                                                value={dueDate || new Date()}
                                                                mode="date"
                                                                display="spinner"
                                                                minimumDate={new Date()}
                                                                onChange={(event, selectedDate) => {
                                                                    if (selectedDate) setDueDate(selectedDate);
                                                                }}
                                                            />
                                                            <TouchableOpacity
                                                                style={{ backgroundColor: Colors.primary, padding: 15, borderRadius: 12, marginTop: 15 }}
                                                                onPress={() => setShowDatePicker(false)}
                                                            >
                                                                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Confirmer</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                </Modal>
                                            )}

                                            {showDatePicker && Platform.OS === 'android' && (
                                                <DateTimePicker
                                                    value={dueDate || new Date()}
                                                    mode="date"
                                                    display="default"
                                                    minimumDate={new Date()}
                                                    onChange={(event, selectedDate) => {
                                                        setShowDatePicker(false);
                                                        if (selectedDate) setDueDate(selectedDate);
                                                    }}
                                                />
                                            )}

                                            <Text style={styles.inputLabel}>Note sur la dette</Text>
                                            <TextInput
                                                style={styles.textArea}
                                                placeholder="Ex: Promesse de paiement fin du mois..."
                                                value={debtNotes}
                                                onChangeText={setDebtNotes}
                                                multiline
                                                numberOfLines={2}
                                            />
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[styles.checkoutButton, (cart.length === 0 || submitting) && styles.disabledButton]}
                                        onPress={handleCheckout}
                                        disabled={cart.length === 0 || submitting}
                                    >
                                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutButtonText}>{isEditMode ? 'Mettre à jour' : 'Enregistrer la vente'}</Text>}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                )}

            </KeyboardAvoidingView>
            {(loading || shopLoading) && <CustomLoader />}
            <BottomMenu navigation={navigation} activeTab="Sales" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    loadingContainer: { flex: 1, justifyContent: 'center' },
    content: { flex: 1, flexDirection: 'column' },
    productSection: { height: '35%', padding: 15 },
    sectionLabel: { fontSize: 11, fontWeight: 'bold', color: Colors.textLight, marginBottom: 8, textTransform: 'uppercase' },
    productItem: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    productImage: { width: 40, height: 40, borderRadius: 8, marginRight: 12 },
    productInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: 'bold' },
    productStock: { fontSize: 11, color: Colors.textLight },
    productPrice: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
    cartSection: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10, paddingBottom: 100 },
    cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cartItems: { flex: 1 },
    emptyCart: { alignItems: 'center', marginTop: 20 },
    emptyCartText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 5 },
    emptyCartText: { textAlign: 'center', color: Colors.textLight, fontSize: 12, marginTop: 5 },
    cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    cartItemInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
    cartItemImage: { width: 36, height: 36, borderRadius: 8, marginRight: 10 },
    cartItemName: { fontSize: 14, fontWeight: '600' },
    cartItemPrice: { fontSize: 11, color: Colors.textLight },
    cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkoutForm: { marginTop: 10 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    totalLabel: { fontSize: 16, fontWeight: 'bold' },
    totalValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
    inputLabel: { fontSize: 11, fontWeight: 'bold', color: Colors.textLight, marginBottom: 5 },
    clientSelectionSection: { marginBottom: 10 },
    clientList: { flexDirection: 'row', marginBottom: 5 },
    clientChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, backgroundColor: '#f3f4f6', marginRight: 8, height: 32, justifyContent: 'center' },
    selectedClientChip: { backgroundColor: Colors.primary },
    clientChipText: { fontSize: 12 },
    selectedClientChipText: { color: '#fff', fontWeight: 'bold' },
    addClientChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.primary, height: 32 },
    addClientText: { marginLeft: 4, fontSize: 11, color: Colors.primary },
    amountInput: { backgroundColor: '#f3f4f6', borderRadius: 10, height: 45, paddingHorizontal: 12, fontSize: 14, marginBottom: 5 },
    debtInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, marginBottom: 10 },
    debtText: { fontSize: 12, color: Colors.error, marginLeft: 8, fontWeight: '600' },
    checkoutButton: { backgroundColor: Colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    disabledButton: { opacity: 0.5 },
    checkoutButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 10, height: 40, flex: 0.7 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.text },

    // Empty State Styles
    emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyStateIconContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    emptyStateTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.text, marginBottom: 10, textAlign: 'center' },
    emptyStateText: { fontSize: 15, color: Colors.textLight, textAlign: 'center', marginBottom: 30, lineHeight: 22, fontFamily: 'Poppins_400Regular' },
    createProductBtn: { position: 'absolute', bottom: 40, flexDirection: 'row', backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, alignItems: 'center', gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    createProductBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Poppins_700Bold' },
    dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, marginBottom: 15, gap: 10 },
    dateSelectorText: { fontSize: 14, color: Colors.text },
    textArea: { backgroundColor: '#f3f4f6', borderRadius: 10, padding: 12, height: 80, textAlignVertical: 'top', marginBottom: 15 }
});
