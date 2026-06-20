const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { checkConflicts } = require('../services/timetableService');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get timetable for a class
router.get('/classe/:classId', auth, async (req, res) => {
  const { classId } = req.params;
  try {
    const timetable = await prisma.emploiDuTemps.findMany({
      where: { classId },
      include: {
        teacher: { select: { id: true, name: true } },
        matiere: true,
        creneau: true
      }
    });
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get timetable for a teacher
router.get('/teacher/:teacherId', auth, async (req, res) => {
  const { teacherId } = req.params;
  try {
    const timetable = await prisma.emploiDuTemps.findMany({
      where: { teacherId },
      include: {
        class: true,
        matiere: true,
        creneau: true
      }
    });
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create timetable session (Director only)
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId, teacherId, matiereId, creneauId, dayOfWeek, room } = req.body;
  try {
    if (!classId || !teacherId || !matiereId || !creneauId || !dayOfWeek) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Check conflicts
    const conflictCheck = await checkConflicts(classId, teacherId, creneauId, dayOfWeek, room);
    if (conflictCheck.conflict) {
      return res.status(409).json(conflictCheck);
    }

    const newSession = await prisma.emploiDuTemps.create({
      data: { classId, teacherId, matiereId, creneauId, dayOfWeek, room },
      include: {
        teacher: { select: { id: true, name: true } },
        matiere: true,
        creneau: true
      }
    });
    res.status(201).json(newSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update timetable session (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId, teacherId, matiereId, creneauId, dayOfWeek, room } = req.body;
  const { id } = req.params;
  try {
    // Check conflicts excluding this session
    const conflictCheck = await checkConflicts(classId, teacherId, creneauId, dayOfWeek, room, id);
    if (conflictCheck.conflict) {
      return res.status(409).json(conflictCheck);
    }

    const updated = await prisma.emploiDuTemps.update({
      where: { id },
      data: { classId, teacherId, matiereId, creneauId, dayOfWeek, room },
      include: {
        teacher: { select: { id: true, name: true } },
        matiere: true,
        creneau: true
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { generateAutomaticTimetable } = require('../services/timetableGenerator');

// Generate automatic timetable (Director only)
router.post('/generate', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  try {
    const result = await generateAutomaticTimetable(req.user.schoolId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete session (Director only)
router.delete('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.emploiDuTemps.delete({
      where: { id }
    });
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
