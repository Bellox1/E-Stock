import React, { useContext } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Colors from '../constants/Colors';
import { AuthContext } from '../context/AuthContext';

export default function WelcomeScreen({ navigation }) {
    const { appConfig } = useContext(AuthContext);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.content}>
                <View style={styles.imageContainer}>
                    <Image
                        source={appConfig?.app_logo_url ? { uri: appConfig.app_logo_url } : { uri: 'https://i.pinimg.com/736x/0c/34/8a/0c348af8afdfb8ac60387e6ecdda52e3.jpg' }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.description}>
                        Gérez vos stocks, vos ventes et vos clients en toute simplicité directement depuis votre mobile.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <View style={styles.dots}>
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.buttonText}>Commencer</Text>
                    </TouchableOpacity>

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
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'space-between',
        paddingBottom: 40,
        paddingTop: 60,
    },
    imageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '45%',
    },
    image: {
        width: '80%',
        height: '80%',
    },
    textContainer: {
        alignItems: 'center',
    },
    description: {
        fontSize: 18,
        color: Colors.white,
        textAlign: 'center',
        lineHeight: 28,
        opacity: 0.9,
    },
    footer: {
        alignItems: 'center',
    },
    dots: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: Colors.white,
        width: 20,
    },
    button: {
        backgroundColor: Colors.white,
        width: '100%',
        height: 60,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    poweredByContainer: {
        marginTop: 20,
        alignItems: 'center',
        opacity: 0.8
    },
    poweredByText: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 2
    },
    poweredByLogo: {
        width: 100,
        height: 30,
        tintColor: Colors.white // Make the logo white to fit on blue bg if it's monochromatic, or remove if full color
    }
});
