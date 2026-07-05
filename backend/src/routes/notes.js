const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get notes by query parameters
router.get('/', auth, async (req, res) => {
  const { classId, matiereId, sequenceId, eleveId, evaluationTypeId } = req.query;
  try {
    const where = {};
    if (sequenceId) where.sequenceId = sequenceId;
    if (matiereId) where.matiereId = matiereId;
    if (eleveId) where.eleveId = eleveId;
    if (evaluationTypeId !== undefined) {
      where.evaluationTypeId = evaluationTypeId === 'null' ? null : evaluationTypeId;
    }
    if (classId) {
      where.eleve = { classId };
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        eleve: true,
        sequence: true,
        matiere: true
      }
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notes input grid for a class, subject, and sequence
router.get('/classe/:classId/matiere/:matiereId/sequence/:sequenceId', auth, async (req, res) => {
  const { classId, matiereId, sequenceId } = req.params;
  try {
    const students = await prisma.eleve.findMany({
      where: { classId, status: "ACTIVE" },
      orderBy: { name: 'asc' }
    });

    const { evaluationTypeId } = req.query;
    
    const whereNotes = {
      sequenceId,
      matiereId,
      eleve: { classId }
    };

    if (evaluationTypeId !== undefined) {
      whereNotes.evaluationTypeId = evaluationTypeId === 'null' ? null : evaluationTypeId;
    } else {
      whereNotes.evaluationTypeId = null; // Default backward compat
    }

    const notes = await prisma.note.findMany({
      where: whereNotes
    });

    // Map notes to students
    const grid = students.map(student => {
      const studentNote = notes.find(n => n.eleveId === student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        matricule: student.matricule,
        noteId: studentNote ? studentNote.id : null,
        value: studentNote ? studentNote.value : '',
        isDraft: studentNote ? studentNote.isDraft : true,
        remarks: studentNote ? studentNote.remarks : ''
      };
    });

    res.json(grid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk process grades (save drafts and validate locks)
router.post('/bulk', auth, requireRole(['TEACHER', 'DIRECTOR']), async (req, res) => {
  const { classId, matiereId, sequenceId, evaluationTypeId, grades } = req.body; // grades: Array of { eleveId, value, isDraft, remarks }
  try {
    if (!sequenceId || !matiereId || !Array.isArray(grades)) {
      return res.status(400).json({ message: 'Sequence ID, Subject ID, and grades list are required' });
    }

    const evalId = evaluationTypeId || null;

    // Optimize: fetch all existing notes at once
    const eleveIds = grades.map(g => g.eleveId).filter(Boolean);
    const existingNotesList = await prisma.note.findMany({
      where: {
        eleveId: { in: eleveIds },
        sequenceId,
        matiereId,
        evaluationTypeId: evalId
      }
    });

    const existingNotesMap = new Map();
    for (const note of existingNotesList) {
      existingNotesMap.set(note.eleveId, note);
    }

    const ops = [];
    for (const item of grades) {
      if (item.value === '' || item.value === null || item.value === undefined) continue;

      const val = parseFloat(item.value);
      if (isNaN(val) || val < 0 || val > 20) continue;

      const existing = existingNotesMap.get(item.eleveId);

      if (existing) {
        ops.push(prisma.note.update({
          where: { id: existing.id },
          data: {
            value: val,
            isDraft: item.isDraft !== false,
            remarks: item.remarks || null,
            teacherId: req.user.id
          }
        }));
      } else {
          ops.push(prisma.note.create({
          data: {
            eleveId: item.eleveId,
            sequenceId,
            matiereId,
            evaluationTypeId: evalId,
            teacherId: req.user.id,
            value: val,
            isDraft: item.isDraft !== false,
            remarks: item.remarks || null
          }
        }));
      }
    }
    
    const saved = await prisma.$transaction(ops);

    res.json({ message: 'Grades processed successfully', count: saved.length, saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save grades as draft (compatibility fallback)
router.post('/save-draft', auth, requireRole(['TEACHER', 'DIRECTOR']), async (req, res) => {
  const { sequenceId, matiereId, evaluationTypeId, grades } = req.body; // grades: Array of { studentId, value }
  try {
    if (!sequenceId || !matiereId || !Array.isArray(grades)) {
      return res.status(400).json({ message: 'Sequence ID, Subject ID, and grades list are required' });
    }

    const evalId = evaluationTypeId || null;

    // Optimize: fetch all existing notes at once
    const eleveIds = grades.map(g => g.studentId).filter(Boolean);
    const existingNotesList = await prisma.note.findMany({
      where: {
        eleveId: { in: eleveIds },
        sequenceId,
        matiereId,
        evaluationTypeId: evalId
      }
    });

    const existingNotesMap = new Map();
    for (const note of existingNotesList) {
      existingNotesMap.set(note.eleveId, note);
    }

    const ops = [];
    for (const item of grades) {
      if (item.value === '' || item.value === null || item.value === undefined) continue;

      const val = parseFloat(item.value);
      if (isNaN(val) || val < 0 || val > 20) continue;

      const existing = existingNotesMap.get(item.studentId);

      if (existing) {
        ops.push(prisma.note.update({
          where: { id: existing.id },
          data: {
            value: val,
            isDraft: true,
            teacherId: req.user.id
          }
        }));
      } else {
        ops.push(prisma.note.create({
          data: {
            eleveId: item.studentId,
            sequenceId,
            matiereId,
            teacherId: req.user.id,
            value: val,
            isDraft: true
          }
        }));
      }
    }
    
    const saved = await prisma.$transaction(ops);

    res.json({ message: 'Draft saved successfully', count: saved.length, saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate and lock grades (compatibility fallback)
router.post('/validate', auth, requireRole(['TEACHER', 'DIRECTOR']), async (req, res) => {
  const { sequenceId, matiereId, grades } = req.body; // grades: Array of { studentId, value }
  try {
    if (!sequenceId || !matiereId || !Array.isArray(grades)) {
      return res.status(400).json({ message: 'Sequence ID, Subject ID, and grades list are required' });
    }

    // Optimize: fetch all existing notes at once
    const eleveIds = grades.map(g => g.studentId).filter(Boolean);
    const existingNotesList = await prisma.note.findMany({
      where: {
        eleveId: { in: eleveIds },
        sequenceId,
        matiereId
      }
    });

    const existingNotesMap = new Map();
    for (const note of existingNotesList) {
      existingNotesMap.set(note.eleveId, note);
    }

    const ops = [];
    for (const item of grades) {
      if (item.value === '' || item.value === null || item.value === undefined) continue;

      const val = parseFloat(item.value);
      if (isNaN(val) || val < 0 || val > 20) {
        return res.status(400).json({ message: `Invalid grade value ${item.value} for student ID ${item.studentId}` });
      }

      const existing = existingNotesMap.get(item.studentId);

      if (existing) {
        ops.push(prisma.note.update({
          where: { id: existing.id },
          data: {
            value: val,
            isDraft: false,
            teacherId: req.user.id
          }
        }));
      } else {
        ops.push(prisma.note.create({
          data: {
            eleveId: item.studentId,
            sequenceId,
            matiereId,
            teacherId: req.user.id,
            value: val,
            isDraft: false
          }
        }));
      }
    }
    
    const validated = await prisma.$transaction(ops);

    res.json({ message: 'Grades validated and locked successfully', count: validated.length, validated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get class averages/progression statistics across sequences
router.get('/stats/classe/:classId', auth, async (req, res) => {
  const { classId } = req.params;
  try {
    const activeYear = await prisma.anneeScolaire.findFirst({
      where: req.selectedYearId ? { schoolId: req.user.schoolId, id: req.selectedYearId } : { schoolId: req.user.schoolId, active: true }
    });

    if (!activeYear) {
      return res.status(404).json({ message: 'No active academic year found' });
    }

    const sequences = await prisma.sequence.findMany({
      where: { anneeScolaireId: activeYear.id },
      orderBy: { name: 'asc' }
    });

    const stats = [];
    for (const seq of sequences) {
      const bulletins = await prisma.bulletin.findMany({
        where: {
          sequenceId: seq.id,
          eleve: { classId },
          type: 'SEQUENCE'
        }
      });

      const average = bulletins.length > 0
        ? bulletins.reduce((acc, curr) => acc + curr.average, 0) / bulletins.length
        : 0;

      stats.push({
        sequenceId: seq.id,
        sequenceName: seq.name,
        average: parseFloat(average.toFixed(2)),
        studentCount: bulletins.length
      });
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
