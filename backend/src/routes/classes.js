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
        anneeScolaire: true
      }
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create class (Director only)
router.post('/', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { name, principalTeacherId, anneeScolaireId } = req.body;
  try {
    if (!name || !anneeScolaireId) {
      return res.status(400).json({ message: 'Name and academic year are required' });
    }

    const newClass = await prisma.classe.create({
      data: {
        schoolId: req.user.schoolId,
        name,
        principalTeacherId: principalTeacherId || null,
        anneeScolaireId
      },
      include: {
        principalTeacher: true,
        anneeScolaire: true
      }
    });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update class (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { name, principalTeacherId, anneeScolaireId } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.classe.update({
      where: { id },
      data: {
        name,
        principalTeacherId: principalTeacherId || null,
        anneeScolaireId
      },
      include: {
        principalTeacher: true,
        anneeScolaire: true
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete class (Director only)
router.delete('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.classe.delete({
      where: { id }
    });
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
