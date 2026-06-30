const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all classes
router.get('/', auth, async (req, res) => {
  try {
    const activeYear = await prisma.anneeScolaire.findFirst({
      where: req.selectedYearId ? { schoolId: req.user.schoolId, id: req.selectedYearId } : { schoolId: req.user.schoolId, active: true }
    });
    
    if (!activeYear) return res.json([]);

    const classes = await prisma.classe.findMany({
      where: { schoolId: req.user.schoolId, anneeScolaireId: activeYear.id },
      include: {
        principalTeacher: {
          select: { id: true, name: true, email: true }
        },
        censeur: {
          select: { id: true, name: true, email: true }
        },
        surveillant: {
          select: { id: true, name: true, email: true }
        },
        anneeScolaire: true,
        eleves: {
          where: { status: 'ACTIVE' },
          select: { gender: true, isSick: true, hasDisability: true }
        }
      }
    });

    const classesWithStats = classes.map(c => {
      let boysCount = 0;
      let girlsCount = 0;
      let sickCount = 0;
      let disabledCount = 0;
      
      c.eleves.forEach(s => {
        if (s.gender === 'M' || s.gender === 'Garçon' || s.gender === 'Male') boysCount++;
        if (s.gender === 'F' || s.gender === 'Fille' || s.gender === 'Female') girlsCount++;
        if (s.isSick) sickCount++;
        if (s.hasDisability) disabledCount++;
      });
      
      const { eleves, ...rest } = c;
      return {
        ...rest,
        studentCount: c.eleves.length,
        boysCount,
        girlsCount,
        sickCount,
        disabledCount
      };
    });

    res.json(classesWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create class (Director only)
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { name, principalTeacherId, censeurId, surveillantId, anneeScolaireId } = req.body;
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
        surveillantId: surveillantId || null,
        anneeScolaireId
      },
      include: {
        principalTeacher: true,
        censeur: true,
        surveillant: true,
        anneeScolaire: true
      }
    });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create multiple classes (bulk import)
router.post('/bulk', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classes } = req.body; // array of { name, anneeScolaireId }
  try {
    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'A valid array of classes is required' });
    }

    const censeurId = req.user.role === 'CENSEUR' ? req.user.id : null;

    const dataToInsert = classes.map(c => ({
      schoolId: req.user.schoolId,
      name: c.name,
      anneeScolaireId: c.anneeScolaireId,
      censeurId: censeurId
    }));

    const result = await prisma.classe.createMany({
      data: dataToInsert,
      skipDuplicates: true // Prisma allows skipDuplicates for PostgreSQL
    });

    res.status(201).json({ message: 'Classes imported successfully', count: result.count });
  } catch (err) {
    console.error('[Classes Bulk] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update class (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { name, principalTeacherId, censeurId, surveillantId, anneeScolaireId } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.classe.update({
      where: { id },
      data: {
        name,
        principalTeacherId: principalTeacherId || null,
        censeurId: censeurId || null,
        surveillantId: surveillantId || null,
        anneeScolaireId
      },
      include: {
        principalTeacher: true,
        censeur: true,
        surveillant: true,
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
