import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import showMessage from '../utils/Toast';

export default function OfferDetailsScreen({ navigation, route }) {
    const { offer, currentOfferId, currentOfferPrice } = route.params;
    const [subscribing, setSubscribing] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(null);
    const { height } = Dimensions.get('window');
    const headerHeight = height * 0.07;
    const cardHeight = height * 0.3;

    // Calcul des options de prix basés sur l'offre
    const prices = offer.prices || [
        { duration_months: 1, price: offer.base_price, discount_percentage: 0 }
    ];

    const isDowngrade = currentOfferId && offer.base_price < currentOfferPrice;

    const handleSubscribe = () => {
        if (!selectedDuration) {
            showMessage('Veuillez sélectionner une durée');
            return;
        }

        if (isDowngrade) {
            Alert.alert(
                'Action impossible',
                "Vous ne pouvez pas rétrograder vers une offre inférieure tant que votre abonnement actuel est actif. Vous pouvez toutefois renouveler votre offre actuelle ou passer à une offre supérieure.",
                [{ text: 'Compris' }]
            );
            return;
        }

        navigation.navigate('Payment', {
            offer,
            subId: offer.id,
            selectedDuration
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.header, { height: headerHeight }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{offer.name}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.durationContainer}>
                    {prices.sort((a, b) => a.duration_months - b.duration_months).map((priceOption, index) => {
                        const isSelected = selectedDuration?.duration_months === priceOption.duration_months;
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.durationCard, isSelected && styles.activeDurationCard, { height: cardHeight }]}
                                onPress={() => setSelectedDuration(priceOption)}
                            >
                                <Text style={[styles.durationText, isSelected && styles.activeText]}>
                                    {priceOption.duration_months} MOIS
                                </Text>

                                <View style={styles.pricesContainer}>
                                    {priceOption.duration_months > 1 && (
                                        <Text style={[styles.pricePerMonth, isSelected && styles.activeText]}>
                                            {Math.floor(priceOption.price / priceOption.duration_months).toLocaleString()} XOF/mois
                                        </Text>
                                    )}
                                    <Text style={[styles.totalPrice, isSelected && styles.activeText]}>
                                        {Math.floor(Number(priceOption.price)).toLocaleString()} XOF
                                    </Text>
                                </View>

                                {priceOption.discount_percentage > 0 && (
                                    <View style={styles.bottomDiscount}>
                                        <Text style={styles.bottomDiscountText}>Économisez {priceOption.discount_percentage}%</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </ScrollView >

            <View style={styles.footer}>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total à payer</Text>
                    <Text style={styles.totalAmount}>
                        {selectedDuration ? `${Math.floor(Number(selectedDuration.price)).toLocaleString()} XOF` : '---'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.payButton, (!selectedDuration || subscribing) && styles.disabledButton]}
                    onPress={handleSubscribe}
                    disabled={!selectedDuration || subscribing}
                >
                    {subscribing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>Continuer</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    safeArea: { backgroundColor: '#fff', zIndex: 10 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.text },
    content: { padding: 20, paddingBottom: 100 },

    durationContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
    durationCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        width: '48%',
        marginBottom: 15,

        justifyContent: 'center',
        alignItems: 'center',
        gap: 12, // Spacing between inner elements

        // Shadow "omble noir"
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 10,

        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.04)' // Very subtle border by default
    },
    activeDurationCard: {
        borderColor: '#3B82F6', // Bright blue border
        borderWidth: 2,
        backgroundColor: '#EFF6FF', // Light blue background tint
        shadowColor: '#3B82F6', // Blue shadow
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 20
    },

    durationText: { fontSize: 22, fontFamily: 'Poppins_800ExtraBold', color: '#8B4513', textTransform: 'uppercase', textAlign: 'center' }, // Brown color
    pricesContainer: { alignItems: 'center', gap: 4 },
    pricePerMonth: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#000' }, // Black
    totalPrice: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#000' }, // Black

    activeText: { color: '#3B82F6' }, // Blue text when active

    bottomDiscount: { backgroundColor: '#6366F1', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 }, // Indigo base, simulating multi-color mix request roughly
    bottomDiscountText: { color: '#fff', fontSize: 12, fontFamily: 'Poppins_700Bold' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, paddingTop: 15, paddingBottom: 30, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
    totalContainer: { flex: 1 },
    totalLabel: { fontSize: 12, color: Colors.textLight, fontFamily: 'Poppins_600SemiBold' },
    totalAmount: { fontSize: 20, color: Colors.text, fontFamily: 'Poppins_900Black' },
    payButton: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, paddingVertical: 15, borderRadius: 15, gap: 10 },
    disabledButton: { backgroundColor: '#CBD5E1' },
    payButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_700Bold' }
});
