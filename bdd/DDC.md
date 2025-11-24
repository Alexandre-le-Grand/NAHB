Dossier de Conception Technique - Projet NAHB (Not Another Hero's Book)

Auteurs : [Noms des membres du groupe]
Date : 24/11/2025
Version : 1.0

1. Présentation du Projet

NAHB est une application web Fullstack permettant de créer, gérer et jouer à des histoires interactives ("Livres dont vous êtes le héros").
L'objectif est de fournir une double interface :

Auteur : Un éditeur de nœuds scénaristiques.

Lecteur : Une interface de jeu immersive avec suivi de progression.

2. Architecture Technique (Stack MERN/PERN)

Pour répondre aux contraintes de délai et de performance, nous avons choisi l'architecture suivante :

2.1 Front-end

Framework : React.js (via Vite pour la rapidité de build).

Styling : Tailwind CSS (pour le responsive et la rapidité d'intégration).

Routing : React Router DOM.

Gestion d'état : Context API ou Zustand (pour gérer la session utilisateur et l'état de la partie en cours).

2.2 Back-end

Runtime : Node.js.

Framework : Express.js (Architecture REST API).

Sécurité :

JWT (JSON Web Tokens) pour l'authentification (stateless).

Bcrypt pour le hachage des mots de passe.

2.3 Base de données

SGBD : MongoDB (recommandé pour la structure flexible des histoires JSON) OU MySQL (si relationnel strict préféré).

Note de conception : Vu la nature hiérarchique des histoires (Pages -> Choix -> Pages), une base NoSQL (Mongo) facilite le stockage, mais une base SQL permet des stats plus robustes. Ce document assume une structure relationnelle logique adaptable aux deux.

3. Modélisation des Données (Schéma Logique)

Voici les entités principales identifiées pour le MVP et les niveaux avancés.

Users (Utilisateurs)

id : Unique ID

username : String

email : String (Unique)

password : Hash

role : Enum ['user', 'admin'] (Un auteur est un user standard qui a créé une histoire)

created_at : Date

Stories (Histoires)

id : Unique ID

title : String

description : Text

author_id : Ref -> Users

start_page_id : Ref -> Pages (Point d'entrée)

status : Enum ['draft', 'published', 'banned']

tags : Array[String] (ex: "Horreur", "Médiéval")

created_at : Date

Pages (Scènes)

id : Unique ID

story_id : Ref -> Stories

content : Text (Le récit)

is_end : Boolean (True si c'est une fin)

ending_type : String (Optionnel: "Mort", "Victoire", "Neutre")

image_url : String (Pour les illustrations)

Choices (Choix)

id : Unique ID

from_page_id : Ref -> Pages

to_page_id : Ref -> Pages (Destination)

text : String (Le texte du bouton, ex: "Ouvrir la porte")

GameSaves (Parties / Historique)

id : Unique ID

user_id : Ref -> Users

story_id : Ref -> Stories

current_page_id : Ref -> Pages (Pour reprise de sauvegarde)

history : Array[Page_IDs] (Liste des pages visitées pour stats "chemin")

status : Enum ['in_progress', 'finished', 'abandoned']

finished_at : Date

4. API Endpoints (Architecture REST)

4.1 Authentification (/api/auth)

POST /register : Création de compte.

POST /login : Connexion (renvoie le JWT).

GET /me : Récupère les infos du user connecté via le token.

4.2 Histoires (/api/stories)

GET / : Liste toutes les histoires publiées (avec filtres recherche/tags).

GET /my-stories : Liste des histoires de l'auteur connecté (y compris brouillons).

POST / : Créer une nouvelle histoire.

GET /:id : Détails d'une histoire (Méta-données).

PUT /:id : Modifier une histoire (titre, statut draft/publish).

DELETE /:id : Supprimer une histoire.

4.3 Éditeur de Scènes (/api/stories/:storyId/pages)

GET / : Récupérer toutes les pages d'une histoire (pour l'arbre/visualisation).

POST / : Créer une page.

PUT /:pageId : Modifier le contenu d'une page et ses choix sortants.

DELETE /:pageId : Supprimer une page.

4.4 Jeu (/api/play)

POST /start/:storyId : Initialise une partie (crée une entrée GameSave).

POST /choice : Enregistre un choix (Update GameSave avec nouvelle page courante).

GET /stats/:storyId : Récupère les stats (ex: % de joueurs ayant fini).

5. Logique Métier & Algorithmes

5.1 Gestion du graphe d'histoire

L'histoire est un Graphe Orienté.

Validation de publication : Avant de passer une histoire en "Published", le backend doit vérifier que :

L'histoire a au moins une start_page.

Il n'y a pas de "cul-de-sac" (pages sans choix qui ne sont pas marquées is_end).

Toutes les destinations des choix existent.

5.2 Moteur de Jeu

Le front-end ne charge pas toute l'histoire d'un coup (pour éviter la triche).

Le client demande la page actuelle.

Le serveur renvoie : Texte + Liste des Choix (ID destination masqué ou API call sur clic).

Si is_end == true, le serveur marque la partie comme finished et calcule les stats.

6. Découpage du développement (Roadmap)

Phase 1 : Setup & Auth (Jour 1-2)

Initialisation Git & Docker.

Setup BDD + Express.

Login/Register fonctionnel.

Phase 2 : Core Auteur (Jour 2-3)

CRUD Histoires.

Création de pages et liaison (système parent-enfant simple).

Visualisation liste simple.

Phase 3 : Core Lecteur (Jour 3-4)

Liste publique des histoires.

Moteur de jeu (Affichage page -> Click choix -> Affichage page suivante).

Détection de fin.

Phase 4 : Polish & Advanced (Jour 5-Weekend)

Design CSS soigné.

Calcul des statistiques.

Déploiement (Render/Vercel).

Tests unitaires si temps disponible.

7. Sécurité et Qualité

Validation des données : Utilisation de Joi ou Zod pour valider les entrées API.

Gestion des erreurs : Middleware global d'erreur dans Express.

Protection : Les routes d'édition (/stories, /pages) sont protégées par middleware verifyToken et vérification que user.id === story.author_id.