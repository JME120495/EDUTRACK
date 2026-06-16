const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all students
router.get('/', auth, async (req, res) => {
  try {
    const eleves = await prisma.eleve.findMany({
      where: { class: { schoolId: req.user.schoolId } },
      include: { class: true }
    });
    res.json(eleves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single student's complete profile
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const eleve = await prisma.eleve.findUnique({
      where: { id },
      include: {
        class: true,
        parents: {
          include: { parent: true }
        },
        notes: {
          include: { sequence: true, matiere: true }
        },
        absences: {
          include: { sequence: true }
        },
        paiements: true
      }
    });

    if (!eleve) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(eleve);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create student (Director only)
router.post('/', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { name, matricule, dateOfBirth, gender, address, photoUrl, classId } = req.body;
  try {
    if (!name || !matricule || !classId) {
      return res.status(400).json({ message: 'Name, matricule, and classId are required' });
    }

    // Check if matricule already exists
    const existing = await prisma.eleve.findUnique({
      where: { matricule }
    });
    if (existing) {
      return res.status(400).json({ message: 'A student with this matricule already exists' });
    }

    const newStudent = await prisma.eleve.create({
      data: {
        name,
        matricule,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        photoUrl,
        classId
      },
      include: { class: true }
    });
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { name, matricule, dateOfBirth, gender, address, photoUrl, classId, status } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.eleve.update({
      where: { id },
      data: {
        name,
        matricule,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        photoUrl,
        classId,
        status
      },
      include: { class: true }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student (Director only)
router.delete('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    // Delete parent links first (or relies on cascade)
    await prisma.parentEleve.deleteMany({
      where: { eleveId: id }
    });
    
    await prisma.eleve.delete({
      where: { id }
    });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import students from CSV (Director only)
router.post('/import-csv', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { csvText, classId } = req.body;
  try {
    if (!csvText || !classId) {
      return res.status(400).json({ message: 'CSV content and target Class ID are required' });
    }

    // CSV format: Name,Matricule,Gender,Address
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const imported = [];
    const skipped = [];

    // Skip header line if it contains metadata
    const startIdx = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('nom') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(part => part.trim());
      if (parts.length < 2) continue;

      const [name, matricule, gender, address] = parts;
      if (!name || !matricule) continue;

      // Check duplicate matricule
      const existing = await prisma.eleve.findUnique({
        where: { matricule }
      });

      if (existing) {
        skipped.push({ name, matricule, reason: 'Matricule duplicate' });
        continue;
      }

      const newStudent = await prisma.eleve.create({
        data: {
          name,
          matricule,
          gender: gender || null,
          address: address || null,
          classId
        }
      });
      imported.push(newStudent);
    }

    res.json({
      message: 'CSV import complete',
      importedCount: imported.length,
      skippedCount: skipped.length,
      imported,
      skipped
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
