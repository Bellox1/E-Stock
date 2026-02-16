import React, { useContext } from 'react';
import showMessage from '../utils/Toast';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { AuthContext } from '../context/AuthContext';

const HelpSection = ({ title, content, icon }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            {icon && <Ionicons name={icon} size={20} color={Colors.primary} style={styles.sectionIcon} />}
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={styles.sectionContent}>{content}</Text>
    </View>
);

export default function FAQScreen({ navigation }) {
    const { appConfig } = useContext(AuthContext);

    const helpItems = [
        {
            q: "Quelles sont les différentes offres disponibles ?",
            a: "Nous proposons plusieurs offres adaptées à vos besoins : l'offre Starter pour débuter, et l'offre Pro qui débloque les statistiques avancées, les graphiques de performance, la gestion multi-boutiques et les alertes de dettes.",
            icon: "sparkles-outline"
        },
        {
            q: "Comment payer mon abonnement ?",
            a: "Le paiement est simple et sécurisé. Vous pouvez payer par MTN Mobile Money, Moov Money, Celtiis Benin ou via FedaPay (Carte bancaire). Sélectionnez une offre, choisissez votre durée (1, 3 ou 6 mois) et suivez les instructions de paiement.",
            icon: "wallet-outline"
        },
        {
            q: "Pourquoi certains chiffres sont masqués par (****) ?",
            a: "L'affichage des revenus détaillés et des dettes globales est réservé aux offres supérieures. Si vous voyez des asterisks, cela signifie que votre offre actuelle ne couvre pas ces statistiques avancées.",
            icon: "eye-off-outline"
        },
        {
            q: "Comment exporter mes données en Excel ?",
            a: "Si votre offre le permet, vous verrez une icône de téléchargement en haut des écrans 'Produits', 'Commandes' et sur le Tableau de bord. Cliquez dessus pour télécharger la liste de vos stocks ou l'historique de vos ventes au format CSV compatible Excel.",
            icon: "download-outline"
        },
        {
            q: "Puis-je changer d'offre à tout moment ?",
            a: "Vous pouvez passer à une offre supérieure (Upgrade) à tout moment pour débloquer plus de fonctionnalités. Cependant, pour passer à une offre inférieure (Downgrade), vous devrez attendre la fin de votre abonnement actuel.",
            icon: "arrow-up-circle-outline"
        },
        {
            q: "Comment ajouter un produit à l'inventaire ?",
            a: "Rendez-vous dans l'onglet 'Inventaire' depuis le menu principal. Appuyez sur le bouton '+' en haut à droite. Saisissez le nom du produit, son prix d'achat, son prix de vente et la quantité initiale disponible. Validez pour enregistrer le produit.",
            icon: "cube-outline"
        },
        {
            q: "Comment enregistrer une vente ?",
            a: "Allez dans l'onglet 'Ventes' ou utilisez le raccourci '+' sur votre tableau de bord. Sélectionnez les produits vendus un par un. Vous pouvez modifier la quantité pour chaque article. Une fois terminé, cliquez sur 'Valider la vente'.",
            icon: "cart-outline"
        },
        {
            q: "Comment gérer les paiements partiels (dettes) ?",
            a: "Lors d'une vente, saisissez le montant reçu. Le système calcule le reste à payer. La date du premier versement est enregistrée sous 'Réglé le', visible sur la facture et le suivi des commandes.",
            icon: "calendar-outline"
        },
        {
            q: "Comment solder une dette rapidement ?",
            a: "Dans la liste des 'Commandes', utilisez l'icône verte (double coche) pour marquer une commande comme entièrement payée. Cela mettra à jour le solde du client et le statut de la vente instantanément.",
            icon: "checkmark-done-circle-outline"
        },
        {
            q: "Comment retrouver une commande via une alerte ?",
            a: "Dans vos notifications, cliquez sur une alerte de paiement. L'application vous redirigera automatiquement vers la liste des commandes en filtrant uniquement celle concernée par l'alerte pour une gestion simplifiée.",
            icon: "notifications-outline"
        },
        {
            q: "Comment ajouter un nouveau client ?",
            a: "Allez dans la section 'Clients'. Appuyez sur le bouton '+' et renseignez le nom et le numéro de téléphone du client. Enregistrer vos clients vous permet de suivre précisément leurs achats et leurs dettes.",
            icon: "people-outline"
        },
        {
            q: "Qu'est-ce que le seuil d'alerte d'inventaire ?",
            a: "Le seuil d'alerte est la quantité en dessous de laquelle vous souhaitez être prévenu qu'un produit s'épuise. Le produit s'affichera en rouge dès qu'il atteint ce seuil pour vous inviter à vous réapprovisionner.",
            icon: "alert-circle-outline"
        }
    ];

    const openWhatsApp = () => {
        // Supprimer tout sauf les chiffres pour wa.me (pas de + ni d'espaces)
        const phone = appConfig.app_num.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${phone}`;

        Linking.openURL(url).catch(() => {
            showMessage('Impossible d\'ouvrir WhatsApp. Vérifiez que l\'application est installée.', 'error');
        });
    };

    const openEmail = () => {
        Linking.openURL(`mailto:${appConfig.app_email}`);
    };

    const openPhoneCall = () => {
        const phone = appConfig.app_num.replace(/[^0-9+]/g, '');
        Linking.openURL(`tel:${phone}`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Centre d'aide</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.mainTitle}>Questions fréquentes</Text>
                <Text style={styles.introText}>Voici les réponses aux questions les plus courantes pour vous aider à utiliser l'application au quotidien.</Text>

                {helpItems.map((item, index) => (
                    <HelpSection key={index} title={item.q} content={item.a} icon={item.icon} />
                ))}

                <View style={styles.footer}>
                    <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                        <Text style={styles.footerLink}>Politique et conditions d'utilisation</Text>
                    </TouchableOpacity>

                    <View style={styles.contactContainer}>
                        <Text style={styles.contactLabel}>Besoin d'aide ?</Text>
                        <View style={styles.contactRow}>
                            <TouchableOpacity style={[styles.contactPill, { borderColor: '#25D366' }]} onPress={openWhatsApp}>
                                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                                <Text style={styles.contactText}>WhatsApp</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.contactPill, { borderColor: '#3B82F6' }]} onPress={openPhoneCall}>
                                <Ionicons name="call" size={18} color="#3B82F6" />
                                <Text style={styles.contactText}>Appeler</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.contactPill, { borderColor: Colors.primary }]} onPress={openEmail}>
                                <Ionicons name="mail" size={18} color={Colors.primary} />
                                <Text style={styles.contactText}>Email</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

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

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView >
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
    mainTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 10, textAlign: 'left' },
    introText: { fontSize: 14, color: '#666666', lineHeight: 20, marginBottom: 20, textAlign: 'left' },
    section: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    sectionIcon: { marginRight: 10 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'left' },
    sectionContent: { fontSize: 14, color: '#444444', lineHeight: 22, textAlign: 'left' },
    footer: { marginTop: 30, alignItems: 'center', paddingVertical: 20 },
    footerLink: { fontSize: 13, color: '#94A3B8', textDecorationLine: 'underline', marginBottom: 20 },
    contactContainer: { alignItems: 'center', width: '100%' },
    contactLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' },
    contactRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
    contactPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 5
    },
    contactText: { fontSize: 12, fontWeight: '600', color: Colors.text },
    poweredByContainer: { alignItems: 'center', marginBottom: 20, opacity: 0.7 },
    poweredByText: { fontSize: 10, color: Colors.textLight, marginBottom: 2 },
    poweredByLogo: { width: 80, height: 25 }
});
