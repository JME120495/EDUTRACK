const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole, requirePlan } = require('../middlewares/authMiddleware');
const { generatePayslipPDF } = require('../services/pdfGeneratorService');

// Require PREMIUM or CUSTOM plan for all HR routes
router.use(auth, requirePlan(['PREMIUM', 'CUSTOM']));

// ----------------------------------------------------
// 1. PERSONNEL & CONTRATS (Staff & Contracts)
// ----------------------------------------------------

// Get all staff (Teachers + Directors + administrative staff)
router.get('/staff', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        schoolId: req.user.schoolId,
        role: { in: ['DIRECTOR', 'TEACHER', 'STAFF', 'CENSEUR', 'INTENDANT', 'SUPPORT'] } // Non-parent roles
      },
      include: {
        contracts: true,
        leaves: { where: { status: 'APPROVED' } }
      }
    });

    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a contract
router.post('/contracts', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { userId, type, startDate, endDate, baseSalary, hourlyRate, status, terms } = req.body;
  try {
    if (!userId || !type || !startDate) {
      return res.status(400).json({ message: 'User ID, Contract Type, and Start Date are required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set other contracts for this user to INACTIVE if status is ACTIVE
    if (status === 'ACTIVE') {
      await prisma.contract.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'INACTIVE' }
      });
    }

    const contract = await prisma.contract.create({
      data: {
        userId,
        type,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        baseSalary: parseFloat(baseSalary) || 0.0,
        hourlyRate: parseFloat(hourlyRate) || 0.0,
        status: status || 'ACTIVE',
        terms
      }
    });

    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disable/delete contract
// V-006 FIX: Verify contract belongs to user's school
router.delete('/contracts/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: { user: true }
    });
    if (!contract || contract.user.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    await prisma.contract.delete({ where: { id } });
    res.json({ message: 'Contract deleted successfully' });
  } catch (err) {
    console.error('[HR] Delete contract error:', err);
    res.status(500).json({ message: 'An internal error occurred' });
  }
});

// ----------------------------------------------------
// 2. AVANCES SUR SALAIRE (Salary Advances)
// ----------------------------------------------------

