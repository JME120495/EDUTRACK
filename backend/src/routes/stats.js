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
      where: req.selectedYearId ? { schoolId, id: req.selectedYearId } : { schoolId, active: true }
    });

    if (!activeYear) {
      return res.json({
        stats: {
          studentsCount: 0,
          boysCount: 0,
          girlsCount: 0,
          sickCount: 0,
          disabledCount: 0,
          teachersCount: 0,
          collectionRate: 0,
          totalRevenue: 0
        },
        alerts: [],
        chartData: [],
        academicYears: [],
        activeYear: null
      });
    }

    // 1. Students Count & Demographics (Parallel optimized counts)
    const [
      studentsCount,
      boysCount,
      girlsCount,
      sickCount,
      disabledCount,
      teachersCount
    ] = await Promise.all([
      prisma.eleve.count({
        where: { class: { schoolId, anneeScolaireId: activeYear.id }, status: 'ACTIVE' }
      }),
      prisma.eleve.count({
        where: {
          class: { schoolId, anneeScolaireId: activeYear.id },
          status: 'ACTIVE',
          gender: { in: ['M', 'Garçon', 'Male', 'G'] }
        }
      }),
      prisma.eleve.count({
        where: {
          class: { schoolId, anneeScolaireId: activeYear.id },
          status: 'ACTIVE',
          gender: { in: ['F', 'Fille', 'Female', 'Fil'] }
        }
      }),
      prisma.eleve.count({
        where: { class: { schoolId, anneeScolaireId: activeYear.id }, status: 'ACTIVE', isSick: true }
      }),
      prisma.eleve.count({
        where: { class: { schoolId, anneeScolaireId: activeYear.id }, status: 'ACTIVE', hasDisability: true }
      }),
      prisma.user.count({
        where: { schoolId, role: 'TEACHER' }
      })
    ]);

    // 2. Finances (Optimized)
    // Get total tuition expected
    const fees = await prisma.fraisScolarite.findMany({
      where: { anneeScolaireId: activeYear.id },
      select: { classId: true, totalAmount: true }
    });
    
    const classStudentCounts = await prisma.eleve.groupBy({
      by: ['classId'],
      where: { class: { schoolId, anneeScolaireId: activeYear.id }, status: 'ACTIVE' },
      _count: { id: true }
    });

    let totalTuitionExpected = 0;
    classStudentCounts.forEach(c => {
      const fee = fees.find(f => f.classId === c.classId);
      if (fee) {
        totalTuitionExpected += fee.totalAmount * c._count.id;
      }
    });

    // Get total tuition collected
    const tuitionPayments = await prisma.paiement.aggregate({
      where: { 
        eleve: { class: { schoolId, anneeScolaireId: activeYear.id } }, 
        status: 'COMPLETED' 
      },
      _sum: { amount: true }
    });
    const totalTuitionCollected = tuitionPayments._sum.amount || 0;

    // Get other income
    const generalTransactions = await prisma.transaction.aggregate({
      where: { schoolId, type: 'INCOME' },
      _sum: { amount: true }
    });
    const otherIncome = generalTransactions._sum.amount || 0;

    const totalRevenue = totalTuitionCollected + otherIncome;
    const collectionRate = totalTuitionExpected > 0 ? Number(((totalTuitionCollected / totalTuitionExpected) * 100).toFixed(1)) : 0;

    // 3. Unpaid Alerts (Debtors) - top 15
    const activeStudentsForAlerts = await prisma.eleve.findMany({
      where: { 
        class: { schoolId, anneeScolaireId: activeYear.id }, 
        status: 'ACTIVE' 
      },
      select: {
        id: true,
        name: true,
        classId: true,
        class: { select: { name: true } },
        paiements: {
          where: { status: 'COMPLETED' },
          select: { amount: true }
        }
      }
    });

    const unpaidAlerts = [];
    const feeMap = {};
    fees.forEach(f => {
      feeMap[f.classId] = f.totalAmount;
    });

    activeStudentsForAlerts.forEach(student => {
      const expected = feeMap[student.classId] || 0;
      const paid = student.paiements.reduce((sum, p) => sum + p.amount, 0);
      if (expected > 0 && paid < expected) {
        unpaidAlerts.push({
          id: student.id,
          name: student.name,
          class: student.class.name,
          amountDue: expected,
          amountPaid: paid,
          parentPhone: null
        });
      }
    });

    unpaidAlerts.sort((a, b) => (b.amountDue - b.amountPaid) - (a.amountDue - a.amountPaid));
    const topAlerts = unpaidAlerts.slice(0, 15);

    if (topAlerts.length > 0) {
      const debtorIds = topAlerts.map(a => a.id);
      const debtorParents = await prisma.parentEleve.findMany({
        where: { eleveId: { in: debtorIds } },
        include: { parent: true }
      });
      
      topAlerts.forEach(alert => {
        const parentLink = debtorParents.find(p => p.eleveId === alert.id);
        alert.parentPhone = parentLink ? parentLink.parent.phone : null;
      });
    }

    // 4. Chart Data (Class Averages) - Raw SQL (Cross-compatible ANSI SQL)
    let chartData = [];
    try {
      const rawChartData = await prisma.$queryRaw`
        SELECT c.name as name, AVG(n.value) as avg
        FROM "Classe" c
        JOIN "Eleve" e ON e."classId" = c.id
        JOIN "Note" n ON n."eleveId" = e.id
        WHERE c."schoolId" = ${schoolId} AND c."anneeScolaireId" = ${activeYear.id}
        GROUP BY c.id, c.name
      `;
      chartData = rawChartData.map(item => ({
        name: item.name,
        avg: item.avg ? Number(Number(item.avg).toFixed(2)) : 0,
        coefficient: 1
      }));
    } catch (sqlErr) {
      console.warn("SQL Query failed, falling back to safe Prisma query:", sqlErr);
      const classes = await prisma.classe.findMany({
        where: { schoolId, anneeScolaireId: activeYear.id },
        select: {
          name: true,
          eleves: {
            select: {
              notes: { select: { value: true } }
            }
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

    const academicYears = await prisma.anneeScolaire.findMany({
      where: { schoolId },
      orderBy: { label: 'desc' }
    });

    res.json({
      stats: {
        studentsCount,
        boysCount,
        girlsCount,
        sickCount,
        disabledCount,
        teachersCount,
        collectionRate,
        totalRevenue
      },
      alerts: topAlerts,
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
