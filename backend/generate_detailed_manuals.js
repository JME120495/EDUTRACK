const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

function createPdf(filename, title, contentBlocks) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const outputPath = path.join(__dirname, '..', filename);
  doc.pipe(fs.createWriteStream(outputPath));

  // Couleurs et polices
  const mainColor = '#1E3A5F';
  const secondaryColor = '#F5A623';
  const textColor = '#333333';

  // Couverture
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#F8FAFC');
  doc.fill(mainColor).fontSize(28).font('Helvetica-Bold').text('EDUTRACK', { align: 'center', margin: 100 });
  doc.moveDown(1);
  doc.fill(secondaryColor).fontSize(20).text(title, { align: 'center' });
  doc.moveDown(3);
  
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');

  doc.fill(mainColor).fontSize(22).font('Helvetica-Bold').text('Sommaire des Fonctionnalités', { align: 'center' });
  doc.moveDown(2);

  contentBlocks.forEach(block => {
    // Check for page break
    if (doc.y > 720) {
      doc.addPage();
    }

    if (block.type === 'h1') {
      doc.moveDown(1);
      doc.fill(mainColor).font('Helvetica-Bold').fontSize(16).text(block.text);
      doc.moveDown(0.5);
    } else if (block.type === 'h2') {
      doc.moveDown(0.8);
      doc.fill(secondaryColor).font('Helvetica-Bold').fontSize(13).text(block.text);
      doc.moveDown(0.4);
    } else if (block.type === 'p') {
      doc.fill(textColor).font('Helvetica').fontSize(11).text(block.text, { align: 'justify', lineGap: 3 });
      doc.moveDown(0.5);
    } else if (block.type === 'step') {
      doc.fill(textColor).font('Helvetica').fontSize(11).text('   ' + block.text, { align: 'justify', lineGap: 3 });
      doc.moveDown(0.2);
    } else if (block.type === 'note') {
      doc.fill('#64748B').font('Helvetica-Oblique').fontSize(10).text('Remarque : ' + block.text, { align: 'justify', lineGap: 2 });
      doc.moveDown(0.5);
    }
  });

  doc.end();
  console.log('Generated:', outputPath);
}

