const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

function generateManual() {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const outputPath = path.join(__dirname, '..', 'Manuel_Utilisation_EduTrack.pdf');
  doc.pipe(fs.createWriteStream(outputPath));

  // --- Helpers ---
  const addTitle = (text) => {
    doc.moveDown().font('Helvetica-Bold').fontSize(20).fillColor('#1e40af').text(text).moveDown(0.5);
  };

  const addSubtitle = (text) => {
    doc.moveDown(0.5).font('Helvetica-Bold').fontSize(14).fillColor('#374151').text(text).moveDown(0.25);
  };

  const addParagraph = (text) => {
    doc.font('Helvetica').fontSize(11).fillColor('#4b5563').text(text, { align: 'justify', lineGap: 3 }).moveDown(0.5);
  };

  const addBullet = (text) => {
    doc.font('Helvetica').fontSize(11).fillColor('#4b5563').text(`• ${text}`, { align: 'left', lineGap: 2, indent: 20 }).moveDown(0.2);
  };

  // --- Title Page ---
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');
  doc.fillColor('#1e40af').fontSize(36).font('Helvetica-Bold').text('EduTrack', { align: 'center', margin: 100 });
  doc.moveDown();
  doc.fontSize(24).fillColor('#3b82f6').text('Manuel d\'Utilisation Officiel', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(14).fillColor('#64748b').text('Système de Gestion Scolaire & Comptabilité OHADA', { align: 'center' });
  doc.moveDown(10);
  doc.fontSize(12).text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
  
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff'); // Reset background

  // --- 1. Introduction ---
  addTitle('1. Introduction à EduTrack');
  addParagraph('EduTrack est une plateforme complète et bilingue de gestion scolaire. Elle centralise toutes les opérations d\'un établissement scolaire : administration, pédagogie, discipline, bibliothèque et gestion financière avancée.');

  // --- 2. Rôles et Accès ---
  addTitle('2. Rôles et Portails d\'Accès');
  addParagraph('L\'application fonctionne avec un système de permissions strict (RBAC) offrant des interfaces dédiées pour chaque profil :');
  addBullet('Directeur : Supervise l\'ensemble de l\'établissement, consulte les statistiques, gère les effectifs et la configuration globale.');
  addBullet('Censeur : Gère la discipline, la scolarité, la bibliothèque et les cartes scolaires.');
  addBullet('Intendant : En charge des paiements, des ressources humaines, et de la comptabilité générale (Plan OHADA).');
  addBullet('Enseignant : Accède à son emploi du temps, fait l\'appel (absences) et saisit les notes.');
  addBullet('Parent : Suit la progression, les notes, l\'emploi du temps et les paiements de son ou ses enfants.');

  // --- 3. Espace Censeur & Bibliothèque ---
  addTitle('3. Espace Censeur & Discipline');
  addParagraph('Le Censeur dispose d\'outils complets pour le suivi quotidien des élèves :');
  addBullet('Saisie et suivi des absences et des retards.');
  addBullet('Attribution de sanctions disciplinaires (Avertissement, Blâme, Exclusion).');
  addBullet('Génération et impression des cartes scolaires.');
  addSubtitle('Module Bibliothèque');
  addParagraph('Ce module permet l\'enregistrement des ouvrages scolaires, la gestion des emprunts par les élèves et le suivi des retours, avec des rappels automatiques pour les livres non restitués.');

  // --- 4. Espace Enseignant ---
  addTitle('4. Espace Enseignant');
  addParagraph('L\'enseignant bénéficie d\'une interface simplifiée pour ses tâches quotidiennes :');
  addBullet('Tableau de bord listant ses cours du jour.');
  addBullet('Interface d\'appel rapide pour signaler les absences.');
  addBullet('Saisie des notes avec possibilité d\'importer depuis un fichier Excel et d\'enregistrer en brouillon avant validation.');

  // --- 5. Focus : Gestion Comptable et Plan OHADA ---
  doc.addPage();
  addTitle('5. Comptabilité et Plan OHADA (Espace Intendant)');
  addParagraph('L\'application EduTrack intègre un module de comptabilité en partie double entièrement conforme au référentiel OHADA, permettant à l\'intendant de tenir les comptes de l\'établissement avec précision.');

  addSubtitle('5.1. Le Plan Comptable OHADA');
  addParagraph('Le système est pré-configuré avec le plan comptable général OHADA, classé par types :');
  addBullet('Comptes de Bilan : Actifs (Classe 2), Capitaux (Classe 1), Passifs (Classe 1 & 4).');
  addBullet('Comptes de Gestion : Charges (Classe 6) et Produits (Classe 7).');
  addBullet('Comptes de Trésorerie : Caisse et Banques (Classe 5).');
  addParagraph('L\'intendant peut initialiser le plan standard OHADA en un clic, rechercher des comptes spécifiques et les modifier selon les besoins de l\'école.');

  addSubtitle('5.2. Saisie des Écritures (Journal Comptable)');
  addParagraph('L\'interface "Saisie Journal" permet d\'enregistrer des opérations manuelles.');
  addBullet('Le système garantit le principe de la partie double : une écriture ne peut être validée que si le Total Débit est rigoureusement égal au Total Crédit.');
  addBullet('Chaque ligne d\'écriture est rattachée à un compte OHADA valide.');
  addBullet('L\'intendant peut consulter l\'historique des écritures et filtrer par statut (Brouillon, Validé).');

  addSubtitle('5.3. Synchronisation Automatique');
  addParagraph('EduTrack automatise la comptabilité pour vous faire gagner du temps :');
  addBullet('Lorsqu\'un paiement de scolarité est enregistré, une écriture comptable est automatiquement générée (Débit du compte Caisse 571, Crédit du compte Frais Scolaires 706).');
  addBullet('La même automatisation s\'applique pour le versement des salaires via le module RH.');

  addSubtitle('5.4. Éditions : Balance Générale et Grand Livre');
  addParagraph('Le module de reporting offre une visibilité financière complète :');
  addBullet('Balance Générale : Calcule automatiquement les mouvements Débit/Crédit et le solde (Débiteur ou Créditeur) pour chaque compte du plan comptable.');
  addBullet('Grand Livre : Présente le détail des écritures compte par compte.');
  addBullet('Export PDF : En un clic, l\'intendant peut exporter le Grand Livre ou la Balance Générale au format PDF pour les audits ou l\'archivage.');

  // --- Conclusion ---
  doc.addPage();
  addTitle('6. Sécurité et Performances');
  addParagraph('EduTrack est bâti sur une architecture moderne garantissant la sécurité de vos données :');
  addBullet('Toutes les requêtes (surtout comptables) sont protégées par chiffrement et authentification forte.');
  addBullet('Les mots de passe sont cryptés et l\'accès au système est protégé par des limiteurs de requêtes pour éviter les abus.');
  addParagraph('EduTrack vous accompagne vers l\'excellence administrative et pédagogique !');

  doc.end();
  console.log(`PDF généré avec succès à l'emplacement : ${outputPath}`);
}

generateManual();
