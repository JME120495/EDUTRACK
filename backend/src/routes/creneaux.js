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

// Generate default time slots
router.post('/generate-default', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  try {
    const existing = await prisma.creneauHoraire.count({
      where: { schoolId: req.user.schoolId }
    });

    if (existing > 0) {
      return res.status(400).json({ message: 'Des créneaux existent déjà. Veuillez les supprimer avant de générer ceux par défaut.' });
    }

    const defaultSlots = [
      { startTime: '07:30', endTime: '08:25', label: 'M1', order: 1 },
      { startTime: '08:25', endTime: '09:20', label: 'M2', order: 2 },
      { startTime: '09:20', endTime: '10:15', label: 'M3', order: 3 },
      { startTime: '10:30', endTime: '11:25', label: 'M4', order: 4 },
      { startTime: '11:25', endTime: '12:20', label: 'M5', order: 5 },
      { startTime: '12:40', endTime: '13:35', label: 'M6', order: 6 },
      { startTime: '13:35', endTime: '14:30', label: 'M7', order: 7 },
      { startTime: '14:30', endTime: '15:25', label: 'M8', order: 8 }
    ];

    await prisma.creneauHoraire.createMany({
      data: defaultSlots.map(slot => ({
        schoolId: req.user.schoolId,
        ...slot
      }))
    });

    const creneaux = await prisma.creneauHoraire.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { order: 'asc' }
    });
    
    res.status(201).json({ message: 'Créneaux par défaut générés', creneaux });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update time slot (Director or Censeur)
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
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

// Delete time slot (Director or Censeur)
router.delete('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
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

// Update time slot (Director or Censeur)
router.put('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
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
