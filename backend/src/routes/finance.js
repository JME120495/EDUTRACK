const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole, requirePlan } = require('../middlewares/authMiddleware');

// Require STANDARD, PREMIUM or CUSTOM plan for all finance routes
router.use(auth, requirePlan(['STANDARD', 'PREMIUM', 'CUSTOM']));
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper to calculate financial reports
async function getFinancialReportData(schoolId) {
  // Active Year
  const activeYear = await prisma.anneeScolaire.findFirst({
    where: { schoolId, active: true }
  });

  // 1. Tuition expected & collected
  let totalTuitionExpected = 0;
  let totalTuitionCollected = 0;

  if (activeYear) {
    const fees = await prisma.fraisScolarite.findMany({
      where: { anneeScolaireId: activeYear.id }
    });
    
    for (const fee of fees) {
      const studentCount = await prisma.eleve.count({
        where: { classId: fee.classId, status: 'ACTIVE' }
      });
      totalTuitionExpected += studentCount * fee.totalAmount;
    }

    const tuitionPayments = await prisma.paiement.findMany({
      where: {
        eleve: { class: { schoolId } },
        status: 'COMPLETED'
      }
    });
    totalTuitionCollected = tuitionPayments.reduce((sum, p) => sum + p.amount, 0);
  }

  // 2. General Transactions
  const generalTransactions = await prisma.transaction.findMany({
    where: { schoolId }
  });

  const otherIncome = generalTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const generalExpenses = generalTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Paid Staff Salaries (from Payslip model)
  const paidSalaries = await prisma.payslip.findMany({
    where: {
      user: { schoolId },
      status: 'PAID'
    }
  });
  const payrollExpense = paidSalaries.reduce((sum, p) => sum + p.netSalary, 0);

  const totalIncome = totalTuitionCollected + otherIncome;
  const totalExpenses = generalExpenses + payrollExpense;
  const balance = totalIncome - totalExpenses;

  // 4. Monthly analytics (Last 6 months)
  const monthlyData = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = { month: key, label: d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), income: 0, expense: 0 };
  }

  // Add tuition payments to monthly
  const allTuitionPayments = await prisma.paiement.findMany({
    where: {
      eleve: { class: { schoolId } },
      status: 'COMPLETED'
    }
  });
  allTuitionPayments.forEach(p => {
    const d = new Date(p.paymentDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[key]) {
      monthlyData[key].income += p.amount;
    }
  });

  // Add general transactions to monthly
  generalTransactions.forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[key]) {
      if (t.type === 'INCOME') monthlyData[key].income += t.amount;
      else monthlyData[key].expense += t.amount;
    }
  });

  // Add paid payroll to monthly
  paidSalaries.forEach(p => {
    if (p.paymentDate) {
      const d = new Date(p.paymentDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) {
        monthlyData[key].expense += p.netSalary;
      }
    }
  });

  return {
    tuition: {
      expected: totalTuitionExpected,
      collected: totalTuitionCollected,
      remaining: Math.max(0, totalTuitionExpected - totalTuitionCollected)
    },
    general: {
      otherIncome,
      generalExpenses,
      payrollExpense
    },
    totals: {
      income: totalIncome,
      expense: totalExpenses,
      balance
    },
    monthly: Object.values(monthlyData)
  };
}

// ----------------------------------------------------
// 1. TRANCHES DE PAIEMENT (Installments)
// ----------------------------------------------------

