# 📡 Documentation API

## Base URL
```
http://localhost:8000/api
```

## Authentification

L'API utilise Laravel Sanctum avec des tokens Bearer pour l'authentification.

### Headers requis pour les routes protégées
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

## Endpoints

### 1. Inscription

**POST** `/register`

Crée un nouveau compte utilisateur.

**Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Réponse (201):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-02-05T20:00:00.000000Z",
    "updated_at": "2026-02-05T20:00:00.000000Z"
  },
  "token": "1|abcdef123456...",
  "message": "Inscription réussie"
}
```

**Erreurs possibles:**
- 422 : Validation échouée (email déjà utilisé, mot de passe trop court, etc.)

---

### 2. Connexion

**POST** `/login`

Connecte un utilisateur existant.

**Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Réponse (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-02-05T20:00:00.000000Z",
    "updated_at": "2026-02-05T20:00:00.000000Z"
  },
  "token": "2|ghijkl789012...",
  "message": "Connexion réussie"
}
```

**Erreurs possibles:**
- 422 : Identifiants incorrects

---

### 3. Déconnexion

**POST** `/logout`

🔒 **Route protégée** - Nécessite un token d'authentification

Déconnecte l'utilisateur actuel et révoque son token.

**Headers:**
```
Authorization: Bearer {token}
```

**Réponse (200):**
```json
{
  "message": "Déconnexion réussie"
}
```

**Erreurs possibles:**
- 401 : Token invalide ou expiré

---

### 4. Utilisateur connecté

**GET** `/user`

🔒 **Route protégée** - Nécessite un token d'authentification

Récupère les informations de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer {token}
```

**Réponse (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "email_verified_at": null,
  "created_at": "2026-02-05T20:00:00.000000Z",
  "updated_at": "2026-02-05T20:00:00.000000Z"
}
```

**Erreurs possibles:**
- 401 : Token invalide ou expiré

---

## Codes de Statut HTTP

| Code | Signification |
|------|---------------|
| 200  | Succès |
| 201  | Créé avec succès |
| 401  | Non authentifié |
| 422  | Erreur de validation |
| 500  | Erreur serveur |

## Exemples avec cURL

### Inscription
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

### Connexion
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Obtenir l'utilisateur connecté
```bash
curl -X GET http://localhost:8000/api/user \
  -H "Authorization: Bearer {votre_token}" \
  -H "Accept: application/json"
```

### Déconnexion
```bash
curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer {votre_token}" \
  -H "Accept: application/json"
```

## Prochaines étapes

Pour ajouter de nouveaux endpoints (produits, catégories, etc.) :

1. Créez un contrôleur :
```bash
php artisan make:controller Api/ProductController --api
```

2. Ajoutez les routes dans `routes/api.php` :
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('products', ProductController::class);
});
```

3. Créez le modèle et la migration :
```bash
php artisan make:model Product -m
```
