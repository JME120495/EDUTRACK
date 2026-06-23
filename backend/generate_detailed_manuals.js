const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

function createPdf(filename, title, contentBlocks) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  // The user might be looking for it in the root or in the frontend/public folder.
  // We'll write to the root folder because the user's active document list shows `c:\Users\esson\OneDrive\Documents\Edutrack\Manuel_Utilisation_EduTrack.pdf`
  const outputPath = path.join(__dirname, '..', filename);
  doc.pipe(fs.createWriteStream(outputPath));

  // Default font
  doc.font('Helvetica');

  doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(2);

  contentBlocks.forEach(block => {
    if (block.type === 'h1') {
      doc.font('Helvetica-Bold').fontSize(16).text(block.text);
      doc.moveDown(0.8);
    } else if (block.type === 'h2') {
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(14).text(block.text);
      doc.moveDown(0.5);
    } else if (block.type === 'h3') {
      doc.font('Helvetica-Bold').fontSize(12).text(block.text);
      doc.moveDown(0.3);
    } else if (block.type === 'p') {
      doc.font('Helvetica').fontSize(11).text(block.text, { align: 'justify', lineGap: 2 });
      doc.moveDown(0.5);
    } else if (block.type === 'bullet') {
      doc.font('Helvetica').fontSize(11).text('• ' + block.text, { align: 'justify', indent: 15, lineGap: 2 });
      doc.moveDown(0.3);
    }
    
    // Add page break if near bottom
    if (doc.y > 750) {
        doc.addPage();
    }
  });

  doc.end();
  console.log('Generated:', outputPath);
}

