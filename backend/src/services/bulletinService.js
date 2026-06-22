const prisma = require('../db');

// Map note values to appreciation levels
function getAppreciation(note) {
  if (note >= 18) return { fr: "Excellent", en: "Excellent" };
  if (note >= 16) return { fr: "Très bien", en: "Very Good" };
  if (note >= 14) return { fr: "Bien", en: "Good" };
  if (note >= 12) return { fr: "Assez bien", en: "Fairly Good" };
  if (note >= 10) return { fr: "Passable", en: "Pass" };
  return { fr: "Insuffisant", en: "Insufficient" };
}

async function generateSequenceBulletins(classId, sequenceId) {
  // 1. Get class details, students, and subjects
  const students = await prisma.eleve.findMany({
    where: { classId, status: "ACTIVE" },
  });

  if (students.length === 0) {
    return { success: false, message: "Aucun élève actif n'est inscrit dans cette classe. Veuillez d'abord ajouter des élèves." };
  }

  const associations = await prisma.enseignantMatiereClasse.findMany({
    where: { classId },
    include: { matiere: true },
  });
  
  // Unique subjects in class (with custom coefficients resolved)
  const subjectsMap = {};
  associations.forEach(a => {
    const coeff = a.coefficient !== null && a.coefficient !== undefined ? a.coefficient : a.matiere.coefficient;
    subjectsMap[a.matiere.id] = {
      ...a.matiere,
      coefficient: coeff
    };
  });
  const subjects = Object.values(subjectsMap);

  if (subjects.length === 0) {
    return { 
      success: false, 
      message: "Aucune matière n'est configurée pour cette classe. Veuillez attribuer des matières et des enseignants à cette classe (dans l'onglet Gestion Enseignants ou Emploi du Temps) avant de générer les bulletins." 
    };
  }

  // 2. Fetch all grades in sequence for this class
  const allNotes = await prisma.note.findMany({
    where: {
      sequenceId,
      eleve: { classId }
    }
  });

  // Fetch all absences in sequence for this class
  const allAbsences = await prisma.absence.findMany({
    where: {
      sequenceId,
      eleve: { classId }
    }
  });

  // Calculate subject averages per student
  const studentAverages = {}; // eleveId -> { matiereId -> average }
  students.forEach(student => {
    studentAverages[student.id] = {};
    subjects.forEach(subject => {
      const studentSubjectNotes = allNotes.filter(n => n.eleveId === student.id && n.matiereId === subject.id);
      if (studentSubjectNotes.length > 0) {
        const sum = studentSubjectNotes.reduce((acc, curr) => acc + curr.value, 0);
        studentAverages[student.id][subject.id] = sum / studentSubjectNotes.length;
      } else {
        studentAverages[student.id][subject.id] = null; // No grade
      }
    });
  });

  // Compute class statistics per subject
  const subjectStats = {}; // matiereId -> { min, max, sum, count, average }
  subjects.forEach(subject => {
    let min = 20;
    let max = 0;
    let sum = 0;
    let count = 0;

    students.forEach(student => {
      const avg = studentAverages[student.id][subject.id];
      if (avg !== null) {
        if (avg < min) min = avg;
        if (avg > max) max = avg;
        sum += avg;
        count++;
      }
    });

    subjectStats[subject.id] = {
      min: count > 0 ? min : 0,
      max: count > 0 ? max : 0,
      average: count > 0 ? sum / count : 0,
    };
  });

  // Compute student overall averages
  const overallAverages = []; // Array of { eleveId, average }
  students.forEach(student => {
    let weightedSum = 0;
    let totalCoeff = 0;

    subjects.forEach(subject => {
      const avg = studentAverages[student.id][subject.id];
      if (avg !== null) {
        weightedSum += avg * subject.coefficient;
        totalCoeff += subject.coefficient;
      }
    });

    const average = totalCoeff > 0 ? weightedSum / totalCoeff : 0;
    overallAverages.push({ eleveId: student.id, average });
  });

  // Sort overall averages descending for ranking
  overallAverages.sort((a, b) => b.average - a.average);

  // Map ranks (handling ties)
  const ranks = {}; // eleveId -> rank
  let currentRank = 1;
  for (let i = 0; i < overallAverages.length; i++) {
    if (i > 0 && overallAverages[i].average < overallAverages[i - 1].average) {
      currentRank = i + 1;
    }
    ranks[overallAverages[i].eleveId] = currentRank;
  }

  // Calculate subject ranks per student
  const subjectRanks = {}; // matiereId -> { eleveId -> rank }
  subjects.forEach(subject => {
    subjectRanks[subject.id] = {};
    const sortedStudentsForSubject = students
      .map(s => ({ eleveId: s.id, value: studentAverages[s.id][subject.id] }))
      .filter(s => s.value !== null)
      .sort((a, b) => b.value - a.value);

    let currentSubRank = 1;
    for (let i = 0; i < sortedStudentsForSubject.length; i++) {
      if (i > 0 && sortedStudentsForSubject[i].value < sortedStudentsForSubject[i - 1].value) {
        currentSubRank = i + 1;
      }
      subjectRanks[subject.id][sortedStudentsForSubject[i].eleveId] = currentSubRank;
    }
  });

  // Write to DB concurrently to avoid N+1 bottlenecks
  await Promise.all(students.map(async (student) => {
    const studentAvg = overallAverages.find(a => a.eleveId === student.id).average;
    const studentRank = ranks[student.id];

    // Compute absences
    const studentAbs = allAbsences.filter(a => a.eleveId === student.id);
    const justified = studentAbs.filter(a => a.justified).reduce((acc, curr) => acc + curr.hours, 0);
    const unjustified = studentAbs.filter(a => !a.justified).reduce((acc, curr) => acc + curr.hours, 0);

    // Create or update Bulletin
    let bulletin = await prisma.bulletin.findFirst({
      where: {
        eleveId: student.id,
        sequenceId,
        type: "SEQUENCE"
      }
    });

    if (bulletin) {
      bulletin = await prisma.bulletin.update({
        where: { id: bulletin.id },
        data: {
          average: studentAvg,
          rank: studentRank,
          absencesJustified: justified,
          absencesUnjustified: unjustified,
        }
      });
      // Delete old details
      await prisma.bulletinDetail.deleteMany({
        where: { bulletinId: bulletin.id }
      });
    } else {
      bulletin = await prisma.bulletin.create({
        data: {
          eleveId: student.id,
          sequenceId,
          type: "SEQUENCE",
          average: studentAvg,
          rank: studentRank,
          absencesJustified: justified,
          absencesUnjustified: unjustified,
        }
      });
    }

    // Save details
    const detailsData = [];
    for (const subject of subjects) {
      const avgVal = studentAverages[student.id][subject.id];
      if (avgVal !== null) {
        const stats = subjectStats[subject.id];
        const subRank = subjectRanks[subject.id][student.id] || null;
        const app = getAppreciation(avgVal);

        detailsData.push({
          bulletinId: bulletin.id,
          matiereId: subject.id,
          noteValue: avgVal,
          classAverage: stats.average,
          minNote: stats.min,
          maxNote: stats.max,
          rank: subRank,
          appreciation: `${app.fr} / ${app.en}`,
          coefficient: subject.coefficient,
        });
      }
    }

    if (detailsData.length > 0) {
      await prisma.bulletinDetail.createMany({
        data: detailsData
      });
    }
  }));

  return { success: true, count: students.length };
}

