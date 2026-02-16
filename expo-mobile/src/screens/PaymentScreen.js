import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import showMessage from '../utils/Toast';

const PAYMENT_METHODS = [
    { id: 'mtn', name: 'MTN Mobile Money', color: '#FFCC00', icon: 'wallet-outline' },
    { id: 'moov', name: 'Moov Money', color: '#005CA9', icon: 'wallet-outline' },
    { id: 'celtiis', name: 'Celtiis Benin', color: '#E30613', icon: 'wallet-outline' },
    { id: 'fedapay', name: 'FedaPay (Carte/Mobile)', color: '#4CAF50', icon: 'card-outline' },
];

export default function PaymentScreen({ navigation, route }) {
    const { offer, selectedDuration } = route.params;
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (!selectedMethod) {
            showMessage('Veuillez sélectionner un mode de paiement');
            return;
        }

        setLoading(true);
        try {
            // Simulation de l'appel API pour l'abonnement
            // En production, cela redirigerait vers une passerelle de paiement
            await axios.post(`${Config.API_URL}/subscriptions/subscribe`, {
                offer_id: offer.id,
                duration_months: selectedDuration.duration_months,
                payment_method: selectedMethod
            });

            Alert.alert(
                'Succès',
                `Votre paiement via ${PAYMENT_METHODS.find(m => m.id === selectedMethod).name} a été initié.`,
                [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
            );
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Erreur lors de l\'initiation du paiement';
            showMessage(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Paiement</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Résumé de l'offre</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Offre :</Text>
                        <Text style={styles.summaryValue}>{offer.name}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Durée :</Text>
                        <Text style={styles.summaryValue}>{selectedDuration.duration_months} Mois</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total à payer :</Text>
                        <Text style={styles.totalValue}>{Math.floor(Number(selectedDuration.price)).toLocaleString()} XOF</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Choisir une méthode de paiement</Text>

                <View style={styles.methodsContainer}>
                    {PAYMENT_METHODS.map((method) => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.methodCard,
                                selectedMethod === method.id && { borderColor: method.color, borderWidth: 2, backgroundColor: method.color + '10' }
                            ]}
                            onPress={() => setSelectedMethod(method.id)}
                        >
                            <View style={[styles.methodIconContainer, { backgroundColor: method.color }]}>
                                <Ionicons name={method.icon} size={24} color="#fff" />
                            </View>
                            <Text style={styles.methodName}>{method.name}</Text>
                            {selectedMethod === method.id && (
                                <Ionicons name="checkmark-circle" size={24} color={method.color} style={styles.checkIcon} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payButton, (!selectedMethod || loading) && styles.disabledButton]}
                    onPress={handlePayment}
                    disabled={!selectedMethod || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.payButtonText}>Confirmer le paiement</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    safeArea: { backgroundColor: '#fff', zIndex: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    content: { padding: 20 },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    summaryLabel: { fontSize: 14, color: Colors.textLight },
    summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
    totalLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
    totalValue: { fontSize: 18, fontWeight: '900', color: Colors.primary },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 20 },
    methodsContainer: { gap: 12 },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    methodIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    methodName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
    checkIcon: { marginLeft: 10 },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    payButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
    payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
