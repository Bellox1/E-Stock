# Configuration de Développement

## 🔧 Configuration de l'URL de l'API

L'URL de l'API doit être configurée différemment selon l'environnement de développement.

### Fichier à modifier
`mobile/src/config/api.js`

### Configurations recommandées

#### 1. Émulateur Android
```javascript
export const API_URL = 'http://10.0.2.2:8000/api';
```
L'adresse `10.0.2.2` est l'alias pour `localhost` sur l'émulateur Android.

#### 2. Émulateur iOS
```javascript
export const API_URL = 'http://localhost:8000/api';
```

#### 3. Appareil physique (Android ou iOS)

**Étape 1** : Trouvez votre adresse IP locale

**Linux/Mac** :
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows** :
```bash
ipconfig
```

**Étape 2** : Utilisez cette IP dans la configuration
```javascript
export const API_URL = 'http://192.168.1.X:8000/api';
```
Remplacez `192.168.1.X` par votre adresse IP réelle.

**Étape 3** : Lancez Laravel sur toutes les interfaces
```bash
php artisan serve --host=0.0.0.0
```

### Configuration actuelle

Le fichier `mobile/src/config/api.js` est actuellement configuré pour :
- **Développement** : Émulateur Android (`http://10.0.2.2:8000/api`)
- **Production** : À définir

## 🗄️ Configuration de la Base de Données

### SQLite (Par défaut)

Aucune configuration supplémentaire nécessaire. La base de données est déjà créée dans `backend/database/database.sqlite`.

### MySQL

**Étape 1** : Créez la base de données
```bash
mysql -u root -p
CREATE DATABASE gestion_stock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

**Étape 2** : Modifiez `backend/.env`
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=gestion_stock
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe
```

**Étape 3** : Exécutez les migrations
```bash
cd backend
php artisan migrate
```

### PostgreSQL

**Étape 1** : Créez la base de données
```bash
psql -U postgres
CREATE DATABASE gestion_stock;
\q
```

**Étape 2** : Modifiez `backend/.env`
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=gestion_stock
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
```

**Étape 3** : Exécutez les migrations
```bash
cd backend
php artisan migrate
```

## 🔐 Configuration de l'Authentification

### Durée de vie des tokens

Par défaut, les tokens Sanctum n'expirent jamais. Pour définir une expiration :

**Fichier** : `backend/config/sanctum.php`

```php
'expiration' => 60 * 24, // 24 heures
```

### Domaines autorisés (CORS)

Pour autoriser des domaines spécifiques :

**Fichier** : `backend/config/cors.php` (à créer si nécessaire)

```php
return [
    'paths' => ['api/*'],
    'allowed_origins' => ['*'],
    'allowed_methods' => ['*'],
    'allowed_headers' => ['*'],
];
```

## 📱 Configuration React Native

### Metro Bundler

Si vous rencontrez des problèmes avec le cache :

```bash
cd mobile
npx react-native start --reset-cache
```

### Ports personnalisés

**Backend Laravel** :
```bash
php artisan serve --port=8080
```

N'oubliez pas de mettre à jour `mobile/src/config/api.js` en conséquence.

## 🐛 Débogage

### Activer les logs Laravel

**Fichier** : `backend/.env`
```env
APP_DEBUG=true
LOG_LEVEL=debug
```

### Activer les logs React Native

**Android** :
```bash
npx react-native log-android
```

**iOS** :
```bash
npx react-native log-ios
```

### Debugger réseau

Pour voir les requêtes HTTP dans React Native :

1. Secouez l'appareil/émulateur
2. Sélectionnez "Debug"
3. Ouvrez Chrome DevTools

## 🚀 Optimisation

### Backend

**Cache de configuration** :
```bash
php artisan config:cache
php artisan route:cache
```

**Désactiver en développement** :
```bash
php artisan config:clear
php artisan route:clear
```

### Mobile

**Build de production Android** :
```bash
cd mobile/android
./gradlew assembleRelease
```

**Build de production iOS** :
```bash
cd mobile/ios
xcodebuild -workspace mobile.xcworkspace -scheme mobile -configuration Release
```

## 📝 Variables d'environnement

### Backend (.env)

Variables importantes :
```env
APP_NAME="Gestion Stock"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# ou mysql, pgsql

SANCTUM_STATEFUL_DOMAINS=localhost:8000
```

### Mobile

React Native n'utilise pas de fichier .env par défaut. Les configurations sont dans :
- `mobile/src/config/api.js` pour l'API
- `mobile/app.json` pour les métadonnées de l'app

## 🔄 Synchronisation des données

Pour réinitialiser complètement la base de données :

```bash
cd backend
php artisan migrate:fresh --seed
```

⚠️ **Attention** : Cette commande supprime toutes les données !
