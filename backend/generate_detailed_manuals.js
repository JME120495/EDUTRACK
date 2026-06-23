const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

function createPdf(filename, title, contentBlocks) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const outputPath = path.join(__dirname, '..', 'frontend', 'public', filename);
  doc.pipe(fs.createWriteStream(outputPath));

  // Default font
  doc.font('Helvetica');

  doc.fontSize(20).text(title, { align: 'center' });
  doc.moveDown(2);

  contentBlocks.forEach(block => {
    if (block.type === 'h1') {
      doc.font('Helvetica-Bold').fontSize(16).text(block.text);
      doc.moveDown(0.5);
    } else if (block.type === 'h2') {
      doc.font('Helvetica-Bold').fontSize(14).text(block.text);
      doc.moveDown(0.5);
    } else if (block.type === 'h3') {
      doc.font('Helvetica-Bold').fontSize(12).text(block.text);
      doc.moveDown(0.5);
    } else if (block.type === 'p') {
      doc.font('Helvetica').fontSize(11).text(block.text, { align: 'justify' });
      doc.moveDown(0.5);
    } else if (block.type === 'bullet') {
      doc.font('Helvetica').fontSize(11).text('• ' + block.text, { align: 'justify', indent: 20 });
      doc.moveDown(0.3);
    }
  });

  doc.end();
  console.log('Generated:', outputPath);
}

