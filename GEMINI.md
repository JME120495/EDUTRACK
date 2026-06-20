# Contexte du Projet EduTrack (Dossier de Passation IA)

Ce fichier `GEMINI.md` sert de point de départ et de résumé global pour permettre à toute future IA (ou tout développeur) de comprendre rapidement l'état actuel de l'application EduTrack.

## 1. Ce que l'application fait

**EduTrack** est un système complet de gestion scolaire bilingue (Français/Anglais), conçu initialement pour le contexte de l'éducation au Cameroun. 
L'application permet de gérer l'administration scolaire, les élèves, le personnel (enseignants, directeurs, censeurs, intendants), les parents, ainsi que des flux tels que la scolarité (paiements), la discipline, les notes, l'emploi du temps, et une bibliothèque.

## 2. Fonctionnalités implémentées

L'application est divisée en plusieurs portails d'accès basés sur les rôles (RBAC) :

*   **Espace Directeur (`DIRECTOR`) :**
    *   Gestion globale de l'école (classes, élèves, enseignants, matières).
    *   Gestion des emplois du temps (`creneaux` horaires).
    *   Génération de documents officiels (cartes scolaires, attestations).
    *   Accès à la bibliothèque, RH, et paiements.
*   **Espace Censeur (`CENSEUR`) :**
    *   Supervision académique et disciplinaire.
    *   Gestion des absences et sanctions (saisie, justification, suppression).
    *   Gestion de la bibliothèque (ajout de livres, gestion des emprunts et retours).
    *   Génération des documents pour les élèves et parents (cartes).
    *   Création de matières et modification de l'emploi du temps.
*   **Espace Intendant (`INTENDANT`) :**
    *   Gestion des paiements de scolarité (tranches, reçus imprimables, alertes d'impayés).
    *   Ressources Humaines (contrats, fiches de paie, avances sur salaire).
*   **Espace Enseignant (`TEACHER`) :**
    *   Tableau de bord listant les cours du jour (via emploi du temps).
    *   Appel électronique (absences) et saisie des notes (brouillons et validation).
    *   Consultation de ses propres fiches de paie.
*   **Espace Parent (`PARENT`) :**
    *   Portail de suivi pour les enfants liés.
    *   Consultation de la discipline, des notes, de l'emploi du temps et des paiements de l'enfant.

## 3. Structure des fichiers

Le projet est un monorepo classique séparant le client et le serveur :

*   **`/backend/`** : L'API Node.js/Express.
    *   `src/routes/` : Contient les différents contrôleurs API (ex: `users.js`, `discipline.js`, `library.js`, `documents.js`, `absences.js`, etc.).
    *   `src/middlewares/` : Logique de sécurité, notamment `authMiddleware.js` avec `requireRole` (RBAC).
    *   `prisma/schema.prisma` : Le schéma complet de la base de données relationnelle.
    *   `src/services/` : Services externes ou générateurs (ex: génération de PDF).
*   **`/frontend/`** : L'application React propulsée par Vite.
    *   `src/App.jsx` : Le routeur principal. Les routes sont protégées par le composant `<RoleRoute>`.
    *   `src/components/Shared/` : Composants réutilisables, modales (`SendMessageModal.jsx`, `SanctionsModal.jsx`), et le menu latéral (`Sidebar.jsx`).
    *   `src/pages/` : Vues de l'application, subdivisées par rôles (`Director/`, `Censeur/`, `Teacher/`, `Intendant/`, `Parent/`).
    *   `src/locales/` : Fichiers i18n pour la traduction bilingue (`fr/translation.json`, `en/translation.json`).

## 4. Les technologies utilisées

*   **Backend** : Node.js, Express.js.
*   **Base de données** : SQLite (actuellement), interfacé via l'ORM **Prisma**.
*   **Frontend** : React.js (via Vite).
*   **Styling** : Tailwind CSS, avec des composants graphiques de `lucide-react`.
*   **Authentification** : JSON Web Tokens (JWT) et hachage de mot de passe via `bcryptjs`.
*   **Graphiques / UI** : `recharts` pour les diagrammes.
*   **Internationalisation** : `i18next` / `react-i18next`.

## 5. Les décisions de design (Aesthetics & Architecture)

*   **Design Visuel Premium :** Le design privilégie des tons modernes (Dark Mode/Light Mode soigné avec des palettes vibrantes comme le `indigo`, `rose`, `slate`), des bords arrondis (glassmorphism/flat design), et des micro-animations pour rendre l'interface vivante.
*   **Permissions RBAC :** Le backend possède une sécurité stricte sur les endpoints via le middleware `requireRole(['ROLE1', 'ROLE2'])`. L'interface frontend se synchronise avec ces droits pour masquer/afficher des boutons ou des pages entières via `RoleRoute`.
*   **Centralisation des modales :** Les fonctionnalités transverses (ex: Envoyer un message) sont encapsulées dans des modales réutilisables au lieu de multiplier les pages de formulaires uniques.
*   **Impression & Export :** Priorité est donnée à l'export local (génération de reçus HTML/CSS natifs pour impression directe ou génération de PDF côté backend).

## 6. Instructions pour un futur modèle IA

> Bonjour, futur agent IA ! Lorsque tu reprends ce projet, garde en tête les directives suivantes :

1.  **Vérifie toujours les routes Backend RBAC :** Si tu ajoutes une fonctionnalité au frontend pour un rôle spécifique (ex: Censeur), assure-toi **absolument** d'ajouter ce rôle dans la liste `requireRole([..., 'CENSEUR'])` du fichier de route correspondant dans `backend/src/routes/`. Une omission ici cause un échec silencieux (403 Forbidden).
2.  **Respect du Schéma Prisma :** Consulte toujours `backend/prisma/schema.prisma` avant de proposer une modification d'entité. Après modification, rappelle d'exécuter `npx prisma db push`.
3.  **Localisation :** Pense à mettre à jour les deux fichiers `fr/translation.json` et `en/translation.json` si tu ajoutes de nouveaux mots dans l'interface (même s'ils peuvent être codés en dur temporairement, la bonne pratique est d'utiliser `useTranslation()`).
4.  **Priorité à l'expérience visuelle :** Ne te contente jamais de créer un tableau simple (MVP). Ajoute toujours des classes Tailwind attrayantes (hover, transitions, couleurs harmonieuses, icônes Lucide).
5.  **Ne crée pas de nouveaux fichiers unitiles :** Si tu dois ajouter une action, vérifie s'il n'y a pas déjà un composant modale existant (ex: `SanctionsModal`) ou un fichier page existant qui pourrait l'accueillir logiquement.
