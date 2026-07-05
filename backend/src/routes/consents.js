const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

// Get all consents for the current parent's children
router.get('/parent', auth, requireRole(['PARENT']), async (req, res) => {
  try {
    const parentId = req.user.id;
    const consents = await prisma.parentalConsent.findMany({
      where: { parentId },
      include: {
        eleve: { select: { name: true, matricule: true } }
      }
    });
    res.json(consents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert a consent (Grant or Withdraw)
router.post('/', auth, requireRole(['PARENT']), async (req, res) => {
  const { eleveId, consentType, status } = req.body;
  const parentId = req.user.id;
  
  if (!['PEDAGOGICAL', 'MARKETING', 'PARTNERS', 'HEALTH'].includes(consentType)) {
    return res.status(400).json({ message: 'Invalid consent type' });
  }
  if (!['GRANTED', 'WITHDRAWN'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Use transaction to ensure both records are created
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the main consent record
      const consent = await tx.parentalConsent.upsert({
        where: {
          parentId_eleveId_consentType: {
            parentId,
            eleveId,
            consentType
          }
        },
        update: {
          status,
          ipAddress
        },
        create: {
          parentId,
          eleveId,
          consentType,
          status,
          ipAddress
        }
      });

      // Create the immutable log
      await tx.parentalConsentLog.create({
        data: {
          consentId: consent.id,
          status,
          ipAddress
        }
      });

      // If withdrawn, notify the director
      if (status === 'WITHDRAWN') {
        const director = await tx.user.findFirst({
          where: { schoolId: req.user.schoolId, role: 'DIRECTOR' }
        });
        
        if (director) {
          const eleve = await tx.eleve.findUnique({ where: { id: eleveId } });
          await tx.message.create({
            data: {
              senderId: parentId,
              receiverId: director.id,
              title: `Retrait de consentement : ${eleve.name}`,
              content: `Le parent ${req.user.name} a retiré son consentement pour la catégorie de données "${consentType}" concernant l'élève ${eleve.name}. Veuillez en prendre note dans le traitement des données.`
            }
          });
        }
      }

      return consent;
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export the processing register (CSV) - DIRECTOR only
router.get('/export', auth, requireRole(['DIRECTOR']), async (req, res) => {
  try {
    // Get all current consents for the school
    const consents = await prisma.parentalConsent.findMany({
      where: {
        eleve: { schoolId: req.user.schoolId }
      },
      include: {
        parent: { select: { name: true, email: true } },
        eleve: { select: { name: true, matricule: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Generate CSV
    const headers = ['Eleve', 'Matricule', 'Parent', 'Email Parent', 'Type de Consentement', 'Statut', 'Date de MAJ', 'IP'];
    const rows = consents.map(c => [
      `"${c.eleve.name}"`,
      `"${c.eleve.matricule}"`,
      `"${c.parent.name}"`,
      `"${c.parent.email || ''}"`,
      `"${c.consentType}"`,
      `"${c.status}"`,
      `"${c.updatedAt.toISOString()}"`,
      `"${c.ipAddress || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="registre_traitements_consentement.csv"');
    res.status(200).send(Buffer.from('\uFEFF' + csvContent, 'utf-8')); // Add BOM for Excel UTF-8 support
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log sensitive access
router.post('/log-access', auth, async (req, res) => {
  const { eleveId, accessReason } = req.body;
  const userId = req.user.id;

  try {
    const log = await prisma.sensitiveDataAccessLog.create({
      data: {
        userId,
        eleveId,
        accessReason: accessReason || 'Consultation dossier médical/disciplinaire'
      }
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
