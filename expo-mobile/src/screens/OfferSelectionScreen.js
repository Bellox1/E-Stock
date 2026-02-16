import React, { useState, useEffect } from 'react';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    FlatList,
    Dimensions,
    Platform
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import CustomLoader from '../components/CustomLoader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; // Increased width
const SPACING = (width - CARD_WIDTH) / 2;


export default function OfferSelectionScreen({ navigation }) {
    const [offers, setOffers] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const flatListRef = React.useRef(null);

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const [offersRes, subRes] = await Promise.all([
                axios.get(`${Config.API_URL}/offers`),
                axios.get(`${Config.API_URL}/subscriptions/current`).catch(() => ({ data: null }))
            ]);

            let offersData = offersRes.data;
            const currentSubData = subRes.data;

            if (currentSubData && offersData.length > 0) {
                const currentIndex = offersData.findIndex(o => o.id === currentSubData.offer_id);
                if (currentIndex !== -1) {
                    const currentOffer = offersData.splice(currentIndex, 1)[0];
                    const targetIndex = offersData.length >= 2 ? 1 : 0;
                    offersData.splice(targetIndex, 0, currentOffer);
                }
            }

            setOffers(offersData);
            setCurrentSub(currentSubData);

            setTimeout(() => {
                const targetIndex = offersData.findIndex(o => o.id === currentSubData?.offer_id);
                if (targetIndex !== -1) {
                    flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.5 });
                }
            }, 500);

            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Fetch offers error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = (offerId) => {
        const item = offers.find(o => o.id === offerId);
        navigation.navigate('OfferDetails', {
            offer: item,
            currentOfferId: currentSub?.offer_id,
            currentOfferPrice: offers.find(o => o.id === currentSub?.offer_id)?.base_price || 0
        });
    };

    const renderItem = ({ item }) => {
        const isActive = currentSub?.offer_id === item.id;
        const perms = (typeof item.permissions === 'string')
            ? JSON.parse(item.permissions)
            : (item.permissions || {});

        const currentOffer = offers.find(o => o.id === currentSub?.offer_id);
        const isDowngrade = currentOffer && item.base_price < currentOffer.base_price;

        return (
            <View style={styles.cardContainer}>
                <View style={[styles.mainCard, isActive && styles.activeCard]}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.offerLabel}>OFFRE</Text>
                            <Text style={styles.offerName}>{item.name}</Text>
                        </View>
                        {isActive && (
                            <View style={styles.activeBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                <Text style={styles.activeBadgeText}> ACTIF</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.description}>{item.description}</Text>

                    <View style={styles.features}>
                        <View style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                            <Text style={styles.featureText}>{perms.shops || 0} Boutique(s)</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                            <Text style={styles.featureText}>{perms.products || 0} Produits</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                            <Text style={styles.featureText}>{perms.clients || 0} Clients</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons
                                name={perms.stock_alerts ? "checkmark-circle" : "add-circle-outline"}
                                size={20}
                                color={perms.stock_alerts ? Colors.success : Colors.textLight}
                            />
                            <Text style={[styles.featureText, !perms.stock_alerts && { color: Colors.textLight }]}>
                                Alertes Stock Critique
                            </Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons
                                name={perms.alerts ? "checkmark-circle" : "add-circle-outline"}
                                size={20}
                                color={perms.alerts ? Colors.success : Colors.textLight}
                            />
                            <Text style={[styles.featureText, !perms.alerts && { color: Colors.textLight }]}>
                                Alertes Avancées (Dettes)
                            </Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons
                                name={perms.invoices ? "checkmark-circle" : "add-circle-outline"}
                                size={20}
                                color={perms.invoices ? Colors.success : Colors.textLight}
                            />
                            <Text style={[styles.featureText, !perms.invoices && { color: Colors.textLight }]}>
                                Factures PDF (Téléchargement)
                            </Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons
                                name={perms.stats ? "checkmark-circle" : "add-circle-outline"}
                                size={20}
                                color={perms.stats ? Colors.success : Colors.textLight}
                            />
                            <Text style={[styles.featureText, !perms.stats && { color: Colors.textLight }]}>
                                Statistiques Avancées
                            </Text>
                        </View>
                    </View>

                </View>

                <TouchableOpacity
                    style={[styles.btn, isActive && { backgroundColor: Colors.white, borderColor: Colors.primary, borderWidth: 1 }]}
                    onPress={() => handleSubscribe(item.id)}
                    disabled={subscribing}
                >
                    <Text style={[styles.btnSubtext, isActive && { color: Colors.primary }, { marginBottom: 2 }]}>
                        {isActive ? 'VOTRE FORFAIT ACTUEL' : `À partir de ${Math.floor(Number(item.base_price || 0)).toLocaleString()} XOF`}
                    </Text>
                    <Text style={[styles.btnPrice, isActive && { color: Colors.primary }]}>
                        {isActive ? 'RENOUVELER MON OFFRE' : `Pack ${item.name}`}
                    </Text>
                </TouchableOpacity>

            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <SafeAreaView style={styles.safeArea}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={28} color={Colors.text} />
                </TouchableOpacity>
            </SafeAreaView>

            <View style={styles.listContainer}>
                <FlatList
                    ref={flatListRef}
                    data={offers}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={CARD_WIDTH + 10}
                    decelerationRate="fast"
                    contentContainerStyle={{
                        paddingHorizontal: SPACING - 5,
                        alignItems: 'center'
                    }}
                />
            </View>

            {loading && <CustomLoader />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    safeArea: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, alignItems: 'flex-end', paddingHorizontal: 20 },

    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        marginTop: 10
    },

    listContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 40
    },
    cardContainer: {
        width: CARD_WIDTH,
        marginHorizontal: 5,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    mainCard: {
        backgroundColor: '#fff',
        borderRadius: 40,
        padding: 30, // Slightly reduced padding
        width: '100%',
        height: '80%', // Reduced height to allow button visibility and side peeking
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        justifyContent: 'flex-start'
    },
    activeCard: { borderColor: Colors.primary, borderWidth: 3 },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10 // Reduced margin
    },
    offerLabel: { fontSize: 13, fontFamily: 'Poppins_700Bold', color: Colors.primary, letterSpacing: 2, marginBottom: 2 },
    offerName: { fontSize: 32, fontFamily: 'Poppins_900Black', color: Colors.text, lineHeight: 38 },
    activeBadge: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10, // Reduced padding
        paddingVertical: 5,
        borderRadius: 20
    },
    activeBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Poppins_900Black' },
    description: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: Colors.textLight, lineHeight: 20, marginBottom: 15 }, // Reduced margin
    features: { flex: 1, justifyContent: 'flex-start' }, // Changed to flex-start + margin
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, // Added explicit small margin
    featureText: { marginLeft: 10, fontSize: 15, color: Colors.text, fontFamily: 'Poppins_600SemiBold' },

    btn: {
        backgroundColor: Colors.primary,
        width: '75%', // Reduced width
        paddingVertical: 12, // Reduced padding
        borderRadius: 24, // Smaller radius
        alignItems: 'center',
        marginTop: -30, // Adjusted overlap 
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    btnActive: { backgroundColor: '#E2E8F0', shadowOpacity: 0, elevation: 0 },
    btnPrice: { color: '#fff', fontSize: 18, fontFamily: 'Poppins_900Black' }, // Smaller font
    btnSubtext: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', marginBottom: 2 }, // Smaller font

});
