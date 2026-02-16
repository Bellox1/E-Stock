import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ShopsScreen from '../screens/ShopsScreen';
import ProductsScreen from '../screens/ProductsScreen';
import SalesScreen from '../screens/SalesScreen';
import ClientsScreen from '../screens/ClientsScreen';
import OfferSelectionScreen from '../screens/OfferSelectionScreen';
import OfferDetailsScreen from '../screens/OfferDetailsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminOfferManagementScreen from '../screens/AdminOfferManagementScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminAnnouncementsScreen from '../screens/AdminAnnouncementsScreen';
import AdminSettingsScreen from '../screens/AdminSettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import FAQScreen from '../screens/FAQScreen';
import TermsScreen from '../screens/TermsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import AdminSubscriptionsScreen from '../screens/AdminSubscriptionsScreen';
import AdminCreateSubAdminScreen from '../screens/AdminCreateSubAdminScreen';
import AdminTeamScreen from '../screens/AdminTeamScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import Colors from '../constants/Colors';
import CustomLoader from '../components/CustomLoader';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return <CustomLoader backgroundColor={Colors.primary} />;
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            {user ? (
                // Screens for logged in users
                user.is_admin ? (
                    <>
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                        <Stack.Screen name="AdminOffers" component={AdminOfferManagementScreen} />
                        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
                        <Stack.Screen name="AdminAnnouncements" component={AdminAnnouncementsScreen} />
                        <Stack.Screen name="AdminSubscriptions" component={AdminSubscriptionsScreen} />
                        <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
                        <Stack.Screen name="AdminCreateSubAdmin" component={AdminCreateSubAdminScreen} />
                        <Stack.Screen name="AdminTeam" component={AdminTeamScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Privacy" component={PrivacyScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="Shops" component={ShopsScreen} />
                        <Stack.Screen name="Products" component={ProductsScreen} />
                        <Stack.Screen name="Sales" component={SalesScreen} />
                        <Stack.Screen name="Clients" component={ClientsScreen} />
                        <Stack.Screen name="Orders" component={OrdersScreen} />
                        <Stack.Screen name="Offers" component={OfferSelectionScreen} />
                        <Stack.Screen name="OfferDetails" component={OfferDetailsScreen} />
                        <Stack.Screen name="Payment" component={PaymentScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="Privacy" component={PrivacyScreen} />
                        <Stack.Screen name="FAQ" component={FAQScreen} />
                        <Stack.Screen name="Terms" component={TermsScreen} />
                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    </>
                )
            ) : (
                // Auth screens
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}
