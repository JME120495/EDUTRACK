const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all sequences for the active academic year
router.get('/', auth, async (req, res) => {
  try {
    const activeYear = await prisma.anneeScolaire.findFirst({
      where: req.selectedYearId ? { schoolId: req.user.schoolId, id: req.selectedYearId } : { schoolId: req.user.schoolId, active: true }
    });

    if (!activeYear) {
      return res.json([]);
    }

    const sequences = await prisma.sequence.findMany({
      where: { anneeScolaireId: activeYear.id },
      orderBy: { name: 'asc' }
    });

    res.json(sequences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get academic years
router.get('/years', auth, async (req, res) => {
  try {
    const years = await prisma.anneeScolaire.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { label: 'desc' }
    });
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create academic year (Director only)
router.post('/years', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { label } = req.body; // e.g. "2025-2026"
  try {
    if (!label) {
      return res.status(400).json({ message: 'Label is required' });
    }

    const newYear = await prisma.anneeScolaire.create({
      data: {
        schoolId: req.user.schoolId,
        label,
        active: false
      }
    });

    // Automatically create 6 sequences for this school year
    const seqNames = [
      { name: 'Séquence 1', term: 1 },
      { name: 'Séquence 2', term: 1 },
      { name: 'Séquence 3', term: 2 },
      { name: 'Séquence 4', term: 2 },
      { name: 'Séquence 5', term: 3 },
      { name: 'Séquence 6', term: 3 }
    ];

    const sequences = seqNames.map((s, idx) => ({
      anneeScolaireId: newYear.id,
      name: s.name,
      term: s.term,
      active: idx === 0 // Make sequence 1 active by default
    }));

    await prisma.sequence.createMany({
      data: sequences
    });

    res.status(201).json(newYear);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate academic year (Director only)
router.post('/years/:id/activate', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    // Deactivate others
    await prisma.anneeScolaire.updateMany({
      where: { schoolId: req.user.schoolId },
      data: { active: false }
    });

    const activated = await prisma.anneeScolaire.update({
      where: { id },
      data: { active: true }
    });

    res.json(activated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update sequence details/active state (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { active, startDate, endDate } = req.body;
  const { id } = req.params;
  try {
    if (active) {
      // Deactivate other sequences of the same year
      const targetSeq = await prisma.sequence.findUnique({ where: { id } });
      await prisma.sequence.updateMany({
        where: { anneeScolaireId: targetSeq.anneeScolaireId },
        data: { active: false }
      });
    }

    const updated = await prisma.sequence.update({
      where: { id },
      data: {
        active,
        name: req.body.name || undefined,
        term: req.body.term ? parseInt(req.body.term) : undefined,
        coefficient: req.body.coefficient !== undefined ? parseFloat(req.body.coefficient) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new sequence manually (Director only)
router.post('/', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { name, term, coefficient, anneeScolaireId, startDate, endDate } = req.body;
  try {
    if (!name || !term || !anneeScolaireId) {
      return res.status(400).json({ message: 'Name, term and anneeScolaireId are required' });
    }

    const newSeq = await prisma.sequence.create({
      data: {
        name,
        term: parseInt(term),
        coefficient: coefficient !== undefined ? parseFloat(coefficient) : 1.0,
        anneeScolaireId,
        active: false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });

    res.status(201).json(newSeq);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a sequence (Director only)
router.delete('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    // Note: Deleting a sequence might fail if there are foreign key constraints (like Notes or Bulletins).
    // In a real scenario, we should handle this gracefully.
    await prisma.sequence.delete({
      where: { id }
    });
    res.json({ message: 'Sequence deleted successfully' });
  } catch (err) {
    if (err.code === 'P2003') {
      return res.status(400).json({ message: 'Impossible de supprimer cette séquence car elle contient des notes ou des bulletins.' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
