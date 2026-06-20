const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { generateSequenceBulletins, generateTermBulletins, generateAnnualBulletins } = require('../services/bulletinService');
const { generateBulletinPDF } = require('../services/pdfService');
const { sendWhatsAppReport } = require('../services/notifService');
const { auth, requireRole } = require('../middlewares/authMiddleware');
const path = require('path');

// Get bulletins by query parameters (classId & sequenceId, or eleveId)
router.get('/', auth, async (req, res) => {
  const { classId, sequenceId, eleveId } = req.query;
  try {
    const where = {};
    if (eleveId) {
      where.eleveId = eleveId;
    } else if (classId && sequenceId) {
      where.sequenceId = sequenceId;
      where.type = 'SEQUENCE';
      where.eleve = { classId };
    } else {
      return res.status(400).json({ message: 'Missing parameters. Provide eleveId, or classId and sequenceId' });
    }

    const bulletins = await prisma.bulletin.findMany({
      where,
      include: {
        eleve: {
          include: {
            parents: {
              include: { parent: true }
            },
            sanctions: {
              orderBy: { date: 'desc' }
            }
          }
        },
        sequence: true,
        details: { include: { matiere: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bulletins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate sequence bulletins for a class (Director only)
router.post('/generate-sequence', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId, sequenceId } = req.body;
  try {
    if (!classId || !sequenceId) {
      return res.status(400).json({ message: 'Class ID and Sequence ID are required' });
    }
    const result = await generateSequenceBulletins(classId, sequenceId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alias /generate -> /generate-sequence
router.post('/generate', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId, sequenceId } = req.body;
  try {
    if (!classId || !sequenceId) {
      return res.status(400).json({ message: 'Class ID and Sequence ID are required' });
    }
    const result = await generateSequenceBulletins(classId, sequenceId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate term bulletins for a class (Director only)
router.post('/generate-term', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId, term } = req.body;
  try {
    if (!classId || !term) {
      return res.status(400).json({ message: 'Class ID and Term number are required' });
    }
    const result = await generateTermBulletins(classId, parseInt(term));
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bulletins for class + sequence
router.get('/classe/:classId/sequence/:sequenceId', auth, async (req, res) => {
  const { classId, sequenceId } = req.params;
  try {
    const bulletins = await prisma.bulletin.findMany({
      where: {
        sequenceId,
        type: 'SEQUENCE',
        eleve: { classId }
      },
      include: {
        eleve: {
          include: {
            parents: {
              include: { parent: true }
            }
          }
        },
        sequence: true,
        details: { include: { matiere: true } }
      }
    });
    res.json(bulletins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bulletins for class + term
router.get('/classe/:classId/term/:term', auth, async (req, res) => {
  const { classId, term } = req.params;
  try {
    const bulletins = await prisma.bulletin.findMany({
      where: {
        term: parseInt(term),
        type: 'TERM',
        eleve: { classId }
      },
      include: {
        eleve: {
          include: {
            parents: {
              include: { parent: true }
            }
          }
        },
        details: { include: { matiere: true } }
      }
    });
    res.json(bulletins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bulletins for a student (Parent Portal)
router.get('/eleve/:eleveId', auth, async (req, res) => {
  const { eleveId } = req.params;
  try {
    const bulletins = await prisma.bulletin.findMany({
      where: { eleveId },
      include: {
        sequence: true,
        eleve: {
          include: {
            parents: {
              include: { parent: true }
            }
          }
        },
        details: { include: { matiere: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bulletins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get or generate PDF for a bulletin
router.get('/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const bulletin = await prisma.bulletin.findUnique({
      where: { id }
    });
    if (!bulletin) {
      return res.status(404).send('Bulletin not found');
    }

    // Generate/regenerate the PDF to ensure it is available and up-to-date
    const relativePdfUrl = await generateBulletinPDF(id);
    await prisma.bulletin.update({
      where: { id },
      data: { pdfUrl: relativePdfUrl }
    });

    const absolutePath = path.join(__dirname, '..', '..', 'public', 'bulletins', `${id}.pdf`);
    res.sendFile(absolutePath);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Generate and get PDF URL for a bulletin
router.post('/:id/generate-pdf', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const pdfUrl = await generateBulletinPDF(id);
    await prisma.bulletin.update({
      where: { id },
      data: { pdfUrl }
    });
    res.json({ pdfUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sign a bulletin electronically
router.post('/:id/sign', auth, async (req, res) => {
  const { id } = req.params;
  const { role } = req.user;
  try {
    const updateData = {};
    if (role === 'DIRECTOR') updateData.signedDirector = true;
    else if (role === 'TEACHER') updateData.signedTeacher = true;
    else if (role === 'PARENT') updateData.signedParent = true;
    else return res.status(403).json({ message: 'Invalid role for signing' });

    const updated = await prisma.bulletin.update({
      where: { id },
      data: updateData
    });

    // Re-generate PDF to include the signature
    const pdfUrl = await generateBulletinPDF(id);
    await prisma.bulletin.update({
      where: { id },
      data: { pdfUrl }
    });

    res.json({ message: 'Bulletin signed successfully', bulletin: updated, pdfUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mass WhatsApp PDF reports dispatch (Director only)
router.post('/send-whatsapp', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { bulletinIds } = req.body;
  try {
    if (!bulletinIds || !Array.isArray(bulletinIds)) {
      return res.status(400).json({ message: 'Bulletin IDs array is required' });
    }

    const sent = [];
    const failed = [];

    for (const bId of bulletinIds) {
      try {
        const bulletin = await prisma.bulletin.findUnique({
          where: { id: bId },
          include: {
            eleve: {
              include: {
                parents: { include: { parent: true } }
              }
            }
          }
        });

        if (!bulletin) continue;

        // Ensure PDF is generated
        let pdfUrl = bulletin.pdfUrl;
        if (!pdfUrl) {
          pdfUrl = await generateBulletinPDF(bId);
          await prisma.bulletin.update({
            where: { id: bId },
            data: { pdfUrl }
          });
        }

        // Get first parent contact phone
        const parentLink = bulletin.eleve.parents[0];
        if (!parentLink || !parentLink.parent.phone) {
          failed.push({ bulletinId: bId, reason: 'No parent phone registered' });
          continue;
        }

        const parentPhone = parentLink.parent.phone;
        const studentName = bulletin.eleve.name;

        // Call WhatsApp notification
        await sendWhatsAppReport(parentPhone, studentName, `http://localhost:5000${pdfUrl}`);
        sent.push({ bulletinId: bId, studentName, phone: parentPhone });
      } catch (e) {
        failed.push({ bulletinId: bId, reason: e.message });
      }
    }

    res.json({
      message: 'WhatsApp mass dispatch complete',
      sentCount: sent.length,
      failedCount: failed.length,
      sent,
      failed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate annual bulletins for a class (Director only)
router.post('/generate-annual', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId } = req.body;
  try {
    if (!classId) {
      return res.status(400).json({ message: 'Class ID is required' });
    }
    const result = await generateAnnualBulletins(classId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get annual bulletins for class
router.get('/classe/:classId/annual', auth, async (req, res) => {
  const { classId } = req.params;
  try {
    const bulletins = await prisma.bulletin.findMany({
      where: {
        type: 'ANNUAL',
        eleve: { classId }
      },
      include: {
        eleve: {
          include: {
            parents: {
              include: { parent: true }
            }
          }
        },
        details: { include: { matiere: true } }
      }
    });
    res.json(bulletins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student behavior and council remarks for a bulletin
router.put('/:id/behavior', auth, requireRole(['DIRECTOR', 'TEACHER']), async (req, res) => {
  const { id } = req.params;
  const { conduct, disciplinaryAction, classCouncilDecision } = req.body;
  try {
    const bulletin = await prisma.bulletin.findUnique({
      where: { id },
      include: { eleve: { include: { class: true } } }
    });
    
    if (!bulletin || bulletin.eleve.class.schoolId !== req.user.schoolId) {
      return res.status(404).json({ message: 'Bulletin not found' });
    }

    // Update bulletin details
    const updated = await prisma.bulletin.update({
      where: { id },
      data: {
        conduct: conduct !== undefined ? conduct : null,
        disciplinaryAction: disciplinaryAction !== undefined ? disciplinaryAction : null,
        classCouncilDecision: classCouncilDecision !== undefined ? classCouncilDecision : null
      }
    });

    // Regenerate PDF automatically
    const pdfUrl = await generateBulletinPDF(id);
    await prisma.bulletin.update({
      where: { id },
      data: { pdfUrl }
    });

    res.json({ message: 'Behavior and class council comments updated', bulletin: updated, pdfUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const archiver = require('archiver');
const fs = require('fs');

// Bulk Export Bulletins as ZIP
router.get('/export-zip', auth, requireRole(['DIRECTOR', 'CENSEUR']), async (req, res) => {
  const { classId, type, parameter } = req.query;
  try {
    if (!classId || !type) {
      return res.status(400).json({ message: 'Missing classId or type' });
    }

    const where = { type, eleve: { classId } };
    if (type === 'SEQUENCE' && parameter) where.sequenceId = parameter;
    if (type === 'TERM' && parameter) where.term = parseInt(parameter);

    const bulletins = await prisma.bulletin.findMany({
      where,
      include: { eleve: true }
    });

    if (bulletins.length === 0) {
      return res.status(404).json({ message: 'Aucun bulletin trouvé pour cette sélection.' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=bulletins_classe_${classId}_${type}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const b of bulletins) {
      let pdfPath;
      if (b.pdfUrl) {
        pdfPath = path.join(__dirname, '..', '..', 'public', b.pdfUrl.replace('/api/', ''));
      } else {
        // Fallback to default path
        pdfPath = path.join(__dirname, '..', '..', 'public', 'bulletins', `${b.id}.pdf`);
      }
      
      if (fs.existsSync(pdfPath)) {
        const studentName = b.eleve.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        archive.file(pdfPath, { name: `${studentName}_Bulletin.pdf` });
      }
    }

    await archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