async function generateTermBulletins(classId, term) {
  // Find the two sequences of the term
  const sequences = await prisma.sequence.findMany({
    where: { term, anneeScolaire: { classes: { some: { id: classId } } } }
  });

  if (sequences.length !== 2) {
    return { success: false, message: `Le trimestre ${term} doit avoir exactement 2 séquences configurées dans le système.` };
  }

  const [seqA, seqB] = sequences;

  // Get active students and subjects
  const students = await prisma.eleve.findMany({
    where: { classId, status: "ACTIVE" },
  });

  if (students.length === 0) {
    return { success: false, message: "Aucun élève actif n'est inscrit dans cette classe. Veuillez d'abord ajouter des élèves." };
  }

  const associations = await prisma.enseignantMatiereClasse.findMany({
    where: { classId },
    include: { matiere: true },
  });
  
  const subjectsMap = {};
  associations.forEach(a => {
    const coeff = a.coefficient !== null && a.coefficient !== undefined ? a.coefficient : a.matiere.coefficient;
    subjectsMap[a.matiere.id] = {
      ...a.matiere,
      coefficient: coeff
    };
  });
  const subjects = Object.values(subjectsMap);

  // Fetch sequence bulletins
  const bulletinsSeqA = await prisma.bulletin.findMany({
    where: { sequenceId: seqA.id, eleve: { classId }, type: "SEQUENCE" },
    include: { details: true }
  });

  const bulletinsSeqB = await prisma.bulletin.findMany({
    where: { sequenceId: seqB.id, eleve: { classId }, type: "SEQUENCE" },
    include: { details: true }
  });

  // Calculate term subject grades for each student
  const studentTermGrades = {}; // eleveId -> { matiereId -> termGrade }
  students.forEach(student => {
    studentTermGrades[student.id] = {};
    const bA = bulletinsSeqA.find(b => b.eleveId === student.id);
    const bB = bulletinsSeqB.find(b => b.eleveId === student.id);

    subjects.forEach(subject => {
      const gA = bA ? bA.details.find(d => d.matiereId === subject.id) : null;
      const gB = bB ? bB.details.find(d => d.matiereId === subject.id) : null;

      let termGrade = null;
      if (gA && gB) {
        termGrade = (gA.noteValue + gB.noteValue) / 2;
      } else if (gA) {
        termGrade = gA.noteValue;
      } else if (gB) {
        termGrade = gB.noteValue;
      }
      studentTermGrades[student.id][subject.id] = termGrade;
    });
  });

  // Calculate subject stats
  const subjectStats = {};
  subjects.forEach(subject => {
    let min = 20;
    let max = 0;
    let sum = 0;
    let count = 0;

    students.forEach(student => {
      const val = studentTermGrades[student.id][subject.id];
      if (val !== null) {
        if (val < min) min = val;
        if (val > max) max = val;
        sum += val;
        count++;
      }
    });

    subjectStats[subject.id] = {
      min: count > 0 ? min : 0,
      max: count > 0 ? max : 0,
      average: count > 0 ? sum / count : 0,
    };
  });

  // Student overall term averages
  const overallTermAverages = [];
  students.forEach(student => {
    let weightedSum = 0;
    let totalCoeff = 0;

    subjects.forEach(subject => {
      const val = studentTermGrades[student.id][subject.id];
      if (val !== null) {
        weightedSum += val * subject.coefficient;
        totalCoeff += subject.coefficient;
      }
    });

    const average = totalCoeff > 0 ? weightedSum / totalCoeff : 0;
    overallTermAverages.push({ eleveId: student.id, average });
  });

  // Ranks
  overallTermAverages.sort((a, b) => b.average - a.average);
  const ranks = {};
  let currentRank = 1;
  for (let i = 0; i < overallTermAverages.length; i++) {
    if (i > 0 && overallTermAverages[i].average < overallTermAverages[i - 1].average) {
      currentRank = i + 1;
    }
    ranks[overallTermAverages[i].eleveId] = currentRank;
  }

  // Subject ranks
  const subjectRanks = {};
  subjects.forEach(subject => {
    subjectRanks[subject.id] = {};
    const sorted = students
      .map(s => ({ eleveId: s.id, value: studentTermGrades[s.id][subject.id] }))
      .filter(s => s.value !== null)
      .sort((a, b) => b.value - a.value);

    let currentSubRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].value < sorted[i - 1].value) {
        currentSubRank = i + 1;
      }
      subjectRanks[subject.id][sorted[i].eleveId] = currentSubRank;
    }
  });

  // Save term bulletins concurrently
  await Promise.all(students.map(async (student) => {
    const studentAvg = overallTermAverages.find(a => a.eleveId === student.id).average;
    const studentRank = ranks[student.id];

    // Cumulate absences across sequence A & B
    const bA = bulletinsSeqA.find(b => b.eleveId === student.id);
    const bB = bulletinsSeqB.find(b => b.eleveId === student.id);

    const justified = (bA ? bA.absencesJustified : 0) + (bB ? bB.absencesJustified : 0);
    const unjustified = (bA ? bA.absencesUnjustified : 0) + (bB ? bB.absencesUnjustified : 0);

    let bulletin = await prisma.bulletin.findFirst({
      where: {
        eleveId: student.id,
        term,
        type: "TERM"
      }
    });

    if (bulletin) {
      bulletin = await prisma.bulletin.update({
        where: { id: bulletin.id },
        data: {
          average: studentAvg,
          rank: studentRank,
          absencesJustified: justified,
          absencesUnjustified: unjustified,
        }
      });
      await prisma.bulletinDetail.deleteMany({
        where: { bulletinId: bulletin.id }
      });
    } else {
      bulletin = await prisma.bulletin.create({
        data: {
          eleveId: student.id,
          term,
          type: "TERM",
          average: studentAvg,
          rank: studentRank,
          absencesJustified: justified,
          absencesUnjustified: unjustified,
        }
      });
    }

    const detailsData = [];
    for (const subject of subjects) {
      const val = studentTermGrades[student.id][subject.id];
      if (val !== null) {
        const stats = subjectStats[subject.id];
        const subRank = subjectRanks[subject.id][student.id] || null;
        const app = getAppreciation(val);

        detailsData.push({
          bulletinId: bulletin.id,
          matiereId: subject.id,
          noteValue: val,
          classAverage: stats.average,
          minNote: stats.min,
          maxNote: stats.max,
          rank: subRank,
          appreciation: `${app.fr} / ${app.en}`,
          coefficient: subject.coefficient,
        });
      }
    }

    if (detailsData.length > 0) {
      await prisma.bulletinDetail.createMany({
        data: detailsData
      });
    }
  }));

  return { success: true, count: students.length };
}

