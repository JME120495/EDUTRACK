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
  const wsClasses = xlsx.utils.aoa_to_sheet([
    ['Nom de la Classe'],
    ['6ème A']
  ]);
  xlsx.utils.book_append_sheet(wb, wsClasses, 'Classes');

  // 2. Enseignants
  const wsEnseignants = xlsx.utils.aoa_to_sheet([
    ['Nom complet', 'Email', 'Téléphone', 'Ville', 'Quartier'],
    ['Jean Dupont', 'jean@ecole.com', '699000000', 'Yaoundé', 'Bastos']
  ]);
  xlsx.utils.book_append_sheet(wb, wsEnseignants, 'Enseignants');

  // 3. Matieres
  const wsMatieres = xlsx.utils.aoa_to_sheet([
    ['Nom (FR)', 'Nom (EN)', 'Code', 'Coefficient', 'Heures par semaine'],
    ['Mathématiques', 'Mathematics', 'MATH', 4, 6]
  ]);
  xlsx.utils.book_append_sheet(wb, wsMatieres, 'Matieres');

  // 4. Eleves
  const wsEleves = xlsx.utils.aoa_to_sheet([
    ['Nom complet', 'Matricule', 'Classe', 'Sexe (M/F)', 'Date Naissance', 'Lieu Naissance', 'Adresse', 'Statut (ACTIVE/INACTIVE)', 'Malade (Oui/Non)', 'Handicap (Oui/Non)', 'Notes Médicales', 'Nom Parent', 'Tel Parent', 'Relation (FATHER/MOTHER/GUARDIAN)'],
    ['Pierre Martin', 'MAT123', '6ème A', 'M', '15/05/2012', 'Douala', 'Akwa', 'ACTIVE', 'Non', 'Non', '', 'Paul Martin', '677000000', 'FATHER']
  ]);
  xlsx.utils.book_append_sheet(wb, wsEleves, 'Eleves');

  // 5. Notes
  const wsNotes = xlsx.utils.aoa_to_sheet([
    ['Matricule Eleve', 'Code Matière', 'Séquence (ex: Séquence 1)', 'Trimestre (1, 2 ou 3)', 'Note (/20)', 'Remarque'],
    ['MAT123', 'MATH', 'Séquence 1', 1, 15.5, 'Très bon travail']
  ]);
  xlsx.utils.book_append_sheet(wb, wsNotes, 'Notes');

  // 6. Absences
  const wsAbsences = xlsx.utils.aoa_to_sheet([
    ['Matricule Eleve', 'Date (JJ/MM/AAAA)', 'Heures', 'Justifiée (Oui/Non)', 'Motif', 'Retard (Oui/Non)', 'Séquence (ex: Séquence 1)'],
    ['MAT123', '20/10/2025', 2, 'Oui', 'Maladie', 'Non', 'Séquence 1']
  ]);
  xlsx.utils.book_append_sheet(wb, wsAbsences, 'Absences');

  // 7. Paiements
  const wsPaiements = xlsx.utils.aoa_to_sheet([
    ['Matricule Eleve', 'Montant', 'Méthode (CASH/MOBILE_MONEY/WAVE/BANK)', 'Date', 'Référence Transaction', 'Téléphone Payeur', 'Remarque'],
    ['MAT123', 25000, 'CASH', '01/09/2025', 'RECU-001', '677000000', 'Tranche 1']
  ]);
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
    const stats = { classes: 0, enseignants: 0, matieres: 0, eleves: 0, notes: 0, absences: 0, paiements: 0 };

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

    // Cache to avoid multiple DB lookups
    const classCache = {}; // name -> id
    const teacherCache = {}; // email -> id
    const subjectCache = {}; // code -> id
    const sequenceCache = {}; // name -> id

    // --- 1. IMPORT CLASSES ---
    if (wb.SheetNames.includes('Classes')) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets['Classes']);
      for (const row of data) {
        const nom = row['Nom de la Classe'] || row['Nom'] || row['Name'];
        if (!nom) continue;
        const classNameStr = nom.toString().trim();
        
        const existing = await prisma.classe.findFirst({
          where: { schoolId, name: classNameStr, anneeScolaireId: activeYear.id }
        });

        if (!existing) {
          const newClass = await prisma.classe.create({
            data: { schoolId, anneeScolaireId: activeYear.id, name: classNameStr }
          });
          classCache[classNameStr] = newClass.id;
          stats.classes++;
        } else {
          classCache[classNameStr] = existing.id;
        }
      }
      logs.push(`Classes traitées: ${stats.classes} importées (les existantes ont été ignorées).`);
    }

    // --- 2. IMPORT ENSEIGNANTS ---
    if (wb.SheetNames.includes('Enseignants')) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets['Enseignants']);
      const schoolSlug = school.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3) || 'sch';
      const countrySlug = getCountrySlug(school.country);

      for (const row of data) {
        const nom = row['Nom complet'] || row['Nom'] || row['Name'];
        const tel = row['Téléphone'] || row['Telephone'] || row['Phone'];
        const ville = row['Ville'];
        const quartier = row['Quartier'];
        let email = row['Email'];
        
        if (!nom) continue;

        if (!email) {
          const baseName = nom.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const uniqueStr = Math.random().toString(36).substring(2, 6);
          email = `${baseName}.${uniqueStr}@${schoolSlug}.edutrack.${countrySlug}`;
        }
        
        const existing = await prisma.user.findUnique({ where: { email: email.toString().trim() } });
        if (!existing) {
          const passwordHash = await bcrypt.hash('123456', 10);
          const newUser = await prisma.user.create({
            data: {
              schoolId,
              name: nom.toString().trim(),
              email: email.toString().trim(),
              phone: tel ? tel.toString() : null,
              city: ville ? ville.toString().trim() : null,
              neighborhood: quartier ? quartier.toString().trim() : null,
              role: 'TEACHER',
              passwordHash
            }
          });
          teacherCache[email.toString().trim()] = newUser.id;
          stats.enseignants++;
        } else {
          teacherCache[existing.email] = existing.id;
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

        if (!nomFr || !code) continue;

        const codeStr = code.toString().trim();
        const existing = await prisma.matiere.findFirst({
          where: { schoolId, code: codeStr }
        });

        if (!existing) {
          const newMat = await prisma.matiere.create({
            data: {
              schoolId,
              nameFr: nomFr.toString().trim(),
              nameEn: nomEn.toString().trim(),
              code: codeStr,
              coefficient: coef,
              volumeHoraire: volume
            }
          });
          subjectCache[codeStr] = newMat.id;
          stats.matieres++;
        } else {
          subjectCache[existing.code] = existing.id;
        }
      }
      logs.push(`Matières traitées: ${stats.matieres} importées.`);
    }

    // --- 4. IMPORT ELEVES & PARENTS ---
    if (wb.SheetNames.includes('Eleves') || wb.SheetNames.includes('Elèves') || wb.SheetNames.includes('Élèves')) {
      const sheetName = wb.SheetNames.find(n => n.includes('leves'));
      const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
      
      for (const row of data) {
        const nom = row['Nom complet'] || row['Nom'];
        const matricule = row['Matricule'];
        const className = row['Classe'];
        const sexe = row['Sexe (M/F)'] || row['Sexe'];
        const adresse = row['Adresse'];
        const statut = row['Statut (ACTIVE/INACTIVE)'] || 'ACTIVE';
        const isSick = row['Malade (Oui/Non)']?.toString().toLowerCase() === 'oui';
        const hasDisability = row['Handicap (Oui/Non)']?.toString().toLowerCase() === 'oui';
        const medicalNotes = row['Notes Médicales'];

        const nomParent = row['Nom Parent'];
        const telParent = row['Tel Parent'];
        const relation = row['Relation (FATHER/MOTHER/GUARDIAN)'] || 'GUARDIAN';
        
        if (!nom || !matricule || !className) continue;
        const matriculeStr = matricule.toString().trim();
        const classNameStr = className.toString().trim();

        // Verify Class
        let classId = classCache[classNameStr];
        if (!classId) {
          const cl = await prisma.classe.findFirst({
            where: { schoolId, name: classNameStr, anneeScolaireId: activeYear.id }
          });
          if (cl) {
            classId = cl.id;
            classCache[classNameStr] = classId;
          } else {
            logs.push(`Erreur Élève ${nom}: Classe "${classNameStr}" introuvable.`);
            continue; 
          }
        }

        // Student Creation or Update
        let parsedDate = null;
        if (row['Date Naissance'] instanceof Date) {
          parsedDate = row['Date Naissance'];
        } else if (typeof row['Date Naissance'] === 'string') {
          // Attempt parsing basic formats, standard DD/MM/YYYY
          const parts = row['Date Naissance'].split('/');
          if (parts.length === 3) parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        
        const eleveData = {
          name: nom.toString().trim(),
          classId,
          gender: sexe ? sexe.toString().trim() : null,
          dateOfBirth: parsedDate,
          placeOfBirth: row['Lieu Naissance'] ? row['Lieu Naissance'].toString() : null,
          address: adresse ? adresse.toString().trim() : null,
          status: statut.toString().trim().toUpperCase(),
          isSick,
          hasDisability,
          medicalNotes: medicalNotes ? medicalNotes.toString().trim() : null
        };

        const existingStudent = await prisma.eleve.findUnique({ where: { matricule: matriculeStr } });
        let studentId;

        if (!existingStudent) {
          const newStudent = await prisma.eleve.create({
            data: {
              ...eleveData,
              matricule: matriculeStr
            }
          });
          studentId = newStudent.id;
          stats.eleves++;
        } else {
          await prisma.eleve.update({
            where: { id: existingStudent.id },
            data: eleveData
          });
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
            const uniqueStr = Math.random().toString(36).substring(2, 6);
            const finalEmail = `${baseName}.${phone}.${uniqueStr}@edutrack.parent`;
            const passwordHash = await bcrypt.hash(phone, 10);
            
            parentUser = await prisma.user.create({
              data: {
                schoolId,
                name: nomParent ? nomParent.toString().trim() : 'Parent de ' + nom,
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
              data: { parentId: parentUser.id, eleveId: studentId, relationship: relation.toString().trim().toUpperCase() }
            });
          }
        }
      }
      logs.push(`Élèves traités: ${stats.eleves} nouveaux élèves importés (les autres ont été mis à jour).`);
    }

    // --- Helper function for sequences ---
    const getSequence = async (seqName, term) => {
      const nameStr = seqName.toString().trim();
      if (sequenceCache[nameStr]) return sequenceCache[nameStr];
      let seq = await prisma.sequence.findFirst({
        where: { anneeScolaireId: activeYear.id, name: nameStr }
      });
      if (!seq) {
        seq = await prisma.sequence.create({
          data: { anneeScolaireId: activeYear.id, name: nameStr, term: parseInt(term) || 1, active: true }
        });
      }
      sequenceCache[nameStr] = seq.id;
      return seq.id;
    };

    // --- Fallback teacher ---
    let fallbackTeacherId = null;
    const getFallbackTeacher = async () => {
      if (fallbackTeacherId) return fallbackTeacherId;
      const teacher = await prisma.user.findFirst({ where: { schoolId, role: 'TEACHER' } });
      if (teacher) {
        fallbackTeacherId = teacher.id;
        return fallbackTeacherId;
      }
      throw new Error("Aucun enseignant disponible dans l'école pour attribuer la note.");
    };

    // --- 5. IMPORT NOTES ---
    if (wb.SheetNames.includes('Notes')) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets['Notes']);
      
      for (const row of data) {
        const matricule = row['Matricule Eleve'];
        const codeMatiere = row['Code Matière'];
        const sequenceName = row['Séquence (ex: Séquence 1)'] || row['Séquence'];
        const term = row['Trimestre (1, 2 ou 3)'];
        const noteValue = row['Note (/20)'];
        const remarque = row['Remarque'];

        if (!matricule || !codeMatiere || !sequenceName || noteValue === undefined) continue;

        const eleve = await prisma.eleve.findUnique({ where: { matricule: matricule.toString().trim() } });
        if (!eleve) {
          logs.push(`Note ignorée: Élève avec matricule ${matricule} introuvable.`);
          continue;
        }

        let matiereId = subjectCache[codeMatiere.toString().trim()];
        if (!matiereId) {
          const mat = await prisma.matiere.findFirst({ where: { schoolId, code: codeMatiere.toString().trim() } });
          if (mat) matiereId = mat.id;
          else {
            logs.push(`Note ignorée: Matière ${codeMatiere} introuvable.`);
            continue;
          }
        }

        const sequenceId = await getSequence(sequenceName, term);

        // Find teacher
        const emc = await prisma.enseignantMatiereClasse.findFirst({
          where: { classId: eleve.classId, matiereId }
        });
        let teacherId;
        try {
          teacherId = emc ? emc.teacherId : await getFallbackTeacher();
        } catch (e) {
          logs.push(`Erreur Note: Impossible d'attribuer un enseignant pour la note de ${matricule}.`);
          continue;
        }

        // Upsert Note
        const existingNote = await prisma.note.findFirst({
          where: { eleveId: eleve.id, matiereId, sequenceId }
        });

        if (existingNote) {
          await prisma.note.update({
            where: { id: existingNote.id },
            data: { value: parseFloat(noteValue), remarks: remarque?.toString().trim(), isDraft: false }
          });
        } else {
          await prisma.note.create({
            data: {
              eleveId: eleve.id,
              matiereId,
              sequenceId,
              teacherId,
              value: parseFloat(noteValue),
              remarks: remarque?.toString().trim(),
              isDraft: false
            }
          });
          stats.notes++;
        }
      }
      logs.push(`Notes traitées: ${stats.notes} nouvelles notes ajoutées.`);
    }

    // --- 6. IMPORT ABSENCES ---
    if (wb.SheetNames.includes('Absences')) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets['Absences']);
      
      for (const row of data) {
        const matricule = row['Matricule Eleve'];
        const dateVal = row['Date (JJ/MM/AAAA)'] || row['Date'];
        const hours = row['Heures'];
        const isJustified = row['Justifiée (Oui/Non)']?.toString().toLowerCase() === 'oui';
        const motif = row['Motif'];
        const isLateness = row['Retard (Oui/Non)']?.toString().toLowerCase() === 'oui';
        const sequenceName = row['Séquence (ex: Séquence 1)'] || row['Séquence'];

        if (!matricule || !dateVal || !sequenceName) continue;

        const eleve = await prisma.eleve.findUnique({ where: { matricule: matricule.toString().trim() } });
        if (!eleve) continue;

        let parsedDate = new Date();
        if (dateVal instanceof Date) parsedDate = dateVal;
        else if (typeof dateVal === 'string') {
          const parts = dateVal.split('/');
          if (parts.length === 3) parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }

        const sequenceId = await getSequence(sequenceName, 1);

        await prisma.absence.create({
          data: {
            eleveId: eleve.id,
            sequenceId,
            date: parsedDate,
            hours: parseFloat(hours) || 1.0,
            justified: isJustified,
            reason: motif ? motif.toString().trim() : null,
            isLateness
          }
        });
        stats.absences++;
      }
      logs.push(`Absences traitées: ${stats.absences} enregistrées.`);
    }

    // --- 7. IMPORT PAIEMENTS ---
    if (wb.SheetNames.includes('Paiements')) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets['Paiements']);
      
      for (const row of data) {
        const matricule = row['Matricule Eleve'];
        const amount = row['Montant'];
        const method = row['Méthode (CASH/MOBILE_MONEY/WAVE/BANK)'];
        const dateVal = row['Date'];
        const ref = row['Référence Transaction'];
        const payerPhone = row['Téléphone Payeur'];
        const remarque = row['Remarque'];
        
        if (!matricule || !amount) continue;

        const eleve = await prisma.eleve.findUnique({
          where: { matricule: matricule.toString().trim() },
          include: { class: true }
        });

        if (eleve && eleve.class.schoolId === schoolId) {
          let parsedDate = new Date();
          if (dateVal instanceof Date) parsedDate = dateVal;
          else if (typeof dateVal === 'string') {
            const parts = dateVal.split('/');
            if (parts.length === 3) parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }

          await prisma.paiement.create({
            data: {
              eleveId: eleve.id,
              amount: parseFloat(amount),
              paymentMethod: method ? method.toString().trim().toUpperCase() : 'CASH',
              paymentDate: parsedDate,
              transactionReference: ref ? ref.toString().trim() : null,
              payerPhone: payerPhone ? payerPhone.toString().trim() : null,
              remarks: remarque ? remarque.toString().trim() : 'Importation Excel',
              status: 'COMPLETED'
            }
          });
          stats.paiements++;
        }
      }
      logs.push(`Paiements traités: ${stats.paiements} enregistrés.`);
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
