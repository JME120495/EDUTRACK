const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateAutomaticTimetable } = require('./src/services/timetableGenerator');

async function test() {
  const schoolId = 'saint-michel-yaounde';
  try {
    const activeYear = await prisma.anneeScolaire.findFirst({ where: { schoolId, active: true } });
    
    // create a class
    const newClass = await prisma.classe.create({
      data: {
        schoolId,
        name: 'Test Class ' + Date.now(),
        anneeScolaireId: activeYear.id
      }
    });

    const matiere = await prisma.matiere.findFirst({ where: { schoolId }});

    // Create 3 assignments without teacher, each 2 hours, total 6 hours
    await prisma.enseignantMatiereClasse.create({
      data: {
        matiereId: matiere.id,
        classId: newClass.id,
        hoursTaught: 2
      }
    });
    await prisma.enseignantMatiereClasse.create({
      data: {
        matiereId: matiere.id,
        classId: newClass.id,
        hoursTaught: 2
      }
    });
    await prisma.enseignantMatiereClasse.create({
      data: {
        matiereId: matiere.id,
        classId: newClass.id,
        hoursTaught: 2
      }
    });

    console.log(`Generating for ${schoolId}...`);
    const result = await generateAutomaticTimetable(schoolId);
    console.log('Result:', result.success, result.messageFr || 'Success!');

  } catch(e) {
    console.error('Error:', e);
  } finally {
    prisma.$disconnect();
  }
}
test();
