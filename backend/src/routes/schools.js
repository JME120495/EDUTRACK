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
  const { name, logo, defaultLanguage, phone, address, email, pdfTheme, pdfPrimaryColor, pdfSecondaryColor, pdfShowBorder } = req.body;
  try {
    const updated = await prisma.school.update({
      where: { id: req.user.schoolId },
      data: { 
        name, 
        logo, 
        defaultLanguage, 
        phone, 
        address, 
        email,
        pdfTheme,
        pdfPrimaryColor,
        pdfSecondaryColor,
        pdfShowBorder: pdfShowBorder !== false
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.put('/', auth, requireRole(['DIRECTOR']), updateSettings);
router.put('/settings', auth, requireRole(['DIRECTOR']), updateSettings);

// Renew/Pay monthly subscription (Director only)
router.post('/pay-subscription', auth, requireRole(['DIRECTOR']), async (req, res) => {
  try {
    const school = await prisma.school.findUnique({
      where: { id: req.user.schoolId }
    });

    const now = new Date();
    let baseDate = now;
    if (school.subscriptionExpiresAt && new Date(school.subscriptionExpiresAt) > now) {
      baseDate = new Date(school.subscriptionExpiresAt);
    }

    const nextExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000); // add 30 days

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
