import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Config from '../constants/Config';
import { AuthContext } from './AuthContext';

export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [selectedShop, setSelectedShop] = useState(null);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAllShops, setShowAllShops] = useState(false);

    // Charger la boutique sélectionnée quand l'utilisateur est connecté
    useEffect(() => {
        if (user) {
            loadSelectedShop();
        } else {
            setSelectedShop(null);
            setShops([]);
            setLoading(false);
        }
    }, [user?.id]);

    const loadSelectedShop = async () => {
        try {
            setLoading(true);
            // Récupérer toutes les boutiques
            const response = await axios.get(`${Config.API_URL}/shops`);
            setShops(response.data);

            if (response.data.length > 0) {
                // Vérifier s'il y a une boutique sauvegardée
                const savedShopId = await AsyncStorage.getItem('selectedShopId');

                if (savedShopId) {
                    const shop = response.data.find(s => s.id === parseInt(savedShopId));
                    setSelectedShop(shop || response.data[0]);
                } else {
                    // Par défaut, sélectionner la première boutique
                    setSelectedShop(response.data[0]);
                    await AsyncStorage.setItem('selectedShopId', response.data[0].id.toString());
                }
            }
        } catch (error) {
            console.error('Error loading shops:', error);
            setSelectedShop(null);
            setShops([]);
        } finally {
            setLoading(false);
        }
    };

    const selectShop = async (shop) => {
        setShowAllShops(false);
        setSelectedShop(shop);
        await AsyncStorage.setItem('selectedShopId', shop.id.toString());
    };

    const refreshShops = async () => {
        try {
            const response = await axios.get(`${Config.API_URL}/shops`);
            setShops(response.data);

            // Mettre à jour la boutique sélectionnée si elle existe toujours
            if (selectedShop) {
                const updatedShop = response.data.find(s => s.id === selectedShop.id);
                if (updatedShop) {
                    setSelectedShop(updatedShop);
                } else if (response.data.length > 0) {
                    selectShop(response.data[0]);
                }
            }
        } catch (error) {
            console.error('Error refreshing shops:', error);
        }
    };

    return (
        <ShopContext.Provider value={{
            selectedShop,
            shops,
            selectShop,
            refreshShops,
            loading,
            showAllShops,
            setShowAllShops
        }}>
            {children}
        </ShopContext.Provider>
    );
};
