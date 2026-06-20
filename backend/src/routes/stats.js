const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all dashboard stats in one request
router.get('/dashboard', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const schoolId = req.user.schoolId;

  try {
    // Active Year
    const activeYear = await prisma.anneeScolaire.findFirst({
      where: { schoolId, active: true }
    });

    // 1. Students Count (only for active year)
    let studentsCount = 0;
    if (activeYear) {
      studentsCount = await prisma.eleve.count({
        where: {
          class: { schoolId, anneeScolaireId: activeYear.id },
          status: 'ACTIVE'
        }
      });
    }

    // 2. Teachers Count (global for school)
    const teachersCount = await prisma.user.count({
      where: {
        schoolId,
        role: 'TEACHER'
      }
    });

    let totalTuitionExpected = 0;
    let totalTuitionCollected = 0;
    const unpaidAlerts = [];
    let chartData = [];

    if (activeYear) {
      // 3. Finances
      const fees = await prisma.fraisScolarite.findMany({
        where: { anneeScolaireId: activeYear.id }
      });
      
      const feeMap = {};
      fees.forEach(f => {
        feeMap[f.classId] = f.totalAmount;
      });

      const allActiveStudents = await prisma.eleve.findMany({
        where: { class: { schoolId }, status: 'ACTIVE' },
        include: {
          class: true,
          paiements: { where: { status: 'COMPLETED' } },
          parents: { include: { parent: true } }
        }
      });

      for (const student of allActiveStudents) {
        const expected = feeMap[student.classId] || 0;
        totalTuitionExpected += expected;

        const paid = student.paiements.reduce((sum, p) => sum + p.amount, 0);
        
        // Build Alerts
        if (expected > 0 && paid < expected) {
          unpaidAlerts.push({
            id: student.id,
            name: student.name,
            class: student.class.name,
            amountDue: expected,
            amountPaid: paid,
            parentPhone: student.parents.length > 0 ? student.parents[0].parent.phone : null
          });
        }
      }

      const tuitionPayments = await prisma.paiement.findMany({
        where: { eleve: { class: { schoolId } }, status: 'COMPLETED' }
      });
      totalTuitionCollected = tuitionPayments.reduce((sum, p) => sum + p.amount, 0);

      // 4. Chart Data (Class Averages based on all individual notes)
      const classes = await prisma.classe.findMany({
        where: { schoolId, anneeScolaireId: activeYear.id },
        include: {
          eleves: {
            include: { notes: true }
          }
        }
      });

      chartData = classes.map(c => {
        let totalNotes = 0;
        let notesCount = 0;
        c.eleves.forEach(student => {
          student.notes.forEach(note => {
            totalNotes += note.value;
            notesCount++;
          });
        });
        return {
          name: c.name,
          avg: notesCount > 0 ? Number((totalNotes / notesCount).toFixed(2)) : 0,
          coefficient: 1
        };
      });
    }

    const generalTransactions = await prisma.transaction.findMany({
      where: { schoolId }
    });
    const otherIncome = generalTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRevenue = totalTuitionCollected + otherIncome;
    const collectionRate = totalTuitionExpected > 0 ? Number(((totalTuitionCollected / totalTuitionExpected) * 100).toFixed(1)) : 0;

    // Sort unpaid alerts by highest remaining balance
    unpaidAlerts.sort((a, b) => (b.amountDue - b.amountPaid) - (a.amountDue - a.amountPaid));

    const academicYears = await prisma.anneeScolaire.findMany({
      where: { schoolId },
      orderBy: { label: 'desc' }
    });

    res.json({
      stats: {
        studentsCount,
        teachersCount,
        collectionRate,
        totalRevenue
      },
      alerts: unpaidAlerts.slice(0, 15), // top 15 debtors
      chartData,
      academicYears,
      activeYear
    });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
