const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

function createPdf(filename, title, contentBlocks) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const outputPath = path.join(__dirname, '..', 'frontend', 'public', filename);
  doc.pipe(fs.createWriteStream(outputPath));

  // Default font for PDFKit
  doc.font('Helvetica');

  doc.fontSize(24).text(title, { align: 'center' });
  doc.moveDown(2);

  contentBlocks.forEach(block => {
    if (block.type === 'h1') {
      doc.font('Helvetica-Bold').fontSize(16).text(block.text);
      doc.moveDown(0.5);
    } else if (block.type === 'h2') {
      doc.font('Helvetica-Bold').fontSize(14).text(block.text);
      doc.moveDown(0.5);
    } else if (block.type === 'p') {
      doc.font('Helvetica').fontSize(12).text(block.text, { align: 'justify' });
      doc.moveDown(1);
    } else if (block.type === 'bullet') {
      doc.font('Helvetica').fontSize(12).text('• ' + block.text, { indent: 20 });
      doc.moveDown(0.5);
    }
  });

  doc.end();
  console.log('Generated:', outputPath);
}

const contentFR = [
  { type: 'h1', text: '1. Introduction' },
  { type: 'p', text: 'EduTrack est une plateforme de gestion scolaire complète, bilingue, avec un accent particulier sur la comptabilité OHADA et la gestion pédagogique.' },
  { type: 'h1', text: '2. Espace Directeur (Gestion Globale)' },
  { type: 'p', text: 'Le directeur supervise l\'ensemble de l\'établissement. Depuis son tableau de bord, il a accès aux statistiques globales. Il peut configurer les classes, gérer le personnel enseignant, inscrire des élèves et superviser toutes les opérations.' },
  { type: 'h1', text: '3. Espace Censeur (Discipline et Bibliothèque)' },
  { type: 'p', text: 'Le rôle du censeur est de maintenir la discipline et de gérer le matériel pédagogique.' },
  { type: 'bullet', text: 'Discipline : Suivi quotidien des absences, retards et justifications. Saisie des sanctions disciplinaires (Avertissement, Blâme, etc.).' },
  { type: 'bullet', text: 'Bibliothèque : Gestion du catalogue de livres scolaires, suivi des emprunts par les élèves et gestion des retours.' },
  { type: 'h1', text: '4. Espace Enseignant (Pédagogie)' },
  { type: 'p', text: 'L\'enseignant dispose d\'un espace simplifié pour ses tâches quotidiennes :' },
  { type: 'bullet', text: 'Appel en classe : Interface rapide pour marquer les élèves absents directement depuis un smartphone ou un ordinateur.' },
  { type: 'bullet', text: 'Saisie des notes : Enregistrement des notes pour les évaluations, avec sauvegarde en brouillon avant validation définitive.' },
  { type: 'bullet', text: 'Emploi du temps : Consultation de son planning hebdomadaire.' },
  { type: 'h1', text: '5. Espace Intendant & Comptabilité OHADA' },
  { type: 'p', text: 'L\'intendant est responsable des finances, incluant les frais de scolarité, la paie, et la comptabilité stricte.' },
  { type: 'h2', text: '5.1. Le Plan Comptable OHADA' },
  { type: 'p', text: 'L\'application intègre le plan comptable OHADA. L\'intendant peut initialiser ce plan par défaut, ajouter ou modifier des comptes (Comptes de bilan, de gestion, de trésorerie).' },
  { type: 'h2', text: '5.2. Saisie du Journal' },
  { type: 'p', text: 'Toutes les opérations comptables manuelles se font dans le journal. Le système bloque toute validation si l\'écriture n\'est pas équilibrée (Total Débit = Total Crédit).' },
  { type: 'h2', text: '5.3. Écritures Automatiques' },
  { type: 'p', text: 'Pour gagner du temps, le paiement d\'une tranche de scolarité par un élève génère automatiquement une écriture comptable dans le journal (ex: Débit Caisse, Crédit Frais Scolaires).' },
  { type: 'h2', text: '5.4. Balance et Grand Livre' },
  { type: 'p', text: 'Le système génère automatiquement la Balance Générale et le Grand Livre pour chaque exercice fiscal. Ces documents sont exportables en PDF pour les contrôles ou les audits.' },
  { type: 'h1', text: '6. Espace Parent (Suivi)' },
  { type: 'p', text: 'Le parent possède un portail personnel pour suivre ses enfants : accès aux relevés de notes, emploi du temps, historique des absences et état des paiements de scolarité.' }
];

const contentEN = [
  { type: 'h1', text: '1. Introduction' },
  { type: 'p', text: 'EduTrack is a comprehensive, bilingual school management platform with a special focus on OHADA accounting and pedagogical management.' },
  { type: 'h1', text: '2. Director Portal (Global Management)' },
  { type: 'p', text: 'The director oversees the entire school. From their dashboard, they access global statistics. They can configure classes, manage teaching staff, enroll students, and supervise all operations.' },
  { type: 'h1', text: '3. Master/Censeur Portal (Discipline & Library)' },
  { type: 'p', text: 'The master\'s role is to maintain discipline and manage educational materials.' },
  { type: 'bullet', text: 'Discipline: Daily tracking of absences, tardiness, and justifications. Entry of disciplinary sanctions (Warnings, Reprimands, etc.).' },
  { type: 'bullet', text: 'Library: Management of the school book catalog, tracking student borrowing, and handling returns.' },
  { type: 'h1', text: '4. Teacher Portal (Pedagogy)' },
  { type: 'p', text: 'Teachers have a simplified space for their daily tasks:' },
  { type: 'bullet', text: 'Roll Call: Fast interface to mark students absent directly from a smartphone or computer.' },
  { type: 'bullet', text: 'Grading: Entering grades for assessments, with draft saving before final validation.' },
  { type: 'bullet', text: 'Timetable: Viewing their weekly schedule.' },
  { type: 'h1', text: '5. Bursar Portal & OHADA Accounting' },
  { type: 'p', text: 'The bursar is responsible for finances, including tuition fees, payroll, and strict accounting.' },
  { type: 'h2', text: '5.1. OHADA Chart of Accounts' },
  { type: 'p', text: 'The application integrates the OHADA chart of accounts. The bursar can initialize this default plan, add or modify accounts (Balance sheet accounts, management accounts, treasury accounts).' },
  { type: 'h2', text: '5.2. Journal Entries' },
  { type: 'p', text: 'All manual accounting operations are done in the journal. The system blocks any validation if the entry is not balanced (Total Debit = Total Credit).' },
  { type: 'h2', text: '5.3. Automatic Entries' },
  { type: 'p', text: 'To save time, the payment of a tuition installment by a student automatically generates an accounting entry in the journal (e.g., Debit Cash, Credit Tuition Fees).' },
  { type: 'h2', text: '5.4. Trial Balance & General Ledger' },
  { type: 'p', text: 'The system automatically generates the Trial Balance and General Ledger for each fiscal year. These documents can be exported as PDFs for checks or audits.' },
  { type: 'h1', text: '6. Parent Portal (Tracking)' },
  { type: 'p', text: 'Parents have a personal portal to track their children: access to report cards, timetables, absence history, and tuition payment status.' }
];

createPdf('Manuel_Utilisation_EduTrack_FR.pdf', 'Manuel d\'Utilisation - EduTrack', contentFR);
createPdf('EduTrack_User_Manual_EN.pdf', 'User Manual - EduTrack', contentEN);
