const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all users (Director only, can filter by role)
router.get('/', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { role } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        schoolId: req.user.schoolId,
        role: role || undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        language: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user (Director only)
router.post('/', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { name, email, password, role, phone, language } = req.body;
  try {
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        schoolId: req.user.schoolId,
        name,
        email,
        passwordHash,
        role,
        phone: phone || null,
        language: language || 'FR'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        language: true
      }
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Link parent to student (Director only)
router.post('/link-parent-student', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { parentId, eleveId, relationship } = req.body; // relationship e.g. "FATHER", "MOTHER"
  try {
    if (!parentId || !eleveId) {
      return res.status(400).json({ message: 'Parent ID and Student ID are required' });
    }

    const link = await prisma.parentEleve.create({
      data: {
        parentId,
        eleveId,
        relationship: relationship || 'GUARDIAN'
      }
    });

    res.status(201).json(link);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all parent-student links (Director only)
router.get('/parent-links', auth, requireRole(['DIRECTOR']), async (req, res) => {
  try {
    const links = await prisma.parentEleve.findMany({
      where: {
        eleve: { class: { schoolId: req.user.schoolId } }
      },
      include: {
        parent: { select: { id: true, name: true, phone: true, email: true } },
        eleve: { include: { class: true } }
      }
    });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update personal language preference (All roles)
router.put('/me/language', auth, async (req, res) => {
  const { language } = req.body;
  try {
    if (!['FR', 'EN'].includes(language)) {
      return res.status(400).json({ message: 'Language must be FR or EN' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { language },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        language: true
      }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user (Director only)
router.delete('/:id', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  try {
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    
    const targetUser = await prisma.user.findUnique({
      where: { id }
    });
    if (!targetUser || targetUser.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cascade deletions for references
    await prisma.parentEleve.deleteMany({
      where: { parentId: id }
    });
    await prisma.enseignantMatiereClasse.deleteMany({
      where: { teacherId: id }
    });

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
