const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all time slots
router.get('/', auth, async (req, res) => {
  try {
    const creneaux = await prisma.creneauHoraire.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { order: 'asc' }
    });
    res.json(creneaux);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update time slot (Director only)
router.post('/', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { startTime, endTime, label, order } = req.body;
  try {
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and End time are required' });
    }

    const creneau = await prisma.creneauHoraire.create({
      data: {
        schoolId: req.user.schoolId,
        startTime,
        endTime,
        label: label || `${startTime}-${endTime}`,
        order: parseInt(order) || 0
      }
    });

    res.status(201).json(creneau);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete time slot (Director only)
router.delete('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.creneauHoraire.delete({
      where: { id }
    });
    res.json({ message: 'Time slot deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update time slot (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  const { startTime, endTime, label, order } = req.body;
  try {
    const updated = await prisma.creneauHoraire.update({
      where: { id },
      data: {
        startTime,
        endTime,
        label,
        order: order !== undefined ? parseInt(order) : undefined
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
