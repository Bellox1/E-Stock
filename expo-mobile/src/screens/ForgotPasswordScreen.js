import React, { useState } from 'react';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import axios from 'axios';
import Config from '../constants/Config';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & Reset
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!email) {
            showMessage('Veuillez saisir votre email');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${Config.API_URL}/forgot-password`, { email });
            showMessage(response.data.message);
            setStep(2);
        } catch (error) {
            showMessage(error.response?.data?.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword) {
            showMessage('Veuillez remplir tous les champs');
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage('Les mots de passe ne correspondent pas');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${Config.API_URL}/reset-password`, {
                email,
                otp_code: otp,
                password: newPassword,
                password_confirmation: confirmPassword
            });
            showMessage(response.data.message);
            navigation.navigate('Login');
        } catch (error) {
            showMessage(error.response?.data?.message || 'Code invalide ou expiré');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Réinitialisation</Text>
                <View style={{ width: 44 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    {step === 1 ? (
                        <View>
                            <Text style={styles.title}>Mot de passe oublié ?</Text>
                            <Text style={styles.subtitle}>Entrez votre adresse email pour recevoir un code de vérification.</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Adresse Email</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.mainBtn} onPress={handleSendOTP} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Envoyer le code</Text>}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.title}>Nouveau mot de passe</Text>
                            <Text style={styles.subtitle}>Entrez le code reçu par mail et votre nouveau mot de passe.</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Code à 6 chiffres</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="key-outline" size={20} color="#64748B" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="000000"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nouveau mot de passe</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirmer le mot de passe</Text>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#64748B" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.mainBtn} onPress={handleResetPassword} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Réinitialiser</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.resendBtn} onPress={() => setStep(1)}>
                                <Text style={styles.resendText}>Changer d'email</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
    content: { padding: 30 },
    title: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 10 },
    subtitle: { fontSize: 15, color: '#64748B', marginBottom: 30, lineHeight: 22 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, marginLeft: 4 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', height: 56, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    icon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
    mainBtn: { backgroundColor: '#3B82F6', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
    mainBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    resendBtn: { marginTop: 20, alignItems: 'center' },
    resendText: { color: '#64748B', fontSize: 14, fontWeight: '600' }
});
