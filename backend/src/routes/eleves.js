const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const prisma = require('../db');
const bcrypt = require('bcryptjs');

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

const { auth, requireRole, requirePlan } = require('../middlewares/authMiddleware');
const { ensureParentAccess } = require('../middlewares/securityMiddleware');
const bcrypt = require('bcryptjs');

// Multer config for student photo uploads
const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', '..', 'public', 'photos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.params.id}${ext}`);
  }
});
const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
});

// Get all students
router.get('/', auth, async (req, res) => {
  try {
    const eleves = await prisma.eleve.findMany({
      where: { class: { schoolId: req.user.schoolId } },
      include: { class: true, user: { select: { email: true } } }
    });
    res.json(eleves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single student's complete profile
// V-006 FIX: Verify student belongs to user's school
// V-007 FIX: Parents can only access their own children
router.get('/:id', auth, ensureParentAccess('id'), async (req, res) => {
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
router.post('/', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  let { name, matricule, dateOfBirth, placeOfBirth, gender, address, photoUrl, classId, createPortalAccount, email: providedEmail, isSick, hasDisability, medicalNotes } = req.body;
  try {
    if (!name || !classId) {
      return res.status(400).json({ message: 'Name and classId are required' });
    }

    // --- Subscription Plan Check ---
    const schoolId = req.user.schoolId;
    const currentPlan = req.user.school.subscriptionPlan || 'PREMIUM';
    const currentStudentsCount = await prisma.eleve.count({ where: { class: { schoolId } } });

    if (currentPlan === 'ESSENTIAL' && currentStudentsCount >= 300) {
      return res.status(403).json({ message: 'Quota atteint. Le pack Essentiel est limité à 300 élèves. Veuillez mettre à niveau votre abonnement.' });
    }
    if (currentPlan === 'STANDARD' && currentStudentsCount >= 1000) {
      return res.status(403).json({ message: 'Quota atteint. Le pack Standard est limité à 1000 élèves. Veuillez passer au pack Premium.' });
    }
    // --------------------------------

    // Generate matricule if not provided
    if (!matricule) {
      const year = new Date().getFullYear();
      const count = await prisma.eleve.count();
      matricule = `${year}-${String(count + 1).padStart(4, '0')}`;
    }

    // Check if matricule already exists
    const existing = await prisma.eleve.findUnique({
      where: { matricule }
    });
    if (existing) {
      return res.status(400).json({ message: 'A student with this matricule already exists' });
    }

    let userId = null;

    if (createPortalAccount) {
      // Create User account for the student
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
      const passwordHash = await bcrypt.hash(matricule, 10); // default password is the matricule

      let finalEmail = providedEmail;
      
      if (!finalEmail || finalEmail.trim() === '') {
        const baseName = lastName ? `${firstName}.${lastName}` : firstName;
        finalEmail = `${baseName}@${schoolSlug}.edutrack.${countrySlug}`;
        let counter = 1;
        while (await prisma.user.findUnique({ where: { email: finalEmail } })) {
          finalEmail = `${baseName}${counter}@${schoolSlug}.edutrack.${countrySlug}`;
          counter++;
        }
      } else {
        // Check if provided email exists
        const exists = await prisma.user.findUnique({ where: { email: finalEmail } });
        if (exists) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre utilisateur.' });
        }
      }

      const newUser = await prisma.user.create({
        data: {
          schoolId: req.user.schoolId,
          name: name,
          email: finalEmail,
          passwordHash,
          role: 'STUDENT',
        }
      });
      userId = newUser.id;
    }

    const newStudent = await prisma.eleve.create({
      data: {
        name,
        matricule,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        placeOfBirth: placeOfBirth || null,
        gender,
        address,
        photoUrl,
        classId,
        userId,
        isSick: isSick || false,
        hasDisability: hasDisability || false,
        medicalNotes: medicalNotes || null
      },
      include: { class: true }
    });
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student (Director only)
router.put('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { name, matricule, dateOfBirth, placeOfBirth, gender, address, photoUrl, classId, status, isSick, hasDisability, medicalNotes } = req.body;
  const { id } = req.params;
  try {
    const updated = await prisma.eleve.update({
      where: { id },
      data: {
        name,
        matricule,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        placeOfBirth: placeOfBirth || null,
        gender,
        address,
        photoUrl,
        classId,
        status,
        isSick: isSick || false,
        hasDisability: hasDisability || false,
        medicalNotes: medicalNotes || null
      },
      include: { class: true }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student (Director only)
router.delete('/:id', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { id } = req.params;
  try {
    const eleve = await prisma.eleve.findUnique({ where: { id } });
    if (!eleve) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Cascade deletions
    await prisma.parentEleve.deleteMany({ where: { eleveId: id } });
    await prisma.note.deleteMany({ where: { eleveId: id } });
    await prisma.absence.deleteMany({ where: { eleveId: id } });
    await prisma.sanction.deleteMany({ where: { eleveId: id } });
    await prisma.bookLoan.deleteMany({ where: { eleveId: id } });
    await prisma.paiement.deleteMany({ where: { eleveId: id } });
    await prisma.moratoire.deleteMany({ where: { eleveId: id } });
    await prisma.bulletin.deleteMany({ where: { eleveId: id } });
    
    await prisma.eleve.delete({ where: { id } });
    
    if (eleve.userId) {
      await prisma.user.delete({ where: { id: eleve.userId } }).catch(() => {});
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle student council status (Director/Censeur only)
router.patch('/:id/council', auth, requireRole(['DIRECTOR', 'CENSEUR']), requirePlan(['PREMIUM', 'CUSTOM']), async (req, res) => {
  const { id } = req.params;
  const { isStudentCouncil } = req.body;
  try {
    const updated = await prisma.eleve.update({
      where: { id },
      data: { isStudentCouncil }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import students from CSV (Director only)
router.post('/import-csv', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { csvText, classId } = req.body;
  try {
    if (!csvText || !classId) {
      return res.status(400).json({ message: 'CSV content and target Class ID are required' });
    }

    // CSV format: Nom, Matricule, Sexe, Date de Naissance, Lieu de Naissance, Adresse, Maladie, Handicap, Nom Parent, Téléphone Parent
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const imported = [];
    const skipped = [];

    // Skip header line if it contains metadata
    const startIdx = lines[0].toLowerCase().includes('nom') || lines[0].toLowerCase().includes('name') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map(part => part.trim());
      if (parts.length < 2) continue;

      const [name, matricule, gender, dateOfBirthStr, placeOfBirth, address, malStr, handStr, parentName, parentPhone] = parts;
      if (!name || !matricule) continue;

      // Check duplicate matricule
      const existing = await prisma.eleve.findUnique({
        where: { matricule }
      });

      if (existing) {
        skipped.push({ name, matricule, reason: 'Matricule duplicate' });
        continue;
      }

      // --- Subscription Plan Check ---
      const schoolId = req.user.schoolId;
      const currentPlan = req.user.school?.subscriptionPlan || 'PREMIUM';
      const currentStudentsCount = await prisma.eleve.count({ where: { class: { schoolId } } });

      if (currentPlan === 'ESSENTIAL' && currentStudentsCount >= 300) {
        skipped.push({ name, matricule, reason: 'Quota Essentiel atteint (Max 300)' });
        continue;
      }
      if (currentPlan === 'STANDARD' && currentStudentsCount >= 1000) {
        skipped.push({ name, matricule, reason: 'Quota Standard atteint (Max 1000)' });
        continue;
      }
      // --------------------------------

      // Parse date of birth
      let parsedDateOfBirth = null;
      if (dateOfBirthStr) {
        if (dateOfBirthStr.includes('/')) {
          const [d, m, y] = dateOfBirthStr.split('/');
          if (d && m && y) parsedDateOfBirth = new Date(`${y}-${m}-${d}`);
        } else {
          parsedDateOfBirth = new Date(dateOfBirthStr);
        }
        if (isNaN(parsedDateOfBirth?.getTime())) parsedDateOfBirth = null;
      }

      const isSick = malStr?.toLowerCase().trim() === 'oui' || malStr?.toLowerCase().trim() === 'yes';
      const hasDisability = handStr?.toLowerCase().trim() === 'oui' || handStr?.toLowerCase().trim() === 'yes';

      const newStudent = await prisma.eleve.create({
        data: {
          name,
          matricule,
          gender: gender || null,
          dateOfBirth: parsedDateOfBirth,
          placeOfBirth: placeOfBirth || null,
          address: address || null,
          isSick,
          hasDisability,
          classId
        }
      });
      imported.push(newStudent);

      // Handle Parent creation and linking
      if (parentPhone) {
        const phone = parentPhone.replace(/\s+/g, '');
        if (phone.length >= 6) { // basic validation
          let parentUser = await prisma.user.findFirst({
            where: { schoolId: req.user.schoolId, role: 'PARENT', phone }
          });
          
          if (!parentUser) {
            const baseName = parentName ? parentName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'parent';
            let finalEmail = `${baseName}.${phone}@edutrack.parent`;
            const passwordHash = await bcrypt.hash(phone, 10);
            
            parentUser = await prisma.user.create({
              data: {
                schoolId: req.user.schoolId,
                name: parentName || 'Parent de ' + name,
                email: finalEmail,
                phone: phone,
                passwordHash,
                role: 'PARENT'
              }
            });
          }
          
          await prisma.parentEleve.create({
            data: {
              parentId: parentUser.id,
              eleveId: newStudent.id,
              relationship: 'GUARDIAN'
            }
          });
        }
      }
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

// Upload student photo (Director only)
router.post('/:id/photo', auth, requireRole(['DIRECTOR', 'CENSEUR']), uploadPhoto.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo file uploaded' });
    }

    const photoUrl = `/photos/${req.file.filename}`;

    const updated = await prisma.eleve.update({
      where: { id: req.params.id },
      data: { photoUrl },
      include: { class: true }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student photo (Director only)
router.delete('/:id/photo', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  try {
    const student = await prisma.eleve.findUnique({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Delete file from disk
    if (student.photoUrl) {
      const filePath = path.join(__dirname, '..', '..', 'public', student.photoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    const updated = await prisma.eleve.update({
      where: { id: req.params.id },
      data: { photoUrl: null },
      include: { class: true }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk transfer students (Promotion / Class change)
router.post('/bulk-transfer', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { studentIds, targetClassId } = req.body;
  try {
    if (!studentIds || !Array.isArray(studentIds) || !targetClassId) {
      return res.status(400).json({ message: 'studentIds array and targetClassId are required' });
    }

    const updated = await prisma.eleve.updateMany({
      where: {
        id: { in: studentIds }
      },
      data: {
        classId: targetClassId
      }
    });

    res.json({ message: 'Students transferred successfully', count: updated.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student's own profile (For STUDENT portal)
router.get('/me/profile', auth, requireRole(['STUDENT']), async (req, res) => {
  try {
    const eleve = await prisma.eleve.findUnique({
      where: { userId: req.user.id },
      include: {
        class: true,
        notes: {
          include: { sequence: true, matiere: true }
        },
        absences: {
          include: { sequence: true }
        },
        paiements: true,
        bookLoans: {
          include: { book: true }
        },
        sanctions: true
      }
    });

    if (!eleve) {
      return res.status(404).json({ message: 'Student profile not found for this account' });
    }

    res.json(eleve);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
