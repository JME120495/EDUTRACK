const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\esson\\.gemini\\antigravity-ide\\brain\\3760e39f-cf63-4b94-b86c-70c1f5c626b4';
const OUTPUT_PATH = path.join(ARTIFACT_DIR, 'edutrack_features_summary.pdf');

// Colors
const PRIMARY = '#1E3A5F'; // Navy
const SECONDARY = '#4F46E5'; // Indigo
const ACCENT = '#F5A623'; // Gold
const TEXT_DARK = '#334155'; // Slate
const TEXT_MUTED = '#64748B';
const BG_LIGHT = '#F8FAFC';
const WHITE = '#FFFFFF';

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(OUTPUT_PATH);
doc.pipe(writeStream);

// Cover Page
doc.rect(0, 0, 595.28, 841.89).fill(BG_LIGHT);

// Draw left decorative accent bar
doc.rect(0, 0, 15, 841.89).fill(PRIMARY);
doc.rect(15, 0, 5, 841.89).fill(ACCENT);

// Title Block
doc.fillColor(PRIMARY)
   .font('Helvetica-Bold')
   .fontSize(36)
   .text('EduTrack', 60, 200)
   .fontSize(20)
   .fillColor(SECONDARY)
   .text('Système de Gestion Scolaire Bilingue', 60, 245)
   .moveDown(0.5);

doc.rect(60, 280, 200, 3).fill(ACCENT);

doc.fillColor(TEXT_DARK)
   .font('Helvetica-Bold')
   .fontSize(24)
   .text('Bilan Complet des Fonctionnalités', 60, 310)
   .moveDown(0.5);

doc.font('Helvetica')
   .fontSize(12)
   .fillColor(TEXT_MUTED)
   .text('Une solution complète, conforme et premium pour la gestion administrative, académique, financière et logistique des établissements scolaires.', 60, 350, { width: 450 })
   .moveDown(4);

// Footer metadata
doc.fillColor(PRIMARY)
   .font('Helvetica-Bold')
   .fontSize(10)
   .text('DOCUMENT DE SYNTHÈSE TECHNIQUE & FONCTIONNELLE', 60, 680)
   .font('Helvetica')
   .fillColor(TEXT_MUTED)
   .text('Généré pour le projet EduTrack', 60, 695)
   .text('Version 1.1.0 • Juillet 2026', 60, 710);

doc.addPage();

// Write regular pages headers/footers
const writeHeaderFooter = () => {
  const pages = doc.bufferedPageRange();
  for (let i = 1; i < pages.count; i++) {
    doc.switchToPage(i);
    
    const oldMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    
    // Header
    doc.fillColor(PRIMARY)
       .font('Helvetica-Bold')
       .fontSize(8)
       .text('EDUTRACK • BILAN COMPLET DES FONCTIONNALITÉS', 50, 25)
       .moveTo(50, 38)
       .lineTo(545.28, 38)
       .lineWidth(0.5)
       .strokeColor(PRIMARY)
       .stroke();
       
    // Footer
    doc.fillColor(TEXT_MUTED)
       .font('Helvetica')
       .fontSize(8)
       .text(`Page ${i + 1} sur ${pages.count}`, 50, 805, { align: 'right', width: 495.28 });

    doc.page.margins.bottom = oldMargin;
  }
};

// Section 1: Intro & Security
doc.fillColor(PRIMARY)
   .font('Helvetica-Bold')
   .fontSize(18)
   .text('1. Vue d\'Ensemble & Architecture de Sécurité (RBAC)', 50, 60)
   .moveDown(0.5);

doc.fillColor(TEXT_DARK)
   .font('Helvetica')
   .fontSize(10.5)
   .text('EduTrack repose sur une architecture robuste basée sur le contrôle d\'accès basé sur les rôles (RBAC) avec une étanchéité stricte côté backend et une interface frontend dynamique s\'adaptant à chaque type de profil. Chaque rôle dispose d\'un portail dédié sécurisé par jetons JWT (JSON Web Tokens) et hachage de mot de passe via bcryptjs.', { align: 'justify' })
   .moveDown(1.5);

// Section 2: Portals
doc.fillColor(PRIMARY)
   .font('Helvetica-Bold')
   .fontSize(18)
   .text('2. Fonctionnalités par Espace Utilisateur', 50, 180)
   .moveDown(0.5);

// Director Portal
doc.fillColor(SECONDARY)
   .font('Helvetica-Bold')
   .fontSize(13)
   .text('Espace Directeur (DIRECTOR)', 50, 215)
   .moveDown(0.3);

