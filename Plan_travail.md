# 📱 Application Mobile – Gestion de boutiques 

## 1️⃣ Objectif général

Créer une **application mobile (React Native)** pour permettre aux commerçants de gérer :

* leurs **boutiques**,
* leurs **produits et stocks**,
* leurs **ventes, commandes et clients**,
* le suivi des **paiements et crédits**,
* tout en recevant des **alertes automatiques** sur stock faible ou paiement en retard.

L’administrateur agit **uniquement comme gestionnaire de la plateforme**, des offres, des permissions et des statistiques globales.

---

## 2️⃣ Utilisateurs

### A. Commerçants (utilisateurs principaux)

**Rôle central : sans commerçants, l’application n’existe pas.**

* S’inscrivent via l’application mobile : nom, email, téléphone, mot de passe.
* Choix d’une **offre** (niveau de permissions) et d’une **durée** (1, 3, 6, 12 mois).
* Paiement intégré pour valider l’abonnement.

**Fonctionnalités essentielles :**

1. **Gestion des boutiques**

   * Créer, modifier, supprimer.
   * Une boutique par défaut à l’inscription.
   * Possibilité d’en créer autant que nécessaire.

2. **Gestion des produits**

   * Ajouter, modifier, supprimer.
   * Suivi automatique du **stock restant**.
   * Alertes si stock < seuil critique (1/4 par défaut).

3. **Gestion des ventes et commandes**

   * Enregistrer chaque vente rapidement.
   * Suivi des paiements : total vendu, payé, crédit restant.
   * Possibilité de définir **la date de paiement pour les crédits** → alertes automatiques.

4. **Gestion des clients**

   * Ajouter un client avant ou pendant une commande.
   * Suivi des crédits clients et de l’historique des commandes.
   * Filtrage des clients selon paiement, commandes ou crédit restant.

5. **Tableau de bord du commerçant**

   * Vue rapide sur :

     * Chiffre d’affaires de chaque boutique
     * Produits épuisés ou presque
     * Commandes en cours
     * Paiements clients en retard
   * Notifications et alertes visibles directement sur mobile.

---

### B. Administrateurs (utilisateurs secondaires)

* **Ne peuvent pas s’inscrire directement**.
* Créés uniquement par un autre administrateur.
* **Ne voient pas les boutiques ni les produits** des commerçants.
* Accès uniquement aux fonctions **de gestion de la plateforme** :

**Fonctionnalités de l’administrateur :**

1. Gestion des offres et permissions :

   * Créer, modifier, supprimer des offres.
   * Définir prix par mois, durée (1, 3, 6, 12 mois), taux ou réduction.
   * Définir les permissions liées à chaque offre → ce que les commerçants peuvent faire.
   * Déclarer une **offre gratuite temporaire** → tous les commerçants bénéficient automatiquement.

2. Gestion des utilisateurs :

   * Voir le nombre total de commerçants sur la plateforme.
   * Voir combien de comptes ont été supprimés.
   * Suivi des abonnements, paiements et expirations.

3. Statistiques globales :

   * Chiffre d’affaires total sur la plateforme.
   * Nombre de commandes et ventes traitées.
   * Montant payé et restant à payer.
   * Visualiser les marchands actifs et abonnements en cours.

4. Création et gestion des **autres administrateurs**.

---

## 3️⃣ Offres et permissions

* Les **offres remplacent les rôles classiques**.
* Chaque offre définit :

  * Les fonctionnalités accessibles pour le commerçant (boutiques, produits, commandes, alertes, statistiques).
  * Le prix et la durée disponibles.
  * Le taux ou réduction selon la durée choisie.
* L’administrateur peut **modifier les permissions** ou rendre une offre gratuite temporairement.
* Le commerçant **accède uniquement aux fonctionnalités de son offre**.

---

## 4️⃣ Paiements et abonnements

* Paiement intégré via mobile.
* Prix total calculé automatiquement selon :

  * Prix par mois défini par l’administrateur
  * Durée choisie (1, 3, 6, 12 mois)
  * Taux ou réduction appliqué selon la durée
* Possibilité de rendre une offre **gratuite temporairement** → activation automatique des permissions.

---

## 5️⃣ Flux général de l’application

1. **Commerçant**

   * S’inscrit → choisit une offre → choisit la durée → paie → permissions activées → accède aux fonctionnalités principales (boutiques, produits, commandes, clients, alertes, statistiques).

2. **Administrateur**

   * Crée et configure les offres → définit les permissions → surveille les commerçants et leurs abonnements → suit les statistiques globales → peut créer d’autres administrateurs.

---

## ✅ Résumé clé

* **Les commerçants sont le cœur du système**, sans eux, il n’y a ni ventes ni boutiques.
* **Les offres remplacent les rôles** et définissent ce que le commerçant peut faire.
* **Les administrateurs supervisent la plateforme**, les offres et les utilisateurs, mais n’accèdent jamais aux stocks ou boutiques.
* Application **entièrement mobile**, simple, intuitive et orientée UX pour faciliter la gestion au quotidien.
