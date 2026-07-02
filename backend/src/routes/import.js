const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { auth, requireRole } = require('../middlewares/authMiddleware');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function getCountrySlug(countryName) {
  if (!countryName) return 'cm';
  const name = countryName.toLowerCase().trim();
  const map = {
    'cameroun': 'cm', 'cameroon': 'cm',
    'france': 'fr', 'senegal': 'sn', 'sénégal': 'sn',
    'cote d\'ivoire': 'ci', 'côte d\'ivoire': 'ci'
  };
  return map[name] || name.substring(0, 2);
}

// Generate an Excel Template
router.get('/template', auth, requireRole(['DIRECTOR']), (req, res) => {
  const wb = xlsx.utils.book_new();

  // 1. Classes
  const wsClasses = xlsx.utils.aoa_to_sheet([['Nom', 'Année Scolaire (ex: 2025-2026)']]);
  xlsx.utils.book_append_sheet(wb, wsClasses, 'Classes');

  // 2. Enseignants
  const wsEnseignants = xlsx.utils.aoa_to_sheet([['Nom complet', 'Email', 'Téléphone']]);
  xlsx.utils.book_append_sheet(wb, wsEnseignants, 'Enseignants');

  // 3. Matieres
  const wsMatieres = xlsx.utils.aoa_to_sheet([['Nom (FR)', 'Nom (EN)', 'Code', 'Coefficient', 'Heures par semaine']]);
  xlsx.utils.book_append_sheet(wb, wsMatieres, 'Matieres');

  // 4. Eleves
  const wsEleves = xlsx.utils.aoa_to_sheet([
    ['Nom complet', 'Matricule', 'Classe', 'Sexe (M/F)', 'Date Naissance (JJ/MM/AAAA)', 'Lieu Naissance', 'Nom Parent', 'Tel Parent']
  ]);
  xlsx.utils.book_append_sheet(wb, wsEleves, 'Eleves');

  // 5. Paiements
  const wsPaiements = xlsx.utils.aoa_to_sheet([['Matricule Eleve', 'Montant Payé', 'Méthode (CASH, MOBILE_MONEY)', 'Date (JJ/MM/AAAA)', 'Remarque']]);
  xlsx.utils.book_append_sheet(wb, wsPaiements, 'Paiements');

  const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

  res.setHeader('Content-Disposition', 'attachment; filename="EduTrack_Import_Template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(excelBuffer);
});

// Process Import
router.post('/excel', auth, requireRole(['DIRECTOR']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const schoolId = req.user.schoolId;
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    
    // Parse Excel file
    const wb = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    
    const logs = [];
    const stats = { classes: 0, enseignants: 0, matieres: 0, eleves: 0, paiements: 0 };

    // Default Academic Year
    let activeYear = await prisma.anneeScolaire.findFirst({
      where: { schoolId, active: true }
    });
    if (!activeYear) {
      activeYear = await prisma.anneeScolaire.create({
        data: { schoolId, label: `${new Date().getFullYear()}-${new Date().getFullYear()+1}`, active: true }
      });
      logs.push(`Année scolaire créée par défaut: ${activeYear.label}`);
    }

    // --- 1. IMPORT CLASSES ---
    if (wb.SheetNames.includes('Classes')) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets['Classes']);
      for (const row of data) {
        const nom = row['Nom'] || row['nom'] || row['Name'];
        if (!nom) continue;
        
        // Find existing
        const existing = await prisma.classe.findFirst({
          where: { schoolId, name: nom.toString().trim(), anneeScolaireId: activeYear.id }
        });

        if (!existing) {
          await prisma.classe.create({
            data: { schoolId, anneeScolaireId: activeYear.id, name: nom.toString().trim() }
          });
          stats.classes++;
        }
      }
      logs.push(`Classes traitées: ${stats.classes} importées.`);
    }

    // --- 2. IMPORT ENSEIGNANTS ---
    if (wb.SheetNames.includes('Enseignants')) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets['Enseignants']);
      const schoolSlug = school.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3) || 'sch';
      const countrySlug = getCountrySlug(school.country);

      for (const row of data) {
        const nom = row['Nom complet'] || row['Nom'] || row['Name'];
        const tel = row['Téléphone'] || row['Telephone'] || row['Phone'];
        let email = row['Email'];
        
        if (!nom) continue;

        if (!email) {
          const baseName = nom.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          email = `${baseName}@${schoolSlug}.edutrack.${countrySlug}`;
        }
        
        const existing = await prisma.user.findFirst({ where: { schoolId, email } });
        if (!existing) {
          const passwordHash = await bcrypt.hash('123456', 10);
          await prisma.user.create({
            data: {
              schoolId,
              name: nom.toString().trim(),
              email,
              phone: tel ? tel.toString() : null,
              role: 'TEACHER',
              passwordHash
            }
          });
          stats.enseignants++;
        }
      }
      logs.push(`Enseignants traités: ${stats.enseignants} importés.`);
    }

    // --- 3. IMPORT MATIERES ---
    if (wb.SheetNames.includes('Matieres') || wb.SheetNames.includes('Matières')) {
      const sheetName = wb.SheetNames.includes('Matieres') ? 'Matieres' : 'Matières';
      const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
      
      for (const row of data) {
        const nomFr = row['Nom (FR)'] || row['Nom'];
        const nomEn = row['Nom (EN)'] || nomFr;
        const code = row['Code'] || nomFr?.substring(0, 4).toUpperCase();
        const coef = row['Coefficient'] ? parseFloat(row['Coefficient']) : 1.0;
        const volume = row['Heures par semaine'] ? parseInt(row['Heures par semaine']) : 2;

        if (!nomFr) continue;

        const existing = await prisma.matiere.findFirst({
          where: { schoolId, code: code.toString() }
        });

        if (!existing) {
          await prisma.matiere.create({
            data: {
              schoolId,
              nameFr: nomFr.toString().trim(),
              nameEn: nomEn.toString().trim(),
              code: code.toString(),
              coefficient: coef,
              volumeHoraire: volume
            }
          });
          stats.matieres++;
        }
      }
      logs.push(`Matières traitées: ${stats.matieres} importées.`);
    }

    // --- 4. IMPORT ELEVES & PARENTS ---
    if (wb.SheetNames.includes('Eleves') || wb.SheetNames.includes('Elèves') || wb.SheetNames.includes('Élèves')) {
      const sheetName = wb.SheetNames.find(n => n.includes('leves'));
      const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
      
      const classCache = {}; // name -> id

      for (const row of data) {
        const nom = row['Nom complet'] || row['Nom'];
        const matricule = row['Matricule'];
        const className = row['Classe'];
        const sexe = row['Sexe (M/F)'] || row['Sexe'];
        const nomParent = row['Nom Parent'] || row['Parent'];
        const telParent = row['Tel Parent'] || row['Téléphone Parent'];
        
        if (!nom || !matricule || !className) continue;

        // Verify Class
        let classId = classCache[className.toString().trim()];
        if (!classId) {
          const cl = await prisma.classe.findFirst({
            where: { schoolId, name: className.toString().trim(), anneeScolaireId: activeYear.id }
          });
          if (cl) {
            classId = cl.id;
            classCache[className.toString().trim()] = classId;
          } else {
            logs.push(`Erreur Élève ${nom}: Classe "${className}" introuvable.`);
            continue; // Skip student if class doesn't exist
          }
        }

        // Student Creation
        const existingStudent = await prisma.eleve.findUnique({ where: { matricule: matricule.toString() } });
        let studentId;

        if (!existingStudent) {
          let parsedDate = null;
          if (row['Date Naissance (JJ/MM/AAAA)'] instanceof Date) {
            parsedDate = row['Date Naissance (JJ/MM/AAAA)'];
          }
          
          const newStudent = await prisma.eleve.create({
            data: {
              name: nom.toString().trim(),
              matricule: matricule.toString().trim(),
              classId,
              gender: sexe ? sexe.toString().trim() : null,
              dateOfBirth: parsedDate,
              placeOfBirth: row['Lieu Naissance'] ? row['Lieu Naissance'].toString() : null
            }
          });
          studentId = newStudent.id;
          stats.eleves++;
        } else {
          studentId = existingStudent.id;
        }

        // Parent linking
        if (telParent && studentId) {
          const phone = telParent.toString().replace(/\s+/g, '');
          let parentUser = await prisma.user.findFirst({
            where: { schoolId, role: 'PARENT', phone }
          });
          
          if (!parentUser) {
            const baseName = nomParent ? nomParent.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'parent';
            const finalEmail = `${baseName}.${phone}@edutrack.parent`;
            const passwordHash = await bcrypt.hash(phone, 10);
            
            parentUser = await prisma.user.create({
              data: {
                schoolId,
                name: nomParent || 'Parent de ' + nom,
                email: finalEmail,
                phone: phone,
                passwordHash,
                role: 'PARENT'
              }
            });
          }
          
          // Create link if not exists
          const existingLink = await prisma.parentEleve.findUnique({
            where: { parentId_eleveId: { parentId: parentUser.id, eleveId: studentId } }
          });
          
          if (!existingLink) {
            await prisma.parentEleve.create({
              data: { parentId: parentUser.id, eleveId: studentId, relationship: 'GUARDIAN' }
            });
          }
        }
      }
      logs.push(`Élèves traités: ${stats.eleves} importés.`);
    }

    // --- 5. IMPORT PAIEMENTS ---
    if (wb.SheetNames.includes('Paiements')) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets['Paiements']);
      
      for (const row of data) {
        const matricule = row['Matricule Eleve'] || row['Matricule'];
        const amount = row['Montant Payé'] || row['Montant'];
        
        if (!matricule || !amount) continue;

        const student = await prisma.eleve.findUnique({
          where: { matricule: matricule.toString().trim() },
          include: { class: true }
        });

        if (student && student.class.schoolId === schoolId) {
          await prisma.paiement.create({
            data: {
              eleveId: student.id,
              amount: parseFloat(amount),
              paymentMethod: row['Méthode (CASH, MOBILE_MONEY)'] || 'CASH',
              remarks: row['Remarque'] ? row['Remarque'].toString() : 'Importation Excel',
              status: 'COMPLETED'
            }
          });
          stats.paiements++;
        }
      }
      logs.push(`Paiements traités: ${stats.paiements} importés.`);
    }

    res.json({
      message: 'Importation globale terminée avec succès.',
      stats,
      logs
    });

  } catch (error) {
    console.error('[Excel Import Error]', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'importation Excel' });
  }
});

module.exports = router;
