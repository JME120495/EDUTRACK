const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all subjects
router.get('/', auth, async (req, res) => {
  try {
    const matieres = await prisma.matiere.findMany({
      where: { schoolId: req.user.schoolId }
    });
    res.json(matieres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create subject (Director and Teacher)
router.post('/', auth, requireRole(['DIRECTOR', 'TEACHER']), async (req, res) => {
  const { nameFr, nameEn, code, coefficient, classId, teacherId } = req.body;
  try {
    if (!nameFr || !nameEn || !code) {
      return res.status(400).json({ message: 'French name, English name, and code are required' });
    }

    // 1. Create the Matiere
    const newMatiere = await prisma.matiere.create({
      data: {
        schoolId: req.user.schoolId,
        nameFr,
        nameEn,
        code,
        coefficient: parseFloat(coefficient) || 1.0
      }
    });

    // 2. If classId is provided, link it to the class and teacher
    if (classId) {
      const tId = teacherId || (req.user.role === 'TEACHER' ? req.user.id : null);
      if (tId) {
        await prisma.enseignantMatiereClasse.create({
          data: {
            teacherId: tId,
            matiereId: newMatiere.id,
            classId
          }
        });
      }
    }

    res.status(201).json(newMatiere);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update subject (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { nameFr, nameEn, code, coefficient } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.matiere.update({
      where: { id },
      data: {
        nameFr,
        nameEn,
        code,
        coefficient: parseFloat(coefficient)
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete subject (Director only)
router.delete('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.matiere.delete({
      where: { id }
    });
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign teacher to subject and class
router.post('/affecter', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { teacherId, matiereId, classId } = req.body;
  try {
    if (!teacherId || !matiereId || !classId) {
      return res.status(400).json({ message: 'Teacher ID, Subject ID, and Class ID are required' });
    }

    // Check if assignment already exists
    const existing = await prisma.enseignantMatiereClasse.findFirst({
      where: { teacherId, matiereId, classId }
    });

    if (existing) {
      return res.status(400).json({ message: 'This assignment already exists' });
    }

    const assignment = await prisma.enseignantMatiereClasse.create({
      data: { teacherId, matiereId, classId },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        matiere: true,
        class: true
      }
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all teacher assignments
router.get('/assignments', auth, async (req, res) => {
  try {
    const assignments = await prisma.enseignantMatiereClasse.findMany({
      where: {
        class: { schoolId: req.user.schoolId }
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        matiere: true,
        class: true
      }
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update assignment (Director only) - e.g. update custom coefficient, hourlyRate, hoursTaught
router.put('/assignments/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  const { coefficient, hourlyRate, hoursTaught } = req.body;
  try {
    const assoc = await prisma.enseignantMatiereClasse.findUnique({
      where: { id },
      include: { class: true }
    });
    if (!assoc || assoc.class.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const updateData = {};
    if (coefficient !== undefined) {
      updateData.coefficient = coefficient !== null && coefficient !== '' ? parseFloat(coefficient) : null;
    }
    if (hourlyRate !== undefined) {
      updateData.hourlyRate = hourlyRate !== null && hourlyRate !== '' ? parseFloat(hourlyRate) : 0.0;
    }
    if (hoursTaught !== undefined) {
      updateData.hoursTaught = hoursTaught !== null && hoursTaught !== '' ? parseFloat(hoursTaught) : 0.0;
    }

    const updated = await prisma.enseignantMatiereClasse.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        matiere: true,
        class: true
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete assignment (Director only)
router.delete('/assignments/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    const assoc = await prisma.enseignantMatiereClasse.findUnique({
      where: { id },
      include: { class: true }
    });
    if (!assoc || assoc.class.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await prisma.enseignantMatiereClasse.delete({
      where: { id }
    });
    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
