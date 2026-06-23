const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

function createPdf(filename, title, contentBlocks) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const outputPath = path.join(__dirname, '..', 'frontend', 'public', filename);
  doc.pipe(fs.createWriteStream(outputPath));

  // Default font
  doc.font('Helvetica');

  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown(1.5);

  contentBlocks.forEach(block => {
    if (block.type === 'h1') {
      doc.font('Helvetica-Bold').fontSize(14).text(block.text);
      doc.moveDown(0.5);
    } else if (block.type === 'h2') {
      doc.font('Helvetica-Bold').fontSize(12).text(block.text);
      doc.moveDown(0.3);
    } else if (block.type === 'h3') {
      doc.font('Helvetica-Bold').fontSize(11).text(block.text);
      doc.moveDown(0.2);
    } else if (block.type === 'p') {
      doc.font('Helvetica').fontSize(10).text(block.text, { align: 'justify' });
      doc.moveDown(0.3);
    } else if (block.type === 'bullet') {
      doc.font('Helvetica').fontSize(10).text('• ' + block.text, { align: 'justify', indent: 15 });
      doc.moveDown(0.2);
    }
  });

  doc.end();
  console.log('Generated:', outputPath);
}

const contentFR = [
  { type: 'h1', text: 'GUIDE D\'UTILISATION COMPLET - EDUTRACK' },
  { type: 'p', text: 'Ce manuel décrit pas à pas comment utiliser l\'intégralité des fonctionnalités d\'EduTrack.' },
  
  { type: 'h2', text: '1. Le Tableau de Bord (Dashboard)' },
  { type: 'p', text: 'Une fois connecté, le tableau de bord présente vos indicateurs clés (élèves, paiements, absences). Utilisez le menu latéral pour naviguer.' },
  
  { type: 'h2', text: '2. Gestion du Personnel (Administratif, Enseignants, Appui)' },
  { type: 'h3', text: 'Ajouter le personnel administratif :' },
  { type: 'bullet', text: '1. Allez dans "Administration" > "Utilisateurs" et cliquez sur "Ajouter un utilisateur".' },
  { type: 'bullet', text: '2. Remplissez Nom, Prénom, Email et choisissez le Rôle (DIRECTOR, CENSEUR, INTENDANT).' },
  { type: 'bullet', text: '3. Enregistrez. L\'utilisateur recevra ses identifiants.' },
  { type: 'h3', text: 'Ajouter des enseignants :' },
  { type: 'bullet', text: '1. Allez dans "Pédagogie" > "Enseignants" > "Ajouter un enseignant".' },
  { type: 'bullet', text: '2. Renseignez les infos et assignez les classes et matières.' },
  { type: 'h3', text: 'Ajouter le personnel d\'appui :' },
  { type: 'bullet', text: '1. Avec le compte Intendant, allez dans "Ressources Humaines" > "Employés" > "Nouveau contrat".' },
  { type: 'bullet', text: '2. Saisissez le poste et le salaire, puis validez.' },

  { type: 'h2', text: '3. Gestion des Élèves' },
  { type: 'h3', text: 'Ajouter un élève individuellement :' },
  { type: 'bullet', text: '1. Allez dans "Administration" > "Élèves" > "Ajouter un élève".' },
  { type: 'bullet', text: '2. Remplissez la fiche complète (Nom, Date de naissance, Classe) et validez.' },
  { type: 'h3', text: 'Ajouter des élèves via fichier Excel :' },
  { type: 'bullet', text: '1. Dans "Élèves", cliquez sur "Import Excel".' },
  { type: 'bullet', text: '2. Téléchargez le modèle, remplissez-le et importez-le.' },

  { type: 'h2', text: '4. Gestion des Parents' },
  { type: 'h3', text: 'Lier un parent à un élève :' },
  { type: 'bullet', text: '1. Allez dans "Administration" > "Parents". Ajoutez ou sélectionnez un parent.' },
  { type: 'bullet', text: '2. Cliquez sur "Associer un enfant", cherchez l\'élève et validez.' },

  { type: 'h2', text: '5. Discipline et Absences (Censeur)' },
  { type: 'h3', text: 'Ajouter une sanction ou justifier une absence :' },
  { type: 'bullet', text: '1. Allez dans "Scolarité" > "Discipline".' },
  { type: 'bullet', text: '2. Pour sanctionner : Cherchez l\'élève, cliquez sur "Ajouter une sanction" (ex: Blâme, Exclusion).' },
  { type: 'bullet', text: '3. Pour justifier : Sélectionnez l\'absence non justifiée, cliquez sur "Justifier" et ajoutez le motif.' },

  { type: 'h2', text: '6. Emploi du Temps (Directeur / Censeur)' },
  { type: 'h3', text: 'Créer l\'emploi du temps :' },
  { type: 'bullet', text: '1. Allez dans "Pédagogie" > "Emploi du temps".' },
  { type: 'bullet', text: '2. Sélectionnez la classe. Cliquez sur un créneau horaire vide.' },
  { type: 'bullet', text: '3. Assignez la matière et l\'enseignant, puis enregistrez.' },

  { type: 'h2', text: '7. Bibliothèque (Censeur)' },
  { type: 'h3', text: 'Ajouter et prêter des livres :' },
  { type: 'bullet', text: '1. Allez dans "Ressources" > "Bibliothèque".' },
  { type: 'bullet', text: '2. Pour ajouter un livre : Cliquez sur "Ajouter un livre", scannez le code ISBN ou remplissez les champs.' },
  { type: 'bullet', text: '3. Pour prêter : Cliquez sur "Emprunter", sélectionnez le livre et l\'élève. La date limite de retour est calculée.' },
  { type: 'bullet', text: '4. Pour un retour : Cliquez sur le livre emprunté et validez "Marquer comme retourné".' },

  { type: 'h2', text: '8. Pédagogie et Notes' },
  { type: 'h3', text: 'Appel en classe et Saisie des notes :' },
  { type: 'bullet', text: '1. Appel : L\'enseignant clique sur son cours actuel, décoche les absents et valide.' },
  { type: 'bullet', text: '2. Notes : Allez dans "Pédagogie" > "Évaluations", choisissez la classe, saisissez les notes et cliquez sur "Publier".' },

  { type: 'h2', text: '9. Comptabilité et Plan OHADA (Intendant)' },
  { type: 'h3', text: 'Paiements et Balance OHADA :' },
  { type: 'bullet', text: '1. Paiement : "Finances" > "Paiements", choisissez l\'élève, la tranche et validez. Le reçu est généré.' },
  { type: 'bullet', text: '2. Balance : "Comptabilité" > "Rapports", cliquez sur "Balance Générale" pour voir et exporter en PDF.' },

  { type: 'h2', text: '10. Ressources Humaines (Intendant)' },
  { type: 'h3', text: 'Avances sur salaire et Fiches de paie :' },
  { type: 'bullet', text: '1. Avance : Allez dans "RH" > "Avances", sélectionnez l\'employé, entrez le montant. L\'avance sera déduite du salaire.' },
  { type: 'bullet', text: '2. Fiche de paie : Allez dans "RH" > "Fiches de paie", sélectionnez le mois et cliquez sur "Générer les fiches". Elles incluront automatiquement les absences et avances.' },

  { type: 'h2', text: '11. Documents Officiels' },
  { type: 'h3', text: 'Générer Cartes et Attestations :' },
  { type: 'bullet', text: '1. Allez dans "Scolarité" > "Documents".' },
  { type: 'bullet', text: '2. Sélectionnez la classe ou l\'élève, choisissez le type de document (Carte Scolaire, Attestation de Scolarité).' },
  { type: 'bullet', text: '3. Cliquez sur "Générer PDF" pour l\'impression.' },

  { type: 'h2', text: '12. Messagerie Interne' },
  { type: 'h3', text: 'Envoyer un message :' },
  { type: 'bullet', text: '1. Utilisez le bouton "Message" en haut à droite (ou sur le profil d\'un utilisateur).' },
  { type: 'bullet', text: '2. Rédigez le message qui sera envoyé sur l\'espace EduTrack du destinataire (Parent, Enseignant, etc.).' }
];

