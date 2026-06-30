const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

function getCountrySlug(countryName) {
  if (!countryName) return 'cm';
  const name = countryName.toLowerCase().trim();
  const map = {
    'cameroun': 'cm', 'cameroon': 'cm',
    'france': 'fr',
    'congo': 'cg', 'rdc': 'cd', 'république démocratique du congo': 'cd',
    'senegal': 'sn', 'sénégal': 'sn',
    'mali': 'ml',
    'cote d\'ivoire': 'ci', 'côte d\'ivoire': 'ci',
    'togo': 'tg',
    'benin': 'bj', 'bénin': 'bj',
    'gabon': 'ga',
    'nigeria': 'ng', 'niger': 'ne',
    'tchad': 'td', 'chad': 'td',
    'guinee': 'gn', 'guinée': 'gn',
    'maroc': 'ma', 'morocco': 'ma',
    'afrique du sud': 'za', 'south africa': 'za',
    'kenya': 'ke',
    'rwanda': 'rw',
    'burkina faso': 'bf'
  };
  return map[name] || name.substring(0, 2);
}


// Get all users (Director, Censeur, Intendant, Surveillant)
router.get('/', auth, requireRole(['DIRECTOR', 'CENSEUR', 'INTENDANT', 'SURVEILLANT']), async (req, res) => {
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
        profession: true,
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

// Create user (Director or Censeur)
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { name, email, password, role, phone, language, profession } = req.body;
  try {
    if (!name || !password || !role) {
      return res.status(400).json({ message: 'Name, password, and role are required' });
    }

    if (req.user.role === 'CENSEUR' && !['TEACHER', 'PARENT', 'STUDENT'].includes(role)) {
      return res.status(403).json({ message: 'Censeur can only create Teachers and Parents' });
    }

    let finalEmail = email;
    if (!finalEmail) {
      const school = await prisma.school.findUnique({ where: { id: req.user.schoolId } });
      const words = school.name.trim().split(/[\s-]+/);
      let schoolSlug = '';
      if (words.length > 1) {
        schoolSlug = words.map(w => w.charAt(0)).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
      } else {
        schoolSlug = school.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3);
      }
      if (!schoolSlug) schoolSlug = 'school';
      const countrySlug = getCountrySlug(school.country);
      const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const lastName = name.split(' ').slice(1).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
      const baseName = lastName ? `${firstName}.${lastName}` : firstName;
      
      finalEmail = `${baseName}@${schoolSlug}.edutrack.${countrySlug}`;
      
      let counter = 1;
      let checkEmail = finalEmail;
      while (await prisma.user.findUnique({ where: { email: checkEmail } })) {
        checkEmail = `${baseName}${counter}@${schoolSlug}.edutrack.${countrySlug}`;
        counter++;
      }
      finalEmail = checkEmail;
    } else {
      const existing = await prisma.user.findUnique({
        where: { email: finalEmail }
      });

      if (existing) {
        return res.status(400).json({ message: 'A user with this email already exists' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        schoolId: req.user.schoolId,
        name,
        email: finalEmail,
        passwordHash,
        role,
        profession: profession || null,
        phone: phone || null,
        language: language || 'FR'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profession: true,
        phone: true,
        language: true
      }
    });

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create multiple users (bulk import)
router.post('/bulk', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { users } = req.body; // array of { name, email, phone, role, profession, language }
  try {
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'A valid array of users is required' });
    }

    const school = await prisma.school.findUnique({ where: { id: req.user.schoolId } });
    let schoolSlug = school.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3) || 'sch';
    const countrySlug = getCountrySlug(school.country);

    let createdCount = 0;
    
    // Process one by one because of email generation and password hashing
    // For a very large number, we'd batch, but usually it's < 100
    for (const u of users) {
      if (!u.name || !u.role) continue;
      
      // Enforce role creation rules
      if (req.user.role === 'CENSEUR' && !['TEACHER', 'PARENT', 'STUDENT'].includes(u.role)) {
        continue; // Skip unauthorized roles
      }

      let finalEmail = u.email;
      if (!finalEmail) {
        const firstName = u.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        const lastName = u.name.split(' ').slice(1).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
        const baseName = lastName ? `${firstName}.${lastName}` : firstName;
        
        finalEmail = `${baseName}@${schoolSlug}.edutrack.${countrySlug}`;
        
        let counter = 1;
        let checkEmail = finalEmail;
        while (await prisma.user.findUnique({ where: { email: checkEmail } })) {
          checkEmail = `${baseName}${counter}@${schoolSlug}.edutrack.${countrySlug}`;
          counter++;
        }
        finalEmail = checkEmail;
      } else {
        const existing = await prisma.user.findUnique({ where: { email: finalEmail } });
        if (existing) continue; // Skip existing emails
      }

      const passwordHash = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: {
          schoolId: req.user.schoolId,
          name: u.name,
          email: finalEmail,
          passwordHash,
          role: u.role,
          profession: u.profession || null,
          phone: u.phone || null,
          language: u.language || 'FR'
        }
      });
      createdCount++;
    }

    res.status(201).json({ message: 'Users imported successfully', count: createdCount });
  } catch (err) {
    console.error('[Users Bulk] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Link parent to student (Director or Censeur)
router.post('/link-parent-student', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
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

// Get all parent-student links (Director or Censeur)
router.get('/parent-links', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
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

// Update parent-student link (Director or Censeur)
router.put('/parent-links', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { parentId, eleveId, relationship } = req.body;
  try {
    if (!parentId || !eleveId || !relationship) {
      return res.status(400).json({ message: 'Parent ID, Student ID, and relationship are required' });
    }

    const updated = await prisma.parentEleve.update({
      where: {
        parentId_eleveId: {
          parentId,
          eleveId
        }
      },
      data: { relationship }
    });

    res.json(updated);
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

// Update user (Director or Censeur)
router.put('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, profession } = req.body;
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id }
    });
    if (!targetUser || targetUser.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'CENSEUR' && !['TEACHER', 'PARENT', 'STUDENT'].includes(targetUser.role)) {
      return res.status(403).json({ message: 'Censeur can only update Teachers and Parents' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
        email,
        profession: profession || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profession: true,
        phone: true,
        createdAt: true
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user (Director or Censeur)
router.delete('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
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

    if (req.user.role === 'CENSEUR' && !['TEACHER', 'PARENT', 'STUDENT'].includes(targetUser.role)) {
      return res.status(403).json({ message: 'Censeur can only delete Teachers and Parents' });
    }

    // Cascade deletions for references
    await prisma.parentEleve.deleteMany({ where: { parentId: id } });
    await prisma.enseignantMatiereClasse.deleteMany({ where: { teacherId: id } });
    
    // Nullify or delete other references
    await prisma.classe.updateMany({ where: { principalTeacherId: id }, data: { principalTeacherId: null } });
    await prisma.classe.updateMany({ where: { censeurId: id }, data: { censeurId: null } });
    await prisma.classe.updateMany({ where: { surveillantId: id }, data: { surveillantId: null } });
    await prisma.classe.updateMany({ where: { intendantId: id }, data: { intendantId: null } });
    
    await prisma.message.deleteMany({ where: { senderId: id } });
    await prisma.message.deleteMany({ where: { receiverId: id } });
    
    await prisma.sanction.deleteMany({ where: { censeurId: id } });
    await prisma.emploiDuTemps.deleteMany({ where: { teacherId: id } });
    await prisma.note.deleteMany({ where: { teacherId: id } });
    
    await prisma.contract.deleteMany({ where: { employeeId: id } });
    await prisma.payslip.deleteMany({ where: { employeeId: id } });
    await prisma.salaryAdvance.deleteMany({ where: { employeeId: id } });
    await prisma.staffLeave.deleteMany({ where: { employeeId: id } });

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Assign classes to a Censeur or Surveillant (Director only)
router.put('/:id/classes', auth, requireRole(['DIRECTOR']), async (req, res) => {
  const { id } = req.params;
  const { classIds } = req.body; // array of class IDs
  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || !['CENSEUR', 'SURVEILLANT', 'INTENDANT'].includes(targetUser.role) || targetUser.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'User not found or role not eligible' });
    }

    const fieldToUpdate = targetUser.role === 'CENSEUR' ? 'censeurId' : targetUser.role === 'SURVEILLANT' ? 'surveillantId' : 'intendantId';

    // First, remove this user from any classes they currently manage
    await prisma.classe.updateMany({
      where: { [fieldToUpdate]: id },
      data: { [fieldToUpdate]: null }
    });

    // Then, assign the new classes
    if (classIds && classIds.length > 0) {
      await prisma.classe.updateMany({
        where: { id: { in: classIds }, schoolId: req.user.schoolId },
        data: { [fieldToUpdate]: id }
      });
    }

    res.json({ message: 'Classes assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update own password (All roles)
router.put('/me/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
