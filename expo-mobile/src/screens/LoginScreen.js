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

export default function LoginScreen({ navigation }) {
    const { login, appConfig } = useContext(AuthContext);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!identifier || !password) {
            showMessage('Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        try {
            await login(identifier, password);
        } catch (error) {
            console.error('Login error:', error.response?.data || error.message);
            let errorMsg = 'Identifiants incorrects';
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
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Text style={styles.title}>Bon retour !</Text>
                        <Text style={styles.subtitle}>Connectez-vous pour gérer votre stock</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email ou Téléphone</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Identifiant"
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Mot de passe</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
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
                            style={styles.forgotPassword}
                            onPress={() => navigation.navigate('ForgotPassword')}
                        >
                            <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.mainButton, loading && styles.disabledButton]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.mainButtonText}>Se connecter</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Pas encore de compte ? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerLink}>S'inscrire</Text>
                        </TouchableOpacity>
                    </View>
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
    backButton: { padding: 20, marginTop: 10 },
    content: { paddingHorizontal: 30, paddingTop: 10, paddingBottom: 40 },
    header: { marginBottom: 35 },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.text, marginBottom: 8 },
    subtitle: { fontSize: 16, color: Colors.textLight },
    form: { flex: 1 },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 10 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 15, height: 55, borderWidth: 1, borderColor: '#F1F5F9' },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 16, color: Colors.text },
    forgotPassword: { alignSelf: 'flex-end', marginVertical: 15 },
    forgotPasswordText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
    mainButton: { backgroundColor: Colors.primary, height: 55, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
    disabledButton: { opacity: 0.7 },
    mainButtonText: { color: Colors.white, fontSize: 17, fontWeight: 'bold' },
    footer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 30 },
    footerText: { color: Colors.textLight, fontSize: 15 },
    registerLink: { color: Colors.primary, fontSize: 15, fontWeight: 'bold' },
    poweredByContainer: { alignItems: 'center', paddingBottom: 20, paddingTop: 10, opacity: 0.7, backgroundColor: Colors.white },
    poweredByText: { fontSize: 10, color: Colors.textLight, marginBottom: 2 },
    poweredByLogo: { width: 80, height: 25 }

});
