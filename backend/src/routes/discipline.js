const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all sanctions (Censeur, Director)
router.get('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId, eleveId } = req.query;

  try {
    const whereClause = {};
    if (classId) {
      whereClause.eleve = { classId };
    }
    if (eleveId) {
      whereClause.eleveId = eleveId;
    }

    // Censeur can see all sanctions in the school. 
    // The school isolation is already guaranteed because the eleve's class belongs to the school,
    // but to be safe, we can add a schoolId check.
    whereClause.eleve = {
      ...whereClause.eleve,
      class: { schoolId: req.user.schoolId }
    };

    const sanctions = await prisma.sanction.findMany({
      where: whereClause,
      include: {
        eleve: {
          select: { name: true, matricule: true, class: { select: { name: true } } }
        },
        censeur: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(sanctions);
  } catch (err) {
    console.error('[Discipline] Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a sanction
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { eleveId, type, motif, date } = req.body;

  try {
    if (!eleveId || !type || !motif) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate permission: Censeur must belong to the same school
    if (req.user.role === 'CENSEUR') {
      const eleve = await prisma.eleve.findUnique({ where: { id: eleveId }, include: { class: true } });
      if (!eleve || eleve.class.schoolId !== req.user.schoolId) {
        return res.status(403).json({ message: 'Élève introuvable dans votre établissement.' });
      }
    }

    const sanction = await prisma.sanction.create({
      data: {
        eleveId,
        censeurId: req.user.id,
        type,
        motif,
        date: date ? new Date(date) : new Date()
      },
      include: { eleve: true }
    });

    // Auto-notify parents
    const parentLinks = await prisma.parentEleve.findMany({
      where: { eleveId },
      select: { parentId: true }
    });

    if (parentLinks.length > 0) {
      const messagesData = parentLinks.map(link => ({
        senderId: req.user.id,
        receiverId: link.parentId,
        title: `⚠️ Notification Disciplinaire : ${type}`,
        content: `Une sanction disciplinaire (${type}) a été appliquée à ${sanction.eleve.name} pour le motif suivant : "${motif}".`
      }));

      await prisma.message.createMany({ data: messagesData });
    }

    res.status(201).json(sanction);
  } catch (err) {
    console.error('[Discipline] Create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a sanction
router.delete('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { id } = req.params;
  try {
    const sanction = await prisma.sanction.findUnique({ where: { id }, include: { eleve: { include: { class: true } } } });
    if (!sanction) {
      return res.status(404).json({ message: 'Sanction not found' });
    }

    if (req.user.role === 'CENSEUR' && sanction.eleve.class.schoolId !== req.user.schoolId) {
      return res.status(403).json({ message: 'Action non autorisée (Hors de votre établissement)' });
    }

    await prisma.sanction.delete({ where: { id } });
    res.json({ message: 'Sanction deleted successfully' });
  } catch (err) {
    console.error('[Discipline] Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
