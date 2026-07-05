const prisma = require('../db');

async function generateAutomaticTimetable(schoolId) {
  // 1. Fetch data
  const classes = await prisma.classe.findMany({
    where: { schoolId }
  });

  const slots = await prisma.creneauHoraire.findMany({
    where: { schoolId },
    orderBy: { order: 'asc' }
  });

  const assignments = await prisma.enseignantMatiereClasse.findMany({
    where: {
      class: { schoolId }
    },
    include: {
      teacher: true,
      matiere: true,
      class: true
    }
  });

  // 2. Filter active slots (no pause)
  const activeSlots = slots.filter(s => {
    const label = (s.label || '').toUpperCase();
    return !label.includes('PAUSE') && !label.includes('BREAK') && !label.includes('RÉCRÉATION');
  });

  if (activeSlots.length === 0) {
    return {
      success: false,
      messageFr: "Veuillez configurer les créneaux horaires de l'école (hors pauses) avant de générer.",
      messageEn: "Please configure school time slots (excluding breaks) before generating."
    };
  }

  // Calculate average slot duration
  let averageDuration = 2.0;
  try {
    const s = activeSlots[0];
    const [startH, startM] = s.startTime.split(':').map(Number);
    const [endH, endM] = s.endTime.split(':').map(Number);
    averageDuration = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  } catch (e) {
    averageDuration = 2.0;
  }

  // 3. Build tasks list
  const tasks = [];
  assignments.forEach(a => {
    const hours = a.hoursTaught || 0;
    if (hours <= 0) return;

    // Calculate slots needed
    const slotsNeeded = Math.ceil(hours / averageDuration);
    for (let i = 0; i < slotsNeeded; i++) {
      tasks.push({
        assignmentId: a.id,
        classId: a.classId,
        teacherId: a.teacherId,
        matiereId: a.matiereId
      });
    }
  });

  if (tasks.length === 0) {
    return {
      success: false,
      messageFr: "Aucun enseignant ou matière n'est configuré avec des heures dans cette école.",
      messageEn: "No teachers or subjects are configured with hours in this school."
    };
  }

  // 4. Sort tasks using MRV heuristic (teachers with most hours first)
  const teacherTotalSlots = {};
  tasks.forEach(t => {
    teacherTotalSlots[t.teacherId] = (teacherTotalSlots[t.teacherId] || 0) + 1;
  });

  tasks.sort((t1, t2) => {
    const diff = teacherTotalSlots[t2.teacherId] - teacherTotalSlots[t1.teacherId];
    if (diff !== 0) return diff;
    return t1.classId.localeCompare(t2.classId);
  });

  // Pre-check: Mathematically impossible if a teacher needs more slots than available in 4 days
  const MAX_DAYS_PER_TEACHER = 4;
  const maxSlotsPossiblePerTeacher = MAX_DAYS_PER_TEACHER * activeSlots.length;
  
  for (const teacherId in teacherTotalSlots) {
    if (teacherTotalSlots[teacherId] > maxSlotsPossiblePerTeacher) {
      return {
        success: false,
        messageFr: `Impossible : un enseignant a ${teacherTotalSlots[teacherId]} heures de cours, mais ne peut travailler que 4 jours par semaine (max ${maxSlotsPossiblePerTeacher} heures). Réduisez ses heures ou ajoutez des créneaux.`,
        messageEn: `Impossible: a teacher has ${teacherTotalSlots[teacherId]} hours, but can only work 4 days per week (max ${maxSlotsPossiblePerTeacher} hours).`
      };
    }
  }

  // 5. Initialize data structures for backtracking
  const DAYS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
  const schedule = {};
  classes.forEach(c => {
    schedule[c.id] = {};
    DAYS.forEach(day => {
      schedule[c.id][day] = {};
    });
  });

  const teacherDays = {};
  const teacherSlots = {};

  let steps = 0;
  const MAX_STEPS = 5000000; // Increased to 5 million for higher chance of finding a solution

  function backtrack(taskIndex) {
    steps++;
    if (steps > MAX_STEPS) {
      return false; // Step limit reached
    }

    if (taskIndex === tasks.length) {
      return true;
    }

    const task = tasks[taskIndex];

    for (const day of DAYS) {
      for (const slot of activeSlots) {
        const creneauId = slot.id;

        // Constraint 1: Class already has a class in this slot
        if (schedule[task.classId][day][creneauId]) {
          continue;
        }

        // Constraint 2: Teacher already busy in this slot
        if (teacherSlots[task.teacherId]?.[day]?.[creneauId]) {
          continue;
        }

        // Constraint 3: Max days per teacher (<= 4)
        const currentDays = teacherDays[task.teacherId] || new Set();
        const isNewDay = !currentDays.has(day);
        if (isNewDay && currentDays.size >= 4) {
          continue;
        }

        // Choose
        schedule[task.classId][day][creneauId] = {
          teacherId: task.teacherId,
          matiereId: task.matiereId
        };
        if (!teacherSlots[task.teacherId]) teacherSlots[task.teacherId] = {};
        if (!teacherSlots[task.teacherId][day]) teacherSlots[task.teacherId][day] = {};
        teacherSlots[task.teacherId][day][creneauId] = task.classId;

        if (isNewDay) {
          currentDays.add(day);
        }
        teacherDays[task.teacherId] = currentDays;

        // Recurse
        if (backtrack(taskIndex + 1)) {
          return true;
        }

        // Backtrack
        delete schedule[task.classId][day][creneauId];
        delete teacherSlots[task.teacherId][day][creneauId];
        if (isNewDay) {
          currentDays.delete(day);
        }
      }
    }

    return false;
  }

  // 6. Run solver
  const solved = backtrack(0);

  if (!solved) {
    return {
      success: false,
      messageFr: "Impossible de générer l'emploi du temps avec les contraintes actuelles. Vérifiez qu'un enseignant n'a pas trop d'heures (max 4 jours par semaine).",
      messageEn: "Unable to generate the timetable with current constraints. Verify that no teacher has too many hours (max 4 days per week)."
    };
  }

  // 7. Save to Database in a transaction
  const classIds = classes.map(c => c.id);
  
  await prisma.$transaction(async (tx) => {
    // Delete existing timetables for all classes in this school
    await tx.emploiDuTemps.deleteMany({
      where: {
        classId: { in: classIds }
      }
    });

    // Create new records
    const recordsToCreate = [];
    for (const classId of classIds) {
      for (const day of DAYS) {
        for (const slot of activeSlots) {
          const assignment = schedule[classId][day][slot.id];
          if (assignment) {
            recordsToCreate.push({
              classId,
              dayOfWeek: day,
              creneauId: slot.id,
              teacherId: assignment.teacherId,
              matiereId: assignment.matiereId,
              room: ''
            });
          }
        }
      }
    }

    if (recordsToCreate.length > 0) {
      await tx.emploiDuTemps.createMany({
        data: recordsToCreate
      });
    }
  });

  return {
    success: true,
    messageFr: "Emploi du temps généré automatiquement avec succès !",
    messageEn: "Timetable automatically generated successfully!"
  };
}

module.exports = {
  generateAutomaticTimetable
};
