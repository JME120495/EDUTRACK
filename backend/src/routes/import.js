const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const path = require("path");
const { auth, requireRole } = require('../middlewares/authMiddleware');


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls' && ext !== '.csv') {
      return cb(new Error('Seuls les fichiers .xlsx, .xls ou .csv sont autorisés'));
    }
    cb(null, true);
  }
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

    const chunkArray = (arr, size) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

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

    // Cache initialization
    const classCache = new Map(); // normalizedName -> id
    
    const normalizeClassName = (name) => {
      if (!name) return '';
      return name.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/eme/g, 'e') // handles 6ème -> 6eme -> 6e
        .replace(/ere/g, 'e') // handles 1ère -> 1ere -> 1e
        .replace(/nde/g, 'e') // handles 2nde -> 2e (optional, but 2nde is usually kept, let's just do spaces)
        .replace(/\s+/g, '') // remove all spaces
        .trim();
    };

    const teacherCache = new Map(); // email -> id
    const subjectCache = new Map(); // code -> id
    const sequenceCache = new Map(); // name -> id
    const eleveCache = new Map(); // matricule -> { id, classId }
    
    // Pre-load existing data to avoid N+1
    const existingClasses = await prisma.classe.findMany({ where: { schoolId, anneeScolaireId: activeYear.id } });
    existingClasses.forEach(c => classCache.set(normalizeClassName(c.name), c.id));

    const existingTeachers = await prisma.user.findMany({ where: { schoolId, role: 'TEACHER' } });
    existingTeachers.forEach(t => teacherCache.set(t.email, t.id));

    const existingSubjects = await prisma.matiere.findMany({ where: { schoolId } });
    existingSubjects.forEach(s => subjectCache.set(s.code, s.id));

    const existingSequences = await prisma.sequence.findMany({ where: { anneeScolaireId: activeYear.id } });
    existingSequences.forEach(s => sequenceCache.set(s.name, s.id));

    const existingEleves = await prisma.eleve.findMany({ 
      where: { class: { schoolId } } 
    });
    existingEleves.forEach(e => {
      if (e.matricule) {
        eleveCache.set(e.matricule.toString().trim().toUpperCase(), { id: e.id, classId: e.classId });
      }
    });

    // Pre-compute common hashes
    const defaultTeacherPasswordHash = await bcrypt.hash('123456', 10);
    const parentHashCache = new Map();

    // Helper for robust sheet name matching
    const normalizeStr = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const findSheet = (possibleNames) => wb.SheetNames.find(n => possibleNames.includes(normalizeStr(n)));

    // --- 1. IMPORT CLASSES ---
    const classesSheet = findSheet(['classes', 'classe']);
    if (classesSheet) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets[classesSheet]);
      const newClasses = [];
      for (const row of data) {
        const nom = row['Nom de la Classe'] || row['Nom'] || row['Name'] || row['Classe'] || Object.values(row)[0];
        if (!nom) continue;
        const classNameStr = nom.toString().trim();
        const normClass = normalizeClassName(classNameStr);
        if (!classCache.has(normClass)) {
          newClasses.push({ schoolId, anneeScolaireId: activeYear.id, name: classNameStr });
          classCache.set(normClass, 'pending'); // Mark as pending to avoid duplicates
        }
      }
      if (newClasses.length > 0) {
        await prisma.classe.createMany({ data: newClasses, skipDuplicates: true });
        const updatedClasses = await prisma.classe.findMany({ where: { schoolId, anneeScolaireId: activeYear.id } });
        updatedClasses.forEach(c => classCache.set(normalizeClassName(c.name), c.id));
        stats.classes += newClasses.length;
      }
      logs.push(`Classes traitées: ${stats.classes} importées (les existantes ont été ignorées).`);
    }

    // --- 2. IMPORT ENSEIGNANTS ---
    const enseignantsSheet = findSheet(['enseignants', 'enseignant']);
    if (enseignantsSheet) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets[enseignantsSheet]);
      const schoolSlug = school.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3) || 'sch';
      const countrySlug = getCountrySlug(school.country);
      const newTeachers = [];

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
        
        const emailStr = email.toString().trim();
        if (!teacherCache.has(emailStr)) {
          newTeachers.push({
            schoolId,
            name: nom.toString().trim(),
            email: emailStr,
            phone: tel ? tel.toString() : null,
            city: ville ? ville.toString().trim() : null,
            neighborhood: quartier ? quartier.toString().trim() : null,
            role: 'TEACHER',
            passwordHash: defaultTeacherPasswordHash
          });
          teacherCache.set(emailStr, 'pending');
        }
      }
      
      if (newTeachers.length > 0) {
        await prisma.user.createMany({ data: newTeachers, skipDuplicates: true });
        const updatedTeachers = await prisma.user.findMany({ where: { schoolId, role: 'TEACHER' } });
        updatedTeachers.forEach(t => teacherCache.set(t.email, t.id));
        stats.enseignants += newTeachers.length;
      }
      logs.push(`Enseignants traités: ${stats.enseignants} importés.`);
    }

    // --- 3. IMPORT MATIERES ---
    const matieresSheet = findSheet(['matieres', 'matiere']);
    if (matieresSheet) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets[matieresSheet]);
      const newSubjects = [];
      
      for (const row of data) {
        const nomFr = row['Nom (FR)'] || row['Nom'];
        const nomEn = row['Nom (EN)'] || nomFr;
        const code = row['Code'] || nomFr?.substring(0, 4).toUpperCase();
        const coef = row['Coefficient'] ? parseFloat(row['Coefficient']) : 1.0;
        const volume = row['Heures par semaine'] ? parseInt(row['Heures par semaine']) : 2;

        if (!nomFr || !code) continue;
        const codeStr = code.toString().trim();

        if (!subjectCache.has(codeStr)) {
          newSubjects.push({
            schoolId,
            nameFr: nomFr.toString().trim(),
            nameEn: nomEn.toString().trim(),
            code: codeStr,
            coefficient: coef,
            volumeHoraire: volume
          });
          subjectCache.set(codeStr, 'pending');
        }
      }
      
      if (newSubjects.length > 0) {
        await prisma.matiere.createMany({ data: newSubjects, skipDuplicates: true });
        const updatedSubjects = await prisma.matiere.findMany({ where: { schoolId } });
        updatedSubjects.forEach(s => subjectCache.set(s.code, s.id));
        stats.matieres += newSubjects.length;
      }
      logs.push(`Matières traitées: ${stats.matieres} importées.`);
    }

    // Helper functions for parsing dates
    const parseDate = (dateVal) => {
      if (dateVal instanceof Date) return dateVal;
      if (typeof dateVal === 'string') {
        const parts = dateVal.split('/');
        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      return null;
    };

    // --- 4. IMPORT ELEVES & PARENTS ---
    const elevesSheet = findSheet(['eleves', 'eleve']);
    if (elevesSheet) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets[elevesSheet]);
      
      const newEleves = [];
      const eleveUpdates = [];
      const parentOperations = []; // to collect parents data
      
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
        
        if (!nom || !matricule || (!className && !req.body.classId)) continue;
        const matriculeStr = matricule.toString().trim().toUpperCase();
        const classNameStr = className ? className.toString().trim() : null;
        const normClass = normalizeClassName(classNameStr);

        let classId = req.body.classId || classCache.get(normClass);
        if (!classId || classId === 'pending') {
            logs.push(`Erreur Élève ${nom}: Classe "${classNameStr}" introuvable.`);
            continue;
        }

        const eleveData = {
          name: nom.toString().trim(),
          classId,
          gender: sexe ? sexe.toString().trim() : null,
          dateOfBirth: parseDate(row['Date Naissance']),
          placeOfBirth: row['Lieu Naissance'] ? row['Lieu Naissance'].toString() : null,
          address: adresse ? adresse.toString().trim() : null,
          status: statut.toString().trim().toUpperCase(),
          isSick,
          hasDisability,
          medicalNotes: medicalNotes ? medicalNotes.toString().trim() : null
        };

        if (!eleveCache.has(matriculeStr)) {
          newEleves.push({ ...eleveData, matricule: matriculeStr, schoolId });
          // Mark as pending to avoid treating it as new again if duplicated in excel
          eleveCache.set(matriculeStr, { classId, pending: true, parentData: { nomParent, telParent, relation } });
        } else {
          const existing = eleveCache.get(matriculeStr);
          if (!existing.pending) {
            let hasChanged = false;
            if (existing.name !== eleveData.name) hasChanged = true;
            if (existing.classId !== eleveData.classId) hasChanged = true;
            if (existing.gender !== eleveData.gender) hasChanged = true;
            if (existing.placeOfBirth !== eleveData.placeOfBirth) hasChanged = true;
            if (existing.address !== eleveData.address) hasChanged = true;
            if (existing.status !== eleveData.status) hasChanged = true;
            if (existing.isSick !== eleveData.isSick) hasChanged = true;
            if (existing.hasDisability !== eleveData.hasDisability) hasChanged = true;
            if (existing.medicalNotes !== eleveData.medicalNotes) hasChanged = true;

            if (hasChanged) {
              eleveUpdates.push({
                where: { id: existing.id },
                data: eleveData
              });
            }
            if (telParent) {
               parentOperations.push({ studentId: existing.id, nomParent, telParent, relation, name: nom });
            }
          }
        }
      }
      
      // Batch insert/update Eleves
      if (newEleves.length > 0) {
         const chunks = chunkArray(newEleves, 1000);
         for (const chunk of chunks) {
            await prisma.eleve.createMany({ data: chunk, skipDuplicates: true });
         }
         stats.eleves += newEleves.length;
      }
      
      // We need to re-fetch eleves to get IDs for new ones to link parents
      const allEleves = await prisma.eleve.findMany({ where: { class: { schoolId }, matricule: { in: matriculesInChunk } } });
      allEleves.forEach(e => {
         if (e.matricule) {
            const normMatricule = e.matricule.toString().trim().toUpperCase();
            const cached = eleveCache.get(normMatricule);
            if (cached && cached.pending) {
               parentOperations.push({ studentId: e.id, ...cached.parentData, name: e.name });
            }
            eleveCache.set(normMatricule, { id: e.id, classId: e.classId });
         }
      });
      
      // Execute Eleve Updates sequentially to avoid connection pool exhaustion
      for (const op of eleveUpdates) {
        await prisma.eleve.update(op);
      }

      // Parents logic
      const parentPhones = [...new Set(parentOperations.map(p => p.telParent?.toString().replace(/\s+/g, '')).filter(Boolean))];
      const existingParents = await prisma.user.findMany({ where: { schoolId, role: 'PARENT', phone: { in: parentPhones } } });
      const parentMap = new Map(existingParents.map(p => [p.phone, p.id]));
      
      const newParentsData = [];
      const parentLinksToCreate = [];

      for (const pop of parentOperations) {
        if (!pop.telParent) continue;
        const phone = pop.telParent.toString().replace(/\s+/g, '');
        let parentId = parentMap.get(phone);

        if (!parentId) {
          if (!parentHashCache.has(phone)) {
             parentHashCache.set(phone, await bcrypt.hash(phone, 10));
          }
          const baseName = pop.nomParent ? pop.nomParent.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'parent';
          const uniqueStr = Math.random().toString(36).substring(2, 6);
          newParentsData.push({
            schoolId,
            name: pop.nomParent ? pop.nomParent.toString().trim() : 'Parent de ' + pop.name,
            email: `${baseName}.${phone}.${uniqueStr}@edutrack.parent`,
            phone: phone,
            passwordHash: parentHashCache.get(phone),
            role: 'PARENT'
          });
          parentMap.set(phone, 'pending'); // avoid duplicates
        }
      }

      if (newParentsData.length > 0) {
        await prisma.user.createMany({ data: newParentsData, skipDuplicates: true });
        const newlyCreatedParents = await prisma.user.findMany({ where: { schoolId, role: 'PARENT', phone: { in: parentPhones } } });
        newlyCreatedParents.forEach(p => parentMap.set(p.phone, p.id));
      }

      // Now create links
      const existingLinks = await prisma.parentEleve.findMany({
         where: { eleve: { class: { schoolId } } }
      });
      const linkSet = new Set(existingLinks.map(l => `${l.parentId}_${l.eleveId}`));

      for (const pop of parentOperations) {
         if (!pop.telParent) continue;
         const phone = pop.telParent.toString().replace(/\s+/g, '');
         const parentId = parentMap.get(phone);
         if (parentId && parentId !== 'pending' && !linkSet.has(`${parentId}_${pop.studentId}`)) {
            parentLinksToCreate.push({
               parentId: parentId,
               eleveId: pop.studentId,
               relationship: pop.relation ? pop.relation.toString().trim().toUpperCase() : 'GUARDIAN'
            });
            linkSet.add(`${parentId}_${pop.studentId}`);
         }
      }

      if (parentLinksToCreate.length > 0) {
         await prisma.parentEleve.createMany({ data: parentLinksToCreate, skipDuplicates: true });
      }

      logs.push(`Élèves traités: ${stats.eleves} nouveaux élèves importés.`);
    }

    // --- Helper function for sequences ---
    const getSequence = async (seqName, term) => {
      const nameStr = seqName.toString().trim();
      let seqId = sequenceCache.get(nameStr);
      if (seqId) return seqId;
      
      const newSeq = await prisma.sequence.create({
        data: { anneeScolaireId: activeYear.id, name: nameStr, term: parseInt(term) || 1, active: true }
      });
      sequenceCache.set(nameStr, newSeq.id);
      return newSeq.id;
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
      return null;
    };

    // --- Preload EnseignantMatiereClasse ---
    const emcList = await prisma.enseignantMatiereClasse.findMany({ where: { class: { schoolId } } });
    const emcMap = new Map(); // `${classId}_${matiereId}` -> teacherId
    emcList.forEach(emc => emcMap.set(`${emc.classId}_${emc.matiereId}`, emc.teacherId));

    // --- 5. IMPORT NOTES ---
    const notesSheet = findSheet(['notes', 'note']);
    if (notesSheet) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets[notesSheet]);
      
      const eleveIdsInChunk = existingEleves.map(e => e.id);
      const existingNotesList = await prisma.note.findMany({
        where: { eleveId: { in: eleveIdsInChunk } },
        select: { id: true, eleveId: true, matiereId: true, sequenceId: true, value: true }
      });
      const noteMap = new Map(existingNotesList.map(n => [`${n.eleveId}_${n.matiereId}_${n.sequenceId}`, n]));
      
      const newNotes = [];
      const noteUpdates = [];
      const fallbackId = await getFallbackTeacher();

      for (const row of data) {
        const matricule = row['Matricule Eleve'] || row['Matricule'];
        const codeMatiere = row['Code Matière'] || row['Code Matiere'] || row['Matière'] || row['Matiere'] || row['Code'];
        const sequenceName = row['Séquence (ex: Séquence 1)'] || row['Séquence'] || row['Sequence'];
        const term = row['Trimestre (1, 2 ou 3)'] || row['Trimestre'];
        const noteValue = row['Note (/20)'] !== undefined ? row['Note (/20)'] : (row['Note'] !== undefined ? row['Note'] : row['Valeur']);
        const remarque = row['Remarque'] || row['Appréciation'];

        if (!matricule || !codeMatiere || !sequenceName || noteValue === undefined) continue;

        const eleve = eleveCache.get(matricule.toString().trim().toUpperCase());
        if (!eleve || !eleve.id) {
          continue;
        }

        const matiereId = subjectCache.get(codeMatiere.toString().trim());
        if (!matiereId) {
          continue;
        }

        const sequenceId = await getSequence(sequenceName, term);

        let teacherId = emcMap.get(`${eleve.classId}_${matiereId}`);
        if (!teacherId && fallbackId) {
          const emcKey = `${eleve.classId}_${matiereId}`;
          newEmcsToCreate.set(emcKey, { classId: eleve.classId, matiereId, teacherId: fallbackId });
          emcMap.set(emcKey, fallbackId);
          teacherId = fallbackId;
        }

        if (!teacherId) continue;

        const noteKey = `${eleve.id}_${matiereId}_${sequenceId}`;
        const existingNote = noteMap.get(noteKey);

        const noteData = {
          value: parseFloat(noteValue),
          remarks: remarque?.toString().trim(),
          isDraft: false
        };

        if (existingNote && existingNote !== 'pending') {
          if (existingNote.value !== noteData.value) {
            noteUpdates.push({ where: { id: existingNote.id }, data: noteData });
          }
        } else if (!existingNote) {
          newNotes.push({
            eleveId: eleve.id,
            matiereId,
            sequenceId,
            teacherId,
            ...noteData
          });
          noteMap.set(noteKey, 'pending');
        }
      }

      if (newEmcsToCreate.size > 0) {
        await prisma.enseignantMatiereClasse.createMany({
          data: Array.from(newEmcsToCreate.values()),
          skipDuplicates: true
        });
      }

      if (newNotes.length > 0) {
         const chunks = chunkArray(newNotes, 1000);
         for (const chunk of chunks) {
            await prisma.note.createMany({ data: chunk, skipDuplicates: true });
         }
         stats.notes += newNotes.length;
      }
      
      // Execute Note Updates sequentially to avoid connection pool exhaustion
      for (const op of noteUpdates) {
        await prisma.note.update(op);
      }

      logs.push(`Notes traitées: ${stats.notes} nouvelles notes ajoutées.`);
    }

    // --- 6. IMPORT ABSENCES ---
    const absencesSheet = findSheet(['absences', 'absence']);
    if (absencesSheet) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets[absencesSheet]);
      const newAbsences = [];
      
      for (const row of data) {
        const matricule = row['Matricule Eleve'] || row['Matricule'];
        const dateVal = row['Date (JJ/MM/AAAA)'] || row['Date'];
        const hours = row['Heures'] || row['Heure'];
        const isJustified = (row['Justifiée (Oui/Non)'] || row['Justifiée'] || row['Justifiee'])?.toString().toLowerCase() === 'oui';
        const motif = row['Motif'] || row['Raison'];
        const isLateness = (row['Retard (Oui/Non)'] || row['Retard'])?.toString().toLowerCase() === 'oui';
        const sequenceName = row['Séquence (ex: Séquence 1)'] || row['Séquence'] || row['Sequence'];

        if (!matricule || !dateVal || !sequenceName) continue;

        const eleve = eleveCache.get(matricule.toString().trim().toUpperCase());
        if (!eleve || !eleve.id) continue;

        const parsedDate = parseDate(dateVal) || new Date();
        const sequenceId = await getSequence(sequenceName, 1);

        newAbsences.push({
          eleveId: eleve.id,
          sequenceId,
          date: parsedDate,
          hours: parseFloat(hours) || 1.0,
          justified: isJustified,
          reason: motif ? motif.toString().trim() : null,
          isLateness
        });
      }
      
      if (newAbsences.length > 0) {
         const chunks = chunkArray(newAbsences, 1000);
         for (const chunk of chunks) {
            await prisma.absence.createMany({ data: chunk, skipDuplicates: true });
         }
         stats.absences += newAbsences.length;
      }
      logs.push(`Absences traitées: ${stats.absences} enregistrées.`);
    }

    // --- 7. IMPORT PAIEMENTS ---
    const paiementsSheet = findSheet(['paiements', 'paiement']);
    if (paiementsSheet) {
      const data = xlsx.utils.sheet_to_json(wb.Sheets[paiementsSheet]);
      const newPaiements = [];
      
      for (const row of data) {
        const matricule = row['Matricule Eleve'] || row['Matricule'];
        const amount = row['Montant'] || row['Somme'];
        const method = row['Méthode (CASH/MOBILE_MONEY/WAVE/BANK)'] || row['Méthode'] || row['Methode'];
        const dateVal = row['Date'] || row['Date Paiement'];
        const ref = row['Référence Transaction'] || row['Référence'] || row['Reference'];
        const payerPhone = row['Téléphone Payeur'] || row['Téléphone'] || row['Telephone'];
        const remarque = row['Remarque'] || row['Motif'];
        
        if (!matricule || !amount) continue;

        const eleve = eleveCache.get(matricule.toString().trim().toUpperCase());
        if (eleve && eleve.id) {
          const parsedDate = parseDate(dateVal) || new Date();
          newPaiements.push({
            eleveId: eleve.id,
            amount: parseFloat(amount),
            paymentMethod: method ? method.toString().trim().toUpperCase() : 'CASH',
            paymentDate: parsedDate,
            transactionReference: ref ? ref.toString().trim() : null,
            payerPhone: payerPhone ? payerPhone.toString().trim() : null,
            remarks: remarque ? remarque.toString().trim() : 'Importation Excel',
            status: 'COMPLETED'
          });
        }
      }
      
      if (newPaiements.length > 0) {
         const chunks = chunkArray(newPaiements, 1000);
         for (const chunk of chunks) {
            await prisma.paiement.createMany({ data: chunk, skipDuplicates: true });
         }
         stats.paiements += newPaiements.length;
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

// =============================================
// CHUNKED IMPORT — Progressive import endpoint
// Receives pre-parsed JSON data from frontend
// =============================================
router.post('/chunk', auth, requireRole(['DIRECTOR']), async (req, res) => {
  try {
    const { sheet, data, chunkIndex, totalChunks, classId } = req.body;

    if (!sheet || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'Données invalides: sheet et data[] requis.' });
    }

    const schoolId = req.user.schoolId;
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
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

    // Normalization helpers
    const normalizeClassName = (name) => {
      if (!name) return '';
      return name.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/eme/g, 'e')
        .replace(/ere/g, 'e')
        .replace(/nde/g, 'e')
        .replace(/\s+/g, '')
        .trim();
    };

    const parseDate = (dateVal) => {
      if (dateVal instanceof Date) return dateVal;
      if (typeof dateVal === 'number') {
        // Excel serial date number
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + dateVal * 86400000);
      }
      if (typeof dateVal === 'string') {
        const parts = dateVal.split('/');
        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        const iso = new Date(dateVal);
        if (!isNaN(iso.getTime())) return iso;
      }
      return null;
    };

    const chunkArray = (arr, size) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    const sheetKey = sheet.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    // ========================
    // CLASSES
    // ========================
    if (sheetKey === 'classes' || sheetKey === 'classe') {
      const existingClasses = await prisma.classe.findMany({ where: { schoolId, anneeScolaireId: activeYear.id } });
      const classCache = new Map();
      existingClasses.forEach(c => classCache.set(normalizeClassName(c.name), c.id));

      const newClasses = [];
      for (const row of data) {
        const nom = row['Nom de la Classe'] || row['Nom'] || row['Name'] || row['Classe'] || Object.values(row)[0];
        if (!nom) continue;
        const classNameStr = nom.toString().trim();
        const normClass = normalizeClassName(classNameStr);
        if (!classCache.has(normClass)) {
          newClasses.push({ schoolId, anneeScolaireId: activeYear.id, name: classNameStr });
          classCache.set(normClass, 'pending');
        }
      }
      if (newClasses.length > 0) {
        await prisma.classe.createMany({ data: newClasses, skipDuplicates: true });
        stats.classes += newClasses.length;
      }
      logs.push(`Chunk ${chunkIndex+1}/${totalChunks}: ${stats.classes} classes importées.`);
    }

    // ========================
    // ENSEIGNANTS
    // ========================
    else if (sheetKey === 'enseignants' || sheetKey === 'enseignant') {
      const existingTeachers = await prisma.user.findMany({ where: { schoolId, role: 'TEACHER' } });
      const teacherCache = new Map();
      existingTeachers.forEach(t => teacherCache.set(t.email, t.id));

      const schoolSlug = school.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3) || 'sch';
      const countrySlug = getCountrySlug(school.country);
      const defaultPasswordHash = await bcrypt.hash('123456', 10);
      const newTeachers = [];

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
        const emailStr = email.toString().trim();
        if (!teacherCache.has(emailStr)) {
          newTeachers.push({
            schoolId, name: nom.toString().trim(), email: emailStr,
            phone: tel ? tel.toString() : null,
            city: ville ? ville.toString().trim() : null,
            neighborhood: quartier ? quartier.toString().trim() : null,
            role: 'TEACHER', passwordHash: defaultPasswordHash
          });
          teacherCache.set(emailStr, 'pending');
        }
      }
      if (newTeachers.length > 0) {
        await prisma.user.createMany({ data: newTeachers, skipDuplicates: true });
        stats.enseignants += newTeachers.length;
      }
      logs.push(`Chunk ${chunkIndex+1}/${totalChunks}: ${stats.enseignants} enseignants importés.`);
    }

    // ========================
    // MATIERES
    // ========================
    else if (sheetKey === 'matieres' || sheetKey === 'matiere') {
      const existingSubjects = await prisma.matiere.findMany({ where: { schoolId } });
      const subjectCache = new Map();
      existingSubjects.forEach(s => subjectCache.set(s.code, s.id));

      const newSubjects = [];
      for (const row of data) {
        const nomFr = row['Nom (FR)'] || row['Nom'];
        const nomEn = row['Nom (EN)'] || nomFr;
        const code = row['Code'] || nomFr?.substring(0, 4).toUpperCase();
        const coef = row['Coefficient'] ? parseFloat(row['Coefficient']) : 1.0;
        const volume = row['Heures par semaine'] ? parseInt(row['Heures par semaine']) : 2;
        if (!nomFr || !code) continue;
        const codeStr = code.toString().trim();
        if (!subjectCache.has(codeStr)) {
          newSubjects.push({
            schoolId, nameFr: nomFr.toString().trim(), nameEn: nomEn.toString().trim(),
            code: codeStr, coefficient: coef, volumeHoraire: volume
          });
          subjectCache.set(codeStr, 'pending');
        }
      }
      if (newSubjects.length > 0) {
        await prisma.matiere.createMany({ data: newSubjects, skipDuplicates: true });
        stats.matieres += newSubjects.length;
      }
      logs.push(`Chunk ${chunkIndex+1}/${totalChunks}: ${stats.matieres} matières importées.`);
    }

    // ========================
    // ELEVES & PARENTS
    // ========================
    else if (sheetKey === 'eleves' || sheetKey === 'eleve') {
      // Build caches
      const existingClasses = await prisma.classe.findMany({ where: { schoolId, anneeScolaireId: activeYear.id } });
      const classCache = new Map();
      existingClasses.forEach(c => classCache.set(normalizeClassName(c.name), c.id));

      const matriculesInChunk = [...new Set(data.map(row => (row['Matricule Eleve'] || row['Matricule'])?.toString().trim().toUpperCase()).filter(Boolean))];
      const existingEleves = await prisma.eleve.findMany({ where: { class: { schoolId }, matricule: { in: matriculesInChunk } } });
      const eleveCache = new Map();
      existingEleves.forEach(e => {
        if (e.matricule) eleveCache.set(e.matricule.toString().trim().toUpperCase(), { id: e.id, classId: e.classId });
      });

      const newEleves = [];
      const parentOperations = [];

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

        if (!nom || !matricule || (!className && !classId)) continue;
        const matriculeStr = matricule.toString().trim().toUpperCase();
        const classNameStr = className ? className.toString().trim() : null;
        const normClass = normalizeClassName(classNameStr);

        let resolvedClassId = classId || classCache.get(normClass);
        if (!resolvedClassId || resolvedClassId === 'pending') {
          logs.push(`Erreur Élève ${nom}: Classe "${classNameStr}" introuvable.`);
          continue;
        }

        if (!eleveCache.has(matriculeStr)) {
          newEleves.push({
            name: nom.toString().trim(), classId: resolvedClassId, matricule: matriculeStr,
            gender: sexe ? sexe.toString().trim() : null,
            dateOfBirth: parseDate(row['Date Naissance']),
            placeOfBirth: row['Lieu Naissance'] ? row['Lieu Naissance'].toString() : null,
            address: adresse ? adresse.toString().trim() : null,
            status: statut.toString().trim().toUpperCase(),
            isSick, hasDisability,
            medicalNotes: medicalNotes ? medicalNotes.toString().trim() : null,
            schoolId
          });
          eleveCache.set(matriculeStr, { classId: resolvedClassId, pending: true, parentData: { nomParent, telParent, relation } });
        }
      }

      // Batch insert eleves
      if (newEleves.length > 0) {
        const chunks = chunkArray(newEleves, 500);
        for (const chunk of chunks) {
          await prisma.eleve.createMany({ data: chunk, skipDuplicates: true });
        }
        stats.eleves += newEleves.length;
      }

      // Re-fetch to get IDs for parent linking
      const allEleves = await prisma.eleve.findMany({ where: { class: { schoolId }, matricule: { in: matriculesInChunk } } });
      allEleves.forEach(e => {
        if (e.matricule) {
          const normMatricule = e.matricule.toString().trim().toUpperCase();
          const cached = eleveCache.get(normMatricule);
          if (cached && cached.pending) {
            parentOperations.push({ studentId: e.id, ...cached.parentData, name: e.name });
          }
          eleveCache.set(normMatricule, { id: e.id, classId: e.classId });
        }
      });

      // Parents logic
      if (parentOperations.length > 0) {
        const parentPhones = [...new Set(parentOperations.map(p => p.telParent?.toString().replace(/\s+/g, '')).filter(Boolean))];
        const existingParents = await prisma.user.findMany({ where: { schoolId, role: 'PARENT', phone: { in: parentPhones } } });
        const parentMap = new Map(existingParents.map(p => [p.phone, p.id]));
        const newParentsData = [];
        const parentHashCache = new Map();

        for (const pop of parentOperations) {
          if (!pop.telParent) continue;
          const phone = pop.telParent.toString().replace(/\s+/g, '');
          let parentId = parentMap.get(phone);
          if (!parentId) {
            if (!parentHashCache.has(phone)) {
              parentHashCache.set(phone, await bcrypt.hash(phone, 10));
            }
            const baseName = pop.nomParent ? pop.nomParent.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'parent';
            const uniqueStr = Math.random().toString(36).substring(2, 6);
            newParentsData.push({
              schoolId, name: pop.nomParent ? pop.nomParent.toString().trim() : 'Parent de ' + pop.name,
              email: `${baseName}.${phone}.${uniqueStr}@edutrack.parent`,
              phone, passwordHash: parentHashCache.get(phone), role: 'PARENT'
            });
            parentMap.set(phone, 'pending');
          }
        }

        if (newParentsData.length > 0) {
          await prisma.user.createMany({ data: newParentsData, skipDuplicates: true });
          const newlyCreated = await prisma.user.findMany({ where: { schoolId, role: 'PARENT', phone: { in: parentPhones } } });
          newlyCreated.forEach(p => parentMap.set(p.phone, p.id));
        }

        // Parent-Eleve links
        const existingLinks = await prisma.parentEleve.findMany({ where: { eleve: { class: { schoolId } } } });
        const linkSet = new Set(existingLinks.map(l => `${l.parentId}_${l.eleveId}`));
        const parentLinksToCreate = [];

        for (const pop of parentOperations) {
          if (!pop.telParent) continue;
          const phone = pop.telParent.toString().replace(/\s+/g, '');
          const parentId = parentMap.get(phone);
          if (parentId && parentId !== 'pending' && !linkSet.has(`${parentId}_${pop.studentId}`)) {
            parentLinksToCreate.push({
              parentId, eleveId: pop.studentId,
              relationship: pop.relation ? pop.relation.toString().trim().toUpperCase() : 'GUARDIAN'
            });
            linkSet.add(`${parentId}_${pop.studentId}`);
          }
        }
        if (parentLinksToCreate.length > 0) {
          await prisma.parentEleve.createMany({ data: parentLinksToCreate, skipDuplicates: true });
        }
      }
      logs.push(`Chunk ${chunkIndex+1}/${totalChunks}: ${stats.eleves} élèves importés.`);
    }

    // ========================
    // NOTES
    // ========================
    else if (sheetKey === 'notes' || sheetKey === 'note') {
      const matriculesInChunk = [...new Set(data.map(row => (row['Matricule Eleve'] || row['Matricule'])?.toString().trim().toUpperCase()).filter(Boolean))];
      const existingEleves = await prisma.eleve.findMany({ where: { class: { schoolId }, matricule: { in: matriculesInChunk } } });
      const eleveCache = new Map();
      existingEleves.forEach(e => {
        if (e.matricule) eleveCache.set(e.matricule.toString().trim().toUpperCase(), { id: e.id, classId: e.classId });
      });

      const existingSubjects = await prisma.matiere.findMany({ where: { schoolId } });
      const subjectCache = new Map();
      existingSubjects.forEach(s => subjectCache.set(s.code, s.id));

      const existingSequences = await prisma.sequence.findMany({ where: { anneeScolaireId: activeYear.id } });
      const sequenceCache = new Map();
      existingSequences.forEach(s => sequenceCache.set(s.name, s.id));

      const emcList = await prisma.enseignantMatiereClasse.findMany({ where: { class: { schoolId } } });
      const emcMap = new Map();
      emcList.forEach(emc => emcMap.set(`${emc.classId}_${emc.matiereId}`, emc.teacherId));

      let fallbackTeacher = await prisma.user.findFirst({ where: { schoolId, role: 'TEACHER' } });
      if (!fallbackTeacher) {
        fallbackTeacher = await prisma.user.findFirst({ where: { schoolId, role: 'DIRECTOR' } });
      }
      const fallbackTeacherId = fallbackTeacher?.id || null;

      const eleveIdsInChunk = existingEleves.map(e => e.id);
      const existingNotesList = await prisma.note.findMany({
        where: { eleveId: { in: eleveIdsInChunk } },
        select: { id: true, eleveId: true, matiereId: true, sequenceId: true, value: true }
      });
      const noteMap = new Map(existingNotesList.map(n => [`${n.eleveId}_${n.matiereId}_${n.sequenceId}`, n]));

      const getSequence = async (seqName, term) => {
        const nameStr = seqName.toString().trim();
        let seqId = sequenceCache.get(nameStr);
        if (seqId) return seqId;
        const newSeq = await prisma.sequence.create({
          data: { anneeScolaireId: activeYear.id, name: nameStr, term: parseInt(term) || 1, active: true }
        });
        sequenceCache.set(nameStr, newSeq.id);
        return newSeq.id;
      };

      const newNotes = [];
      const newEmcsToCreate = new Map(); // Track missing EMCs to bulk create

      for (const row of data) {
        const matricule = row['Matricule Eleve'] || row['Matricule'];
        const codeMatiere = row['Code Matière'] || row['Code Matiere'] || row['Matière'] || row['Matiere'] || row['Code'];
        const sequenceName = row['Séquence (ex: Séquence 1)'] || row['Séquence'] || row['Sequence'];
        const term = row['Trimestre (1, 2 ou 3)'] || row['Trimestre'];
        const noteValue = row['Note (/20)'] !== undefined ? row['Note (/20)'] : (row['Note'] !== undefined ? row['Note'] : row['Valeur']);
        const remarque = row['Remarque'] || row['Appréciation'];

        if (!matricule || !codeMatiere || !sequenceName || noteValue === undefined) continue;

        const eleve = eleveCache.get(matricule.toString().trim().toUpperCase());
        if (!eleve || !eleve.id) continue;

        const matiereId = subjectCache.get(codeMatiere.toString().trim());
        if (!matiereId) continue;

        const sequenceId = await getSequence(sequenceName, term);
        
        let teacherId = emcMap.get(`${eleve.classId}_${matiereId}`);
        if (!teacherId && fallbackTeacherId) {
          // Track missing EMC to create
          const emcKey = `${eleve.classId}_${matiereId}`;
          newEmcsToCreate.set(emcKey, { classId: eleve.classId, matiereId, teacherId: fallbackTeacherId });
          emcMap.set(emcKey, fallbackTeacherId);
          teacherId = fallbackTeacherId;
        }

        if (!teacherId) continue;

        const noteKey = `${eleve.id}_${matiereId}_${sequenceId}`;
        if (!noteMap.has(noteKey)) {
          newNotes.push({
            eleveId: eleve.id, matiereId, sequenceId, teacherId,
            value: parseFloat(noteValue),
            remarks: remarque?.toString().trim(),
            isDraft: false
          });
          noteMap.set(noteKey, 'pending');
        }
      }

      if (newEmcsToCreate.size > 0) {
        await prisma.enseignantMatiereClasse.createMany({
          data: Array.from(newEmcsToCreate.values()),
          skipDuplicates: true
        });
      }

      if (newNotes.length > 0) {
        const chunks = chunkArray(newNotes, 500);
        for (const chunk of chunks) {
          await prisma.note.createMany({ data: chunk, skipDuplicates: true });
        }
        stats.notes += newNotes.length;
      }
      logs.push(`Chunk ${chunkIndex+1}/${totalChunks}: ${stats.notes} notes importées.`);
    }

    // ========================
    // ABSENCES
    // ========================
    else if (sheetKey === 'absences' || sheetKey === 'absence') {
      const matriculesInChunk = [...new Set(data.map(row => (row['Matricule Eleve'] || row['Matricule'])?.toString().trim().toUpperCase()).filter(Boolean))];
      const existingEleves = await prisma.eleve.findMany({ where: { class: { schoolId }, matricule: { in: matriculesInChunk } } });
      const eleveCache = new Map();
      existingEleves.forEach(e => {
        if (e.matricule) eleveCache.set(e.matricule.toString().trim().toUpperCase(), { id: e.id, classId: e.classId });
      });

      const existingSequences = await prisma.sequence.findMany({ where: { anneeScolaireId: activeYear.id } });
      const sequenceCache = new Map();
      existingSequences.forEach(s => sequenceCache.set(s.name, s.id));

      const getSequence = async (seqName, term) => {
        const nameStr = seqName.toString().trim();
        let seqId = sequenceCache.get(nameStr);
        if (seqId) return seqId;
        const newSeq = await prisma.sequence.create({
          data: { anneeScolaireId: activeYear.id, name: nameStr, term: parseInt(term) || 1, active: true }
        });
        sequenceCache.set(nameStr, newSeq.id);
        return newSeq.id;
      };

      const newAbsences = [];
      for (const row of data) {
        const matricule = row['Matricule Eleve'] || row['Matricule'];
        const dateVal = row['Date (JJ/MM/AAAA)'] || row['Date'];
        const hours = row['Heures'] || row['Heure'];
        const isJustified = (row['Justifiée (Oui/Non)'] || row['Justifiée'] || row['Justifiee'])?.toString().toLowerCase() === 'oui';
        const motif = row['Motif'] || row['Raison'];
        const isLateness = (row['Retard (Oui/Non)'] || row['Retard'])?.toString().toLowerCase() === 'oui';
        const sequenceName = row['Séquence (ex: Séquence 1)'] || row['Séquence'] || row['Sequence'];

        if (!matricule || !dateVal || !sequenceName) continue;

        const eleve = eleveCache.get(matricule.toString().trim().toUpperCase());
        if (!eleve || !eleve.id) continue;

        const parsedDate = parseDate(dateVal) || new Date();
        const sequenceId = await getSequence(sequenceName, 1);

        newAbsences.push({
          eleveId: eleve.id, sequenceId, date: parsedDate,
          hours: parseFloat(hours) || 1.0, justified: isJustified,
          reason: motif ? motif.toString().trim() : null, isLateness
        });
      }

      if (newAbsences.length > 0) {
        const chunks = chunkArray(newAbsences, 500);
        for (const chunk of chunks) {
          await prisma.absence.createMany({ data: chunk, skipDuplicates: true });
        }
        stats.absences += newAbsences.length;
      }
      logs.push(`Chunk ${chunkIndex+1}/${totalChunks}: ${stats.absences} absences importées.`);
    }

    // ========================
    // PAIEMENTS
    // ========================
    else if (sheetKey === 'paiements' || sheetKey === 'paiement') {
      const matriculesInChunk = [...new Set(data.map(row => (row['Matricule Eleve'] || row['Matricule'])?.toString().trim().toUpperCase()).filter(Boolean))];
      const existingEleves = await prisma.eleve.findMany({ where: { class: { schoolId }, matricule: { in: matriculesInChunk } } });
      const eleveCache = new Map();
      existingEleves.forEach(e => {
        if (e.matricule) eleveCache.set(e.matricule.toString().trim().toUpperCase(), { id: e.id, classId: e.classId });
      });

      const newPaiements = [];
      for (const row of data) {
        const matricule = row['Matricule Eleve'] || row['Matricule'];
        const amount = row['Montant'] || row['Somme'];
        const method = row['Méthode (CASH/MOBILE_MONEY/WAVE/BANK)'] || row['Méthode'] || row['Methode'];
        const dateVal = row['Date'] || row['Date Paiement'];
        const ref = row['Référence Transaction'] || row['Référence'] || row['Reference'];
        const payerPhone = row['Téléphone Payeur'] || row['Téléphone'] || row['Telephone'];
        const remarque = row['Remarque'] || row['Motif'];

        if (!matricule || !amount) continue;

        const eleve = eleveCache.get(matricule.toString().trim().toUpperCase());
        if (eleve && eleve.id) {
          const parsedDate = parseDate(dateVal) || new Date();
          newPaiements.push({
            eleveId: eleve.id, amount: parseFloat(amount),
            paymentMethod: method ? method.toString().trim().toUpperCase() : 'CASH',
            paymentDate: parsedDate,
            transactionReference: ref ? ref.toString().trim() : null,
            payerPhone: payerPhone ? payerPhone.toString().trim() : null,
            remarks: remarque ? remarque.toString().trim() : 'Importation Excel',
            status: 'COMPLETED'
          });
        }
      }

      if (newPaiements.length > 0) {
        const chunks = chunkArray(newPaiements, 500);
        for (const chunk of chunks) {
          await prisma.paiement.createMany({ data: chunk, skipDuplicates: true });
        }
        stats.paiements += newPaiements.length;
      }
      logs.push(`Chunk ${chunkIndex+1}/${totalChunks}: ${stats.paiements} paiements importés.`);
    }

    else {
      return res.status(400).json({ error: `Feuille inconnue: "${sheet}"` });
    }

    res.json({
      message: `Chunk ${chunkIndex+1}/${totalChunks} traité avec succès.`,
      stats,
      logs,
      chunkIndex,
      totalChunks
    });

  } catch (error) {
    console.error('[Chunk Import Error]', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'importation du chunk' });
  }
});

module.exports = router;
