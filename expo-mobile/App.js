import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Colors from './src/constants/Colors';

// Ignorer les avertissements sur l'écran (jaune/rouge)
LogBox.ignoreAllLogs();
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ShopProvider } from './src/context/ShopContext';
import { RootSiblingParent } from 'react-native-root-siblings';

// Garder le splash screen visible pendant le chargement
SplashScreen.preventAutoHideAsync();

import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black
} from '@expo-google-fonts/poppins';

export default function App() {
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Temporairement: garder le splash screen visible pendant 3 secondes
      // pour vérifier que l'arrière-plan est bien bleu
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 3000);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <RootSiblingParent>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: Colors.primary }}>
          <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
          <AuthProvider>
            <NavigationContainer>
              <ShopProvider>
                <AppNavigator />
              </ShopProvider>
            </NavigationContainer>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </RootSiblingParent>
  );
}
