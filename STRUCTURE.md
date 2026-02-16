# 📂 Structure du Projet

## Vue d'ensemble

```
GestionStock/
├── backend/              # API Laravel
├── mobile/               # Application React Native
├── README.md             # Documentation principale
├── DEMARRAGE.md          # Guide de démarrage rapide
└── package.json          # Scripts de lancement
```

## Backend (Laravel)

```
backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── Api/
│   │           └── AuthController.php    # Contrôleur d'authentification
│   └── Models/
│       └── User.php                      # Modèle utilisateur avec HasApiTokens
├── config/
│   └── sanctum.php                       # Configuration Sanctum
├── database/
│   ├── migrations/                       # Migrations de base de données
│   └── database.sqlite                   # Base de données SQLite
├── routes/
│   ├── api.php                           # Routes API
│   └── web.php                           # Routes web
├── bootstrap/
│   └── app.php                           # Configuration CORS
├── .env                                  # Variables d'environnement
└── API.md                                # Documentation API
```

### Fichiers clés du backend

| Fichier | Description |
|---------|-------------|
| `routes/api.php` | Définition des routes API |
| `app/Http/Controllers/Api/AuthController.php` | Gestion de l'authentification |
| `app/Models/User.php` | Modèle utilisateur |
| `bootstrap/app.php` | Configuration CORS |
| `database/migrations/` | Schéma de base de données |

## Mobile (React Native)

```
mobile/
├── src/
│   ├── config/
│   │   └── api.js                        # Configuration API
│   ├── context/
│   │   └── AuthContext.js                # Contexte d'authentification
│   ├── services/
│   │   └── authService.js                # Service d'authentification
│   ├── navigation/
│   │   └── AppNavigator.js               # Navigation principale
│   └── screens/
│       ├── LoginScreen.js                # Écran de connexion
│       ├── RegisterScreen.js             # Écran d'inscription
│       └── HomeScreen.js                 # Écran d'accueil
├── android/                              # Code natif Android
├── ios/                                  # Code natif iOS
├── App.tsx                               # Point d'entrée de l'app
└── package.json                          # Dépendances npm
```

### Fichiers clés du mobile

| Fichier | Description |
|---------|-------------|
| `App.tsx` | Point d'entrée principal |
| `src/config/api.js` | URL et configuration de l'API |
| `src/context/AuthContext.js` | État global d'authentification |
| `src/services/authService.js` | Appels API d'authentification |
| `src/navigation/AppNavigator.js` | Configuration de la navigation |
| `src/screens/` | Écrans de l'application |

## Architecture

### Backend (Laravel)

```
┌─────────────┐
│   Routes    │  routes/api.php
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controllers │  app/Http/Controllers/Api/
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Models    │  app/Models/
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │  database/
└─────────────┘
```

### Mobile (React Native)

```
┌─────────────┐
│   App.tsx   │  Point d'entrée
└──────┬──────┘
       │
       ▼
┌─────────────┐
│AuthProvider │  Contexte global
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Navigator  │  Navigation
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Screens   │  Écrans
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Services   │  Appels API
└─────────────┘
```

## Flux de données

### Authentification

```
Mobile App                    Laravel API
    │                             │
    │  POST /api/register         │
    ├──────────────────────────>  │
    │                             │
    │  { user, token }            │
    │  <──────────────────────────┤
    │                             │
    │  Store token in            │
    │  AsyncStorage              │
    │                             │
    │  POST /api/login            │
    ├──────────────────────────>  │
    │                             │
    │  { user, token }            │
    │  <──────────────────────────┤
    │                             │
    │  GET /api/user              │
    │  Authorization: Bearer      │
    ├──────────────────────────>  │
    │                             │
    │  { user data }              │
    │  <──────────────────────────┤
    │                             │
```

## Ajout de nouvelles fonctionnalités

### 1. Backend (Laravel)

1. **Créer un modèle et migration** :
   ```bash
   php artisan make:model Product -m
   ```

2. **Créer un contrôleur API** :
   ```bash
   php artisan make:controller Api/ProductController --api
   ```

3. **Ajouter les routes** dans `routes/api.php` :
   ```php
   Route::middleware('auth:sanctum')->group(function () {
       Route::apiResource('products', ProductController::class);
   });
   ```

### 2. Mobile (React Native)

1. **Créer un service** dans `src/services/productService.js`
2. **Créer un écran** dans `src/screens/ProductsScreen.js`
3. **Ajouter la route** dans `src/navigation/AppNavigator.js`

## Technologies utilisées

### Backend
- Laravel 12
- Laravel Sanctum (authentification)
- SQLite/MySQL (base de données)
- PHP 8.x

### Mobile
- React Native 0.83
- React Navigation (navigation)
- Axios (requêtes HTTP)
- AsyncStorage (stockage local)
- TypeScript (typage)

## Conventions de code

### Backend (Laravel)
- PSR-12 pour le style de code PHP
- Nommage des contrôleurs : `{Nom}Controller`
- Nommage des modèles : Singulier, PascalCase
- Routes API : Pluriel, kebab-case

### Mobile (React Native)
- ESLint pour le style de code JavaScript
- Nommage des composants : PascalCase
- Nommage des fichiers : PascalCase pour les composants
- Hooks personnalisés : préfixe `use`

## Sécurité

- ✅ Authentification par token (Sanctum)
- ✅ Validation des données côté serveur
- ✅ CORS configuré
- ✅ Mots de passe hashés (bcrypt)
- ✅ Protection CSRF désactivée pour l'API
- ✅ Tokens stockés de manière sécurisée (AsyncStorage)

## Performance

- ✅ Eager loading pour éviter le problème N+1
- ✅ Cache de base de données configuré
- ✅ Optimisation des requêtes API
- ✅ Lazy loading des écrans React Native