const contentFR = [
  { type: 'h1', text: 'GUIDE D\'UTILISATION DÉTAILLÉ - ESPACE ADMINISTRATEUR (DIRECTEUR)' },
  { type: 'p', text: 'Ce manuel décrit de manière exhaustive chaque fonctionnalité accessible depuis le tableau de bord de l\'Administrateur (Directeur) dans EduTrack.' },
  
  { type: 'h2', text: '1. Tableau de Bord' },
  { type: 'p', text: 'La vue d\'ensemble de votre établissement à la connexion.' },
  { type: 'bullet', text: 'Statistiques globales : Visualisez instantanément le nombre d\'Élèves Actifs, d\'Enseignants, le Taux de Recouvrement, et le Total Recouvré.' },
  { type: 'bullet', text: 'Alertes et Retards de Paiements : Consultez la liste des élèves en retard de paiement de scolarité.' },
  { type: 'bullet', text: 'Envoyer Rappel SMS : Depuis le tableau de bord, envoyez en un clic ("Envoyer Rappel SMS") une relance automatique aux parents des élèves en retard.' },
  { type: 'bullet', text: 'Actions Rapides : Raccourcis vers les tâches les plus courantes.' },

  { type: 'h2', text: '2. Personnel Administratif' },
  { type: 'p', text: 'Gestion des profils administratifs (Directeurs adjoints, Censeurs, Intendants).' },
  { type: 'bullet', text: 'Ajouter ou modifier des comptes d\'utilisateurs ayant accès au panneau d\'administration avec différents niveaux de permissions.' },

  { type: 'h2', text: '3. Personnel d\'Appui' },
  { type: 'p', text: 'Gérez les gardiens, femmes de ménage, secrétaires et autres employés d\'appui.' },
  { type: 'bullet', text: 'Ajouter du Personnel : Saisissez le Nom, la Profession / Poste, le Téléphone et l\'Email.' },
  { type: 'bullet', text: 'Consultation : Affichez la liste complète ("Total Personnel") et recherchez par nom ou téléphone.' },

  { type: 'h2', text: '4. Gestion Élèves' },
  { type: 'p', text: 'Consultez, ajoutez et liez les profils d\'élèves avec les identifiants parents.' },
  { type: 'bullet', text: 'Ajouter un Élève : Saisie manuelle des informations de l\'élève (Nom complet, Matricule, Genre, Classe).' },
  { type: 'bullet', text: 'Importer depuis CSV : Ajout d\'élèves en masse à partir d\'un fichier.' },
  { type: 'bullet', text: 'Comptes Parents & Liaisons : Créez un compte parent ("Créer Compte Parent") et liez-le à ses enfants ("Lier un Parent").' },

  { type: 'h2', text: '5. Gestion Classes' },
  { type: 'p', text: 'Structure pédagogique de l\'établissement.' },
  { type: 'bullet', text: 'Créer une classe : Définissez les nouvelles salles de classe, leur niveau et leur capacité.' },

  { type: 'h2', text: '6. Gestion Enseignants' },
  { type: 'p', text: 'Gérez les comptes des enseignants titulaires et vacataires et affectez-les aux matières par classe.' },
  { type: 'bullet', text: 'Créer Compte Enseignant : Ajoutez un nouveau professeur (Nom, Téléphone, Email).' },
  { type: 'bullet', text: 'Affecter Enseignant : Assurez la liaison entre un professeur, une classe et une matière spécifique.' },

  { type: 'h2', text: '7. Emploi du Temps' },
  { type: 'p', text: 'Planification hebdomadaire des cours.' },
  { type: 'bullet', text: 'Ajouter un cours : Sélectionnez la Salle, l\'Enseignant, la Matière et le Jour (du Lundi au Samedi).' },
  { type: 'bullet', text: 'Détection de Conflit : Le système vous alerte si un enseignant ou une salle est doublement assigné.' },
  { type: 'bullet', text: 'Exporter en PDF : Générez une version imprimable de l\'emploi du temps de la classe.' },

  { type: 'h2', text: '8. Bibliothèque' },
  { type: 'p', text: 'Gérez le stock de romans/livres de lecture et suivez les prêts aux élèves.' },
  { type: 'bullet', text: 'Ajouter un Livre : Entrez les informations des ouvrages dans la base de données.' },
  { type: 'bullet', text: 'Rechercher : Trouvez rapidement un livre par titre ou par auteur.' },

  { type: 'h2', text: '9. Saisie des Notes' },
  { type: 'p', text: 'Saisie Séquentielle des Notes. Saisissez les notes et appréciations comportementales par classe, matière et séquence.' },
  { type: 'bullet', text: 'Note / 20 & Comportement : Entrez la note et sélectionnez une appréciation ("-- Choisir remarque --").' },
  { type: 'bullet', text: 'Enregistrer Brouillon / Sauvegarder Brouillon : Permet de sauvegarder la saisie en cours (Statut : BROUILLON).' },
  { type: 'bullet', text: 'Validation Finale / Valider définitivement : Verrouille les notes ("Notes validées et verrouillées !").' },
  { type: 'bullet', text: 'Mode Hors-ligne : Poursuivez la saisie même en cas de coupure de connexion, avec une synchronisation ultérieure.' },

  { type: 'h2', text: '10. Absences / Appel' },
  { type: 'p', text: 'Registre des Absences & Appel.' },
  { type: 'bullet', text: 'Effectuez l\'appel numérique et cliquez sur "Sauvegarder l\'Appel" pour enregistrer.' },

  { type: 'h2', text: '11. Bulletins' },
  { type: 'p', text: 'Génération de Bulletins.' },
  { type: 'bullet', text: 'Options de génération : "Générer Bulletins de Séquence", "Générer Bulletins Trimestriels", "Générer Bulletins Annuels".' },
  { type: 'bullet', text: 'Conseil de Classe & Comportement : "Modifier Décisions/Conduite", saisissez la Conduite, les Sanctions Disciplinaires et la Décision du Conseil.' },
  { type: 'bullet', text: 'Signatures : Cliquez sur "Signer en tant que Directeur" pour apposer votre signature électronique.' },
  { type: 'bullet', text: 'Diffusion : "Envoyer à tous les Parents par WhatsApp" pour une distribution instantanée, ou générez le PDF.' },

  { type: 'h2', text: '12. Paiements & Scolarité' },
  { type: 'p', text: 'Suivi Financier : Gestion de scolarité, plans d\'échéance, moratoires et rapports financiers.' },
  { type: 'bullet', text: 'Configurer les Frais par Classe : Définissez les tranches ("Modifier les Frais").' },
  { type: 'bullet', text: 'Enregistrer un Paiement / + Saisir Versement : Ajoutez le montant encaissé ("Payé (FCFA)"). Le statut s\'ajustera automatiquement (Scolarité Réglée, Paiement Partiel, Impayé).' },
  { type: 'bullet', text: 'Envoyer Relances Classe : Envoyez un SMS groupé aux mauvais payeurs d\'une classe.' },

  { type: 'h2', text: '13. Comptabilité (OHADA)' },
  { type: 'p', text: 'Module réservé aux plans Premium/Custom pour la gestion comptable aux normes OHADA.' },

  { type: 'h2', text: '14. Ressources Humaines' },
  { type: 'p', text: 'Gestion du personnel, contrats, avances sur salaire et congés.' },
  { type: 'bullet', text: 'Personnel & Contrats : "Créer un Contrat" avec Type de contrat, Salaire de base et Taux horaire.' },
  { type: 'bullet', text: 'Avances Salaire : "Demander une Avance" et suivre les remboursements.' },
  { type: 'bullet', text: 'Congés & Absences : "Demander un Congé" (Type, Date de début, Motif).' },
  { type: 'bullet', text: 'Bulletins de Paie : "Générer la paie du mois" (calcul du Net à payer, Retenues, Primes, Avance déduite).' },

  { type: 'h2', text: '15. Paie des Enseignants' },
  { type: 'p', text: 'Gérer les taux horaires, les heures effectuées et les salaires des enseignants.' },
  { type: 'bullet', text: 'Configuration : "Configurer la Paie", saisissez le Taux Horaire (FCFA/h) et le total des Heures effectuées pour générer le Salaire dû.' },

  { type: 'h2', text: '16. Documents & Badges' },
  { type: 'p', text: 'Impression en masse de cartes d\'accès avec QR codes et attestations d\'étudiants.' },
  { type: 'bullet', text: 'Modèles d\'Attestations : "Créer un Modèle" en utilisant les balises ({NOM_ELEVE}, {CLASSE}, {MATRICULE}, etc.).' },
  { type: 'bullet', text: 'Générer Attestation : Choisissez le modèle et l\'élève pour générer le PDF.' },
  { type: 'bullet', text: 'Cartes & Badges : "Télécharger Grille Badges Élèves (A4)" ou "Badges Parents (A4)".' },

  { type: 'h2', text: '17. Abonnement & Facturation' },
  { type: 'p', text: 'Gérez votre abonnement EduTrack et découvrez nos offres.' },
  { type: 'bullet', text: 'Consultez votre plan (Essentiel, Pro, Premium, Sur Mesure), cliquez sur "Changer de Plan" ou "Mettre à niveau" selon vos besoins.' },

  { type: 'h2', text: '18. Paramètres École' },
  { type: 'p', text: 'Configuration de l\'Établissement.' },
  { type: 'bullet', text: 'Réglez le Nom de l\'école et la Langue par défaut de l\'interface, puis cliquez sur "Enregistrer les modifications".' },

  { type: 'h2', text: '19. Messagerie' },
  { type: 'p', text: 'Outil de communication intégré.' },
  { type: 'bullet', text: 'Boîte de réception : Consultez les messages reçus.' },
  { type: 'bullet', text: 'Nouveau Message : "Envoyer un message à", rédigez ("Écrivez votre message ici...") et cliquez sur "Envoyer".' }
];

createPdf('Manuel_Utilisation_EduTrack.pdf', 'MANUEL D\'UTILISATION - ADMINISTRATEUR', contentFR);