const contentEN = [
  { type: 'h1', text: 'COMPLETE USER GUIDE - EDUTRACK' },
  { type: 'p', text: 'This manual describes step-by-step how to use all the features of EduTrack.' },
  
  { type: 'h2', text: '1. The Dashboard' },
  { type: 'p', text: 'Once logged in, the dashboard presents your key indicators (students, payments, absences). Use the left menu to navigate.' },
  
  { type: 'h2', text: '2. Staff Management (Administrative, Teachers, Support)' },
  { type: 'h3', text: 'Add administrative staff :' },
  { type: 'bullet', text: '1. Go to "Administration" > "Users" and click "Add a User".' },
  { type: 'bullet', text: '2. Fill in Name, Email and choose the Role (DIRECTOR, CENSEUR, INTENDANT).' },
  { type: 'bullet', text: '3. Save. The user will receive their credentials.' },
  { type: 'h3', text: 'Add teachers :' },
  { type: 'bullet', text: '1. Go to "Pedagogy" > "Teachers" > "Add a teacher".' },
  { type: 'bullet', text: '2. Fill in details and assign classes and subjects.' },
  { type: 'h3', text: 'Add support staff :' },
  { type: 'bullet', text: '1. With the Bursar account, go to "Human Resources" > "Employees" > "New Contract".' },
  { type: 'bullet', text: '2. Enter the position and salary, then validate.' },

  { type: 'h2', text: '3. Student Management' },
  { type: 'h3', text: 'Add a student individually :' },
  { type: 'bullet', text: '1. Go to "Administration" > "Students" > "Add a student".' },
  { type: 'bullet', text: '2. Fill out the full form (Name, Date of Birth, Class) and validate.' },
  { type: 'h3', text: 'Add students via Excel file :' },
  { type: 'bullet', text: '1. In "Students", click "Import Excel".' },
  { type: 'bullet', text: '2. Download the template, fill it out, and import it.' },

  { type: 'h2', text: '4. Parent Management' },
  { type: 'h3', text: 'Link a parent to a student :' },
  { type: 'bullet', text: '1. Go to "Administration" > "Parents". Add or select a parent.' },
  { type: 'bullet', text: '2. Click "Link a child", search for the student and validate.' },

  { type: 'h2', text: '5. Discipline and Absences (Censeur)' },
  { type: 'h3', text: 'Add a sanction or justify an absence :' },
  { type: 'bullet', text: '1. Go to "Schooling" > "Discipline".' },
  { type: 'bullet', text: '2. To sanction: Search for the student, click "Add a sanction" (e.g., Warning, Exclusion).' },
  { type: 'bullet', text: '3. To justify: Select the unexcused absence, click "Justify" and add the reason.' },

  { type: 'h2', text: '6. Timetable Management (Director / Censeur)' },
  { type: 'h3', text: 'Create the timetable :' },
  { type: 'bullet', text: '1. Go to "Pedagogy" > "Timetable".' },
  { type: 'bullet', text: '2. Select the class. Click on an empty time slot.' },
  { type: 'bullet', text: '3. Assign the subject and teacher, then save.' },

  { type: 'h2', text: '7. Library Management (Censeur)' },
  { type: 'h3', text: 'Add and lend books :' },
  { type: 'bullet', text: '1. Go to "Resources" > "Library".' },
  { type: 'bullet', text: '2. To add a book: Click "Add a book", scan ISBN or fill the fields.' },
  { type: 'bullet', text: '3. To lend: Click "Borrow", select the book and student. The return date is calculated.' },
  { type: 'bullet', text: '4. To return: Click the borrowed book and validate "Mark as returned".' },

  { type: 'h2', text: '8. Pedagogy and Grades' },
  { type: 'h3', text: 'Class roll call and Grade entry :' },
  { type: 'bullet', text: '1. Roll call: Teacher clicks their current class, unchecks absent students and validates.' },
  { type: 'bullet', text: '2. Grades: Go to "Pedagogy" > "Evaluations", choose class, enter grades and click "Publish".' },

  { type: 'h2', text: '9. Accounting and OHADA Plan (Bursar)' },
  { type: 'h3', text: 'Payments and OHADA Balance :' },
  { type: 'bullet', text: '1. Payment: "Finances" > "Payments", choose student, installment and validate. Receipt is generated.' },
  { type: 'bullet', text: '2. Balance: "Accounting" > "Reports", click "Trial Balance" to view and export as PDF.' },

  { type: 'h2', text: '10. Human Resources (Bursar)' },
  { type: 'h3', text: 'Salary advances and Payslips :' },
  { type: 'bullet', text: '1. Advance: Go to "HR" > "Advances", select employee, enter amount. It will be deducted from salary.' },
  { type: 'bullet', text: '2. Payslip: Go to "HR" > "Payslips", select month and click "Generate payslips". They include absences and advances.' },

  { type: 'h2', text: '11. Official Documents' },
  { type: 'h3', text: 'Generate IDs and Certificates :' },
  { type: 'bullet', text: '1. Go to "Schooling" > "Documents".' },
  { type: 'bullet', text: '2. Select the class or student, choose the document type (Student ID, Enrollment Certificate).' },
  { type: 'bullet', text: '3. Click "Generate PDF" for printing.' },

  { type: 'h2', text: '12. Internal Messaging' },
  { type: 'h3', text: 'Send a message :' },
  { type: 'bullet', text: '1. Use the "Message" button at the top right (or on a user profile).' },
  { type: 'bullet', text: '2. Write the message that will be sent to the recipient\'s EduTrack portal.' }
];

createPdf('Manuel_Utilisation_EduTrack_FR.pdf', 'Manuel d\'Utilisation Complet - EduTrack', contentFR);
createPdf('EduTrack_User_Manual_EN.pdf', 'Complete User Guide - EduTrack', contentEN);