const contentFR = [
  { type: 'h1', text: 'GUIDE D\'UTILISATION DÉTAILLÉ - EDUTRACK' },
  { type: 'p', text: 'Ce manuel décrit pas à pas comment utiliser les différentes fonctionnalités d\'EduTrack.' },
  
  { type: 'h2', text: '1. Le Tableau de Bord (Dashboard)' },
  { type: 'p', text: 'Une fois connecté, le tableau de bord vous présente un résumé global : nombre d\'élèves, taux de présence, paiements, etc. Utilisez le menu latéral gauche pour naviguer entre les différents modules.' },
  
  { type: 'h2', text: '2. Gestion du Personnel (Administratif, Enseignants, Appui)' },
  { type: 'h3', text: 'Comment ajouter le personnel administratif (Directeur, Censeur, Intendant) :' },
  { type: 'bullet', text: '1. Allez dans le menu "Administration" > "Utilisateurs".' },
  { type: 'bullet', text: '2. Cliquez sur le bouton "Ajouter un utilisateur".' },
  { type: 'bullet', text: '3. Remplissez le formulaire avec le nom, prénom et l\'adresse email.' },
  { type: 'bullet', text: '4. Sélectionnez le Rôle correspondant (DIRECTOR, CENSEUR, ou INTENDANT).' },
  { type: 'bullet', text: '5. Cliquez sur "Enregistrer". L\'utilisateur recevra ses identifiants par email.' },
  
  { type: 'h3', text: 'Comment ajouter des enseignants :' },
  { type: 'bullet', text: '1. Allez dans le menu "Pédagogie" > "Enseignants".' },
  { type: 'bullet', text: '2. Cliquez sur "Ajouter un enseignant".' },
  { type: 'bullet', text: '3. Renseignez les informations personnelles.' },
  { type: 'bullet', text: '4. Assignez-lui les classes et les matières qu\'il dispense.' },
  
  { type: 'h3', text: 'Comment ajouter le personnel d\'appui (gardiens, agents d\'entretien) :' },
  { type: 'bullet', text: '1. Connectez-vous avec un compte Intendant et allez dans "Ressources Humaines".' },
  { type: 'bullet', text: '2. Allez dans "Employés" > "Nouveau contrat".' },
  { type: 'bullet', text: '3. Saisissez le poste (ex: Agent d\'entretien), le salaire et validez.' },

  { type: 'h2', text: '3. Gestion des Élèves' },
  { type: 'h3', text: 'Comment ajouter un élève individuellement :' },
  { type: 'bullet', text: '1. Allez dans "Administration" > "Élèves".' },
  { type: 'bullet', text: '2. Cliquez sur le bouton "Ajouter un élève".' },
  { type: 'bullet', text: '3. Remplissez la fiche (Nom, Date de naissance, Sexe, Classe affectée).' },
  { type: 'bullet', text: '4. Cliquez sur "Valider". L\'élève reçoit un matricule automatiquement.' },

  { type: 'h3', text: 'Comment ajouter des élèves à travers un fichier Excel (en masse) :' },
  { type: 'bullet', text: '1. Dans la liste des élèves, cliquez sur le bouton "Import Excel".' },
  { type: 'bullet', text: '2. Téléchargez le fichier modèle (Template) fourni par le système.' },
  { type: 'bullet', text: '3. Remplissez le fichier Excel avec la liste de vos élèves (Nom, Prénom, Sexe, Classe).' },
  { type: 'bullet', text: '4. Cliquez sur "Parcourir", sélectionnez votre fichier complété, puis cliquez sur "Importer".' },

  { type: 'h2', text: '4. Gestion des Parents' },
  { type: 'h3', text: 'Comment lier un parent à un élève :' },
  { type: 'bullet', text: '1. Allez dans "Administration" > "Parents".' },
  { type: 'bullet', text: '2. Ajoutez un nouveau parent (Nom, Téléphone, Email) ou sélectionnez un parent existant.' },
  { type: 'bullet', text: '3. Dans la fiche du parent, cliquez sur le bouton "Associer un enfant".' },
  { type: 'bullet', text: '4. Recherchez l\'élève par son nom ou son matricule et confirmez le lien de parenté.' },
  { type: 'bullet', text: '5. Le parent pourra désormais voir les notes et absences de cet élève depuis son espace parent.' },

  { type: 'h2', text: '5. Pédagogie et Notes' },
  { type: 'h3', text: 'Comment faire l\'appel en classe (Enseignants) :' },
  { type: 'bullet', text: '1. Depuis l\'espace Enseignant, cliquez sur le cours en cours dans l\'emploi du temps.' },
  { type: 'bullet', text: '2. La liste des élèves s\'affiche. Décochez ceux qui sont absents.' },
  { type: 'bullet', text: '3. Validez l\'appel. Les parents reçoivent une notification.' },

  { type: 'h3', text: 'Comment saisir et publier les notes :' },
  { type: 'bullet', text: '1. Allez dans "Pédagogie" > "Évaluations".' },
  { type: 'bullet', text: '2. Choisissez la classe et la matière.' },
  { type: 'bullet', text: '3. Saisissez les notes dans le tableau. Vous pouvez enregistrer en "Brouillon".' },
  { type: 'bullet', text: '4. Une fois vérifiées, cliquez sur "Publier" pour les intégrer au bulletin.' },

  { type: 'h2', text: '6. Comptabilité et Plan OHADA' },
  { type: 'h3', text: 'Comment enregistrer un paiement de scolarité :' },
  { type: 'bullet', text: '1. Allez dans "Finances" > "Paiements" (Espace Intendant).' },
  { type: 'bullet', text: '2. Recherchez l\'élève et sélectionnez la tranche à payer.' },
  { type: 'bullet', text: '3. Validez le paiement. Le système génère automatiquement un reçu et l\'écriture comptable.' },

  { type: 'h3', text: 'Comment générer la balance et le grand livre OHADA :' },
  { type: 'bullet', text: '1. Allez dans "Comptabilité" > "Rapports".' },
  { type: 'bullet', text: '2. Cliquez sur "Générer la Balance Générale".' },
  { type: 'bullet', text: '3. Le document affiche tous les comptes avec leurs soldes Débit/Crédit et peut être exporté en PDF.' }
];

