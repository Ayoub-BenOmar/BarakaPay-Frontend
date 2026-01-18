# 🏦 Albaraka Digital Bank – Frontend

<div align="center">

### 💎 Application frontend Angular pour la banque digitale **Albaraka**

Trois espaces distincts (Client, Agent, Admin) pour gérer comptes, opérations et utilisateurs

[![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)

</div>

---

## 📋 Table des matières

- [Stack & Outils](#-stack--outils)
- [Démarrage rapide](#-démarrage-rapide)
- [Architecture](#-architecture)
- [Espaces fonctionnels](#-espaces-fonctionnels)
- [Intégration API & Sécurité](#-intégration-api--sécurité)
- [Conventions & Bonnes pratiques](#-conventions--bonnes-pratiques)

---

## 🛠 Stack & Outils

<table>
<tr>
<td align="center" width="33%">

### Framework
**Angular 17+**  
Standalone Components

</td>
<td align="center" width="33%">

### Langage
**TypeScript**  
Typage strict

</td>
<td align="center" width="33%">

### Build
**Angular CLI**  
esbuild

</td>
</tr>
<tr>
<td align="center" width="33%">

### HTTP
**HttpClient**  
JWT Auth

</td>
<td align="center" width="33%">

### Routing
**Angular Router**  
Lazy Loading + Guards

</td>
<td align="center" width="33%">

### Styles
**CSS Custom**  
Par composant

</td>
</tr>
</table>

---

## 🚀 Démarrage rapide

### Prérequis

```
✓ Node.js (LTS)
✓ npm ou yarn
✓ Backend API démarré (http://localhost:8080)
```

### ⚙️ Installation & Lancement

```bash
# 📥 Installation des dépendances
npm install

# 🎬 Démarrage du serveur de développement
npm start        # équivalent à ng serve
```

### 🗺️ URLs principales

<table>
<tr>
<td align="center" width="25%">

**🔐 Auth**  
`/auth`  
Authentification

</td>
<td align="center" width="25%">

**👤 Client**  
`/client`  
Rôle `CLIENT`

</td>
<td align="center" width="25%">

**👨‍💼 Agent**  
`/agent`  
Rôle `AGENT_BANCAIRE`

</td>
<td align="center" width="25%">

**⚙️ Admin**  
`/admin`  
Rôle `ADMIN`

</td>
</tr>
</table>

---

## 🏗 Architecture

### Vue globale

```
📦 src/
 ┣ 📂 app/
 ┃ ┣ 📄 app.routes.ts          # Routing principal
 ┃ ┣ 📂 core/
 ┃ ┃ ┗ 📂 services/             # Services partagés
 ┃ ┃   ┣ auth.service.ts
 ┃ ┃   ┣ user.service.ts
 ┃ ┃   ┗ operation.service.ts
 ┃ ┗ 📂 features/
 ┃   ┣ 📂 auth/                 # Login / Register
 ┃   ┣ 📂 client/               # Espace client
 ┃   ┣ 📂 agent/                # Espace agent bancaire
 ┃   ┗ 📂 admin/                # Espace administrateur
```

### 🎯 Services principaux

<table>
<tr>
<td width="33%">

#### `auth.service.ts`
🎫 Gestion du token  
🚪 Login/Logout  
🛡️ JWT Security

</td>
<td width="33%">

#### `operation.service.ts`
⏳ Opérations pending  
✅ Décisions (approve/reject)  
📎 Justificatifs

</td>
<td width="33%">

#### 👥 `user.service.ts`
📋 `getAdminUsers()`  
✅ `enableUser()`  
❌ `disableUser()`  
🔄 `updateUserRole()`

</td>
</tr>
</table>

---

## 📱 Espaces fonctionnels

### 👤 Espace Client

**Shell** : `ClientShellComponent`

**Pages disponibles** :
- 📊 Dashboard (soldes, KPI, opérations récentes)
- 💰 Dépôt / Retrait / Virement
- 📄 Historique / Relevés
- 🔔 Notifications

---

### 👨‍💼 Espace Agent

**Objectif** : Gérer les opérations en attente

**Composants clés** :

**`PendingOperationsComponent`**
- Liste des opérations PENDING avec filtres, tri et pagination
- Sélection d'une opération → ouverture d'un panneau de détail

**`OperationDetailComponent`**
- Détails opération + informations client
- Liste des justificatifs (téléchargement protégé par JWT)
- Actions : ✅ Approuver / ❌ Rejeter (masquées si aucun justificatif)

---

### ⚙️ Espace Admin

**Shell** : `AdminShellComponent` (layout identique au shell client)

**Gestion des utilisateurs** :

**Colonnes affichées** :
```
ID | Nom | Email | Rôle | Statut | Date
```

**Fonctionnalités** :

🔍 **Filtres** :
- Email/Nom
- Rôle (CLIENT, AGENT_BANCAIRE, ADMIN)
- Statut (ACTIVE, INACTIVE)

📊 **Tri** :
- Date, Nom, Email, Rôle

⚡ **Actions** :
- Activation/Désactivation de compte avec confirmation
- Attribution de rôle via modale
- APIs : `/api/admin/users/{id}/enable|disable` et `PUT /api/admin/users/{id}/roles`

---

## 🔒 Intégration API & Sécurité

### ⚙️ Configuration

```typescript
environment.apiBaseUrl = "http://localhost:8080"
```

<div align="center">

**🔐 Tous les services utilisent cette base URL**

</div>

### 🎫 Authentification JWT

Un `HttpInterceptor` ajoute automatiquement le token à chaque requête :

```http
Authorization: Bearer <token>
```

### 📡 Endpoints Backend

<table>
<tr>
<th>Méthode</th>
<th>Endpoint</th>
<th>Description</th>
</tr>
<tr>
<td align="center">

`GET`

</td>
<td>

`/api/admin/users`

</td>
<td>

📋 Liste paginée des utilisateurs

</td>
</tr>
<tr>
<td align="center">

`POST`

</td>
<td>

`/api/admin/users/{id}/enable`

</td>
<td>

✅ Activer un utilisateur

</td>
</tr>
<tr>
<td align="center">

`POST`

</td>
<td>

`/api/admin/users/{id}/disable`

</td>
<td>

❌ Désactiver un utilisateur

</td>
</tr>
<tr>
<td align="center">

`PUT`

</td>
<td>

`/api/admin/users/{id}/roles`

</td>
<td>

🎭 Mettre à jour le rôle

</td>
</tr>
</table>

### ⚠️ Gestion des erreurs

<table>
<tr>
<td align="center" width="33%">

**🚫 401**  
Non authentifié  
Redirection login

</td>
<td align="center" width="33%">

**🔒 403**  
Accès refusé  
Droits insuffisants

</td>
<td align="center" width="33%">

**📄 Format**  
Réponse JSON  
Pas de HTML

</td>
</tr>
</table>

---

## ✅ Conventions & Bonnes pratiques

### 🏛️ Architecture

<table>
<tr>
<td align="center" width="33%">

**Components**  
Standalone  
Imports modulaires

</td>
<td align="center" width="33%">

**TypeScript**  
Typage strict  
Interfaces définies

</td>
<td align="center" width="33%">

**Gestion erreurs**  
Messages utilisateur  
Logs console

</td>
</tr>
</table>

### 🎨 UI Cohérente entre espaces

```
┌─────────────────────────────────────────┐
│  Même shell (sidebar + carte)        │
│  Listes standardisées                │
│  Composants réutilisables            │
│  Header + Filtres + Tableau + Pages  │
└─────────────────────────────────────────┘
```

### 📂 Structure du code

<table>
<tr>
<td width="50%">

#### 📍 Organisation
```
✓ Services → core/services/
✓ Features → isolation + routing
✓ Guards → protection routes
✓ Interceptors → JWT centralisé
```

</td>
<td width="50%">

#### 🎯 Types définis
```typescript
AdminUserSummary
PendingOperation
ClientAccount
BankOperation
```

</td>
</tr>
</table>


---

<div align="center">

### 🌟 **Albaraka Digital Bank** 🌟

💎 Application bancaire moderne et sécurisée 💎

[![Made with Angular](https://img.shields.io/badge/Made%20with-Angular-DD0031?style=for-the-badge&logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Secure](https://img.shields.io/badge/Security-JWT-00B300?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)

**⭐ Star ce projet si vous le trouvez utile ! ⭐**

</div>
