import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Config from '../constants/Config';

export const AuthContext = createContext();

const API_URL = Config.API_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFirstLogin, setIsFirstLogin] = useState(false);

    const [appConfig, setAppConfig] = useState({
        app_name: '',
        app_num: '',
        app_email: ''
    });

    useEffect(() => {
        loadStorageData();
        fetchAppConfig();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken) {
                setToken(storedToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            const isNew = await AsyncStorage.getItem('is_new_registration');
            if (isNew === 'true') {
                setIsFirstLogin(true);
            }
        } catch (e) {
            console.error('Failed to load storage', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppConfig = async () => {
        try {
            const response = await axios.get(`${API_URL}/config`);
            setAppConfig(response.data);
        } catch (e) {
            console.log('Using default config');
        }
    };

    const login = async (identifier, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, { login: identifier, password });
            const { token, user } = response.data;

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            return response.data;
        } catch (e) {
            throw e;
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/register`, userData);
            const { token, user } = response.data;

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            await AsyncStorage.setItem('is_new_registration', 'true');

            setToken(token);
            setUser(user);
            setIsFirstLogin(true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;


            return response.data;
        } catch (e) {
            throw e;
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/logout`);
        } catch (e) {
            console.error('Logout error', e);
        } finally {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    const updateUserInfo = async (userInfo) => {
        setUser(userInfo);
        if (userInfo) {
            await AsyncStorage.setItem('user', JSON.stringify(userInfo));
        } else {
            await AsyncStorage.removeItem('user');
        }
    };

    const refreshUser = async () => {
        try {
            const response = await axios.get(`${API_URL}/user`);
            const updatedUser = response.data;
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            return updatedUser;
        } catch (e) {
            console.error('Failed to refresh user', e);
        }
    };

    const getPermission = (key, defaultValue = null) => {
        if (!user || !user.permissions) return defaultValue;
        return user.permissions[key] ?? defaultValue;
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser: updateUserInfo,
            refreshUser,
            token,
            login,
            logout,
            register,
            getPermission,
            isLoading: loading,
            isFirstLogin,
            setIsFirstLogin,
            appConfig,
            fetchAppConfig
        }}>
            {children}
        </AuthContext.Provider>
    );
};