const directorBulletPoints = [
  'Tableau de bord décisionnel : Statistiques en temps réel sur les effectifs, scolarités, personnels.',
  'Structure Académique : Configuration des années scolaires, création des classes et des niveaux.',
  'Gestion du Personnel : Attribution des cours et matières aux enseignants, création des profils.',
  'Emplois du Temps : Configuration globale des créneaux horaires et grilles de cours.',
  'Impression de documents : Génération instantanée de cartes scolaires avec codes QR et fiches.',
  'Pilotage Financier & RH : Suivi des frais de scolarité, fiches de paie et avances de salaire.'
];

directorBulletPoints.forEach(pt => {
  doc.fillColor(TEXT_DARK)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('  • ', { continued: true })
     .font('Helvetica')
     .text(pt)
     .moveDown(0.2);
});
doc.moveDown(0.8);

// Censeur Portal
doc.fillColor(SECONDARY)
   .font('Helvetica-Bold')
   .fontSize(13)
   .text('Espace Censeur & Discipline (CENSEUR / SURVEILLANT)', 50, doc.y)
   .moveDown(0.3);

const censeurBulletPoints = [
  'Gestion de la Discipline : Saisie des absences, retards et exclusions, justifications.',
  'Bibliothèque Scolaire : Gestion du catalogue, prêts et retours de livres (Actif, Retourné, Perdu).',
  'Administration de cours : Création de matières, coefficients, volumes horaires.',
  'Ajustements des plannings : Modification directe des emplois du temps.'
];

censeurBulletPoints.forEach(pt => {
  doc.fillColor(TEXT_DARK)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('  • ', { continued: true })
     .font('Helvetica')
     .text(pt)
     .moveDown(0.2);
});
doc.moveDown(0.8);

// Intendant Portal
doc.fillColor(SECONDARY)
   .font('Helvetica-Bold')
   .fontSize(13)
   .text('Espace Intendant (INTENDANT)', 50, doc.y)
   .moveDown(0.3);

const intendantBulletPoints = [
  'Gestion de la Scolarité : Encaissement de scolarité, reçus imprimables, alertes impayés.',
  'Ressources Humaines : Fiches de paie du personnel, contrats, avances de salaire.',
  'Comptabilité (Norme OHADA) : Journaux comptables (Caisse, Banque, OD), plan comptable, écritures à double entrée.',
  'Logistique - Transport : Lignes de bus scolaires, tarifs, abonnements avec recherche en temps réel.',
  'Logistique - Cantine : Abonnements des élèves avec notes sur allergies et régimes diététiques.'
];

intendantBulletPoints.forEach(pt => {
  doc.fillColor(TEXT_DARK)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('  • ', { continued: true })
     .font('Helvetica')
     .text(pt)
     .moveDown(0.2);
});

doc.addPage();

// Teacher Portal
doc.fillColor(SECONDARY)
   .font('Helvetica-Bold')
   .fontSize(13)
   .text('Espace Enseignant (TEACHER)', 50, 60)
   .moveDown(0.3);

const teacherBulletPoints = [
  'Cours du jour : Tableau de bord listant les leçons planifiées selon l\'emploi du temps.',
  'Appel Électronique : Saisie des retards et absences des élèves en 3 clics.',
  'Cahier de Textes : Remplissage des chapitres enseignés et devoirs donnés.',
  'Saisie des Notes : Enregistrement des notes d\'évaluations (brouillons et validations).',
  'RH personnel : Consultation de ses propres bulletins de paie et demandes d\'avances.'
];

teacherBulletPoints.forEach(pt => {
  doc.fillColor(TEXT_DARK)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('  • ', { continued: true })
     .font('Helvetica')
     .text(pt)
     .moveDown(0.2);
});
doc.moveDown(0.8);

// Parent Portal
doc.fillColor(SECONDARY)
   .font('Helvetica-Bold')
   .fontSize(13)
   .text('Espace Parent (PARENT)', 50, doc.y)
   .moveDown(0.3);

const parentBulletPoints = [
  'Suivi Académique : Notes par séquence, bulletins trimestriels, emploi du temps.',
  'Discipline & Absences : Alertes instantanées concernant la discipline de l\'enfant.',
  'Frais de Scolarité : État des paiements et solde restant dû.',
  'Consentement Parental (Loi 2024/017 Cameroun) : Module d\'opt-in explicite, traçabilité des signatures IP/dates.'
];

parentBulletPoints.forEach(pt => {
  doc.fillColor(TEXT_DARK)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('  • ', { continued: true })
     .font('Helvetica')
     .text(pt)
     .moveDown(0.2);
});
doc.moveDown(0.8);

