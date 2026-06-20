const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all annees scolaires for the school
router.get('/', auth, async (req, res) => {
  try {
    const annees = await prisma.anneeScolaire.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(annees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new annee scolaire
router.post('/', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { label, active } = req.body;
  try {
    if (!label) {
      return res.status(400).json({ message: 'Label is required' });
    }

    if (active) {
      // Deactivate all others
      await prisma.anneeScolaire.updateMany({
        where: { schoolId: req.user.schoolId },
        data: { active: false }
      });
    }

    const annee = await prisma.anneeScolaire.create({
      data: {
        schoolId: req.user.schoolId,
        label,
        active: active || false
      }
    });
    res.status(201).json(annee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update annee scolaire
router.put('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { label, active } = req.body;
  const { id } = req.params;
  try {
    const annee = await prisma.anneeScolaire.findUnique({ where: { id } });
    if (!annee || annee.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Not found' });
    }

    if (active && !annee.active) {
      // Deactivate all others
      await prisma.anneeScolaire.updateMany({
        where: { schoolId: req.user.schoolId },
        data: { active: false }
      });
    }

    const updated = await prisma.anneeScolaire.update({
      where: { id },
      data: { label, active }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete annee scolaire
router.delete('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    const annee = await prisma.anneeScolaire.findUnique({ where: { id } });
    if (!annee || annee.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Not found' });
    }

    await prisma.anneeScolaire.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    // Check if it's a foreign key constraint violation
    if (err.code === 'P2003') {
      return res.status(400).json({ message: 'Cannot delete: this academic year is already linked to classes or payments.' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
