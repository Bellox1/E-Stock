import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

/**
 * Composant de navigation inférieur premium partagé
 * @param {Object} props
 * @param {Object} props.navigation - L'objet de navigation
 * @param {string} props.activeTab - L'onglet actif
 * @param {boolean} props.isAdmin - Si l'utilisateur est admin
 */
export default function BottomMenu({ navigation, activeTab, isAdmin = false }) {

    const merchantTabs = [
        { id: 'Dashboard', label: 'Accueil', icon: 'grid', target: 'Dashboard' },
        { id: 'Products', label: 'Stocks', icon: 'swap-vertical', target: 'Products' },
        { id: 'Sales', label: 'Vente', icon: 'cart', target: 'Sales', isCenter: true },
        { id: 'Clients', label: 'Clients', icon: 'people', target: 'Clients' },
        { id: 'Profile', label: 'Profil', icon: 'person', target: 'Profile' },
    ];

    const adminTabs = [
        { id: 'AdminDashboard', label: 'Admin', icon: 'grid', target: 'AdminDashboard' },
        { id: 'AdminUsers', label: 'Marchands', icon: 'people', target: 'AdminUsers' },
        { id: 'AdminAnnouncements', label: 'Pubs', icon: 'megaphone', target: 'AdminAnnouncements', isCenter: true },
        { id: 'AdminOffers', label: 'Offres', icon: 'ribbon', target: 'AdminOffers' },
        { id: 'Profile', label: 'Profil', icon: 'person', target: 'Profile' },
    ];

    const tabs = isAdmin ? adminTabs : merchantTabs;

    return (
        <View style={styles.bottomBar}>
            {tabs.map((tab) => {
                if (tab.isCenter) {
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={styles.tabItem}
                            onPress={() => navigation.navigate(tab.target)}
                        >
                            <View style={styles.addBtnContainer}>
                                <Ionicons name={tab.icon} size={28} color={Colors.white} />
                            </View>
                        </TouchableOpacity>
                    );
                }

                const isActive = activeTab === tab.id;

                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={styles.tabItem}
                        onPress={() => navigation.navigate(tab.target)}
                    >
                        <Ionicons
                            name={isActive ? tab.icon : `${tab.icon}-outline`}
                            size={24}
                            color={isActive ? Colors.primary : Colors.textLight}
                        />
                        <Text style={[styles.tabLabel, { color: isActive ? Colors.primary : Colors.textLight }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 90,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10
    },
    tabItem: { alignItems: 'center', flex: 1 },
    tabLabel: { fontSize: 10, marginTop: 4, fontWeight: 'bold' },
    addBtnContainer: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -40,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8
    },
});
