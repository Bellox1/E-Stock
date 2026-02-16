import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import CustomLoader from '../components/CustomLoader';

const TermSection = ({ title, content }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionContent}>{content}</Text>
    </View>
);

export default function TermsScreen({ navigation }) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Politique & Conditions</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.mainTitle}>Conditions Générales d'Utilisation</Text>
                <Text style={styles.introText}>Dernière mise à jour : 06 XOFévrier 2026</Text>

                <TermSection
                    title="1. Objet du service"
                    content="L'application Gestion Stock est un outil de gestion commerciale permettant aux commerçants et propriétaires de boutiques de suivre leur inventaire, d'enregistrer leurs ventes et de gérer les dettes de leurs clients de manière numérique et sécurisée."
                />

                <TermSection
                    title="2. Collecte et Utilisation des Données"
                    content="Nous collectons les données que vous saisissez (noms des produits, prix, quantités, informations clients) exclusivement pour vous permettre de consulter vos rapports d'activité. Votre numéro de téléphone et votre email servent uniquement à sécuriser l'accès à votre compte et à vous envoyer les codes de validation."
                />

                <TermSection
                    title="3. Confidentialité"
                    content="Vos données commerciales sont strictement confidentielles. Nous ne vendons, n'échangeons, ni ne partageons vos données de gestion avec aucune entreprise tierce. Seul l'administrateur technique du système peut accéder aux données en cas de besoin de maintenance technique, tout en respectant le secret professionnel."
                />

                <TermSection
                    title="4. Sécurité du compte"
                    content="Vous êtes responsable de la sécurité de votre mot de passe. L'application impose un mot de passe de 8 caractères minimum pour limiter les risques. Toute modification de vos informations sensibles (Email/Téléphone) nécessite une validation par code OTP reçu par email."
                />

                <TermSection
                    title="5. Responsabilité de l'utilisateur"
                    content="L'utilisateur s'engage à fournir des informations exactes. L'application est un outil d'aide à la gestion ; nous ne sommes pas responsables des erreurs de comptabilité résultant d'une mauvaise saisie de l'utilisateur ou d'un oubli d'enregistrement d'une vente."
                />

                <TermSection
                    title="6. Disponibilité et Sauvegarde"
                    content="Nous nous efforçons de maintenir le service disponible 24h/24. Vos données sont sauvegardées en ligne périodiquement. En cas de perte de votre appareil, vos données sont récupérables dès que vous vous reconnectez sur un nouvel appareil."
                />

                <TermSection
                    title="7. Abonnements, Offres et Paiements"
                    content="L'application propose différentes offres (ex: Starter, Pro) avec des fonctionnalités variées. Le paiement s'effectue via des solutions mobiles (MTN MoMo, Moov Money, Celtiis Cash) ou par carte bancaire (FedaPay). Toute souscription est ferme et non remboursable. Vous pouvez passer à une offre supérieure à tout moment ; l'accès aux nouvelles fonctionnalités est immédiat. Cependant, le passage à une offre de tarif inférieur (downgrade) n'est possible qu'à l'expiration de votre abonnement actuel."
                />

                <TermSection
                    title="8. Modification des conditions"
                    content="Nous nous réservons le droit de mettre à jour ces conditions pour les adapter aux évolutions techniques et légales. Vous serez informé de toute modification majeure lors de votre connexion à l'application."
                />

                <View style={{ height: 40 }} />
            </ScrollView>
            {loading && <CustomLoader />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE'
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
    mainTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 5, textAlign: 'left' },
    introText: { fontSize: 13, color: '#999999', marginBottom: 20, textAlign: 'left' },
    section: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 6, textAlign: 'left' },
    sectionContent: { fontSize: 14, color: '#444444', lineHeight: 22, textAlign: 'left' }
});
