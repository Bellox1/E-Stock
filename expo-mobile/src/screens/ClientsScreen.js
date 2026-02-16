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
    Modal,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import CustomLoader from '../components/CustomLoader';
import BottomMenu from '../components/BottomMenu';
import { AuthContext } from '../context/AuthContext';

export default function ClientsScreen({ navigation }) {
    const { getPermission } = useContext(AuthContext);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
    const [submitting, setSubmitting] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [errorMsg, setErrorMsg] = useState(null);

    const showLocalError = (msg) => {
        setErrorMsg(msg);
        setTimeout(() => setErrorMsg(null), 3000);
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.includes(searchQuery))
    ).sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await axios.get(`${Config.API_URL}/clients`);
            setClients(response.data);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Fetch clients error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClient = async () => {
        if (!formData.name) {
            showMessage('Le nom est obligatoire');
            return;
        }

        setSubmitting(true);
        try {
            if (isEditing) {
                const response = await axios.put(`${Config.API_URL}/clients/${selectedClient.id}`, formData);
                setClients(clients.map(c => c.id === selectedClient.id ? response.data : c));
                showMessage('Client modifié');
            } else {
                const response = await axios.post(`${Config.API_URL}/clients`, formData);
                setClients([response.data, ...clients]);
                showMessage('Client ajouté');
            }
            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error('Save client error:', error);
            if (error.response) {
                const message = error.response.data.message || 'Action non autorisée';

                // Gestion 422
                if (error.response.status === 422 && error.response.data.errors) {
                    const firstError = Object.values(error.response.data.errors).flat()[0];
                    showLocalError(firstError);
                    return;
                }

                if (error.response.status === 403) {
                    // Check for limit message
                    if (message.toLowerCase().includes('limite')) {
                        showMessage('Limite atteinte !');
                        setModalVisible(false);
                        navigation.navigate('Offers');
                    } else {
                        showLocalError(message);
                    }
                } else {
                    showLocalError(message);
                }
            } else {
                showLocalError('Une erreur est survenue');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClient = (client) => {
        Alert.alert('Suppression', `Voulez-vous supprimer le client ${client.name} ?`, [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${Config.API_URL}/clients/${client.id}`);
                        setClients(clients.filter(c => c.id !== client.id));
                        showMessage('Client supprimé');
                    } catch (error) {
                        showMessage('Impossible de supprimer ce client (il a peut-être des commandes liées)');
                    }
                }
            }
        ]);

    };

    const resetForm = () => {
        setFormData({ name: '', phone: '', email: '', address: '' });
        setSelectedClient(null);
        setIsEditing(false);
        setErrorMsg(null);
    };

    const openEditModal = (client) => {
        setErrorMsg(null);
        setSelectedClient(client);
        setFormData({
            name: client.name,
            phone: client.phone || '',
            email: client.email || '',
            address: client.address || ''
        });
        setIsEditing(true);
        setModalVisible(true);
    };

    const renderClientItem = ({ item }) => (
        <TouchableOpacity
            style={styles.clientItem}
            onPress={() => navigation.navigate('Orders', { clientId: item.id })}
            activeOpacity={0.7}
        >

            <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.name}</Text>
                {item.email ? <Text style={styles.clientEmail} numberOfLines={1}>{item.email}</Text> : null}
                <Text style={styles.clientPhone}>{item.phone || 'Pas de numéro'}</Text>
            </View>
            <View style={styles.clientActions}>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); openEditModal(item); }} style={styles.actionButton}>
                    <Ionicons name="pencil" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteClient(item); }} style={styles.actionButton}>
                    <Ionicons name="trash" size={20} color={Colors.error} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Clients</Text>
                <TouchableOpacity
                    onPress={() => {
                        const limit = getPermission('clients', 0);
                        if (clients.length >= limit) {
                            Alert.alert(
                                'Limite atteinte',
                                `Votre offre actuelle est limitée à ${limit} client(s). Veuillez passer à une offre supérieure pour en enregistrer d'autres.`,
                                [
                                    { text: 'Plus tard', style: 'cancel' },
                                    { text: 'Voir les offres', onPress: () => navigation.navigate('Offers') }
                                ]
                            );
                            return;
                        }
                        resetForm();
                        setModalVisible(true);
                    }}
                    style={styles.headerIconBtn}
                >
                    <Ionicons name="person-add" size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={Colors.textLight} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un client..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredClients}
                renderItem={renderClientItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={60} color={Colors.textLight} />
                            <Text style={styles.emptyText}>Aucun client enregistré</Text>
                        </View>
                    )
                }
            />

            {loading && <CustomLoader />}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{isEditing ? 'Modifier' : 'Nouveau'} Client</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={Colors.text} />
                                </TouchableOpacity>
                            </View>

                            {errorMsg && (
                                <View style={styles.floatingError}>
                                    <Ionicons name="alert-circle" size={20} color="#fff" />
                                    <Text style={styles.errorText}>{errorMsg}</Text>
                                </View>
                            )}

                            <ScrollView showsVerticalScrollIndicator={false}>

                                <Text style={styles.label}>Nom Complet *</Text>
                                <TextInput style={styles.input} placeholder="Nom Complet" value={formData.name} onChangeText={t => setFormData({ ...formData, name: t })} />

                                <Text style={styles.label}>Téléphone</Text>
                                <TextInput style={styles.input} placeholder="Ex: 01020304" keyboardType="phone-pad" value={formData.phone} onChangeText={t => setFormData({ ...formData, phone: t })} />

                                <Text style={styles.label}>Email (optionnel)</Text>
                                <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={formData.email} onChangeText={t => setFormData({ ...formData, email: t })} autoCapitalize="none" />

                                <Text style={styles.label}>Adresse (optionnel)</Text>
                                <TextInput style={styles.input} placeholder="Adresse" value={formData.address} onChangeText={t => setFormData({ ...formData, address: t })} />

                                <TouchableOpacity style={styles.submitButton} onPress={handleSaveClient} disabled={submitting}>
                                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{isEditing ? 'Enregistrer' : 'Enregistrer le client'}</Text>}
                                </TouchableOpacity>
                                <View style={{ height: 20 }} />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <BottomMenu navigation={navigation} activeTab="Clients" />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
    headerIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 15, paddingHorizontal: 15, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    searchInput: { flex: 1, marginLeft: 10 },
    loadingContainer: { flex: 1, justifyContent: 'center' },
    listContent: { padding: 20, paddingBottom: 110 },
    clientItem: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    listContent: { padding: 20, paddingBottom: 110 },
    clientItem: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    clientInfo: { flex: 1 },
    clientName: { fontSize: 16, fontWeight: '600' },
    clientEmail: { fontSize: 13, color: Colors.text, marginBottom: 2 },
    clientPhone: { fontSize: 13, color: Colors.textLight },
    clientActions: { flexDirection: 'row' },
    actionButton: { padding: 5, marginLeft: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    label: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: Colors.textLight },
    input: { backgroundColor: '#f3f4f6', borderRadius: 12, height: 55, paddingHorizontal: 15, marginBottom: 15, fontSize: 16 },
    submitButton: { backgroundColor: Colors.primary, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    floatingError: { position: 'absolute', top: 70, left: 20, right: 20, backgroundColor: Colors.error, borderRadius: 25, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', zIndex: 100, elevation: 5 },
    errorText: { color: '#fff', marginLeft: 10, fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: Colors.textLight, marginTop: 10 }
});
