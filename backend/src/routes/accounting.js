const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();
const prisma = require('../db');

// Protect all accounting routes
router.use(auth);

// OHADA Base Accounts Data
const ohadaBaseAccounts = [
  // Classes 1: Comptes de Ressources Durables
  { number: '101', name: 'Capital social', type: 'EQUITY' },
  { number: '131', name: 'Résultat net', type: 'EQUITY' },
  { number: '161', name: 'Emprunts obligataires', type: 'LIABILITY' },
  
  // Classes 2: Comptes d'Actif Immobilisé
  { number: '211', name: 'Frais de développement', type: 'ASSET' },
  { number: '221', name: 'Terrains', type: 'ASSET' },
  { number: '231', name: 'Bâtiments', type: 'ASSET' },
  { number: '241', name: 'Matériel et outillage', type: 'ASSET' },
  { number: '244', name: 'Matériel de bureau et informatique', type: 'ASSET' },
  
  // Classes 3: Comptes de Stocks
  { number: '311', name: 'Marchandises', type: 'ASSET' },
  { number: '331', name: 'Matières premières', type: 'ASSET' },
  
  // Classes 4: Comptes de Tiers
  { number: '401', name: 'Fournisseurs', type: 'LIABILITY' },
  { number: '411', name: 'Clients (Élèves/Parents)', type: 'ASSET' },
  { number: '421', name: 'Personnel, Rémunérations dues', type: 'LIABILITY' },
  { number: '431', name: 'Sécurité sociale', type: 'LIABILITY' },
  { number: '442', name: 'État, Impôts et taxes', type: 'LIABILITY' },
  
  // Classes 5: Comptes de Trésorerie
  { number: '512', name: 'Banques', type: 'ASSET' },
  { number: '521', name: 'Caisse', type: 'ASSET' },
  { number: '571', name: 'Mobile Money', type: 'ASSET' },
  
  // Classes 6: Comptes de Charges (Dépenses)
  { number: '601', name: 'Achats de marchandises', type: 'EXPENSE' },
  { number: '604', name: 'Achats d\'études et prestations de services', type: 'EXPENSE' },
  { number: '605', name: 'Matériel et fournitures', type: 'EXPENSE' },
  { number: '612', name: 'Redevances de crédit-bail', type: 'EXPENSE' },
  { number: '613', name: 'Locations (Loyer)', type: 'EXPENSE' },
  { number: '614', name: 'Charges locatives et copropriété', type: 'EXPENSE' },
  { number: '622', name: 'Rémunérations d\'intermédiaires et honoraires', type: 'EXPENSE' },
  { number: '624', name: 'Entretien, réparations', type: 'EXPENSE' },
  { number: '631', name: 'Frais bancaires', type: 'EXPENSE' },
  { number: '641', name: 'Impôts et taxes', type: 'EXPENSE' },
  { number: '661', name: 'Rémunérations du personnel (Salaires)', type: 'EXPENSE' },
  
  // Classes 7: Comptes de Produits (Revenus)
  { number: '701', name: 'Ventes de marchandises', type: 'REVENUE' },
  { number: '706', name: 'Services vendus (Frais de Scolarité)', type: 'REVENUE' },
  { number: '707', name: 'Produits accessoires (Cantine, Transport)', type: 'REVENUE' },
  { number: '771', name: 'Subventions d\'exploitation', type: 'REVENUE' },
];

const defaultJournals = [
  { code: 'BQ', name: 'Banque' },
  { code: 'CA', name: 'Caisse' },
  { code: 'OD', name: 'Opérations Diverses' },
  { code: 'RAN', name: 'Report À Nouveau' },
];

// ==========================================
// ACCOUNTS (Plan Comptable)
// ==========================================

// Get all accounts
router.get('/accounts', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const accounts = await prisma.accountingAccount.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { number: 'asc' }
    });
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Init OHADA
router.post('/accounts/init-ohada', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const { schoolId } = req.user;
    
    // Create accounts if they don't exist
    for (const acc of ohadaBaseAccounts) {
      await prisma.accountingAccount.upsert({
        where: { schoolId_number: { schoolId, number: acc.number } },
        update: {},
        create: {
          schoolId,
          number: acc.number,
          name: acc.name,
          type: acc.type
        }
      });
    }

    // Init default journals too
    for (const journal of defaultJournals) {
      await prisma.accountingJournal.upsert({
        where: { schoolId_code: { schoolId, code: journal.code } },
        update: {},
        create: {
          schoolId,
          code: journal.code,
          name: journal.name
        }
      });
    }

    // Ensure a default fiscal year exists
    const currentYear = new Date().getFullYear();
    const existingFy = await prisma.accountingFiscalYear.findFirst({
      where: { schoolId, status: 'OPEN' }
    });

    if (!existingFy) {
      await prisma.accountingFiscalYear.create({
        data: {
          schoolId,
          startDate: new Date(`${currentYear}-01-01`),
          endDate: new Date(`${currentYear}-12-31`),
        }
      });
    }

    res.json({ message: 'Plan comptable OHADA et journaux initialisés avec succès.' });
  } catch (error) {
    console.error('Error init OHADA:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Create account
router.post('/accounts', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const { number, name, type } = req.body;
    const account = await prisma.accountingAccount.create({
      data: {
        schoolId: req.user.schoolId,
        number,
        name,
        type
      }
    });
    res.status(201).json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(400).json({ message: 'Erreur. Le compte existe peut-être déjà.' });
  }
});

// ==========================================
// JOURNALS
// ==========================================

