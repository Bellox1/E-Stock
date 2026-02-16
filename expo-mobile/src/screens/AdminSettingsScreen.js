import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import BottomMenu from '../components/BottomMenu';
import showMessage from '../utils/Toast';

export default function AdminSettingsScreen({ navigation }) {
    const { user: currentUser } = useContext(AuthContext);
    const canWrite = !currentUser?.admin_permissions || currentUser?.admin_permissions?.can_write === true || currentUser?.admin_permissions?.can_write === 1;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState([]);
    const [defaultPerms, setDefaultPerms] = useState({
        shops: 1,
        products: 0,
        clients: 0,
        alerts: false,
        stats: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${Config.API_URL}/admin/settings`);
            setSettings(response.data);

            // Trouver la clé default_permissions
            const perms = response.data.find(s => s.key === 'default_permissions');
            if (perms) {
                setDefaultPerms(perms.value);
            }
        } catch (error) {
            console.error('Fetch settings error:', error);
            showMessage('Erreur lors de la récupération des réglages', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePermissions = async () => {
        try {
            setSaving(true);
            await axios.put(`${Config.API_URL}/admin/settings/default_permissions`, {
                value: defaultPerms
            });
            showMessage('Permissions par défaut mises à jour');
        } catch (error) {
            console.error('Update settings error:', error);
            const msg = error.response?.data?.message || 'Erreur lors de la mise à jour';
            showMessage(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleSwitch = (key) => {
        setDefaultPerms({ ...defaultPerms, [key]: !defaultPerms[key] });
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Réglages Système</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>Permissions par défaut</Text>
                    </View>
                    <Text style={styles.sectionDesc}>Ces réglages s'appliquent aux marchands qui n'ont pas d'abonnement actif.</Text>

                    <View style={styles.card}>
                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Max Boutiques</Text>
                            <TextInput
                                style={styles.smallInput}
                                keyboardType="numeric"
                                value={defaultPerms.shops.toString()}
                                onChangeText={(t) => setDefaultPerms({ ...defaultPerms, shops: parseInt(t) || 0 })}
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Max Produits (total)</Text>
                            <TextInput
                                style={styles.smallInput}
                                keyboardType="numeric"
                                value={defaultPerms.products.toString()}
                                onChangeText={(t) => setDefaultPerms({ ...defaultPerms, products: parseInt(t) || 0 })}
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <Text style={styles.label}>Max Clients</Text>
                            <TextInput
                                style={styles.smallInput}
                                keyboardType="numeric"
                                value={defaultPerms.clients.toString()}
                                onChangeText={(t) => setDefaultPerms({ ...defaultPerms, clients: parseInt(t) || 0 })}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.switchRow}
                            onPress={() => toggleSwitch('stock_alerts')}
                        >
                            <Text style={styles.label}>Alertes Stock (Critique)</Text>
                            <Ionicons
                                name={defaultPerms.stock_alerts ? "checkbox" : "square-outline"}
                                size={24}
                                color={defaultPerms.stock_alerts ? Colors.primary : Colors.textLight}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.switchRow}
                            onPress={() => toggleSwitch('alerts')}
                        >
                            <Text style={styles.label}>Alertes Avancées (Dettes)</Text>
                            <Ionicons
                                name={defaultPerms.alerts ? "checkbox" : "square-outline"}
                                size={24}
                                color={defaultPerms.alerts ? Colors.primary : Colors.textLight}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.switchRow}
                            onPress={() => toggleSwitch('invoices')}
                        >
                            <Text style={styles.label}>Factures PDF</Text>
                            <Ionicons
                                name={defaultPerms.invoices ? "checkbox" : "square-outline"}
                                size={24}
                                color={defaultPerms.invoices ? Colors.primary : Colors.textLight}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.switchRow}
                            onPress={() => toggleSwitch('stats')}
                        >
                            <Text style={styles.label}>Stats Avancées</Text>
                            <Ionicons
                                name={defaultPerms.stats ? "checkbox" : "square-outline"}
                                size={24}
                                color={defaultPerms.stats ? Colors.primary : Colors.textLight}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.switchRow}
                            onPress={() => toggleSwitch('export_excel')}
                        >
                            <Text style={styles.label}>Export Excel (Produits/Ventes)</Text>
                            <Ionicons
                                name={defaultPerms.export_excel ? "checkbox" : "square-outline"}
                                size={24}
                                color={defaultPerms.export_excel ? Colors.primary : Colors.textLight}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, saving && { opacity: 0.7 }]}
                            onPress={handleSavePermissions}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>Enregistrer les permissions</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <BottomMenu navigation={navigation} activeTab="AdminDashboard" isAdmin={true} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 70,
        backgroundColor: '#F8F9FE',
        borderBottomWidth: 1,
        borderBottomColor: '#EBF0FF',
    },
    headerTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    scrollContent: { padding: 20, paddingBottom: 100 },
    section: { marginBottom: 30 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginLeft: 10 },
    sectionDesc: { fontSize: 13, color: Colors.textLight, marginBottom: 15, lineHeight: 18 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    label: { fontSize: 15, color: Colors.text, fontWeight: '500' },
    smallInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        width: 60,
        height: 40,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
