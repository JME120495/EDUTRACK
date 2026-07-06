const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get cahier de textes for a class
router.get('/classe/:classId', auth, async (req, res) => {
  const { classId } = req.params;
  try {
    const cahiers = await prisma.cahierTexte.findMany({
      where: { classId },
      include: {
        matiere: true,
        teacher: { select: { id: true, name: true } },
        homeworks: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(cahiers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cahier de textes for a teacher
router.get('/teacher', auth, requireRole(['TEACHER']), async (req, res) => {
  try {
    const cahiers = await prisma.cahierTexte.findMany({
      where: { teacherId: req.user.id },
      include: {
        matiere: true,
        class: true,
        homeworks: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(cahiers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new cahier de texte entry
router.post('/', auth, requireRole(['TEACHER']), async (req, res) => {
  const { classId, matiereId, date, title, content, attachments, homework } = req.body;
  try {
    if (!classId || !matiereId || !title || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newEntry = await prisma.cahierTexte.create({
      data: {
        schoolId: req.user.schoolId,
        classId,
        matiereId,
        teacherId: req.user.id,
        date: date ? new Date(date) : new Date(),
        title,
        content,
        attachments: attachments ? JSON.stringify(attachments) : null,
        homeworks: homework && homework.description ? {
          create: {
            description: homework.description,
            dueDate: new Date(homework.dueDate),
            attachments: homework.attachments ? JSON.stringify(homework.attachments) : null
          }
        } : undefined
      },
      include: {
        homeworks: true,
        matiere: true,
        class: true
      }
    });

    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an entry
router.delete('/:id', auth, requireRole(['TEACHER', 'DIRECTOR', 'CENSEUR']), async (req, res) => {
  try {
    const entry = await prisma.cahierTexte.findUnique({ where: { id: req.params.id } });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    
    if (req.user.role === 'TEACHER' && entry.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await prisma.cahierTexte.delete({ where: { id: req.params.id } });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
