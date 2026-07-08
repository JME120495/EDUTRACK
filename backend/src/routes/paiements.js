const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { sendSMS, sendWhatsAppMessage } = require('../services/notifService');
const { generateEntryForPayment } = require('../services/accountingService');
const { auth, requireRole, requirePlan } = require('../middlewares/authMiddleware');
const { ensureParentAccess } = require('../middlewares/securityMiddleware');

// Require STANDARD, PREMIUM or CUSTOM plan for all payments routes
router.use(auth, requirePlan(['STANDARD', 'PREMIUM', 'CUSTOM']));

// Get payments for all students in a class (including their unpaid balance)
router.get('/classe/:classId', auth, async (req, res) => {
  const { classId } = req.params;
  try {
    const students = await prisma.eleve.findMany({
      where: { classId, status: 'ACTIVE' },
      include: {
        paiements: true
      }
    });

    // Get tuition fee for this class
    const activeYear = await prisma.anneeScolaire.findFirst({
      where: req.selectedYearId ? { schoolId: req.user.schoolId, id: req.selectedYearId } : { schoolId: req.user.schoolId, active: true }
    });

    let totalTuition = 0;
    if (activeYear) {
      const fee = await prisma.fraisScolarite.findFirst({
        where: { classId, anneeScolaireId: activeYear.id }
      });
      if (fee) {
        totalTuition = fee.totalAmount;
      }
    }

    const report = students.map(student => {
      const paid = student.paiements
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, curr) => sum + curr.amount, 0);

      const balance = totalTuition - paid;

      return {
        studentId: student.id,
        studentName: student.name,
        matricule: student.matricule,
        totalTuition,
        amountPaid: paid,
        balance: balance > 0 ? balance : 0,
        status: balance <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
        payments: student.paiements
      };
    });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment history for an individual student (Parent / Director)
// V-007 FIX: Parents can only see their own children's payments
router.get('/eleve/:eleveId', auth, ensureParentAccess('eleveId'), async (req, res) => {
  const { eleveId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const total = await prisma.paiement.count({ where: { eleveId } });
    const payments = await prisma.paiement.findMany({
      where: { eleveId },
      orderBy: { paymentDate: 'desc' },
      skip,
      take: limit
    });
    res.json({
      data: payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record a manual cash/bank payment (Director only)
router.post('/', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { eleveId, amount, paymentMethod, transactionReference, remarks } = req.body;
  try {
    if (!eleveId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Student ID, amount, and payment method are required' });
    }

    const payment = await prisma.paiement.create({
      data: {
        eleveId,
        amount: parseFloat(amount),
        paymentMethod,
        transactionReference: transactionReference || `MANUAL-${Date.now()}`,
        status: 'COMPLETED',
        remarks
      }
    });

    // Auto-generate accounting entry if OHADA is initialized
    await generateEntryForPayment(req.user.schoolId, payment);

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Configure tuition fees for a class (Director only)
router.post('/frais', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { classId, anneeScolaireId, totalAmount } = req.body;
  try {
    if (!classId || !anneeScolaireId || !totalAmount) {
      return res.status(400).json({ message: 'Class ID, Academic Year ID, and total amount are required' });
    }

    const existing = await prisma.fraisScolarite.findFirst({
      where: { classId, anneeScolaireId }
    });

    let fee;
    if (existing) {
      fee = await prisma.fraisScolarite.update({
        where: { id: existing.id },
        data: { totalAmount: parseFloat(totalAmount) }
      });
    } else {
      fee = await prisma.fraisScolarite.create({
        data: { classId, anneeScolaireId, totalAmount: parseFloat(totalAmount) }
      });
    }

    res.json(fee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tuition fee settings
router.get('/frais/all', auth, async (req, res) => {
  try {
    const fees = await prisma.fraisScolarite.findMany({
      where: { class: { schoolId: req.user.schoolId } },
      include: { class: true, anneeScolaire: true }
    });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generic Webhook for Mobile Money (Wave, Orange, MTN MoMo)
// V-020 FIX: Secured with HMAC signature verification + idempotency check
const crypto = require('crypto');

router.post('/webhook', async (req, res) => {
  const { event, studentId, amount, reference, method, phone, remarks } = req.body;
  try {
    // V-020 FIX: Verify webhook signature (HMAC-SHA256)
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];
      if (!signature) {
        console.warn('[Payment Webhook] Missing signature header');
        return res.status(403).json({ message: 'Missing webhook signature' });
      }
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        console.warn('[Payment Webhook] Invalid signature');
        return res.status(403).json({ message: 'Invalid webhook signature' });
      }
    }

    // V-021 FIX: Log only non-sensitive metadata (no body dump)
    console.log(`[Payment Webhook] event=${event} reference=${reference} method=${method}`);

    if (event !== 'payment.success') {
      return res.status(200).json({ status: 'ignored', message: 'Not a success event' });
    }

    if (!reference) {
      return res.status(400).json({ message: 'Transaction reference is required' });
    }

    // V-020 FIX: Idempotency check — prevent duplicate processing
    const existingPayment = await prisma.paiement.findFirst({
      where: { transactionReference: reference }
    });
    if (existingPayment) {
      return res.status(200).json({ status: 'already_processed', message: 'Payment already recorded' });
    }

    const student = await prisma.eleve.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Validate amount is positive
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const payment = await prisma.paiement.create({
      data: {
        eleveId: studentId,
        amount: parsedAmount,
        paymentMethod: method || 'MOBILE_MONEY',
        transactionReference: reference,
        status: 'COMPLETED',
        payerPhone: phone,
        remarks: remarks || 'Mobile Payment Webhook Success'
      }
    });

    // Auto-generate accounting entry if OHADA is initialized
    await generateEntryForPayment(student.schoolId, payment);

    // Notify Parent via SMS
    const parentLinks = await prisma.parentEleve.findMany({
      where: { eleveId: studentId },
      include: { parent: true }
    });

    for (const link of parentLinks) {
      if (link.parent.phone) {
        const msg = link.parent.language === 'FR'
          ? `EduTrack: Paiement mobile reçu de ${parsedAmount} FCFA pour l'élève ${student.name}. Réf: ${payment.transactionReference}.`
          : `EduTrack: Mobile payment of ${parsedAmount} FCFA received for student ${student.name}. Ref: ${payment.transactionReference}.`;
        await sendSMS(link.parent.phone, msg);
      }
    }

    res.json({ status: 'processed', paymentId: payment.id });
  } catch (err) {
    console.error('[Payment Webhook] Error:', err);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

// Simulate payment (for Parent Portal) - No HMAC signature needed, but requires auth
router.post('/simulate', auth, async (req, res) => {
  const { event, studentId, amount, reference, method, phone, remarks } = req.body;
  try {
    if (event !== 'payment.success') {
      return res.status(200).json({ status: 'ignored', message: 'Not a success event' });
    }
    if (!reference) {
      return res.status(400).json({ message: 'Transaction reference is required' });
    }

    const existingPayment = await prisma.paiement.findFirst({
      where: { transactionReference: reference }
    });
    if (existingPayment) {
      return res.status(200).json({ status: 'already_processed', message: 'Payment already recorded' });
    }

    const student = await prisma.eleve.findUnique({
      where: { id: studentId }
    });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const payment = await prisma.paiement.create({
      data: {
        eleveId: studentId,
        amount: parsedAmount,
        paymentMethod: method || 'MOBILE_MONEY',
        transactionReference: reference,
        status: 'COMPLETED',
        payerPhone: phone,
        remarks: remarks || 'Mobile Payment Simulated Success'
      }
    });

    // Auto-generate accounting entry if OHADA is initialized
    await generateEntryForPayment(student.schoolId, payment);

    const parentLinks = await prisma.parentEleve.findMany({
      where: { eleveId: studentId },
      include: { parent: true }
    });

    for (const link of parentLinks) {
      if (link.parent.phone) {
        const msg = link.parent.language === 'FR'
          ? `EduTrack: Paiement mobile reçu de ${parsedAmount} FCFA pour l'élève ${student.name}. Réf: ${payment.transactionReference}.`
          : `EduTrack: Mobile payment of ${parsedAmount} FCFA received for student ${student.name}. Ref: ${payment.transactionReference}.`;
        await sendSMS(link.parent.phone, msg);
      }
    }

    res.json({ status: 'processed', paymentId: payment.id });
  } catch (err) {
    console.error('[Payment Simulate] Error:', err);
    res.status(500).json({ message: 'Simulation processing error' });
  }
});

// Trigger unpaid fee reminders (Director only)
router.post('/unpaid-alerts', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { classId } = req.body;
  try {
    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }

    const activeYear = await prisma.anneeScolaire.findFirst({
      where: req.selectedYearId ? { schoolId: req.user.schoolId, id: req.selectedYearId } : { schoolId: req.user.schoolId, active: true }
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year' });
    }

    const fee = await prisma.fraisScolarite.findFirst({
      where: { classId, anneeScolaireId: activeYear.id }
    });

    if (!fee) {
      return res.status(400).json({ message: 'No tuition fee config found for this class' });
    }

    const students = await prisma.eleve.findMany({
      where: { classId, status: 'ACTIVE' },
      include: {
        paiements: true,
        parents: { include: { parent: true } }
      }
    });

    let alertCount = 0;
    for (const student of students) {
      const paid = student.paiements
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, curr) => sum + curr.amount, 0);

      const balance = fee.totalAmount - paid;
      if (balance > 0) {
        // Send SMS to parents
        for (const link of student.parents) {
          if (link.parent.phone) {
            const msg = link.parent.language === 'FR'
              ? `Rappel EduTrack: Il reste un solde de scolarité impayé de ${balance} FCFA pour l'élève ${student.name}. Veuillez régulariser dès que possible.`
              : `EduTrack Reminder: There is an unpaid tuition balance of ${balance} FCFA for student ${student.name}. Please settle as soon as possible.`;
            await sendSMS(link.parent.phone, msg);
            alertCount++;
          }
        }
      }
    }

    res.json({ message: 'Reminders sent successfully', alertCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a single custom reminder (individual)
router.post('/send-reminder', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { phone, message } = req.body;
  try {
    if (!phone || !message) {
      return res.status(400).json({ message: 'Phone and message are required' });
    }

    // Create an internal message
    const parent = await prisma.user.findFirst({ where: { phone, role: 'PARENT' } });
    if (parent) {
      await prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId: parent.id,
          title: 'Alerte Scolarité',
          content: message
        }
      });
    }

    const result = await sendWhatsAppMessage(phone, message);
    res.json({ ...result, internalMessageSent: !!parent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger reminders to ALL parents with unpaid tuition in the entire school
router.post('/send-unpaid-reminders-all', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  try {
    const activeYear = await prisma.anneeScolaire.findFirst({
      where: req.selectedYearId ? { schoolId: req.user.schoolId, id: req.selectedYearId } : { schoolId: req.user.schoolId, active: true }
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const fees = await prisma.fraisScolarite.findMany({
      where: { anneeScolaireId: activeYear.id }
    });

    const tuitionMap = {};
    fees.forEach(f => {
      tuitionMap[f.classId] = f.totalAmount;
    });

    const students = await prisma.eleve.findMany({
      where: {
        class: { schoolId: req.user.schoolId },
        status: 'ACTIVE'
      },
      include: {
        paiements: true,
        parents: { include: { parent: true } }
      }
    });

    let alertCount = 0;
    const sent = [];
    const failed = [];

    for (const student of students) {
      const totalTuition = tuitionMap[student.classId] || 150000;
      const paid = student.paiements
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, curr) => sum + curr.amount, 0);

      const balance = totalTuition - paid;
      if (balance > 0) {
        for (const link of student.parents) {
          if (link.parent.phone) {
            try {
              const msg = link.parent.language === 'FR'
                ? `Rappel Scolarité EduTrack: Cher parent, il reste un solde impayé de ${balance.toLocaleString()} FCFA pour les frais de scolarité de votre enfant ${student.name}. Merci de régulariser.`
                : `EduTrack Tuition Reminder: Dear parent, there is an unpaid balance of ${balance.toLocaleString()} FCFA for your child ${student.name}. Please settle it as soon as possible.`;
              
              await sendWhatsAppMessage(link.parent.phone, msg);
              sent.push({ studentName: student.name, parentPhone: link.parent.phone, balance });
              alertCount++;
            } catch (e) {
              failed.push({ studentName: student.name, parentPhone: link.parent.phone, error: e.message });
            }
          }
        }
      }
    }

    res.json({
      message: 'Unpaid tuition reminders broadcast complete',
      alertCount,
      sentCount: sent.length,
      failedCount: failed.length,
      sent,
      failed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Broadcast custom announcement message to all parents in the school
router.post('/broadcast-announcement', auth, requireRole(['DIRECTOR', 'INTENDANT']), async (req, res) => {
  const { message } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ message: 'Message content is required' });
  }

  try {
    const parents = await prisma.user.findMany({
      where: {
        role: 'PARENT',
        schoolId: req.user.schoolId,
        children: {
          some: {
            eleve: { status: 'ACTIVE' }
          }
        }
      }
    });

    const sent = [];
    const failed = [];

    for (const parent of parents) {
      if (parent.phone) {
        try {
          await sendWhatsAppMessage(parent.phone, message);
          sent.push({ parentName: parent.name, phone: parent.phone });
        } catch (e) {
          failed.push({ parentName: parent.name, phone: parent.phone, error: e.message });
        }
      }
    }

    res.json({
      message: 'Announcement broadcast completed',
      sentCount: sent.length,
      failedCount: failed.length,
      sent,
      failed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
