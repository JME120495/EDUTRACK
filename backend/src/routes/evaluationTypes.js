const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all evaluation types for the school
router.get('/', auth, async (req, res) => {
  try {
    const types = await prisma.evaluationType.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new evaluation type
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  try {
    const { name, coefficient } = req.body;
    if (!name || coefficient === undefined) {
      return res.status(400).json({ error: 'Le nom et le coefficient sont requis.' });
    }

    const newType = await prisma.evaluationType.create({
      data: {
        schoolId: req.user.schoolId,
        name,
        coefficient: parseFloat(coefficient)
      }
    });
    res.status(201).json(newType);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an evaluation type
router.put('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  try {
    const { name, coefficient } = req.body;
    
    // Check ownership
    const existing = await prisma.evaluationType.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.schoolId !== req.user.schoolId) {
      return res.status(404).json({ error: "Type d'évaluation non trouvé" });
    }

    const updatedType = await prisma.evaluationType.update({
      where: { id: req.params.id },
      data: {
        name,
        coefficient: parseFloat(coefficient)
      }
    });
    res.json(updatedType);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an evaluation type
router.delete('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  try {
    const existing = await prisma.evaluationType.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.schoolId !== req.user.schoolId) {
      return res.status(404).json({ error: "Type d'évaluation non trouvé" });
    }

    await prisma.evaluationType.delete({
      where: { id: req.params.id }
    });
    res.json({ message: "Supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
