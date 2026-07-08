const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all received messages for the logged-in user
router.get('/', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const total = await prisma.message.count({ where: { receiverId: req.user.id } });
    const messages = await prisma.message.findMany({
      where: { receiverId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: {
          select: { name: true, role: true }
        }
      }
    });
    res.json({
      data: messages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[Messages] Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all sent messages for the logged-in user
router.get('/sent', auth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const total = await prisma.message.count({ where: { senderId: req.user.id } });
    const messages = await prisma.message.findMany({
      where: { senderId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        receiver: {
          select: { name: true, role: true }
        }
      }
    });
    res.json({
      data: messages,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('[Messages] Fetch sent error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  const { receiverId, receiverIds, title, content } = req.body;
  try {
    const targets = receiverIds || (receiverId ? [receiverId] : []);
    
    if (targets.length === 0 || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    const receivers = await prisma.user.findMany({
      where: { id: { in: targets } },
      select: { role: true }
    });

    if (req.user.role === 'TEACHER') {
      const hasRestricted = receivers.some(r => r.role === 'DIRECTOR');
      if (hasRestricted) {
        return res.status(403).json({ message: 'Teachers are not allowed to send messages to the director' });
      }
    }
    
    if (req.user.role === 'PARENT') {
      const hasRestricted = receivers.some(r => r.role === 'DIRECTOR');
      if (hasRestricted) {
        return res.status(403).json({ message: 'Parents are not allowed to send messages to the director' });
      }
    }

    const messagesData = targets.map(id => ({
      senderId: req.user.id,
      receiverId: id,
      title,
      content
    }));

    await prisma.message.createMany({
      data: messagesData
    });

    res.status(201).json({ message: 'Messages sent successfully', count: targets.length });
  } catch (err) {
    console.error('[Messages] Send error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get eligible recipients for messaging
router.get('/recipients', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    const schoolId = req.user.schoolId;
    const userId = req.user.id;
    
    let recipientsMap = new Map();

    const userSelect = {
      id: true,
      name: true,
      role: true,
      studentProfile: { select: { class: { select: { id: true, name: true } } } },
      children: { select: { eleve: { select: { class: { select: { id: true, name: true } } } } } }
    };

    const formatUser = (u) => {
      let classesMap = new Map();
      if (u.studentProfile?.class) {
        classesMap.set(u.studentProfile.class.id, u.studentProfile.class);
      }
      if (u.children) {
        u.children.forEach(c => {
          if (c.eleve?.class) {
            classesMap.set(c.eleve.class.id, c.eleve.class);
          }
        });
      }
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        classes: Array.from(classesMap.values())
      };
    };

    const addUsers = (users) => {
      users.forEach(u => {
        if (u.id !== userId) recipientsMap.set(u.id, formatUser(u));
      });
    };

    if (userRole === 'DIRECTOR' || userRole === 'INTENDANT' || userRole === 'CENSEUR' || userRole === 'SURVEILLANT') {
      // Admin sees everyone in the school
      const users = await prisma.user.findMany({
        where: { schoolId },
        select: userSelect
      });
      addUsers(users);

    } else if (userRole === 'TEACHER') {
      // Teacher sees Admin (except Director), other Teachers, and Students of their classes
      const adminsAndTeachers = await prisma.user.findMany({
        where: { schoolId, role: { in: ['CENSEUR', 'INTENDANT', 'SURVEILLANT', 'TEACHER'] } },
        select: userSelect
      });
      addUsers(adminsAndTeachers);

      const taughtClasses = await prisma.enseignantMatiereClasse.findMany({
        where: { teacherId: userId },
        select: { classId: true }
      });
      const classIds = taughtClasses.map(c => c.classId);

      // Students
      const studentsInClasses = await prisma.user.findMany({
        where: { schoolId, role: 'STUDENT', studentProfile: { classId: { in: classIds } } },
        select: userSelect
      });
      addUsers(studentsInClasses);

      // Parents of students in their classes
      const parentsOfStudents = await prisma.user.findMany({
        where: {
          schoolId,
          role: 'PARENT',
          children: {
            some: {
              eleve: { classId: { in: classIds } }
            }
          }
        },
        select: userSelect
      });
      addUsers(parentsOfStudents);
    } else if (userRole === 'STUDENT') {
      // Student sees Admin and Teachers of their classes
      const admins = await prisma.user.findMany({
        where: { schoolId, role: { in: ['DIRECTOR', 'CENSEUR', 'INTENDANT', 'SURVEILLANT'] } },
        select: userSelect
      });
      addUsers(admins);

      const me = await prisma.eleve.findUnique({ where: { userId: userId } });
      if (me && me.classId) {
        const taughtSubjects = await prisma.enseignantMatiereClasse.findMany({
          where: { classId: me.classId },
          include: { teacher: { select: userSelect } }
        });
        taughtSubjects.forEach(ts => {
          if (ts.teacher && ts.teacher.id !== userId) recipientsMap.set(ts.teacher.id, formatUser(ts.teacher));
        });
        
        // If the student is a member of the Student Council, they can contact all students in the school
        if (me.isStudentCouncil) {
          const allStudents = await prisma.user.findMany({
            where: { schoolId, role: 'STUDENT' },
            select: userSelect
          });
          addUsers(allStudents);
        }
      }
    } else if (userRole === 'PARENT') {
      // Parent sees Admin (except Director) and Teachers of their children's classes
      const admins = await prisma.user.findMany({
        where: { schoolId, role: { in: ['CENSEUR', 'INTENDANT', 'SURVEILLANT'] } },
        select: userSelect
      });
      addUsers(admins);

      const childrenLinks = await prisma.parentEleve.findMany({
        where: { parentId: userId },
        include: { eleve: true }
      });
      
      const classIds = childrenLinks.map(c => c.eleve.classId);
      if (classIds.length > 0) {
        const taughtSubjects = await prisma.enseignantMatiereClasse.findMany({
          where: { classId: { in: classIds } },
          include: { teacher: { select: userSelect } }
        });
        taughtSubjects.forEach(ts => {
          if (ts.teacher && ts.teacher.id !== userId) recipientsMap.set(ts.teacher.id, formatUser(ts.teacher));
        });
      }
    }

    // Convert map to array and sort by name
    const result = Array.from(recipientsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    res.json(result);
  } catch (err) {
    console.error('[Messages] Recipients error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark a message as read
router.patch('/:id/read', auth, async (req, res) => {
  const { id } = req.params;
  try {
    // Verify the message belongs to the user
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg || msg.receiverId !== req.user.id) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (err) {
    console.error('[Messages] Mark read error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a message
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const msg = await prisma.message.findUnique({ where: { id } });
    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only sender or receiver can delete the message
    if (msg.senderId !== req.user.id && msg.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await prisma.message.delete({ where: { id } });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('[Messages] Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
