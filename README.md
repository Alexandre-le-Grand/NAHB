# NAHB
# NAHB - Not Another Hero's Book

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

NAHB est une application web fullstack qui permet de créer et de jouer à des "livres dont vous êtes le héros". Les auteurs peuvent construire des histoires interactives complexes avec des embranchements multiples, tandis que les lecteurs peuvent explorer ces mondes et voir leurs choix façonner leur aventure.

## ✨ Fonctionnalités principales

### ✍️ Pour les Auteurs
- **Création d'histoires complètes** : Un éditeur de pages intuitif pour créer des scènes, des choix et des fins multiples.
- **Gestion des histoires** : Modifier, supprimer et gérer le statut de ses propres histoires (brouillon, publié).
- **Système de Tags** : Associer des thèmes à une histoire pour faciliter la découverte.
- **Statistiques par histoire** : Suivre le nombre de lectures et de fins atteintes pour ses propres créations.

### 📖 Pour les Lecteurs
- **Bibliothèque d'histoires** : Parcourir et rechercher toutes les histoires publiées.
- **Lecture interactive** : Une expérience de lecture immersive où chaque choix compte.
- **Sauvegarde de la progression** : Le système enregistre les histoires "en cours" ou "terminées" pour chaque lecteur.

### 🔧 Pour les Administrateurs
- **Modération des utilisateurs et du contenu** : Bannir des auteurs ou suspendre des histoires.
- **Modération des Tags** : Un système de validation où les nouveaux tags doivent être approuvés par un admin (ou l'auteur) avant d'être visibles publiquement.

## 🛠️ Stack Technique

- **Frontend** : React avec TypeScript, en utilisant des modules CSS pour le style.
- **Backend** : Node.js avec le framework Express.js.
- **Base de données** : MySQL avec l'ORM Sequelize pour la modélisation des données et les requêtes.
- **Authentification** : Système basé sur les JSON Web Tokens (JWT).

## 🚀 Installation et Lancement

Pour lancer le projet en local, suivez ces étapes.

### Prérequis
- Node.js (v18 ou supérieure)
- Un serveur de base de données MySQL en cours d'exécution.

### 1. Configuration du Backend

```bash
# Allez dans le dossier du serveur
cd server

# Installez les dépendances
npm install

# Créez un fichier .env à la racine du dossier /server
# et copiez coller ceci : 
```

**Fichier `.env` :**
```env
DB_HOST=mysql.thomasale.familyds.com
DB_PORT=3307
DB_USER=root
DB_PASSWORD=charlotte
DB_NAME=nahb_db
JWT_SECRET=NAHBsuperSecret2025!
```

```bash
# Lancez le serveur de développement (avec nodemon)
npm run dev
```
Le serveur backend sera accessible sur `http://localhost:5000`.

### 2. Configuration du Frontend

```bash
# Depuis la racine du projet, allez dans le dossier du client
cd client

# Installez les dépendances
npm install

# Lancez le serveur de développement
npm run dev
```
L'application web sera accessible sur `http://localhost:5173` (ou un autre port indiqué par Vite).

## 👤 Comptes de Démonstration

Pour tester l'application, vous pouvez utiliser les comptes suivants :

- **Compte Administrateur** :
  - **Email** : `omar@omar.omar`
  - **Mot de passe** : `omaromar`

- **Compte Auteur** :
  - **Email** : `alex@alex.alex`
  - **Mot de passe** : `alexalex`

---

Réalisé par Alexandre Thomas et Omar Chekkouri.
