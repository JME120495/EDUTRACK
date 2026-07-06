const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');
const { ensureParentAccess } = require('../middlewares/securityMiddleware');

// Get absences for a student
// V-007 FIX: Parents can only see their own children's absences
router.get('/eleve/:eleveId', auth, ensureParentAccess('eleveId'), async (req, res) => {
  const { eleveId } = req.params;
  try {
    const absences = await prisma.absence.findMany({
      where: { eleveId },
      include: { sequence: true },
      orderBy: { date: 'desc' }
    });
    res.json(absences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register absence
router.post('/', auth, requireRole(['TEACHER', 'DIRECTOR', 'CENSEUR', 'SURVEILLANT']), async (req, res) => {
  const { eleveId, sequenceId, date, hours, justified, reason, isLateness } = req.body;
  try {
    if (!eleveId || !sequenceId) {
      return res.status(400).json({ message: 'Student ID and Sequence ID are required' });
    }

    const absence = await prisma.absence.create({
      data: {
        eleveId,
        sequenceId,
        date: date ? new Date(date) : new Date(),
        hours: parseFloat(hours || 0),
        justified: justified || false,
        reason: reason || '',
        isLateness: isLateness || false
      },
      include: { eleve: true }
    });

    // Notify parents via internal message
    const parentLinks = await prisma.parentEleve.findMany({ where: { eleveId } });
    if (parentLinks.length > 0) {
      const typeStr = isLateness ? 'un retard' : 'une absence';
      const hoursStr = isLateness ? '' : ` (${absence.hours}h)`;
      const msgContent = `Votre enfant ${absence.eleve.name} a enregistré ${typeStr}${hoursStr} le ${absence.date.toLocaleDateString('fr-FR')}. Veuillez vérifier le portail ou contacter la scolarité.`;
      
      const messageData = parentLinks.map(p => ({
        senderId: req.user.id,
        receiverId: p.parentId,
        content: msgContent,
        title: isLateness ? 'Notification de Retard' : 'Notification d\'Absence'
      }));
      await prisma.message.createMany({ data: messageData });
    }

    res.status(201).json(absence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update absence justification
router.put('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR', 'TEACHER', 'SURVEILLANT']), async (req, res) => {
  const { justified, reason } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.absence.update({
      where: { id },
      data: { justified, reason }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get absences for a class on a specific date
router.get('/classe/:classId/date/:dateString', auth, async (req, res) => {
  const { classId, dateString } = req.params;
  const { sequenceId } = req.query;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    const start = new Date(dateString);
    start.setHours(0,0,0,0);
    const end = new Date(dateString);
    end.setHours(23,59,59,999);

    const absences = await prisma.absence.findMany({
      where: {
        sequenceId: sequenceId || undefined,
        date: { gte: start, lte: end },
        eleve: { classId }
      }
    });
    res.json(absences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk register absences for a class (roll call)
router.post('/bulk', auth, requireRole(['TEACHER', 'DIRECTOR', 'CENSEUR', 'SURVEILLANT']), async (req, res) => {
  const { classId, sequenceId, date, absences } = req.body; // absences: Array of { eleveId, hours, reason, isLateness }
  try {
    if (!classId || !sequenceId || !date || !Array.isArray(absences)) {
      return res.status(400).json({ message: 'Class ID, Sequence ID, Date, and absences list are required' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const start = new Date(date);
    start.setHours(0,0,0,0);
    const end = new Date(date);
    end.setHours(23,59,59,999);

    // Delete existing absences for the students of this class on this date & sequence
    await prisma.absence.deleteMany({
      where: {
        sequenceId,
        date: { gte: start, lte: end },
        eleve: { classId }
      }
    });

    // Create new absences
    const toCreate = absences.map(item => ({
      eleveId: item.eleveId,
      sequenceId,
      date: parsedDate,
      hours: parseFloat(item.hours || (item.isLateness ? 0 : 1)),
      justified: false,
      reason: item.reason || '',
      isLateness: item.isLateness || false
    }));

    if (toCreate.length > 0) {
      await prisma.absence.createMany({
        data: toCreate
      });

      // Send internal messages for these absences
      const eleveIds = toCreate.map(a => a.eleveId);
      const parentLinks = await prisma.parentEleve.findMany({
        where: { eleveId: { in: eleveIds } },
        include: { eleve: true }
      });
      
      const messageData = [];
      for (const p of parentLinks) {
        const absence = toCreate.find(a => a.eleveId === p.eleveId);
        if (absence) {
          const typeStr = absence.isLateness ? 'un retard' : 'une absence';
          const msgContent = `Votre enfant ${p.eleve.name} a enregistré ${typeStr} le ${parsedDate.toLocaleDateString('fr-FR')}. Veuillez vérifier le portail.`;
          messageData.push({
            senderId: req.user.id,
            receiverId: p.parentId,
            content: msgContent,
            title: absence.isLateness ? 'Notification de Retard' : 'Notification d\'Absence'
          });
        }
      }
      
      if (messageData.length > 0) {
        await prisma.message.createMany({ data: messageData });
      }
    }
    }

    res.status(201).json({ message: 'Attendance recorded successfully', count: toCreate.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get teacher absences
router.get('/teachers', auth, requireRole(['DIRECTOR', 'CENSEUR', 'SURVEILLANT', 'TEACHER']), async (req, res) => {
  const { dateString, month, year } = req.query;
  try {
    const where = {};
    if (req.user.role === 'TEACHER') {
      where.teacherId = req.user.id;
    }
    
    if (dateString) {
      const start = new Date(dateString);
      start.setHours(0,0,0,0);
      const end = new Date(dateString);
      end.setHours(23,59,59,999);
      where.date = { gte: start, lte: end };
    } else if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      where.date = {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59, 999)
      };
    }
    const absences = await prisma.teacherAbsence.findMany({
      where,
      include: { teacher: { select: { id: true, name: true, phone: true } } }
    });
    res.json(absences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk register teacher absences
router.post('/teachers/bulk', auth, requireRole(['DIRECTOR', 'CENSEUR', 'SURVEILLANT']), async (req, res) => {
  const { date, absences } = req.body; // absences: [{ teacherId, hours, reason }]
  try {
    if (!date || !Array.isArray(absences)) {
      return res.status(400).json({ message: 'Date and absences list are required' });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const start = new Date(date);
    start.setHours(0,0,0,0);
    const end = new Date(date);
    end.setHours(23,59,59,999);

    // Delete existing absences for this date
    await prisma.teacherAbsence.deleteMany({
      where: {
        date: { gte: start, lte: end }
      }
    });

    // Create new absences
    const toCreate = absences.map(item => ({
      teacherId: item.teacherId,
      date: parsedDate,
      hours: parseFloat(item.hours || 1),
      reason: item.reason || ''
    }));

    if (toCreate.length > 0) {
      await prisma.teacherAbsence.createMany({
        data: toCreate
      });
    }

    res.status(201).json({ message: 'Teacher attendance recorded successfully', count: toCreate.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update teacher absence
router.put('/teachers/:id', auth, requireRole(['DIRECTOR', 'CENSEUR', 'SURVEILLANT']), async (req, res) => {
  const { hours, reason } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.teacherAbsence.update({
      where: { id },
      data: { hours, reason }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete teacher absence
router.delete('/teachers/:id', auth, requireRole(['DIRECTOR', 'CENSEUR', 'SURVEILLANT']), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.teacherAbsence.delete({ where: { id } });
    res.json({ message: 'Absence deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
