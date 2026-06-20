const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all classes
router.get('/', auth, async (req, res) => {
  try {
    const classes = await prisma.classe.findMany({
      where: { schoolId: req.user.schoolId },
      include: {
        principalTeacher: {
          select: { id: true, name: true, email: true }
        },
        censeur: {
          select: { id: true, name: true, email: true }
        },
        anneeScolaire: true
      }
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create class (Director only)
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { name, principalTeacherId, censeurId, anneeScolaireId } = req.body;
  try {
    if (!name || !anneeScolaireId) {
      return res.status(400).json({ message: 'Name and academic year are required' });
    }

    const newClass = await prisma.classe.create({
      data: {
        schoolId: req.user.schoolId,
        name,
        principalTeacherId: principalTeacherId || null,
        censeurId: censeurId || null,
        anneeScolaireId
      },
      include: {
        principalTeacher: true,
        censeur: true,
        anneeScolaire: true
      }
    });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update class (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { name, principalTeacherId, censeurId, anneeScolaireId } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.classe.update({
      where: { id },
      data: {
        name,
        principalTeacherId: principalTeacherId || null,
        censeurId: censeurId || null,
        anneeScolaireId
      },
      include: {
        principalTeacher: true,
        censeur: true,
        anneeScolaire: true
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete class (Director only)
// V-006 FIX: Verify class belongs to user's school
router.delete('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { id } = req.params;
  try {
    const classe = await prisma.classe.findUnique({ where: { id } });
    if (!classe || classe.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Class not found' });
    }
    await prisma.classe.delete({
      where: { id }
    });
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    console.error('[Classes] Delete error:', err);
    res.status(500).json({ message: 'An internal error occurred' });
  }
});

module.exports = router;