const contentEN = [
  { type: 'h1', text: 'DETAILED USER GUIDE - EDUTRACK' },
  { type: 'p', text: 'This manual describes step-by-step how to use the various features of EduTrack.' },
  
  { type: 'h2', text: '1. The Dashboard' },
  { type: 'p', text: 'Once logged in, the dashboard presents a global summary: number of students, attendance rate, payments, etc. Use the left side menu to navigate between different modules.' },
  
  { type: 'h2', text: '2. Staff Management (Administrative, Teachers, Support)' },
  { type: 'h3', text: 'How to add administrative staff (Director, Master, Bursar):' },
  { type: 'bullet', text: '1. Go to the "Administration" > "Users" menu.' },
  { type: 'bullet', text: '2. Click on the "Add a User" button.' },
  { type: 'bullet', text: '3. Fill out the form with last name, first name, and email address.' },
  { type: 'bullet', text: '4. Select the corresponding Role (DIRECTOR, CENSEUR, or INTENDANT).' },
  { type: 'bullet', text: '5. Click "Save". The user will receive their login credentials via email.' },
  
  { type: 'h3', text: 'How to add teachers:' },
  { type: 'bullet', text: '1. Go to the "Pedagogy" > "Teachers" menu.' },
  { type: 'bullet', text: '2. Click on "Add a teacher".' },
  { type: 'bullet', text: '3. Fill in the personal information.' },
  { type: 'bullet', text: '4. Assign them the classes and subjects they teach.' },
  
  { type: 'h3', text: 'How to add support staff (guards, maintenance agents):' },
  { type: 'bullet', text: '1. Log in with a Bursar account and go to "Human Resources".' },
  { type: 'bullet', text: '2. Go to "Employees" > "New Contract".' },
  { type: 'bullet', text: '3. Enter the position (e.g., Maintenance Agent), salary, and submit.' },

  { type: 'h2', text: '3. Student Management' },
  { type: 'h3', text: 'How to add a student individually:' },
  { type: 'bullet', text: '1. Go to "Administration" > "Students".' },
  { type: 'bullet', text: '2. Click on the "Add a student" button.' },
  { type: 'bullet', text: '3. Fill out the form (Name, Date of Birth, Gender, Assigned Class).' },
  { type: 'bullet', text: '4. Click "Submit". The student automatically receives an ID number.' },

  { type: 'h3', text: 'How to add students through an Excel file (bulk import):' },
  { type: 'bullet', text: '1. In the student list, click on the "Import Excel" button.' },
  { type: 'bullet', text: '2. Download the template file provided by the system.' },
  { type: 'bullet', text: '3. Fill out the Excel file with your student list (Name, First Name, Gender, Class).' },
  { type: 'bullet', text: '4. Click "Browse", select your completed file, then click "Import".' },

  { type: 'h2', text: '4. Parent Management' },
  { type: 'h3', text: 'How to link a parent to a student:' },
  { type: 'bullet', text: '1. Go to "Administration" > "Parents".' },
  { type: 'bullet', text: '2. Add a new parent (Name, Phone, Email) or select an existing parent.' },
  { type: 'bullet', text: '3. On the parent\'s profile, click the "Link a child" button.' },
  { type: 'bullet', text: '4. Search for the student by their name or ID and confirm the relationship.' },
  { type: 'bullet', text: '5. The parent will now be able to see this student\'s grades and absences from the parent portal.' },

  { type: 'h2', text: '5. Pedagogy and Grades' },
  { type: 'h3', text: 'How to take attendance in class (Teachers):' },
  { type: 'bullet', text: '1. From the Teacher portal, click on the current class in the timetable.' },
  { type: 'bullet', text: '2. The student list appears. Uncheck those who are absent.' },
  { type: 'bullet', text: '3. Submit the roll call. Parents receive a notification.' },

  { type: 'h3', text: 'How to enter and publish grades:' },
  { type: 'bullet', text: '1. Go to "Pedagogy" > "Evaluations".' },
  { type: 'bullet', text: '2. Choose the class and subject.' },
  { type: 'bullet', text: '3. Enter the grades in the table. You can save as a "Draft".' },
  { type: 'bullet', text: '4. Once verified, click "Publish" to integrate them into the report card.' },

  { type: 'h2', text: '6. Accounting and OHADA Plan' },
  { type: 'h3', text: 'How to record a tuition payment:' },
  { type: 'bullet', text: '1. Go to "Finances" > "Payments" (Bursar Portal).' },
  { type: 'bullet', text: '2. Search for the student and select the installment to be paid.' },
  { type: 'bullet', text: '3. Validate the payment. The system automatically generates a receipt and the accounting entry.' },

  { type: 'h3', text: 'How to generate the OHADA trial balance and general ledger:' },
  { type: 'bullet', text: '1. Go to "Accounting" > "Reports".' },
  { type: 'bullet', text: '2. Click on "Generate Trial Balance".' },
  { type: 'bullet', text: '3. The document displays all accounts with their Debit/Credit balances and can be exported as a PDF.' }
];

createPdf('Manuel_Utilisation_EduTrack_FR.pdf', 'Manuel d\'Utilisation Détaillé - EduTrack', contentFR);
createPdf('EduTrack_User_Manual_EN.pdf', 'Detailed User Guide - EduTrack', contentEN);