// Configure installments for tuition fees
router.post('/tranches', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { fraisScolariteId, installments } = req.body; // installments: [{ name, amount, dueDate }]
  try {
    if (!fraisScolariteId || !Array.isArray(installments)) {
      return res.status(400).json({ message: 'FraisScolarite ID and installments array are required' });
    }

    const tuition = await prisma.fraisScolarite.findUnique({
      where: { id: fraisScolariteId }
    });

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition configuration not found' });
    }

    // Verify installments total matches the total fee
    const sum = installments.reduce((acc, inst) => acc + parseFloat(inst.amount), 0);
    if (Math.abs(sum - tuition.totalAmount) > 0.01) {
      return res.status(400).json({ message: `The sum of installments (${sum} FCFA) must equal the total tuition fee (${tuition.totalAmount} FCFA)` });
    }

    // Replace installments in a transaction
    await prisma.$transaction([
      prisma.installmentConfig.deleteMany({
        where: { fraisScolariteId }
      }),
      prisma.installmentConfig.createMany({
        data: installments.map(inst => ({
          fraisScolariteId,
          name: inst.name,
          amount: parseFloat(inst.amount),
          dueDate: new Date(inst.dueDate)
        }))
      })
    ]);

    const updated = await prisma.installmentConfig.findMany({
      where: { fraisScolariteId },
      orderBy: { dueDate: 'asc' }
    });

    res.json({ message: 'Installments configured successfully', installments: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get installments by class
router.get('/tranches/classe/:classId', auth, async (req, res) => {
  const { classId } = req.params;
  try {
    const activeYear = await prisma.anneeScolaire.findFirst({
      where: { schoolId: req.user.schoolId, active: true }
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const fee = await prisma.fraisScolarite.findFirst({
      where: { classId, anneeScolaireId: activeYear.id },
      include: {
        installments: {
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    res.json(fee ? fee.installments : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 2. MORATOIRES (Payment Delay Management)
// ----------------------------------------------------

// Grant a moratorium
router.post('/moratoires', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { eleveId, amount, dueDate, remarks } = req.body;
  try {
    if (!eleveId || !amount || !dueDate) {
      return res.status(400).json({ message: 'Student ID, amount, and due date are required' });
    }

    const student = await prisma.eleve.findUnique({
      where: { id: eleveId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const moratorium = await prisma.moratoire.create({
      data: {
        eleveId,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        remarks,
        status: 'PENDING'
      }
    });

    res.status(201).json(moratorium);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all moratoriums in the school
router.get('/moratoires/all', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const moratoriums = await prisma.moratoire.findMany({
      where: {
        eleve: { class: { schoolId: req.user.schoolId } }
      },
      include: {
        eleve: { include: { class: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(moratoriums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete/Cancel a moratorium
// V-006 FIX: Verify moratorium belongs to user's school
router.delete('/moratoires/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  try {
    const moratorium = await prisma.moratoire.findUnique({
      where: { id },
      include: { eleve: { include: { class: true } } }
    });
    if (!moratorium || moratorium.eleve.class.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Moratorium not found' });
    }
    await prisma.moratoire.delete({
      where: { id }
    });
    res.json({ message: 'Moratorium deleted/settled successfully' });
  } catch (err) {
    console.error('[Finance] Delete moratorium error:', err);
    res.status(500).json({ message: 'An internal error occurred' });
  }
});

// ----------------------------------------------------
// 3. SUIVI DES RECETTES ET DÉPENSES (General Transactions)
// ----------------------------------------------------

// Add a transaction
router.post('/transactions', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { type, category, amount, date, description, reference, paymentMethod } = req.body;
  try {
    if (!type || !category || !amount || !description || !paymentMethod) {
      return res.status(400).json({ message: 'Type, category, amount, description, and payment method are required' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        schoolId: req.user.schoolId,
        type, // "INCOME" or "EXPENSE"
        category,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        description,
        reference: reference || null,
        paymentMethod
      }
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all transactions
router.get('/transactions/all', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const list = await prisma.transaction.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { date: 'desc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a transaction record
router.delete('/transactions/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  try {
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx || tx.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. REPORTS & ANALYTICS
// ----------------------------------------------------

// Get aggregated financial data
router.get('/reports', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const data = await getFinancialReportData(req.user.schoolId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export a financial statement PDF report
router.get('/reports/pdf', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId }
    });
    const data = await getFinancialReportData(req.user.schoolId);

    const pdfName = `financial-report-${Date.now()}.pdf`;
    const targetPath = path.join(__dirname, '..', '..', 'public', 'reports', pdfName);
    
    // Ensure directory exists
    const dirname = path.dirname(targetPath);
    if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const writeStream = fs.createWriteStream(targetPath);
    doc.pipe(writeStream);

    const primaryColor = school.pdfPrimaryColor || '#1E3A5F';
    const secondaryColor = school.pdfSecondaryColor || '#F5A623';

    // Page Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(1)
       .stroke(primaryColor);

    // Title
    doc.fillColor(primaryColor)
       .fontSize(18)
       .font('Helvetica-Bold')
       .text(school.name.toUpperCase(), 40, 35)
       .fontSize(12)
       .text('RAPPORT FINANCIER GLOBAL / FINANCIAL REPORT', 40, 55);

    doc.moveTo(40, 80).lineTo(doc.page.width - 40, 80).stroke('#CCCCCC');

    // Stats Block
    doc.fillColor(primaryColor)
       .rect(40, 100, doc.page.width - 80, 25)
       .fill();

    doc.fillColor('#FFFFFF')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('RÉSUMÉ DES COMPTES / ACCOUNT SUMMARY', 50, 108);

    doc.fillColor('#F9FAFB')
       .rect(40, 125, doc.page.width - 80, 110)
       .fill();

    doc.fillColor('#333333')
       .fontSize(9)
       .font('Helvetica')
       .text(`Total Recettes Scolarité (Tuition Revenue):`, 50, 140)
       .font('Helvetica-Bold')
       .text(`${data.tuition.collected.toLocaleString()} FCFA`, 300, 140)

       .font('Helvetica')
       .text(`Autres Recettes (Other Income):`, 50, 160)
       .font('Helvetica-Bold')
       .text(`${data.general.otherIncome.toLocaleString()} FCFA`, 300, 160)

       .font('Helvetica')
       .text(`Dépenses Administratives (General Expenses):`, 50, 180)
       .font('Helvetica-Bold')
       .text(`${data.general.generalExpenses.toLocaleString()} FCFA`, 300, 180)

       .font('Helvetica')
       .text(`Dépenses de Salaires (Payroll Expense):`, 50, 200)
       .font('Helvetica-Bold')
       .text(`${data.general.payrollExpense.toLocaleString()} FCFA`, 300, 200)

       .save()
       .moveTo(40, 220).lineTo(doc.page.width - 40, 220).stroke('#CCCCCC')
       .restore();

    doc.fillColor(primaryColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text(`SOLDE DE CAISSE (FINAL BALANCE):`, 50, 245)
       .text(`${data.totals.balance.toLocaleString()} FCFA`, 300, 245);

    // Detailed tuition collections
    doc.fillColor(primaryColor)
       .rect(40, 280, doc.page.width - 80, 20)
       .fill();

    doc.fillColor('#FFFFFF')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('RECOUVREMENT DES FRAIS DE SCOLARITÉ', 50, 286);

    doc.fillColor('#333333')
       .fontSize(9)
       .font('Helvetica')
       .text(`Scolarité totale attendue (Expected):`, 50, 310)
       .text(`${data.tuition.expected.toLocaleString()} FCFA`, 300, 310)
       .text(`Scolarité totale encaissée (Collected):`, 50, 330)
       .text(`${data.tuition.collected.toLocaleString()} FCFA`, 300, 330)
       .text(`Reste à recouvrer (Outstanding):`, 50, 350)
       .fillColor(secondaryColor)
       .font('Helvetica-Bold')
       .text(`${data.tuition.remaining.toLocaleString()} FCFA`, 300, 350);

    // Date Generated
    doc.fillColor('#999999')
       .fontSize(8)
       .font('Helvetica')
       .text(`Rapport généré électroniquement le : ${new Date().toLocaleString('fr-FR')}`, 40, doc.page.height - 50, { align: 'center' });

    doc.end();
    writeStream.on('finish', () => res.json({ url: `/reports/${pdfName}` }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