const contentFR = [
  { type: 'h1', text: '1. Connexion et Tableau de Bord' },
  { type: 'p', text: 'Le Tableau de Bord est la page d\'accueil de votre espace Administrateur (Directeur). Il centralise les données importantes de l\'école.' },
  { type: 'h2', text: 'Comment y accéder et l\'utiliser :' },
  { type: 'step', text: '1. Allez sur la page de connexion EduTrack.' },
  { type: 'step', text: '2. Entrez votre email (ex: jme.trading.academy@gmail.com) et le mot de passe (123456).' },
  { type: 'step', text: '3. Cliquez sur "Se Connecter". Vous êtes redirigé vers le Tableau de Bord.' },
  { type: 'step', text: '4. En haut de la page, lisez les blocs de statistiques : "Élèves Actifs", "Enseignants", "Taux de Recouvrement" et "Total Recouvré". Ces données sont calculées automatiquement par le système.' },
  { type: 'step', text: '5. Dans la section "Alertes et Retards de Paiements", vous voyez les élèves n\'ayant pas réglé leur scolarité.' },
  { type: 'step', text: '6. Pour relancer les parents de ces élèves, cliquez simplement sur le bouton "Envoyer Rappel SMS". Le système enverra automatiquement un SMS à chaque parent concerné.' },

  { type: 'h1', text: '2. Personnel Administratif' },
  { type: 'p', text: 'Cet onglet permet de créer et gérer les comptes des Censeurs et Intendants.' },
  { type: 'h2', text: 'Comment ajouter un membre du personnel :' },
  { type: 'step', text: '1. Dans le menu latéral gauche, cliquez sur "Personnel Administratif".' },
  { type: 'step', text: '2. Cliquez sur le bouton "Ajouter du personnel" en haut à droite.' },
  { type: 'step', text: '3. Dans la fenêtre qui s\'ouvre, choisissez le RÔLE dans le menu déroulant : "CENSEUR" ou "INTENDANT".' },
  { type: 'step', text: '4. Remplissez le NOM COMPLET et le TÉLÉPHONE.' },
  { type: 'step', text: '5. Entrez un MOT DE PASSE (il servira à la première connexion de l\'utilisateur).' },
  { type: 'step', text: '6. Cliquez sur "Enregistrer".' },
  { type: 'h2', text: 'Comment assigner des classes à un Censeur :' },
  { type: 'step', text: '1. Sur la ligne du Censeur, cliquez sur l\'icône de livre ("Assigner des classes") dans la colonne "Actions".' },
  { type: 'step', text: '2. Cochez les cases correspondant aux classes qu\'il doit gérer.' },
  { type: 'step', text: '3. Cliquez sur "Enregistrer".' },

  { type: 'h1', text: '3. Personnel d\'Appui' },
  { type: 'p', text: 'Permet de recenser les gardiens, chauffeurs, femmes de ménage, etc.' },
  { type: 'h2', text: 'Comment ajouter ou modifier :' },
  { type: 'step', text: '1. Cliquez sur "Personnel d\'Appui" dans le menu.' },
  { type: 'step', text: '2. Cliquez sur le bouton "Ajouter du Personnel".' },
  { type: 'step', text: '3. Remplissez le NOM COMPLET, le POSTE (ex: Gardien), et le TÉLÉPHONE.' },
  { type: 'step', text: '4. Cliquez sur "Enregistrer". Le personnel apparaît maintenant dans le tableau.' },
  { type: 'step', text: '5. Pour modifier les informations d\'un personnel existant, cliquez sur l\'icône de crayon (bleu) sur sa ligne.' },

  { type: 'h1', text: '4. Gestion des Élèves' },
  { type: 'p', text: 'C\'est ici que vous inscrivez les élèves et que vous les liez à leurs parents.' },
  { type: 'h2', text: 'Comment ajouter un élève manuellement :' },
  { type: 'step', text: '1. Allez dans "Gestion Élèves".' },
  { type: 'step', text: '2. Cliquez sur "Ajouter un Élève".' },
  { type: 'step', text: '3. Saisissez le Nom complet, le Matricule, le Genre et choisissez sa Classe.' },
  { type: 'step', text: '4. Cliquez sur "Enregistrer".' },
  { type: 'h2', text: 'Comment lier un parent à un élève :' },
  { type: 'step', text: '1. Toujours dans "Gestion Élèves", cliquez sur l\'onglet "Comptes Parents & Liaisons".' },
  { type: 'step', text: '2. Cliquez sur "Créer Compte Parent" et entrez son nom et son numéro de téléphone.' },
  { type: 'step', text: '3. Revenez à l\'onglet "Élèves". Sur la ligne de l\'élève, cliquez sur le bouton "Lier un Parent".' },
  { type: 'step', text: '4. Sélectionnez le parent que vous venez de créer et validez. Le parent pourra désormais voir les notes de cet élève depuis son propre compte.' },

  { type: 'h1', text: '5. Gestion des Classes' },
  { type: 'p', text: 'Pour créer l\'architecture de l\'école (ex: 6ème M1, Terminale D).' },
  { type: 'h2', text: 'Comment créer une classe :' },
  { type: 'step', text: '1. Allez dans "Gestion Classes".' },
  { type: 'step', text: '2. Cliquez sur "Créer une classe".' },
  { type: 'step', text: '3. Saisissez le nom de la classe, le niveau et sa capacité d\'accueil maximale.' },
  { type: 'step', text: '4. Cliquez sur "Enregistrer".' },

  { type: 'h1', text: '6. Gestion des Enseignants' },
  { type: 'p', text: 'Gérez les profils professeurs et assignez-les aux différentes matières.' },
  { type: 'h2', text: 'Comment ajouter et affecter un enseignant :' },
  { type: 'step', text: '1. Cliquez sur "Gestion Enseignants" dans le menu.' },
  { type: 'step', text: '2. Cliquez sur "Créer Compte Enseignant" et remplissez son nom et téléphone. Enregistrez.' },
  { type: 'step', text: '3. Allez ensuite sur l\'onglet "Affectations des Matières" (en haut de la page).' },
  { type: 'step', text: '4. Cliquez sur "Affecter Enseignant".' },
  { type: 'step', text: '5. Sélectionnez l\'enseignant, la classe où il enseigne, et la matière. Renseignez également son quota d\'heures.' },
  { type: 'step', text: '6. Validez pour terminer l\'affectation.' },

  { type: 'h1', text: '7. Emploi du Temps' },
  { type: 'p', text: 'Planifiez les cours de la semaine pour chaque classe.' },
  { type: 'h2', text: 'Comment construire l\'emploi du temps :' },
  { type: 'step', text: '1. Allez dans "Emploi du Temps".' },
  { type: 'step', text: '2. Sélectionnez la classe voulue dans la liste déroulante.' },
  { type: 'step', text: '3. Cliquez sur "Ajouter un cours" ou directement sur une case vide du planning.' },
  { type: 'step', text: '4. Choisissez le Jour, l\'Heure de début et de fin, la Matière, l\'Enseignant et la Salle.' },
  { type: 'step', text: '5. Cliquez sur "Enregistrer". (Note: Si l\'enseignant est déjà occupé ailleurs à cette heure, le système affichera un message de "Détection de Conflit").' },
  { type: 'step', text: '6. Cliquez sur "Exporter en PDF" pour télécharger la grille finalisée.' },

  { type: 'h1', text: '8. Bibliothèque' },
  { type: 'p', text: 'Module pour la gestion du stock de livres et les emprunts.' },
  { type: 'h2', text: 'Comment gérer les livres :' },
  { type: 'step', text: '1. Allez dans "Bibliothèque".' },
  { type: 'step', text: '2. Cliquez sur "Ajouter un Livre" pour entrer un nouvel ouvrage dans le système (Titre, Auteur, ISBN, Quantité).' },
  { type: 'step', text: '3. Pour prêter un livre : sur la ligne du livre, cliquez sur le bouton "Prêter".' },
  { type: 'step', text: '4. Sélectionnez l\'élève qui emprunte le livre et validez. Le système calcule la date de retour prévue.' },

  { type: 'h1', text: '9. Saisie des Notes' },
  { type: 'p', text: 'Entrez les évaluations et la note de comportement des élèves.' },
  { type: 'h2', text: 'Comment saisir les notes :' },
  { type: 'step', text: '1. Cliquez sur "Saisie des Notes".' },
  { type: 'step', text: '2. Utilisez les filtres en haut : sélectionnez la "CLASSE", puis la "MATIÈRE", puis la "SÉQUENCE ACADÉMIQUE".' },
  { type: 'step', text: '3. La liste des élèves s\'affiche. Dans la colonne "Note / 20", tapez la note de l\'élève.' },
  { type: 'step', text: '4. Dans la colonne "Appréciations", cliquez sur "-- Choisir remarque --" pour indiquer le comportement.' },
  { type: 'step', text: '5. Si vous n\'avez pas terminé, cliquez sur "Enregistrer Brouillon".' },
  { type: 'step', text: '6. Si toutes les notes sont correctes, cliquez sur "Valider définitivement". Attention, cela verrouille les notes.' },

  { type: 'h1', text: '10. Absences / Appel' },
  { type: 'p', text: 'Registre numérique de présence.' },
  { type: 'h2', text: 'Comment faire l\'appel :' },
  { type: 'step', text: '1. Allez dans "Absences / Appel".' },
  { type: 'step', text: '2. Sélectionnez la classe. La liste des élèves apparaît avec des cases à cocher.' },
  { type: 'step', text: '3. Par défaut, tout le monde est présent. Décochez la case des élèves qui sont absents.' },
  { type: 'step', text: '4. Cliquez sur le bouton "Sauvegarder l\'Appel". Les parents des absents recevront automatiquement une notification.' },

  { type: 'h1', text: '11. Bulletins' },
  { type: 'p', text: 'Génération automatique des bulletins en fin de période.' },
  { type: 'h2', text: 'Comment générer et distribuer les bulletins :' },
  { type: 'step', text: '1. Allez dans "Bulletins".' },
  { type: 'step', text: '2. Cliquez sur l\'un des boutons : "Générer Bulletins de Séquence", "Trimestriels" ou "Annuels".' },
  { type: 'step', text: '3. Une fois générés, la liste des élèves apparaît avec leur moyenne et leur rang.' },
  { type: 'step', text: '4. Cliquez sur "Modifier Décisions/Conduite" pour ajouter l\'avis du Conseil de Classe ou une sanction.' },
  { type: 'step', text: '5. Cliquez sur "Signer en tant que Directeur" pour apposer votre signature sur le document.' },
  { type: 'step', text: '6. Pour imprimer, cliquez sur "Bulletins PDF".' },
  { type: 'step', text: '7. Pour envoyer directement le bulletin aux parents sur leur téléphone, cliquez sur "Envoyer à tous les Parents par WhatsApp".' },

  { type: 'h1', text: '12. Paiements & Scolarité' },
  { type: 'p', text: 'Le cœur financier de l\'école pour le suivi des frais de scolarité.' },
  { type: 'h2', text: 'Comment configurer et encaisser :' },
  { type: 'step', text: '1. Allez dans "Paiements & Scolarité".' },
  { type: 'step', text: '2. Cliquez sur "Modifier les Frais" pour configurer le montant total exigé pour chaque classe.' },
  { type: 'step', text: '3. Pour enregistrer l\'argent remis par un élève, cliquez sur "+ Saisir Versement".' },
  { type: 'step', text: '4. Sélectionnez l\'élève, saisissez le montant dans "Payé (FCFA)" et validez.' },
  { type: 'step', text: '5. Un reçu de paiement est généré et le "Reste à payer" de l\'élève diminue automatiquement.' },
  { type: 'step', text: '6. En cas de nombreux impayés, cliquez sur le bouton "Envoyer Relances Classe" pour notifier tous les débiteurs d\'un coup par SMS.' },

  { type: 'h1', text: '13. Comptabilité (OHADA)' },
  { type: 'p', text: 'Si vous avez le plan Premium, cet onglet génère automatiquement votre Balance et votre Journal de Caisse selon le plan comptable OHADA à partir des paiements saisis.' },

  { type: 'h1', text: '14. Ressources Humaines' },
  { type: 'p', text: 'Gestion des contrats de travail, des congés et des avances.' },
  { type: 'h2', text: 'Comment gérer les avances et contrats :' },
  { type: 'step', text: '1. Allez dans "Ressources Humaines".' },
  { type: 'step', text: '2. Sous l\'onglet "Personnel & Contrats", cliquez sur "Créer un Contrat" pour définir le salaire de base d\'un employé.' },
  { type: 'step', text: '3. Pour accorder une avance, allez dans l\'onglet "Avances Salaire" et cliquez sur "Demander une Avance" en spécifiant le montant et le mois de remboursement.' },
  { type: 'step', text: '4. Pour générer les salaires à la fin du mois, allez dans "Bulletins de Paie" et cliquez sur "Générer la paie du mois". Le système va déduire automatiquement l\'avance accordée à l\'étape 3 du "Net à payer".' },

  { type: 'h1', text: '15. Paie des Enseignants' },
  { type: 'p', text: 'Calculez la paie des professeurs selon leur taux horaire et le volume effectué.' },
  { type: 'h2', text: 'Comment valider les heures :' },
  { type: 'step', text: '1. Allez dans l\'onglet "Paie des Enseignants".' },
  { type: 'step', text: '2. Cliquez sur le bouton "Configurer la Paie".' },
  { type: 'step', text: '3. Pour chaque enseignant listé, entrez le "Taux Horaire (FCFA/h)" et le nombre de "Heures effectuées" dans le mois.' },
  { type: 'step', text: '4. Le montant "Salaire dû" se met à jour immédiatement. Cliquez sur "Enregistrer les modifications".' },

  { type: 'h1', text: '16. Documents & Badges' },
  { type: 'p', text: 'Outil de génération de documents administratifs en masse.' },
  { type: 'h2', text: 'Comment imprimer des cartes scolaires ou attestations :' },
  { type: 'step', text: '1. Allez dans "Documents & Badges".' },
  { type: 'step', text: '2. Onglet "Modèles d\'Attestations" : Cliquez sur "Créer un Modèle". Vous pouvez rédiger un texte avec des balises comme {NOM_ELEVE} qui seront remplacées automatiquement.' },
  { type: 'step', text: '3. Onglet "Générer Attestation" : Choisissez le modèle créé, choisissez l\'élève cible, et cliquez sur "Générer le PDF".' },
  { type: 'step', text: '4. Onglet "Cartes & Badges" : Choisissez une classe et cliquez sur "Télécharger Grille Badges Élèves (A4)" pour obtenir les cartes scolaires de toute la classe prêtes à imprimer.' },

  { type: 'h1', text: '17. Paramètres École' },
  { type: 'p', text: 'Configuration basique de l\'établissement.' },
  { type: 'h2', text: 'Comment configurer :' },
  { type: 'step', text: '1. Allez dans "Paramètres École".' },
  { type: 'step', text: '2. Changez le "Nom de l\'école" ou la "Langue par défaut".' },
  { type: 'step', text: '3. Cliquez sur le bouton "Enregistrer les modifications".' },

  { type: 'h1', text: '18. Messagerie' },
  { type: 'p', text: 'Communiquez facilement avec les parents, enseignants et autres employés.' },
  { type: 'h2', text: 'Comment envoyer un message interne :' },
  { type: 'step', text: '1. Allez dans "Messagerie".' },
  { type: 'step', text: '2. La "Boîte de réception" vous affiche les messages reçus.' },
  { type: 'step', text: '3. Pour écrire, cliquez sur "Nouveau Message" (ou "Envoyer un message à").' },
  { type: 'step', text: '4. Sélectionnez les destinataires dans la liste (ou utilisez "Sélectionner Tous").' },
  { type: 'step', text: '5. Rédigez le contenu dans "Écrivez votre message ici..." et cliquez sur "Envoyer". Le message apparaîtra sur le tableau de bord de la personne connectée.' }
];

createPdf('Manuel_Utilisation_EduTrack.pdf', 'MANUEL PAS À PAS - DIRECTEUR', contentFR);


