import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import showMessage from '../utils/Toast';

export default function AdminCreateSubAdminScreen({ navigation, route }) {
    const adminToEdit = route.params?.admin;
    const isEditing = !!adminToEdit;

    const [name, setName] = useState(adminToEdit?.name || '');
    const [email, setEmail] = useState(adminToEdit?.email || '');
    const [phone, setPhone] = useState(adminToEdit?.phone || '');
    const [password, setPassword] = useState('');
    const [canWrite, setCanWrite] = useState(adminToEdit?.admin_permissions?.can_write || false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !email || (!isEditing && !password)) {
            showMessage('Veuillez remplir les champs obligatoires', 'error');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name,
                email,
                phone,
                can_write: canWrite
            };
            if (password) payload.password = password;

            if (isEditing) {
                await axios.put(`${Config.API_URL}/admin/sub-admins/${adminToEdit.id}`, payload);
                showMessage('Compte Admin mis à jour');
            } else {
                await axios.post(`${Config.API_URL}/admin/sub-admins`, payload);
                showMessage('Compte Admin créé avec succès');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Admin action error:', error);
            let errorMsg = `Erreur lors de la ${isEditing ? 'mise à jour' : 'création'}`;

            if (error.response?.data?.errors) {
                const firstErrorKey = Object.keys(error.response.data.errors)[0];
                errorMsg = error.response.data.errors[firstErrorKey][0];
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }

            showMessage(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'Modifier Admin' : 'Nouvel Administrateur'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.infoCard}>
                        <Ionicons name={isEditing ? "create" : "shield-checkmark"} size={40} color={Colors.primary} style={styles.centerIcon} />
                        <Text style={styles.infoTitle}>{isEditing ? 'Éditer l\'accès' : 'Droits d\'Accès'}</Text>
                        <Text style={styles.infoSubtitle}>
                            {isEditing
                                ? 'Modifiez les informations ou les permissions de cet administrateur.'
                                : 'Vous êtes sur le point de créer un accès privilégié. Par défaut, le compte est en lecture seule.'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nom Complet *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom complet"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Adresse Email *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Adresse email"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Téléphone</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Numéro de téléphone"
                                keyboardType="phone-pad"
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Mot de passe {isEditing && '(Optionnel)'} *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Mot de passe"}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        <View style={styles.permissionCard}>
                            <View style={styles.permissionHeader}>
                                <View>
                                    <Text style={styles.permissionTitle}>Droit d'écriture</Text>
                                    <Text style={styles.permissionSubtitle}>Autoriser les modifications (OFF = Lecture seule)</Text>
                                </View>
                                <Switch
                                    value={canWrite}
                                    onValueChange={setCanWrite}
                                    trackColor={{ false: '#D1D5DB', true: Colors.primary + '50' }}
                                    thumbColor={canWrite ? Colors.primary : '#9CA3AF'}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.disabledBtn]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name={isEditing ? "save" : "add-circle-outline"} size={22} color="#fff" style={{ marginRight: 10 }} />
                                    <Text style={styles.submitBtnText}>{isEditing ? 'Enregistrer les modifications' : 'Créer le compte Admin'}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 70,
        backgroundColor: '#F8F9FE',
        borderBottomWidth: 1,
        borderBottomColor: '#EBF0FF'
    },
    headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
    scrollContent: { padding: 20 },
    infoCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EBF0FF'
    },
    centerIcon: { marginBottom: 15 },
    infoTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
    infoSubtitle: { fontSize: 13, color: Colors.textLight, textAlign: 'center', lineHeight: 18 },
    form: { gap: 15 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginLeft: 5 },
    input: {
        backgroundColor: '#fff',
        height: 55,
        borderRadius: 15,
        paddingHorizontal: 15,
        fontSize: 15,
        borderWidth: 1,
        borderColor: '#EBF0FF',
        color: Colors.text
    },
    permissionCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#EBF0FF'
    },
    permissionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    permissionTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
    permissionSubtitle: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
    submitBtn: {
        backgroundColor: Colors.primary,
        height: 50,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        paddingHorizontal: 25,
        alignSelf: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5
    },
    disabledBtn: { opacity: 0.7 },
    submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' }
});
