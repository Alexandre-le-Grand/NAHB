  # ✅ **10/20 — Fonctionnalités de base (obligatoires)**

  ### 👤 Authentification

  * Inscription (pseudo/email + mdp)
  * Connexion / Déconnexion
  * Session persistante (reste connecté)

  ### ✍️ Côté auteur — Histoires

  * Créer une histoire (titre + description + tags libres)
  * Modifier / supprimer ses histoires
  * Statut : brouillon (par défaut) / publié
  * Définir une page de départ

  ### 📄 Pages / Scènes

  * Créer des scènes avec :

    * texte
    * option : « page finale »
  * Pour chaque scène :

    * ajouter des choix avec texte
    * chaque choix renvoie vers une autre page
  * Modifier / supprimer pages et choix

  ### 📖 Côté lecteur — Lecture

  * Liste des histoires publiées
  * Recherche par titre
  * Lecture :

    * commence sur la page de départ
    * affiche texte + choix
    * clic → page suivante
    * fin claire si fin atteinte

  ### 📊 Enregistrement minimal des parties

  * À la fin : enregistrer

    * histoire jouée
    * page de fin atteinte
    * utilisateur

  ### 🔧 Admin

  * Bannir un auteur
  * Suspendre une histoire
  * Stats globales (nb total de parties jouées)

  ---

  # ✅ **13/20 — Fonctionnalités avancées (lecteur)**

  ### 🎚️ Filtrage

  * Filtrer les histoires par thème

  ### 📊 Statistiques (simples + parcours)

  * Nombre de fois qu’une fin est atteinte
  * Nombre de parties totales
  * « Vous avez pris le même chemin que X % des joueurs »
  * Stats % par fin

  ### 🏆 Fins nommées + collection

  * Chaque fin a un label ("Fin héroïque", …)
  * Le lecteur voit les fins déjà débloquées pour une histoire

  ### ⭐ Notes & commentaires

  * Noter 1–5 ★
  * Ajouter un commentaire
  * Moyenne + nb de votes visibles

  ### 💾 Reprise automatique

  * Sauvegarde du parcours en cours
  * Le lecteur peut reprendre où il s’est arrêté

  ### 🚨 Signalement

  * Un lecteur peut signaler une histoire

  ---

  # ✅ **16/20 — Fonctionnalités avancées (auteur + UX)**

  ### 👤 Espace auteur

  * Profil Auteur / Mes histoires
  * Stats de base par histoire :

    * lectures
    * fins atteintes
    * note moyenne

  ### 📈 Stats avancées

  * Distribution par fin
  * Lectures totales
  * Parties abandonnées

  ### 🚧 Brouillon / publié (visible uniquement si publié)

  ### 🧪 Mode preview (sans impacter les stats)

  ### 🖼️ Illustrations

  * Ajouter des images dans les scènes

  ### 🎨 UX/UI

  * Interface améliorée (layout + responsive)
  * Messages d’erreur / succès visibles
  * Confirmation avant suppression (histoire/page/choix)

  ---

  # ✅ **18/20 — Palier haut (qualité, features avancées)**

  ### 🌳 Arbre des histoires (côté auteur)

  * Visualisation graphique des pages + choix

  ### 🌳 Arbre du parcours (côté lecteur)

  * Visualisation du chemin parcouru pendant une partie

  ### 🖼️ Illustrations interactives

  * Certaines zones d’une image mènent à une autre scène (hotspots)

  ### 🎲 Système de hasard

  * Jet de dés influençant les choix accessibles

  ### 🧪 Qualité logicielle

  * Tests unitaires (logique métier)
  * Tests d’intégration (endpoints API)

  ### 🐳 Docker

  * Dockerfile backend (+ frontend si possible)
  * docker-compose pour app + BDD

  ### ☁️ Déploiement

  * Déploiement back (API)
  * Déploiement front (si possible)
  * Fournir URL


