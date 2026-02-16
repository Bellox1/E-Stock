import React, { useEffect, useRef, useContext } from 'react';
import { View, Image, Animated, StyleSheet, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function CustomLoader({ backgroundColor = 'transparent' }) {
    const { appConfig } = useContext(AuthContext);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [scaleAnim]);

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {appConfig?.app_logo_url ? (
                    <Image
                        source={{ uri: appConfig.app_logo_url }}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={[styles.logo, { backgroundColor: Colors.primary + '10', borderRadius: 50, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="bag-handle" size={50} color={Colors.primary} />
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    logo: {
        width: 100,
        height: 100,
    }
});
