Projet NAHB (Not another hero’s book)

Projet en groupe de 2 personnes.
Présentation vendredi. 15-20 de présentation (to be updated), puis 5mins de QA, 5 mins de debrief
Rendu sur césar dimanche 30/11 23h55

## 1. Contexte & Concept

Vous allez réaliser une application web fullstack de type « livre dont vous êtes le héros », qui permettra de créer des histoires, et de les jouer.

Vue d’ensemble :
* Des auteurs créent des histoires interactives sous forme de scènes et de choix.
* Des lecteurs parcourent ces histoires, font des choix à chaque étape, et atteignent différentes fins possibles.
* L’application propose aussi des statistiques (popularité des fins, chemins choisis, etc.).

Un même utilisateur peut être à la fois auteur et lecteur.

!!!Le contenu des histoires de démo peut être générée par IA pour gagner du temps. !!!

---

## 2. Déroulé

Ce projet vise à valider des compétences de développement fullstack :

* Concevoir un modèle de données cohérent (histoires / pages / choix / utilisateurs), mis à jour au fur et à mesure des niveaux de fonctionnalités.
* Implémenter un back-end avec une API REST.
* Développer une interface front-end dynamique consommant cette API.
* Gérer l’authentification et les autorisations.
* Mettre en place un qualité logicielle minimale (organisation du code, validations, gestion d’erreurs).
* Pour les niveaux avancés : tests, Docker, déploiement et réflexion sur l’architecture…

---

## 3. Rôles

* Auteur

  * Crée et édite des histoires.
  * Organise ses histoires en pages/scènes avec des choix.
  * Publie ou laisse en brouillon.

* Lecteur

  * Parcourt la liste des histoires publiées.
  * Joue une histoire, fait des choix, atteint une fin.
  * Voit un récapitulatif de sa partie, et éventuellement des statistiques.

Admin
Accède aux statistiques globales du site
Bannir des histoires et des auteurs

---------------------------------------------------------
Fonctionnalités

10/20
## Fonctionnalités de base

### Authentification

* Inscription (pseudo et/ou email + mot de passe).
* Connexion / déconnexion.
* Gestion de session (l’utilisateur reste connecté tant qu’il ne se déconnecte pas).

### Gestion des histoires (côté auteur)

Un utilisateur connecté peut :

* Créer une histoire avec :

  * titre,
  * courte description,
  * éventuellement tags (texte libre accepté).
* Modifier / supprimer ses propres histoires.
* Gérer le statut de l’histoire (brouillon(par défaut), publié).
* Définir une page de départ pour l’histoire.

### Pages / scènes et choix

Pour chaque histoire :

* Possibilité de créer des pages (scènes) :

  * champ texte (contenu de la scène),
  * indicateur si la page est une fin ou non.

* Pour chaque page :

  * possibilité d’ajouter des choix avec un texte (ex. “Ouvrir la porte”),
  * chaque choix pointe vers une autre page de la même histoire (ou vers une fin).

* L’auteur peut modifier / supprimer ses pages et choix.

### Lecture d’une histoire (côté lecteur)

* Page listant les histoires publiées (ou au minimum toutes les histoires), avec un champ de recherche sur le nom.
* Lecture :

  * démarrage sur la page de départ,
  * affichage du texte de la page + des choix,
  * clic sur un choix → page suivante correspondante,
  * arrivée sur une page finale clairement indiquée (message de fin).

### Enregistrement minimal des parties

* À la fin d’une lecture d’histoire, l’application enregistre au minimum :

  * l’histoire jouée,
  * la page de fin atteinte,
  * l’utilisateur.

### Gestion de l’app (côté admin)
Possibilité de bannir un auteur
Possibilité de suspendre une histoire
Possibilité de voir les statistiques de toutes les histoires (nb de parties jouée)
---------------------------------------------------------
13/20
## 5. Fonctionnalités avancées

### 5.1 Côté lecteur

* Possibilité de filtrer les histoires
  Ajout d'un thème aux histoires

* Statistiques de fin simples :

  * nombre de fois qu’une fin a été atteinte,
  * nombre total de parties jouées.

* Statistiques de parcours :

  * en fin de partie : « Vous avez pris le même chemin que X % des joueurs »,
  * stats par fin (répartition en %).

* Fins nommées & collection de fins :

  * chaque page finale a un label ("Fin héroïque", "Fin tragique", etc.),
  * le lecteur voit les fins qu’il a déjà débloquées pour une histoire.

* Notation & commentaires :

  * un utilisateur peut noter une histoire (1–5 ★) et laisser un commentaire,
  * moyenne des notes + nombre de votes affichés sur la fiche de l’histoire.

* enregistrement automatique en cours de partie
  doit être enregistré le parcours du joueur, et l'étape où il se trouve pour qu’il puisse reprendre

*un lecteur peut signaler une histoire
---------------------------------------------------------
16/20
### Côté auteur

* Profil auteur / Mes histoires :

  * liste de ses histoires,
  * stats de base (lectures, fins atteintes, note moyenne…).

* Stats avancées :

  * distribution par fin,
  * nombre de lectures, nombre de parties abandonnées, etc.

* Mode brouillon / publié :

  * seules les histoires « publiées » sont visibles dans la liste publique.

* Mode preview :

  * l’auteur peut tester son histoire comme lecteur, sans polluer les vraies stats.


*Ajout d'illustrations dans les étapes.


### UX / UI

* Interface plus soignée (layout, hiérarchie visuelle, responsive simple).
* Messages d’erreur / succès clairs et visibles.
* Confirmations pour les actions destructrices (supprimer page, histoire, choix).

---------------------------------------------------------
18/20
### Qualité logicielle, Docker, déploiement (palier haut)

Fonctionnalités Auteur :
* Arbres des histoires

  * l'auteur peut visualiser ses histoires sous forme d'arbre.

Fonctionnalités Lecture :
* Arbres des histoires parcouru

  * le lecteur peut voir les histoires qu'il a parcouru, avec les étapes atteintes.

*Rendre les illustrations interactives(certaines sections d'une illustration peuvent mener vers l'étape suivante)

*Ajout d'un système de hasard dans le jeu, avec des jets de dés qui vont influer sur les étapes accessibles.



* Tests unitaires (TU) et/ou tests d’intégration (TI) :

  * sur la logique métier (navigation entre pages, validation, auth, etc.),
  * sur les endpoints d’API (tests d’API).

* Dockerisation :

  * Dockerfile pour le back (et éventuellement pour le front),
  * docker-compose pour lancer l’application et la base de données.

* Déploiement :

  * application déployée sur un serveur ou une plateforme (Render, Railway, Vercel, Netlify, OVH, etc.),
  * accès via une URL, au moins pour le back (API) et idéalement pour le front.

---------------------------------------------------------------

## Technologies conseillées

Stack :

* React/Node.js + Express/Base MongoDB/MySQL

Justifier clairement le découpage (dans le README et la présentation).
--

## Livrables attendus

1. Code source (front + back) dans un dépôt Git.
2. README (obligatoire) contenant :

   * description du projet,
   * instructions d’installation et de lancement (dev + Docker s’il existe),
   * instructions pour lancer les tests s’ils existent,
   * URL de démo si déployé.
   * schéma de BDD ou d’architecture,
   * captures d’écran.
   * maquettes rapide