async function generateAnnualBulletins(classId) {
  // Get active students and subjects
  const students = await prisma.eleve.findMany({
    where: { classId, status: "ACTIVE" },
  });

  if (students.length === 0) {
    return { success: false, message: "Aucun élève actif n'est inscrit dans cette classe." };
  }

  const associations = await prisma.enseignantMatiereClasse.findMany({
    where: { classId },
    include: { matiere: true },
  });
  
  const subjectsMap = {};
  associations.forEach(a => {
    const coeff = a.coefficient !== null && a.coefficient !== undefined ? a.coefficient : a.matiere.coefficient;
    subjectsMap[a.matiere.id] = {
      ...a.matiere,
      coefficient: coeff
    };
  });
  const subjects = Object.values(subjectsMap);

  // Fetch all term bulletins for this class
  const termBulletins = await prisma.bulletin.findMany({
    where: {
      type: "TERM",
      eleve: { classId }
    },
    include: { details: true }
  });

  // Calculate annual subject grades for each student
  const studentAnnualGrades = {}; // eleveId -> { matiereId -> annualGrade }
  students.forEach(student => {
    studentAnnualGrades[student.id] = {};
    const sBulletins = termBulletins.filter(b => b.eleveId === student.id);

    subjects.forEach(subject => {
      const grades = [];
      sBulletins.forEach(b => {
        const d = b.details.find(det => det.matiereId === subject.id);
        if (d && d.noteValue !== null && d.noteValue !== undefined) {
          grades.push(d.noteValue);
        }
      });

      studentAnnualGrades[student.id][subject.id] = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;
    });
  });

  // Calculate subject stats
  const subjectStats = {};
  subjects.forEach(subject => {
    let min = 20;
    let max = 0;
    let sum = 0;
    let count = 0;

    students.forEach(student => {
      const val = studentAnnualGrades[student.id][subject.id];
      if (val !== null) {
        if (val < min) min = val;
        if (val > max) max = val;
        sum += val;
        count++;
      }
    });

    subjectStats[subject.id] = {
      min: count > 0 ? min : 0,
      max: count > 0 ? max : 0,
      average: count > 0 ? sum / count : 0,
    };
  });

  // Student overall annual averages: average of their term averages
  const overallAnnualAverages = [];
  students.forEach(student => {
    const sBulletins = termBulletins.filter(b => b.eleveId === student.id);
    const termAverages = sBulletins.map(b => b.average);
    const average = termAverages.length > 0 ? termAverages.reduce((a, b) => a + b, 0) / termAverages.length : 0;
    overallAnnualAverages.push({ eleveId: student.id, average });
  });

  // Ranks
  overallAnnualAverages.sort((a, b) => b.average - a.average);
  const ranks = {};
  let currentRank = 1;
  for (let i = 0; i < overallAnnualAverages.length; i++) {
    if (i > 0 && overallAnnualAverages[i].average < overallAnnualAverages[i - 1].average) {
      currentRank = i + 1;
    }
    ranks[overallAnnualAverages[i].eleveId] = currentRank;
  }

  // Subject ranks
  const subjectRanks = {};
  subjects.forEach(subject => {
    subjectRanks[subject.id] = {};
    const sorted = students
      .map(s => ({ eleveId: s.id, value: studentAnnualGrades[s.id][subject.id] }))
      .filter(s => s.value !== null)
      .sort((a, b) => b.value - a.value);

    let currentSubRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].value < sorted[i - 1].value) {
        currentSubRank = i + 1;
      }
      subjectRanks[subject.id][sorted[i].eleveId] = currentSubRank;
    }
  });

  // Save annual bulletins concurrently
  await Promise.all(students.map(async (student) => {
    const studentAvg = overallAnnualAverages.find(a => a.eleveId === student.id).average;
    const studentRank = ranks[student.id];

    // Cumulate absences across all terms
    const sBulletins = termBulletins.filter(b => b.eleveId === student.id);
    const justified = sBulletins.reduce((sum, b) => sum + b.absencesJustified, 0);
    const unjustified = sBulletins.reduce((sum, b) => sum + b.absencesUnjustified, 0);
    
    // Auto-decision for Annual Bulletin
    const decision = studentAvg >= 10 ? "Admis(e) en classe supérieure" : "Redouble";

    let bulletin = await prisma.bulletin.findFirst({
      where: {
        eleveId: student.id,
        type: "ANNUAL"
      }
    });

    if (bulletin) {
      bulletin = await prisma.bulletin.update({
        where: { id: bulletin.id },
        data: {
          average: studentAvg,
          rank: studentRank,
          absencesJustified: justified,
          absencesUnjustified: unjustified,
          classCouncilDecision: decision,
        }
      });
      await prisma.bulletinDetail.deleteMany({
        where: { bulletinId: bulletin.id }
      });
    } else {
      bulletin = await prisma.bulletin.create({
        data: {
          eleveId: student.id,
          type: "ANNUAL",
          average: studentAvg,
          rank: studentRank,
          absencesJustified: justified,
          absencesUnjustified: unjustified,
          classCouncilDecision: decision,
        }
      });
    }

    const detailsData = [];
    for (const subject of subjects) {
      const val = studentAnnualGrades[student.id][subject.id];
      if (val !== null) {
        const stats = subjectStats[subject.id];
        const subRank = subjectRanks[subject.id][student.id] || null;
        const app = getAppreciation(val);

        detailsData.push({
          bulletinId: bulletin.id,
          matiereId: subject.id,
          noteValue: val,
          classAverage: stats.average,
          minNote: stats.min,
          maxNote: stats.max,
          rank: subRank,
          appreciation: `${app.fr} / ${app.en}`,
          coefficient: subject.coefficient,
        });
      }
    }

    if (detailsData.length > 0) {
      await prisma.bulletinDetail.createMany({
        data: detailsData
      });
    }
  }));

  return { success: true, count: students.length };
}

module.exports = {
  generateSequenceBulletins,
  generateTermBulletins,
  generateAnnualBulletins
};
