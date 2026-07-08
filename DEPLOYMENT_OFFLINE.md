# 🎓 EduTrack : Mode Serveur Local (Intranet)

Ce guide explique comment déployer EduTrack sur un réseau local d'établissement (sans connexion Internet). Ce mode est particulièrement adapté pour les écoles situées dans des zones à faible connectivité.

---

## 🚀 Le Kit d'Installation

EduTrack intègre désormais un **Kit d'Installation Automatique** dans le dossier `install/`. 
Ce kit s'occupe de tout configurer pour transformer un ordinateur (Windows, macOS, ou Linux) en un serveur local pour toute l'école.

### Fichiers du kit :
- `install/INSTALLER_EDUTRACK.bat` : Pour les ordinateurs **Windows** (recommandé).
- `install/installer_edutrack.sh` : Pour les ordinateurs **macOS / Linux**.

---

## 🛠️ Étapes d'installation (Windows)

1. **Prérequis** : Vous avez besoin d'une connexion Internet *uniquement* lors de la première installation pour télécharger les bibliothèques logicielles. Ensuite, la connexion Internet n'est plus nécessaire.
2. Copiez l'intégralité du dossier `Edutrack` sur l'ordinateur qui servira de serveur (par exemple, dans `C:\Edutrack`).
3. Allez dans le dossier `install` et double-cliquez sur `INSTALLER_EDUTRACK.bat`.
4. Laissez le programme travailler (environ 2 à 5 minutes). Il va automatiquement :
   - Vérifier et installer **Node.js** si nécessaire.
   - Installer les composants réseau.
   - Créer une **base de données locale autonome** (SQLite).
   - Créer un **raccourci sur votre bureau**.

---

## 📶 Comment l'utiliser au quotidien ?

### 1. Démarrer le serveur (Chaque matin)
Sur l'ordinateur central (celui où l'installation a été faite), double-cliquez sur l'icône :
**🎓 Démarrer EduTrack** qui se trouve sur le bureau.
*Une fenêtre noire va s'ouvrir. Ne la fermez JAMAIS tant que l'école travaille. Si vous la fermez, le logiciel s'arrêtera pour tout le monde.*

### 2. Se connecter sur l'ordinateur serveur
Si vous travaillez directement sur l'ordinateur serveur, ouvrez votre navigateur (Chrome, Firefox, Edge) et tapez l'adresse :
👉 `http://localhost:5000`

### 3. Se connecter depuis les autres appareils de l'école (Censeur, Professeurs)
Tout le personnel peut se connecter avec son téléphone, sa tablette ou un autre ordinateur, à condition qu'ils soient **connectés au même réseau Wi-Fi** que l'ordinateur serveur.

Regardez l'adresse affichée dans la fenêtre noire du serveur (elle ressemble à ceci : `http://192.168.1.XX:5000`). Tapez exactement cette adresse dans le navigateur du téléphone ou de l'ordinateur de vos collègues.

---

## ⚠️ Limitations du mode Hors Ligne

Puisque vous fonctionnez sans Internet, certaines fonctionnalités "Cloud" ne seront pas disponibles :
1. **Les notifications SMS et WhatsApp** : Les parents ne recevront pas les messages sur leurs téléphones.
2. **Le Portail Parent depuis la maison** : Les parents ne pourront pas consulter le profil de leur enfant depuis chez eux. Le logiciel n'est accessible qu'à l'intérieur de l'école (sur le réseau Wi-Fi).
3. **Paiement Mobile Money** : Les parents devront payer la scolarité en espèces à l'intendant (saisie manuelle).

## ☁️ Synchronisation (Futur)
La base de données locale (fichier `backend/prisma/edutrack-local.db`) contient toutes vos données. À l'avenir, une fonction de synchronisation permettra d'envoyer ces données vers le Cloud lorsque l'école disposera d'une connexion Internet temporaire, afin de mettre à jour le Portail Parent.