// Request salary advance
router.post('/advances', auth, async (req, res) => {
  const { amount, repaymentMonth, repaymentYear, remarks, userId } = req.body;
  // If director, can request for anyone. If staff, only for themselves.
  const targetUserId = req.user.role === 'DIRECTOR' ? (userId || req.user.id) : req.user.id;

  try {
    if (!amount || !repaymentMonth || !repaymentYear) {
      return res.status(400).json({ message: 'Amount and repayment month/year are required' });
    }

    const advance = await prisma.salaryAdvance.create({
      data: {
        userId: targetUserId,
        amount: parseFloat(amount),
        repaymentMonth: parseInt(repaymentMonth),
        repaymentYear: parseInt(repaymentYear),
        remarks,
        status: req.user.role === 'DIRECTOR' ? 'APPROVED' : 'PENDING'
      }
    });

    res.status(201).json(advance);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all advances
router.get('/advances', auth, async (req, res) => {
  try {
    // Staff can only see their own advances. Director sees all.
    const whereClause = req.user.role === 'DIRECTOR' 
      ? { user: { schoolId: req.user.schoolId } } 
      : { userId: req.user.id };

    const list = await prisma.salaryAdvance.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: { requestDate: 'desc' }
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/Reject advance
router.put('/advances/:id/status', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "APPROVED" or "REJECTED"
  try {
    const updated = await prisma.salaryAdvance.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. CONGÉS & PERMISSIONS (Leave management)
// ----------------------------------------------------

// Request a leave
router.post('/leaves', auth, async (req, res) => {
  const { type, startDate, endDate, reason, userId } = req.body;
  const targetUserId = req.user.role === 'DIRECTOR' ? (userId || req.user.id) : req.user.id;

  try {
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ message: 'Type, Start Date and End Date are required' });
    }

    const leave = await prisma.staffLeave.create({
      data: {
        userId: targetUserId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        status: req.user.role === 'DIRECTOR' ? 'APPROVED' : 'PENDING'
      }
    });

    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get leaves list
router.get('/leaves', auth, async (req, res) => {
  try {
    const whereClause = req.user.role === 'DIRECTOR' 
      ? { user: { schoolId: req.user.schoolId } } 
      : { userId: req.user.id };

    const list = await prisma.staffLeave.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: { startDate: 'desc' }
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/Reject leave
router.put('/leaves/:id/status', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "APPROVED" or "REJECTED"
  try {
    const updated = await prisma.staffLeave.update({
      where: { id },
      data: { status }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 4. BULLETINS DE PAIE (Payslips)
// ----------------------------------------------------

// Get all payslips
router.get('/payslips', auth, async (req, res) => {
  try {
    const whereClause = req.user.role === 'DIRECTOR'
      ? { user: { schoolId: req.user.schoolId } }
      : { userId: req.user.id };

    const list = await prisma.payslip.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate payslips for all staff for a month
router.post('/payslips/generate', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { month, year, customAdjustments } = req.body; // customAdjustments: { [userId]: { bonuses: 10000, deductions: 5000 } }
  try {
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and Year are required' });
    }

    // Get all staff contracts that are active
    const activeContracts = await prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        user: { schoolId: req.user.schoolId }
      },
      include: { user: true }
    });

    const generatedPayslips = [];

    for (const contract of activeContracts) {
      const user = contract.user;
      const baseSalary = contract.baseSalary;
      const hourlyRate = contract.hourlyRate;

      // Calculate hours worked if teacher and hourly paid
      let hoursWorked = 0;
      if (user.role === 'TEACHER') {
        const assignments = await prisma.enseignantMatiereClasse.findMany({
          where: { teacherId: user.id }
        });
        hoursWorked = assignments.reduce((sum, a) => sum + a.hoursTaught, 0);
      }

      // Find approved advances for this month
      const advances = await prisma.salaryAdvance.findMany({
        where: {
          userId: user.id,
          status: 'APPROVED',
          repaymentMonth: parseInt(month),
          repaymentYear: parseInt(year)
        }
      });

      const advancesDeducted = advances.reduce((sum, a) => sum + a.amount, 0);

      // Custom adjustments
      const adjustments = (customAdjustments && customAdjustments[user.id]) || {};
      const bonuses = parseFloat(adjustments.bonuses) || 0.0;
      const deductions = parseFloat(adjustments.deductions) || 0.0;

      const hourlyEarnings = hourlyRate * hoursWorked;
      const netSalary = baseSalary + hourlyEarnings + bonuses - deductions - advancesDeducted;

      // Delete existing payslip for this month if exists
      await prisma.payslip.deleteMany({
        where: { userId: user.id, month: parseInt(month), year: parseInt(year) }
      });

      // Create payslip
      const payslip = await prisma.payslip.create({
        data: {
          userId: user.id,
          month: parseInt(month),
          year: parseInt(year),
          baseSalary,
          hourlyRate,
          hoursWorked,
          bonuses,
          deductions,
          advancesDeducted,
          netSalary: netSalary > 0 ? netSalary : 0,
          status: 'PENDING'
        }
      });

      // Update advances to REPAID
      if (advances.length > 0) {
        await prisma.salaryAdvance.updateMany({
          where: { id: { in: advances.map(a => a.id) } },
          data: { status: 'REPAID' }
        });
      }

      // Generate PDF in background/async
      try {
        const pdfUrl = await generatePayslipPDF(payslip.id);
        await prisma.payslip.update({
          where: { id: payslip.id },
          data: { pdfUrl }
        });
      } catch (pdfErr) {
        console.error(`Failed to generate PDF for payslip ${payslip.id}:`, pdfErr);
      }

      generatedPayslips.push(payslip);
    }

    res.status(201).json({ message: 'Payslips generated successfully', count: generatedPayslips.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update payslip status to PAID (Mark as paid and add to expenses)
router.put('/payslips/:id/pay', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  const { paymentMethod } = req.body; // "CASH", "BANK", etc.
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    if (payslip.status === 'PAID') {
      return res.status(400).json({ message: 'Payslip is already paid' });
    }

    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthStr = months[payslip.month - 1] || payslip.month.toString();

    // Mark as PAID and add to cashflow as EXPENSE
    await prisma.$transaction([
      prisma.payslip.update({
        where: { id },
        data: {
          status: 'PAID',
          paymentDate: new Date(),
          paymentMethod: paymentMethod || 'CASH'
        }
      }),
      prisma.transaction.create({
        data: {
          schoolId: req.user.schoolId,
          type: 'EXPENSE',
          category: 'SALARY',
          amount: payslip.netSalary,
          date: new Date(),
          description: `Paiement salaire ${payslip.user.name} - ${monthStr} ${payslip.year}`,
          paymentMethod: paymentMethod || 'CASH'
        }
      })
    ]);

    res.json({ message: 'Payslip marked as paid and expense logged' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. MISSING CRUD ENDPOINTS (Edit/Delete)
// ----------------------------------------------------

// Edit contract
router.put('/contracts/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  const { type, startDate, endDate, baseSalary, hourlyRate, status, terms } = req.body;
  try {
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
        baseSalary: parseFloat(baseSalary) || 0.0,
        hourlyRate: parseFloat(hourlyRate) || 0.0,
        status,
        terms
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete advance
router.delete('/advances/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.salaryAdvance.delete({ where: { id } });
    res.json({ message: 'Advance deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit advance
router.put('/advances/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  const { amount, repaymentMonth, repaymentYear, remarks } = req.body;
  try {
    const updated = await prisma.salaryAdvance.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        repaymentMonth: parseInt(repaymentMonth),
        repaymentYear: parseInt(repaymentYear),
        remarks
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete leave
router.delete('/leaves/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.staffLeave.delete({ where: { id } });
    res.json({ message: 'Leave deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit leave
router.put('/leaves/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  const { type, startDate, endDate, reason } = req.body;
  try {
    const updated = await prisma.staffLeave.update({
      where: { id },
      data: {
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        reason
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete payslip
router.delete('/payslips/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.payslip.delete({ where: { id } });
    res.json({ message: 'Payslip deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit payslip
router.put('/payslips/:id', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { id } = req.params;
  const { baseSalary, hourlyRate, hoursWorked, bonuses, deductions, advancesDeducted } = req.body;
  try {
    const bs = parseFloat(baseSalary) || 0;
    const hr = parseFloat(hourlyRate) || 0;
    const hw = parseFloat(hoursWorked) || 0;
    const b = parseFloat(bonuses) || 0;
    const d = parseFloat(deductions) || 0;
    const ad = parseFloat(advancesDeducted) || 0;
    
    let netSalary = bs + (hr * hw) + b - d - ad;
    if (netSalary < 0) netSalary = 0;

    const updated = await prisma.payslip.update({
      where: { id },
      data: {
        baseSalary: bs,
        hourlyRate: hr,
        hoursWorked: hw,
        bonuses: b,
        deductions: d,
        advancesDeducted: ad,
        netSalary
      }
    });
    
    // Regenerate PDF
    try {
      const pdfUrl = await generatePayslipPDF(updated.id);
      await prisma.payslip.update({
        where: { id: updated.id },
        data: { pdfUrl }
      });
    } catch (pdfErr) {
      console.error(`Failed to generate PDF for payslip ${updated.id}:`, pdfErr);
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
