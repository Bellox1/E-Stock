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
    Alert,
    Modal,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { ShopContext } from '../context/ShopContext';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Config from '../constants/Config';
import CustomLoader from '../components/CustomLoader';
import BottomMenu from '../components/BottomMenu';

export default function ProductsScreen({ navigation, route }) {
    const { getPermission } = useContext(AuthContext);
    const { selectedShop, loading: shopLoading } = useContext(ShopContext);
    const editId = route.params?.editId;
    const showLowStock = route.params?.showLowStock;
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stockModalVisible, setStockModalVisible] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newStock, setNewStock] = useState('');
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleExportCSV = async () => {
        if (!getPermission('export_excel')) {
            Alert.alert('Accès refusé', "Votre offre ne permet pas l'export Excel.");
            return;
        }

        try {
            showMessage("Préparation de l'export...");
            const authHeader = axios.defaults.headers.common['Authorization'];
            if (!authHeader) return; // Should handle re-auth but kept simple

            // Construire l'URL avec le shop_id
            const url = `${Config.API_URL}/export/products?shop_id=${selectedShop?.id}`; // Assuming selectedShop is available
            const fileUri = FileSystem.documentDirectory + `produits_${selectedShop?.name || 'export'}_${Date.now()}.csv`;

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

    const showLocalError = (msg) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(null), 3000);
    };

    // Form for product
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        stock_quantity: '',
        stock_threshold: '1',
        category_id: null,
        description: '',
        image: null
    });

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (showLowStock) {
            return matchesSearch && (p.stock_quantity <= p.stock_threshold);
        }
        return matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        if (selectedShop) {
            fetchData();
        }
    }, [selectedShop]);

    useEffect(() => {
        if (route.params?.createMode) {
            resetForm();
            setAddModalVisible(true);
            navigation.setParams({ createMode: null });
        }
    }, [route.params?.createMode]);

    const fetchData = async () => {
        if (!selectedShop) return;

        try {
            const [productsRes, categoriesRes] = await Promise.all([
                axios.get(`${Config.API_URL}/products?shop_id=${selectedShop.id}`),
                axios.get(`${Config.API_URL}/categories?shop_id=${selectedShop.id}`)
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Fetch error:', error);
            showMessage('Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && editId && products.length > 0) {
            const product = products.find(p => p.id == editId);
            if (product) {
                openEditModal(product);
            }
        }
    }, [loading, editId, products]);

    const handleUpdateStock = async () => {
        if (!newStock || isNaN(newStock)) {
            showMessage('Veuillez entrer un nombre valide');
            return;
        }

        setUpdating(true);
        try {
            const response = await axios.put(`${Config.API_URL}/products/${selectedProduct.id}`, {
                stock_quantity: parseInt(newStock)
            });
            setProducts(products.map(p => p.id === selectedProduct.id ? response.data : p));
            setStockModalVisible(false);
        } catch (error) {
            showMessage('Mise à jour échouée');
        } finally {
            setUpdating(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setFormData({ ...formData, image: result.assets[0].uri });
        }
    };

    const handleSaveProduct = async () => {
        if (!formData.name || !formData.price || !formData.stock_quantity) {
            showLocalError('Veuillez remplir les champs obligatoires');
            return;
        }

        setUpdating(true);
        try {
            const data = new FormData();
            data.append('shop_id', selectedShop.id);
            data.append('name', formData.name);
            data.append('price', formData.price);
            data.append('stock_quantity', formData.stock_quantity);
            data.append('stock_threshold', formData.stock_threshold);
            if (formData.category_id) data.append('category_id', formData.category_id);
            if (formData.description) data.append('description', formData.description);

            if (formData.image && !formData.image.startsWith('http')) {
                const filename = formData.image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                data.append('image', { uri: formData.image, name: filename, type });
            }

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            if (isEditing) {
                data.append('_method', 'PUT');
                const response = await axios.post(`${Config.API_URL}/products/${selectedProduct.id}`, data, config);
                setProducts(products.map(p => p.id === selectedProduct.id ? response.data : p));
                showMessage('Produit modifié');
            } else {
                const response = await axios.post(`${Config.API_URL}/products`, data, config);
                setProducts([response.data, ...products]);
                showMessage('Produit ajouté');
            }
            setAddModalVisible(false);
            resetForm();
        } catch (error) {
            console.error('Save product error:', error);
            if (error.response) {
                const data = error.response.data;

                // 1. Validation errors (422)
                if (error.response.status === 422 && data.errors) {
                    const errorMessages = Object.values(data.errors).flat();
                    if (errorMessages.length > 0) {
                        showLocalError(errorMessages[0]);
                        return;
                    }
                }

                // 2. Server message
                const message = data.message || 'Erreur inconnue';

                // Check if it's a limit error (403 or generic message)
                if (message.toLowerCase().includes('limite')) {
                    showMessage('Limite atteinte !');
                    setAddModalVisible(false);
                    navigation.navigate('Offers');
                    return;
                }

                showLocalError(message);
            } else {
                showLocalError('Erreur de connexion');
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteProduct = (product, force = false) => {
        Alert.alert(
            force ? 'Confirmation de force' : 'Suppression',
            force ? 'Cela supprimera également tout l\'historique des ventes de ce produit. Continuer ?' : `Voulez-vous supprimer "${product.name}" ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const url = `${Config.API_URL}/products/${product.id}${force ? '?force=1' : ''}`;
                            await axios.delete(url);
                            setProducts(products.filter(p => p.id !== product.id));
                            showMessage('Produit supprimé');
                        } catch (error) {
                            if (error.response?.data?.requires_force) {
                                handleDeleteProduct(product, true);
                            } else {
                                showMessage(error.response?.data?.message || 'Suppression impossible');
                            }
                        }
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', stock_quantity: '', stock_threshold: '1', category_id: null, description: '', image: null });
        setSelectedProduct(null);
        setIsEditing(false);
        setErrorMsg(null);
    };

    const openEditModal = (product) => {
        setErrorMsg(null);
        setSelectedProduct(product);
        setFormData({
            name: product.name,
            price: product.price.toString(),
            stock_quantity: product.stock_quantity.toString(),
            stock_threshold: product.stock_threshold.toString(),
            category_id: product.category_id,
            description: product.description || '',
            image: product.image_url
        });
        setIsEditing(true);
        setAddModalVisible(true);
    };

    const renderProductItem = ({ item }) => (
        <View style={styles.productItem}>
            <View style={styles.productHeader}>
                {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={styles.productImageThumb} />
                ) : (
                    <View style={styles.productImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color={Colors.textLight} />
                    </View>
                )}
                <View style={styles.productMainInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <TouchableOpacity onPress={() => openEditModal(item)} style={{ marginLeft: 10 }}>
                            <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.productCategory}>{item.category?.name || ''}</Text>
                    {item.description ? (
                        <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                </View>
                <View style={styles.priceActions}>
                    <Text style={styles.productPrice}>{Math.floor(item.price).toLocaleString()} XOF</Text>
                    <TouchableOpacity onPress={() => handleDeleteProduct(item)} style={{ marginTop: 5 }}>
                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.productFooter}>
                <View style={[
                    styles.stockBadge,
                    { backgroundColor: item.stock_quantity <= item.stock_threshold ? '#FFEBEE' : '#E8F5E9' }
                ]}>
                    <Text style={[
                        styles.stockText,
                        { color: item.stock_quantity <= item.stock_threshold ? Colors.error : Colors.success }
                    ]}>
                        Stock: {item.stock_quantity}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={() => {
                        setSelectedProduct(item);
                        setNewStock(item.stock_quantity.toString());
                        setStockModalVisible(true);
                    }}
                >
                    <Ionicons name="swap-vertical" size={18} color={Colors.white} />
                    <Text style={styles.updateButtonText}>Stock</Text>
                </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Produits</Text>

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
                        onPress={() => {
                            const limit = getPermission('products', 0);
                            if (products.length >= limit) {
                                Alert.alert(
                                    'Limite atteinte',
                                    `Votre offre actuelle est limitée à ${limit} produit(s). Veuillez passer à une offre supérieure pour en ajouter d'autres.`,
                                    [
                                        { text: 'Plus tard', style: 'cancel' },
                                        { text: 'Voir les offres', onPress: () => navigation.navigate('Offers') }
                                    ]
                                );
                                return;
                            }
                            resetForm();
                            setAddModalVisible(true);
                        }}
                        style={styles.headerIconBtn}
                    >
                        <Ionicons name="add" size={28} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {showLowStock && (
                <View style={styles.filterInfo}>
                    <Ionicons name="filter" size={16} color={Colors.error} />
                    <Text style={styles.filterText}>Affichage : Produits en alerte uniquement</Text>
                    <TouchableOpacity onPress={() => navigation.setParams({ showLowStock: false })}>
                        <Text style={styles.clearFilter}>Effacer</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={Colors.textLight} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredProducts}
                renderItem={renderProductItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={60} color={Colors.textLight} />
                            <Text style={styles.emptyText}>Aucun produit trouvé</Text>
                        </View>
                    )
                }
            />

            {loading && <CustomLoader />}

            {/* Stock Adjustment Modal */}
            <Modal visible={stockModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Ajuster le stock</Text>
                        <TextInput
                            style={styles.modalInput}
                            keyboardType="number-pad"
                            value={newStock}
                            onChangeText={setNewStock}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setStockModalVisible(false)}>
                                <Text>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleUpdateStock}>
                                {updating ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Valider</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add / Edit Product Modal */}
            <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.fullModal}>
                    <View style={styles.modalTopBar}>
                        <View style={styles.modalDragHandle} />
                        <View style={styles.modalHeaderContent}>
                            <Text style={styles.modalTitleLarge}>{isEditing ? 'Modifier' : 'Nouveau'} Produit</Text>
                            <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {errorMsg && (
                        <View style={styles.floatingError}>
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 50}
                        style={{ flex: 1 }}
                    >
                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <View style={styles.formSection}>
                                <Text style={styles.label}>Image du produit (Optionnel)</Text>
                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                    {formData.image ? (
                                        <Image source={{ uri: formData.image }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Ionicons name="camera-outline" size={30} color={Colors.textLight} />
                                            <Text style={styles.imagePlaceholderText}>Ajouter une photo</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>Informations Générales</Text>
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIcon}>
                                        <Ionicons name="pricetag-outline" size={20} color={Colors.textLight} />
                                    </View>
                                    <TextInput
                                        style={styles.inputFlex}
                                        value={formData.name}
                                        onChangeText={t => setFormData({ ...formData, name: t })}
                                        placeholder="Nom du produit (ex: Savon Bio)"
                                    />
                                </View>

                                <View style={styles.rowInputs}>
                                    <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                        <View style={styles.inputIcon}>
                                            <Ionicons name="cash-outline" size={20} color={Colors.textLight} />
                                        </View>
                                        <TextInput
                                            style={styles.inputFlex}
                                            keyboardType="numeric"
                                            value={formData.price}
                                            onChangeText={t => setFormData({ ...formData, price: t })}
                                            placeholder="Prix"
                                        />
                                    </View>
                                    <View style={[styles.inputContainer, { flex: 1 }]}>
                                        <View style={styles.inputIcon}>
                                            <Ionicons name="cube-outline" size={20} color={Colors.textLight} />
                                        </View>
                                        <TextInput
                                            style={styles.inputFlex}
                                            keyboardType="numeric"
                                            value={formData.stock_quantity}
                                            onChangeText={t => {
                                                const qty = parseInt(t) || 0;
                                                setFormData({
                                                    ...formData,
                                                    stock_quantity: t,
                                                    stock_threshold: Math.floor(qty / 4).toString()
                                                });
                                            }}
                                            placeholder="Stock"
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>Paramètres d'Alerte</Text>
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIcon}>
                                        <Ionicons name="notifications-outline" size={20} color={Colors.error} />
                                    </View>
                                    <TextInput
                                        style={styles.inputFlex}
                                        keyboardType="numeric"
                                        value={formData.stock_threshold}
                                        onChangeText={t => setFormData({ ...formData, stock_threshold: t })}
                                        placeholder="Seuil critique (ex: 5)"
                                    />
                                </View>
                                <Text style={styles.helpText}>Vous recevrez une notification quand le stock descendra sous ce niveau.</Text>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={4}
                                    value={formData.description}
                                    onChangeText={t => setFormData({ ...formData, description: t })}
                                    placeholder="Ajoutez des détails sur le produit..."
                                />
                            </View>

                            <TouchableOpacity style={styles.saveButtonLarge} onPress={handleSaveProduct} disabled={updating}>
                                {updating ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.saveButtonTextLarge}>{isEditing ? 'Enregistrer les modifications' : 'Créer le produit'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={{ height: 100 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
            <BottomMenu navigation={navigation} activeTab="Products" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 15, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    searchInput: { flex: 1, marginLeft: 10 },
    filterInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 20, marginBottom: 15, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FEE2E2' },
    filterText: { flex: 1, fontSize: 13, color: Colors.error, marginLeft: 8, fontWeight: '600' },
    clearFilter: { fontSize: 13, color: Colors.primary, fontWeight: 'bold', paddingLeft: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center' },
    listContent: { paddingHorizontal: 20, paddingBottom: 110 },
    productItem: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#f3f4f6' },
    productHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    productMainInfo: { flex: 1 },
    productName: { fontSize: 16, fontWeight: 'bold' },
    productCategory: { fontSize: 12, color: Colors.textLight },
    productDescription: { fontSize: 11, color: Colors.textLight, marginTop: 4 },
    priceActions: { alignItems: 'flex-end' },
    productPrice: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
    quickActions: { flexDirection: 'row', marginTop: 5 },
    actionIcon: { padding: 5, marginLeft: 10 },
    productFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, alignItems: 'center' },
    stockBadge: { padding: 6, borderRadius: 8, paddingHorizontal: 10 },
    stockText: { fontSize: 12, fontWeight: 'bold' },
    updateButton: { backgroundColor: Colors.primary, flexDirection: 'row', padding: 10, borderRadius: 10, alignItems: 'center', paddingHorizontal: 15 },
    updateButtonText: { color: '#fff', marginLeft: 5, fontWeight: 'bold', fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    modalInput: { width: '100%', height: 60, backgroundColor: '#f3f4f6', borderRadius: 10, textAlign: 'center', fontSize: 28, marginBottom: 20, fontWeight: 'bold' },
    modalButtons: { flexDirection: 'row', gap: 10 },
    modalButton: { flex: 1, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cancelButton: { backgroundColor: '#f3f4f6' },
    confirmButton: { backgroundColor: Colors.primary },
    fullModal: { flex: 1, backgroundColor: '#F8FAFC' },
    modalTopBar: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 15, paddingTop: Platform.OS === 'android' ? 15 : 0 },
    modalDragHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 15 },
    modalHeaderContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25 },
    modalTitleLarge: { fontSize: 24, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    modalForm: { padding: 25 },
    formSection: { marginBottom: 25 },
    label: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, height: 60, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EDF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5 },
    inputIcon: { width: 35, alignItems: 'center' },
    inputFlex: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '600', paddingLeft: 5 },
    rowInputs: { flexDirection: 'row', marginTop: 15 },
    textArea: { backgroundColor: '#fff', borderRadius: 16, padding: 15, fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: '#EDF2F7', height: 120, textAlignVertical: 'top' },
    helpText: { fontSize: 12, color: Colors.textLight, marginTop: 8, paddingLeft: 5 },
    saveButtonLarge: { backgroundColor: Colors.primary, height: 50, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginTop: 10 },
    saveButtonTextLarge: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    imagePicker: { width: '100%', height: 200, backgroundColor: '#F3F4F6', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center', gap: 10 },
    imagePlaceholderText: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
    productImageThumb: { width: 60, height: 60, borderRadius: 10, marginRight: 15, backgroundColor: '#F3F4F6' },
    productImagePlaceholder: { width: 60, height: 60, borderRadius: 10, marginRight: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    productImagePlaceholder: { width: 60, height: 60, borderRadius: 10, marginRight: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
    floatingError: { position: 'absolute', top: 90, left: 20, right: 20, backgroundColor: Colors.error, borderRadius: 25, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 100, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    errorText: { color: '#fff', marginLeft: 10, flex: 1, fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textLight, marginTop: 10 }
});
