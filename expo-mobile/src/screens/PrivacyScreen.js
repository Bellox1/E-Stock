import React, { useState } from 'react';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import CustomLoader from '../components/CustomLoader';


export default function PrivacyScreen({ navigation }) {
    const { appConfig } = useContext(AuthContext);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage('Veuillez remplir tous les champs');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 8) {
            showMessage('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${Config.API_URL}/user/change-password`, {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
            showMessage('Mot de passe modifié avec succès');
            navigation.goBack();
        } catch (error) {
            showMessage(error.response?.data?.message || 'Impossible de changer le mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header simple */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sécurité</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.sectionHeader}>
                        <Ionicons name="lock-closed-outline" size={22} color="#64748B" />
                        <Text style={styles.sectionTitle}>Mot de passe</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Actuel</Text>
                        <View style={styles.inputWithIcon}>
                            <TextInput
                                style={styles.input}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showPasswords.current}
                                placeholder="Ancien"
                            />
                            <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                                <Ionicons name={showPasswords.current ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nouveau</Text>
                        <View style={styles.inputWithIcon}>
                            <TextInput
                                style={styles.input}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPasswords.new}
                                placeholder="8 car. min"
                            />
                            <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                                <Ionicons name={showPasswords.new ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirmer</Text>
                        <View style={styles.inputWithIcon}>
                            <TextInput
                                style={styles.input}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showPasswords.confirm}
                                placeholder="Répéter"
                            />
                            <TouchableOpacity onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                                <Ionicons name={showPasswords.confirm ? "eye-off" : "eye"} size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        <Text style={styles.saveBtnText}>Enregistrer</Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                    {appConfig?.by_logo_url && (
                        <View style={styles.poweredByContainer}>
                            <Text style={styles.poweredByText}>Powered by</Text>
                            <Image
                                source={{ uri: appConfig.by_logo_url }}
                                style={styles.poweredByLogo}
                                resizeMode="contain"
                            />
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
            {loading && <CustomLoader />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
    scrollContent: { padding: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    inputGroup: { marginBottom: 18 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', height: 52, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
    input: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
    saveBtn: { backgroundColor: '#3B82F6', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, width: '100%' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    poweredByContainer: { alignItems: 'center', marginBottom: 20, opacity: 0.7 },
    poweredByText: { fontSize: 10, color: Colors.textLight, marginBottom: 2 },
    poweredByLogo: { width: 80, height: 25 }
});
