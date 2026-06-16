const prisma = require('../db');

async function checkConflicts(classId, teacherId, creneauId, dayOfWeek, room, excludeId = null) {
  // 1. Check if the teacher is already booked at this time slot on this day
  const teacherConflict = await prisma.emploiDuTemps.findFirst({
    where: {
      teacherId,
      creneauId,
      dayOfWeek,
      NOT: excludeId ? { id: excludeId } : undefined,
    },
    include: {
      class: true,
      creneau: true,
    }
  });

  if (teacherConflict) {
    return {
      conflict: true,
      type: 'TEACHER',
      messageFr: `L'enseignant est déjà occupé avec la classe ${teacherConflict.class.name} sur ce créneau.`,
      messageEn: `Teacher is already teaching class ${teacherConflict.class.name} in this time slot.`,
    };
  }

  // 2. Check if the room is occupied at this time slot on this day
  if (room && room.trim() !== '') {
    const roomConflict = await prisma.emploiDuTemps.findFirst({
      where: {
        room: room.trim(),
        creneauId,
        dayOfWeek,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
      include: {
        class: true,
      }
    });

    if (roomConflict) {
      return {
        conflict: true,
        type: 'ROOM',
        messageFr: `La salle ${room} est déjà occupée par la classe ${roomConflict.class.name}.`,
        messageEn: `Room ${room} is already occupied by class ${roomConflict.class.name}.`,
      };
    }
  }

  // 3. Check if the class itself already has a lesson at this time
  const classConflict = await prisma.emploiDuTemps.findFirst({
    where: {
      classId,
      creneauId,
      dayOfWeek,
      NOT: excludeId ? { id: excludeId } : undefined,
    },
    include: {
      matiere: true,
    }
  });

  if (classConflict) {
    return {
      conflict: true,
      type: 'CLASS',
      messageFr: `La classe a déjà un cours de ${classConflict.matiere.nameFr} sur ce créneau.`,
      messageEn: `Class already has a ${classConflict.matiere.nameEn} class scheduled in this time slot.`,
    };
  }

  return { conflict: false };
}

module.exports = {
  checkConflicts,
};
