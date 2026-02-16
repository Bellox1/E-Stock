#!/bin/bash

# Script pour démarrer le backend Laravel et le frontend Expo
# Utilisation: ./DEMARRER.sh

echo "🚀 Démarrage de GestionStock..."
echo ""

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour démarrer le backend
start_backend() {
    echo -e "${BLUE}📦 Démarrage du backend Laravel...${NC}"
    cd backend
    php artisan serve --host=192.168.8.100 --port=8000 &
    BACKEND_PID=$!
    echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}"
    echo -e "   URL: http://192.168.8.100:8000"
    echo ""
    cd ..
}

# Fonction pour démarrer le frontend
start_frontend() {
    echo -e "${BLUE}📱 Démarrage du frontend Expo...${NC}"
    cd expo-mobile
    npx expo start --lan -c &
    FRONTEND_PID=$!
    echo -e "${GREEN}✅ Frontend démarré (PID: $FRONTEND_PID)${NC}"
    echo ""
    cd ..
}

# Démarrer les services
start_backend
start_frontend

echo -e "${GREEN}🎉 Tous les services sont démarrés!${NC}"
echo ""
echo "📱 Pour utiliser l'application:"
echo "   1. Ouvrez Expo Go sur votre iPhone"
echo "   2. Scannez le QR code qui va s'afficher"
echo ""
echo "⚠️  Pour arrêter les services, appuyez sur Ctrl+C"
echo ""

# Attendre que l'utilisateur arrête les services
wait
