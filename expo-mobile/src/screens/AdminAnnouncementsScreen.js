import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
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
    ScrollView,
    Image,
    Alert,
    Switch,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import BottomMenu from '../components/BottomMenu';
import CustomLoader from '../components/CustomLoader';

export default function AdminAnnouncementsScreen({ navigation }) {
    const { user: currentUser } = useContext(AuthContext);
    const canWrite = !currentUser?.admin_permissions || currentUser?.admin_permissions?.can_write === true || currentUser?.admin_permissions?.can_write === 1;
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({ title: '', content: '', image_url: '', is_active: true, image: null });
    const [errorMsg, setErrorMsg] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const isEditing = !!selectedItem;

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        if (errorMsg) {
            const timer = setTimeout(() => {
                setErrorMsg(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMsg]);

    const fetchAnnouncements = async () => {
        try {
            // Note: On utilise la route admin pour voir toutes les annonces (actives ou non)
            const response = await axios.get(`${Config.API_URL}/admin/announcements`);
            setAnnouncements(response.data);
        } catch (error) {
            console.error('Fetch announcements error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setErrorMsg(null);
        // Seule l'image (URL ou Locale) est obligatoire selon la demande utilisateur
        if (!formData.image_url && !formData.image) {
            setErrorMsg('Une image (URL ou Upload) est obligatoire.');
            return;
        }

        setSubmitting(true);
        try {
            const data = new FormData();
            data.append('title', formData.title || 'Annonce sans titre');
            data.append('content', formData.content || '');
            data.append('is_active', formData.is_active ? '1' : '0');

            if (formData.image_url) {
                data.append('image_url', formData.image_url);
            }

            if (formData.image && !formData.image.startsWith('http')) {
                const filename = formData.image.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                data.append('image', { uri: formData.image, name: filename, type });
            }

            const config = {
                headers: { 'Content-Type': 'multipart/form-data' }
            };

            let response;
            if (selectedItem) {
                data.append('_method', 'PUT');
                response = await axios.post(`${Config.API_URL}/admin/announcements/${selectedItem.id}`, data, config);
                setAnnouncements(announcements.map(a => a.id === selectedItem.id ? response.data : a));
                showMessage('Annonce mise à jour avec succès');
            } else {
                response = await axios.post(`${Config.API_URL}/admin/announcements`, data, config);
                setAnnouncements([response.data, ...announcements]);
                showMessage('Annonce créée avec succès');
            }
            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data && error.response.data.errors) {
                const errors = Object.values(error.response.data.errors).flat().join('\n');
                setErrorMsg(errors);
            } else {
                setErrorMsg(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled) {
            setFormData({ ...formData, image: result.assets[0].uri, image_url: '' });
        }
    };

    const handleDelete = (id) => {
        Alert.alert('Suppression', 'Voulez-vous supprimer cette annonce ?', [
            { text: 'Annuler', style: 'cancel' },
            {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${Config.API_URL}/admin/announcements/${id}`);
                        setAnnouncements(announcements.filter(a => a.id !== id));
                        showMessage('Annonce supprimée avec succès');
                    } catch (error) {
                        const msg = error.response?.data?.message || 'Échec de la suppression';
                        showMessage(msg, 'error');
                    }
                }
            }
        ]);

    };

    const resetForm = () => {
        setFormData({ title: '', content: '', image_url: '', is_active: true, image: null });
        setSelectedItem(null);
        setErrorMsg(null);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.cardImage} />
            ) : null}
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
                <View style={styles.cardFooter}>
                    <Text style={[styles.status, { color: item.is_active ? Colors.success : Colors.error }]}>
                        {item.is_active ? 'Active' : 'Inactive'}
                    </Text>
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => {
                            setSelectedItem(item);
                            setFormData({
                                title: item.title,
                                content: item.content,
                                image_url: item.image_url,
                                is_active: item.is_active,
                                image: item.image_url // Pour la prévisualisation
                            });
                            setModalVisible(true);
                        }}>
                            <Ionicons name="pencil" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                        {canWrite && (
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 15 }}>
                                <Ionicons name="trash" size={20} color={Colors.error} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Gestion Affichages</Text>
                <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }}>
                    <Ionicons name="add-circle" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <CustomLoader />
            ) : (
                <FlatList
                    data={announcements}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucune affiche créée</Text>}
                />
            )}

            {/* Modal Premium Annonce */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={styles.fullModal}>
                    <View style={styles.modalTopBar}>
                        <View style={styles.modalDragHandle} />
                        <View style={styles.modalHeaderContent}>
                            <Text style={styles.modalTitleLarge}>{isEditing ? 'Modifier' : 'Nouvelle'} Annonce</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {errorMsg && (
                        <View style={styles.toastContainer}>
                            <Text style={styles.toastText}>{errorMsg}</Text>
                        </View>
                    )}

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
                    >
                        <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
                            <View style={styles.formSection}>
                                <Text style={styles.label}>Image de l'affiche (Obligatoire)</Text>
                                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                                    {(formData.image || formData.image_url) ? (
                                        <Image source={{ uri: formData.image || formData.image_url }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Ionicons name="camera-outline" size={40} color={Colors.textLight} />
                                            <Text style={styles.imagePlaceholderText}>Cliquer pour uploader</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>

                                <Text style={[styles.label, { marginTop: 15 }]}>OU via URL</Text>
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIcon}>
                                        <Ionicons name="link-outline" size={20} color={Colors.textLight} />
                                    </View>
                                    <TextInput
                                        style={styles.inputFlex}
                                        value={formData.image_url}
                                        onChangeText={t => setFormData({ ...formData, image_url: t, image: null })}
                                        placeholder="https://mon-image.png"
                                    />
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>Titre (Optionnel)</Text>
                                <View style={styles.inputContainer}>
                                    <View style={styles.inputIcon}>
                                        <Ionicons name="megaphone-outline" size={20} color={Colors.textLight} />
                                    </View>
                                    <TextInput
                                        style={styles.inputFlex}
                                        value={formData.title}
                                        onChangeText={t => setFormData({ ...formData, title: t })}
                                        placeholder="Titre de l'annonce"
                                    />
                                </View>
                            </View>

                            <View style={styles.formSection}>
                                <Text style={styles.label}>Contenu (Optionnel)</Text>
                                <TextInput
                                    style={styles.textArea}
                                    multiline
                                    numberOfLines={4}
                                    value={formData.content}
                                    onChangeText={t => setFormData({ ...formData, content: t })}
                                    placeholder="Détails de l'affiche..."
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={styles.switchLabel}>Publication</Text>
                                    <Text style={styles.switchSubtitle}>Rendre visible immédiatement</Text>
                                </View>
                                <Switch
                                    value={formData.is_active}
                                    onValueChange={v => setFormData({ ...formData, is_active: v })}
                                    trackColor={{ false: '#CBD5E1', true: Colors.primary + '80' }}
                                    thumbColor={formData.is_active ? Colors.primary : '#F1F5F9'}
                                />
                            </View>

                            <TouchableOpacity style={styles.saveButtonLarge} onPress={handleSave} disabled={submitting}>
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.saveButtonTextLarge}>{isEditing ? 'Mettre à jour' : 'Publier l\'affiche'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={{ height: 50 }} />
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
            <BottomMenu navigation={navigation} activeTab="AdminAnnouncements" isAdmin={true} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    loadingContainer: { flex: 1, justifyContent: 'center' },
    listContent: { padding: 20, paddingBottom: 110 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 22,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1
    },
    cardImage: { width: '100%', height: 160 },
    cardBody: { padding: 18 },
    cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
    cardContent: { fontSize: 14, color: Colors.textLight, marginTop: 6, lineHeight: 20 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, alignItems: 'center' },
    status: { fontSize: 12, fontWeight: 'bold' },
    actions: { flexDirection: 'row' },
    fullModal: { flex: 1, backgroundColor: '#F8FAFC' },
    modalTopBar: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 15, paddingTop: Platform.OS === 'android' ? 10 : 0 },
    modalDragHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 15 },
    modalHeaderContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25 },
    modalTitleLarge: { fontSize: 22, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    modalForm: { padding: 25 },
    formSection: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, height: 60, paddingHorizontal: 15, borderWidth: 1, borderColor: '#EDF2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5 },
    inputIcon: { width: 35, alignItems: 'center' },
    inputFlex: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '600', paddingLeft: 5 },
    textArea: { backgroundColor: '#fff', borderRadius: 16, padding: 15, fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: '#EDF2F7', height: 120, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#EDF2F7' },
    switchLabel: { fontSize: 15, fontWeight: '700', color: Colors.text },
    switchSubtitle: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    saveButtonLarge: { backgroundColor: Colors.primary, height: 44, width: '60%', alignSelf: 'center', borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2, marginTop: 20 },
    saveButtonTextLarge: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    imagePicker: { width: '100%', height: 180, backgroundColor: '#fff', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    previewImage: { width: '100%', height: '100%' },
    imagePlaceholder: { alignItems: 'center', gap: 10 },
    imagePlaceholderText: { fontSize: 14, color: Colors.textLight, fontWeight: '600' },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' },
    toastContainer: {
        position: 'absolute',
        top: 80,
        alignSelf: 'center',
        backgroundColor: '#FF5252',
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        zIndex: 100,
        maxWidth: '90%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    toastText: { color: '#fff', fontWeight: '600', textAlign: 'center' }
});