router.get('/journals', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const journals = await prisma.accountingJournal.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { code: 'asc' }
    });
    res.json(journals);
  } catch (error) {
    console.error('Error fetching journals:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ==========================================
// FISCAL YEARS
// ==========================================

router.get('/fiscal-years', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const fy = await prisma.accountingFiscalYear.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { startDate: 'desc' }
    });
    res.json(fy);
  } catch (error) {
    console.error('Error fetching fiscal years:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ==========================================
// ENTRIES (Écritures Comptables)
// ==========================================

router.get('/entries', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const entries = await prisma.accountingEntry.findMany({
      where: { schoolId: req.user.schoolId },
      include: {
        journal: true,
        lines: {
          include: { account: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 100 // limit to recent 100 for basic view
    });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

router.post('/entries', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const { journalId, date, description, reference, lines } = req.body;
    
    // Validate balance
    const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);

    // Allowing small floating point differences, but practically they should be exact
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ message: 'L\'écriture n\'est pas équilibrée (Total Débit ≠ Total Crédit).' });
    }

    // Get active fiscal year
    const activeFy = await prisma.accountingFiscalYear.findFirst({
      where: { schoolId: req.user.schoolId, status: 'OPEN' }
    });

    if (!activeFy) {
      return res.status(400).json({ message: 'Aucun exercice comptable ouvert.' });
    }

    const entry = await prisma.accountingEntry.create({
      data: {
        schoolId: req.user.schoolId,
        journalId,
        fiscalYearId: activeFy.id,
        date: new Date(date),
        description,
        reference,
        status: 'VALIDATED', // Auto validated for now
        lines: {
          create: lines.map(l => ({
            accountId: l.accountId,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            description: l.description || description
          }))
        }
      },
      include: { lines: true }
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'écriture.' });
  }
});

// ==========================================
// REPORTS (Grand Livre, Balance, Compte Résultat)
// ==========================================

router.get('/reports/trial-balance', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const { schoolId } = req.user;

    // Fetch all lines with their accounts
    const lines = await prisma.accountingLine.findMany({
      where: {
        entry: {
          schoolId,
          status: 'VALIDATED'
        }
      },
      include: {
        account: true
      }
    });

    // Aggregate by account
    const balanceMap = {};
    
    lines.forEach(line => {
      const accNum = line.account.number;
      if (!balanceMap[accNum]) {
        balanceMap[accNum] = {
          account: line.account,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0 // + for Debit balance, - for Credit balance
        };
      }
      balanceMap[accNum].totalDebit += line.debit;
      balanceMap[accNum].totalCredit += line.credit;
    });

    const trialBalance = Object.values(balanceMap).map(b => {
      b.balance = b.totalDebit - b.totalCredit;
      return b;
    }).sort((a, b) => a.account.number.localeCompare(b.account.number));

    res.json(trialBalance);
  } catch (error) {
    console.error('Error generating trial balance:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

const PDFDocument = require('pdfkit');

router.get('/reports/grand-livre/pdf', requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const { schoolId } = req.user;

    // Fetch all lines
    const lines = await prisma.accountingLine.findMany({
      where: {
        entry: {
          schoolId,
          status: 'VALIDATED'
        }
      },
      include: {
        account: true,
        entry: true
      },
      orderBy: [
        { accountId: 'asc' },
        { entry: { date: 'asc' } }
      ]
    });

    // Group by account
    const accountsMap = {};
    lines.forEach(line => {
      const accNum = line.account.number;
      if (!accountsMap[accNum]) {
        accountsMap[accNum] = {
          account: line.account,
          lines: []
        };
      }
      accountsMap[accNum].lines.push(line);
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Grand_Livre.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('GRAND LIVRE COMPTABLE', { align: 'center' });
    doc.moveDown(2);

    const sortedAccountNums = Object.keys(accountsMap).sort();

    sortedAccountNums.forEach(accNum => {
      const data = accountsMap[accNum];
      
      doc.fontSize(14).font('Helvetica-Bold').text(`Compte ${data.account.number} - ${data.account.name}`);
      doc.moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Date', 40, tableTop);
      doc.text('Réf.', 100, tableTop);
      doc.text('Libellé', 180, tableTop);
      doc.text('Débit', 380, tableTop, { width: 60, align: 'right' });
      doc.text('Crédit', 450, tableTop, { width: 60, align: 'right' });
      doc.text('Solde', 520, tableTop, { width: 60, align: 'right' });
      
      doc.moveTo(40, doc.y + 2).lineTo(580, doc.y + 2).stroke();
      doc.moveDown(0.5);

      doc.font('Helvetica');
      let balance = 0;
      
      data.lines.forEach(line => {
        balance += (line.debit - line.credit);
        
        // Check page break
        if (doc.y > 750) {
          doc.addPage();
        }

        const y = doc.y;
        doc.text(new Date(line.entry.date).toLocaleDateString(), 40, y);
        doc.text(line.entry.reference || '-', 100, y, { width: 70, height: 12, ellipsis: true });
        doc.text(line.description || '-', 180, y, { width: 190, height: 12, ellipsis: true });
        doc.text(line.debit > 0 ? line.debit.toFixed(2) : '-', 380, y, { width: 60, align: 'right' });
        doc.text(line.credit > 0 ? line.credit.toFixed(2) : '-', 450, y, { width: 60, align: 'right' });
        doc.text(balance.toFixed(2), 520, y, { width: 60, align: 'right' });
        
        doc.moveDown(0.2);
      });

      doc.moveDown(2);
    });

    doc.end();

  } catch (error) {
    console.error('Error generating Grand Livre PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Erreur lors de la génération du PDF.' });
    }
  }
});

module.exports = router;
