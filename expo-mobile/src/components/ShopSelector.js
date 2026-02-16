import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopContext } from '../context/ShopContext';
import Colors from '../constants/Colors';

export default function ShopSelector({ visible, onClose, showAllOption = false, onSelectAll = null, isAllSelected = false }) {
    const { shops, selectedShop, selectShop } = useContext(ShopContext);

    const handleSelectShop = (shop) => {
        selectShop(shop);
        onClose();
    };

    const handleSelectAll = () => {
        if (onSelectAll) onSelectAll();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Sélectionner une boutique</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView>
                        {showAllOption && (
                            <TouchableOpacity
                                style={[
                                    styles.shopItem,
                                    isAllSelected && styles.selectedShopItem
                                ]}
                                onPress={handleSelectAll}
                            >
                                <View style={styles.shopInfo}>
                                    <Ionicons
                                        name="grid"
                                        size={24}
                                        color={isAllSelected ? Colors.primary : Colors.textLight}
                                    />
                                    <View style={{ marginLeft: 15, flex: 1 }}>
                                        <Text style={[
                                            styles.shopName,
                                            isAllSelected && styles.selectedShopName
                                        ]}>
                                            Toutes les boutiques
                                        </Text>
                                    </View>
                                </View>
                                {isAllSelected && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        )}

                        {shops.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.shopItem,
                                    (!isAllSelected && selectedShop?.id === item.id) && styles.selectedShopItem
                                ]}
                                onPress={() => handleSelectShop(item)}
                            >
                                <View style={styles.shopInfo}>
                                    <Ionicons
                                        name="business"
                                        size={24}
                                        color={(!isAllSelected && selectedShop?.id === item.id) ? Colors.primary : Colors.textLight}
                                    />
                                    <View style={{ marginLeft: 15, flex: 1 }}>
                                        <Text style={[
                                            styles.shopName,
                                            (!isAllSelected && selectedShop?.id === item.id) && styles.selectedShopName
                                        ]}>
                                            {item.name}
                                        </Text>
                                        {item.address && (
                                            <Text style={styles.shopAddress}>{item.address}</Text>
                                        )}
                                    </View>
                                </View>
                                {(!isAllSelected && selectedShop?.id === item.id) && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    content: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingBottom: 40, maxHeight: '70%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    title: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    shopItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    selectedShopItem: { backgroundColor: '#EFF6FF' },
    shopInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    shopName: { fontSize: 16, fontWeight: '600', color: Colors.text },
    selectedShopName: { color: Colors.primary },
    shopAddress: { fontSize: 13, color: Colors.textLight, marginTop: 4 }
});
