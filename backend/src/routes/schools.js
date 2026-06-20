const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get school details
router.get('/', auth, async (req, res) => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId }
    });
    res.json(school);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update school settings (Director only)
const updateSettings = async (req, res) => {
  const { name, logo, defaultLanguage, phone, address, email, currency, pdfTheme, pdfPrimaryColor, pdfSecondaryColor, pdfShowBorder } = req.body;
  try {
    const dataToUpdate = { 
        name, 
        logo, 
        defaultLanguage, 
        phone, 
        address, 
        email,
        pdfTheme,
        pdfPrimaryColor,
        pdfSecondaryColor,
        pdfShowBorder: pdfShowBorder !== undefined ? pdfShowBorder !== false : undefined
      };
      
    if (currency) {
      dataToUpdate.currency = currency;
    }

    const updated = await prisma.school.update({
      where: { id: req.user.schoolId },
      data: dataToUpdate
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.put('/', auth, requireRole(['DIRECTOR']), updateSettings);
router.put('/settings', auth, requireRole(['DIRECTOR']), updateSettings);

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/authMiddleware');

// Update subscription plan (Director only)
router.put('/plan', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { plan } = req.body;
  try {
    if (!['ESSENTIAL', 'STANDARD', 'PREMIUM', 'CUSTOM'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }
    const updated = await prisma.school.update({
      where: { id: req.user.schoolId },
      data: { subscriptionPlan: plan }
    });

    // Generate a new token with the updated subscription plan
    const token = jwt.sign(
      { 
        userId: req.user.id, 
        role: req.user.role, 
        schoolId: req.user.schoolId,
        subscriptionPlan: updated.subscriptionPlan,
        name: req.user.name,
        schoolName: req.user.school.name,
        currency: req.user.school.currency
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Plan updated successfully', plan: updated.subscriptionPlan, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Renew/Pay monthly or annual subscription (Director only)
router.post('/pay-subscription', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { months = 1 } = req.body;
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId }
    });

    const now = new Date();
    let baseDate = now;
    if (school.subscriptionExpiresAt && new Date(school.subscriptionExpiresAt) > now) {
      baseDate = new Date(school.subscriptionExpiresAt);
    }

    const nextExpiry = new Date(baseDate.getTime() + (months * 30) * 24 * 60 * 60 * 1000); // add 30 days * months

    const updated = await prisma.school.update({
      where: { id: req.user.schoolId },
      data: { subscriptionExpiresAt: nextExpiry }
    });

    res.json({ message: 'Subscription paid successfully', subscriptionExpiresAt: updated.subscriptionExpiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