// Student Portal
doc.fillColor(SECONDARY)
   .font('Helvetica-Bold')
   .fontSize(13)
   .text('Portail Élève (STUDENT)', 50, doc.y)
   .moveDown(0.3);

const studentBulletPoints = [
  'Suivi des cours : Visualisation de son emploi du temps individuel.',
  'Suivi scolaire : Notes, moyennes, sanctions disciplinaires.',
  'Bibliothèque : Consultation de ses livres empruntés et dates de retour.'
];

studentBulletPoints.forEach(pt => {
  doc.fillColor(TEXT_DARK)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('  • ', { continued: true })
     .font('Helvetica')
     .text(pt)
     .moveDown(0.2);
});
doc.moveDown(1.5);

// Section 3: Global features
doc.fillColor(PRIMARY)
   .font('Helvetica-Bold')
   .fontSize(18)
   .text('3. Fonctionnalités Transverses (Globales)', 50, doc.y)
   .moveDown(0.5);

const globalBulletPoints = [
  'Messagerie Interne : Canal de communication direct école-famille.',
  'Internationalisation (i18n) : Traduction complète de la plateforme (Français / Anglais).',
  'Système d\'Audit : Journalisation d\'accès aux fiches d\'élèves mineurs à des fins de sécurité.'
];

globalBulletPoints.forEach(pt => {
  doc.fillColor(TEXT_DARK)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text('  • ', { continued: true })
     .font('Helvetica')
     .text(pt)
     .moveDown(0.2);
});

doc.addPage();

// Section 4: Recap Table
doc.fillColor(PRIMARY)
   .font('Helvetica-Bold')
   .fontSize(18)
   .text('4. Tableau Récapitulatif des Modules', 50, 60)
   .moveDown(0.8);

// Draw table
const startX = 50;
let startY = 95;
const colWidths = [120, 230, 145];
const headers = ['Module', 'Fonctionnalités Clés', 'Rôles Concernés'];

// Draw headers
doc.rect(startX, startY, 495, 25).fill(PRIMARY);
doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(9.5);
doc.text(headers[0], startX + 8, startY + 8, { width: colWidths[0] - 16 });
doc.text(headers[1], startX + colWidths[0] + 8, startY + 8, { width: colWidths[1] - 16 });
doc.text(headers[2], startX + colWidths[0] + colWidths[1] + 8, startY + 8, { width: colWidths[2] - 16 });

startY += 25;

const rows = [
  ['Académie', 'Classes, Années, Matières, Emplois du temps', 'Directeur, Censeur'],
  ['Vie Scolaire', 'Appel en classe, Cahier de devoirs, Textes', 'Enseignant, Surveillant'],
  ['Discipline & Notes', 'Sanctions, Saisie des Notes, Bulletins', 'Enseignant, Censeur, Parent'],
  ['Finances', 'Scolarité, Reçus PDF, Comptabilité OHADA', 'Intendant, Directeur, Parent'],
  ['Ressources Humaines', 'Fiches de paie, Contrats, Avances salaire', 'Intendant, Directeur, Enseignant'],
  ['Services Annexes', 'Bibliothèque, Bus & Cantine (abonnements)', 'Censeur, Intendant, Parent'],
  ['Sécurité (2024)', 'Consentement parental, Logs d\'accès sensible', 'Parent, Directeur, Admin'],
  ['Communication', 'Messagerie interne école-famille', 'Tous les rôles']
];

rows.forEach((row, rowIndex) => {
  const rowHeight = 25;
  const fillCol = rowIndex % 2 === 1 ? BG_LIGHT : WHITE;
  
  doc.rect(startX, startY, 495, rowHeight).fill(fillCol);
  
  doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(8.5);
  doc.text(row[0], startX + 8, startY + 8, { width: colWidths[0] - 16 });
  doc.text(row[1], startX + colWidths[0] + 8, startY + 8, { width: colWidths[1] - 16 });
  doc.text(row[2], startX + colWidths[0] + colWidths[1] + 8, startY + 8, { width: colWidths[2] - 16 });
  
  // Cell border lines
  doc.strokeColor('#E2E8F0').lineWidth(0.5);
  doc.moveTo(startX, startY + rowHeight).lineTo(startX + 495, startY + rowHeight).stroke();
  
  startY += rowHeight;
});

// Finalize document page numbers and headers
writeHeaderFooter();

doc.end();

writeStream.on('finish', () => {
  console.log('PDF Generated successfully!');
});
