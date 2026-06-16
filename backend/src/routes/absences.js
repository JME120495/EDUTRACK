const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get absences for a student
router.get('/eleve/:eleveId', auth, async (req, res) => {
  const { eleveId } = req.params;
  try {
    const absences = await prisma.absence.findMany({
      where: { eleveId },
      include: { sequence: true },
      orderBy: { date: 'desc' }
    });
    res.json(absences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register absence
router.post('/', auth, requireRole(['TEACHER', 'DIRECTOR']), async (req, res) => {
  const { eleveId, sequenceId, date, hours, justified, reason } = req.body;
  try {
    if (!eleveId || !sequenceId || !hours) {
      return res.status(400).json({ message: 'Student ID, Sequence ID, and hours are required' });
    }

    const absence = await prisma.absence.create({
      data: {
        eleveId,
        sequenceId,
        date: date ? new Date(date) : new Date(),
        hours: parseFloat(hours),
        justified: justified || false,
        reason: reason || ''
      }
    });

    res.status(201).json(absence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update absence justification
router.put('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { justified, reason } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.absence.update({
      where: { id },
      data: { justified, reason }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get absences for a class on a specific date
router.get('/classe/:classId/date/:dateString', auth, async (req, res) => {
  const { classId, dateString } = req.params;
  const { sequenceId } = req.query;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    const start = new Date(dateString);
    start.setHours(0,0,0,0);
    const end = new Date(dateString);
    end.setHours(23,59,59,999);

    const absences = await prisma.absence.findMany({
      where: {
        sequenceId: sequenceId || undefined,
        date: { gte: start, lte: end },
        eleve: { classId }
      }
    });
    res.json(absences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk register absences for a class (roll call)
router.post('/bulk', auth, requireRole(['TEACHER', 'DIRECTOR']), async (req, res) => {
  const { classId, sequenceId, date, absences } = req.body; // absences: Array of { eleveId, hours, reason }
  try {
    if (!classId || !sequenceId || !date || !Array.isArray(absences)) {
      return res.status(400).json({ message: 'Class ID, Sequence ID, Date, and absences list are required' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const start = new Date(date);
    start.setHours(0,0,0,0);
    const end = new Date(date);
    end.setHours(23,59,59,999);

    // Delete existing absences for the students of this class on this date & sequence
    await prisma.absence.deleteMany({
      where: {
        sequenceId,
        date: { gte: start, lte: end },
        eleve: { classId }
      }
    });

    // Create new absences
    const toCreate = absences.map(item => ({
      eleveId: item.eleveId,
      sequenceId,
      date: parsedDate,
      hours: parseFloat(item.hours || 1),
      justified: false,
      reason: item.reason || ''
    }));

    if (toCreate.length > 0) {
      await prisma.absence.createMany({
        data: toCreate
      });
    }

    res.status(201).json({ message: 'Attendance recorded successfully', count: toCreate.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
