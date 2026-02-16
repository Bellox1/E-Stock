import React, { useState, useContext } from 'react';
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
    ScrollView,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
    const { register, appConfig } = useContext(AuthContext);

    // States for the registration flow
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const [step, setStep] = useState(1); // 1: Basic Info, 2: Password
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleNextStep = () => {
        if (!name || !email || !phone) {
            showMessage('Veuillez remplir toutes les informations');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Veuillez entrer une adresse email valide');
            return;
        }

        // Validation simplifiée : Uniquement chiffres, espace et +
        const cleanPhone = phone.trim();

        if (!/^[0-9+\s]+$/.test(cleanPhone)) {
            showMessage('Caractères non autorisés. Utilisez uniquement des chiffres et +');
            return;
        }

        if (cleanPhone.length < 8) {
            showMessage('Le numéro est trop court (min. 8 chiffres)');
            return;
        }

        setStep(2);
    };

    const handleRegister = async () => {
        if (!password) {
            showMessage('Veuillez saisir un mot de passe');
            return;
        }

        if (password.length < 8) {
            showMessage('Le mot de passe doit faire au moins 8 caractères');
            return;
        }

        setLoading(true);
        try {
            await register({
                name,
                email,
                phone,
                password,
                password_confirmation: password,
            });
        } catch (error) {
            console.error('Register error:', error.response?.data || error.message);
            let errorMsg = 'Erreur lors de l\'inscription';
            if (error.response?.data?.errors) {
                const firstErrorKey = Object.keys(error.response.data.errors)[0];
                errorMsg = error.response.data.errors[firstErrorKey][0];
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }
            showMessage(errorMsg, 'error');

            if (error.response?.status === 422) {
                setStep(1);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.headerNav}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.stepIndicator}>Étape {step} sur 2</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Text style={styles.title}>{step === 1 ? 'Créer un compte' : 'Mot de passe'}</Text>
                        <Text style={styles.subtitle}>
                            {step === 1
                                ? 'Rejoignez-nous pour simplifier votre gestion'
                                : 'Protégez votre compte avec un mot de passe robuste'}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {step === 1 ? (
                            <>
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Nom complet</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="person-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Nom et prénoms"
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Adresse Email</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="mail-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
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

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Téléphone</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="call-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ex: 07 00 00 00 00"
                                            value={phone}
                                            onChangeText={setPhone}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.mainButton}
                                    onPress={handleNextStep}
                                >
                                    <Text style={styles.mainButtonText}>Continuer</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.summaryBadge}>
                                    <View style={styles.summaryRow}>
                                        <Ionicons name="person-outline" size={16} color="#64748B" />
                                        <Text style={styles.summaryText}>{name}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Ionicons name="mail-outline" size={16} color="#64748B" />
                                        <Text style={styles.summaryText}>{email}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Ionicons name="call-outline" size={16} color="#64748B" />
                                        <Text style={styles.summaryText}>{phone}</Text>
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Définir un mot de passe</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="8 caractères minimum"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoFocus
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons
                                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                                size={20}
                                                color={Colors.textLight}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.mainButton, loading && styles.disabledButton]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={Colors.white} />
                                    ) : (
                                        <Text style={styles.mainButtonText}>Créer mon compte</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {step === 1 && (
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Déjà un compte ? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Se connecter</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
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
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    keyboardView: { flex: 1 },
    headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 25 },
    backButton: { padding: 20 },
    stepIndicator: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
    scrollContent: { paddingHorizontal: 30, paddingTop: 10, paddingBottom: 40 },
    header: { marginBottom: 30 },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 10 },
    subtitle: { fontSize: 16, color: Colors.textLight, lineHeight: 22 },
    form: { marginBottom: 30 },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#F1F5F9' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: Colors.text },
    summaryBadge: { backgroundColor: '#F1F5F9', padding: 15, borderRadius: 14, marginBottom: 25, gap: 8 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    summaryText: { fontSize: 14, color: '#475569', fontWeight: '500' },
    mainButton: { backgroundColor: Colors.primary, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10, flexDirection: 'row' },
    disabledButton: { opacity: 0.7 },
    mainButtonText: { color: Colors.white, fontSize: 17, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    footerText: { color: Colors.textLight, fontSize: 15 },
    loginLink: { color: Colors.primary, fontSize: 15, fontWeight: 'bold' },
    poweredByContainer: { alignItems: 'center', paddingBottom: 20, paddingTop: 10, opacity: 0.7, backgroundColor: Colors.white },
    poweredByText: { fontSize: 10, color: Colors.textLight, marginBottom: 2 },
    poweredByLogo: { width: 80, height: 25 }

});
