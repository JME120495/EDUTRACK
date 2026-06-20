const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');
const { generateCertificatePDF, generateIDCardsPDF } = require('../services/pdfGeneratorService');

// ----------------------------------------------------
// 1. MODÈLES D'ATTESTATIONS (Templates)
// ----------------------------------------------------

// Get all templates
router.get('/templates', auth, async (req, res) => {
  try {
    const list = await prisma.documentTemplate.findMany({
      where: { schoolId: req.user.schoolId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update template
router.post('/templates', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { id, title, content, language } = req.body;
  try {
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    let template;
    if (id) {
      // Update
      template = await prisma.documentTemplate.update({
        where: { id },
        data: {
          title,
          content,
          language: language || 'FR'
        }
      });
    } else {
      // Create
      template = await prisma.documentTemplate.create({
        data: {
          schoolId: req.user.schoolId,
          title,
          content,
          language: language || 'FR'
        }
      });
    }

    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete template
// V-006 FIX: Verify template belongs to user's school
router.delete('/templates/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { id } = req.params;
  try {
    const template = await prisma.documentTemplate.findUnique({ where: { id } });
    if (!template || template.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Template not found' });
    }
    await prisma.documentTemplate.delete({ where: { id } });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    console.error('[Documents] Delete template error:', err);
    res.status(500).json({ message: 'An internal error occurred' });
  }
});

// ----------------------------------------------------
// 2. GÉNÉRATION D'ATTESTATIONS (Certificates)
// ----------------------------------------------------

// Generate a certificate PDF for a student
router.post('/generate-certificate', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { templateId, studentId, customContent } = req.body;
  try {
    if (!templateId || !studentId) {
      return res.status(400).json({ message: 'Template ID and Student ID are required' });
    }

    const pdfPath = await generateCertificatePDF(templateId, studentId, customContent);
    res.json({ url: pdfPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 3. IMPRESSION EN MASSE DE CARTES (ID Cards)
// ----------------------------------------------------

// Generate student cards for a class or selected students
router.get('/cards/students/:classId', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId } = req.params;
  const { studentIds } = req.query; // optional list of student IDs comma separated

  try {
    let ids = [];
    if (studentIds) {
      ids = studentIds.split(',');
    } else {
      const students = await prisma.eleve.findMany({
        where: { classId, status: 'ACTIVE' },
        select: { id: true }
      });
      ids = students.map(s => s.id);
    }

    if (ids.length === 0) {
      return res.status(400).json({ message: 'No student found to generate cards for.' });
    }

    const pdfPath = await generateIDCardsPDF(req.user.schoolId, ids, 'student');
    res.json({ url: pdfPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate parent access cards for all parents or selected parents
router.get('/cards/parents', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { parentIds } = req.query; // optional list of parent IDs comma separated

  try {
    let ids = [];
    if (parentIds) {
      ids = parentIds.split(',');
    } else {
      const parents = await prisma.user.findMany({
        where: {
          schoolId: req.user.schoolId,
          role: 'PARENT'
        },
        select: { id: true }
      });
      ids = parents.map(p => p.id);
    }

    if (ids.length === 0) {
      return res.status(400).json({ message: 'No parent found to generate cards for.' });
    }

    const pdfPath = await generateIDCardsPDF(req.user.schoolId, ids, 'parent');
    res.json({ url: pdfPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
