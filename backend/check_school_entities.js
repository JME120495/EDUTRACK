const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const classes = await prisma.classe.findMany({
      where: { schoolId: 'saint-michel-yaounde' }
    });
    console.log(`saint-michel-yaounde has ${classes.length} classes.`);

    const matieres = await prisma.matiere.findMany({
      where: { schoolId: 'saint-michel-yaounde' }
    });
    console.log(`saint-michel-yaounde has ${matieres.length} matieres.`);

    const teachers = await prisma.user.findMany({
      where: { schoolId: 'saint-michel-yaounde', role: 'TEACHER' }
    });
    console.log(`saint-michel-yaounde has ${teachers.length} teachers.`);

    const assignments = await prisma.enseignantMatiereClasse.findMany({
      where: { class: { schoolId: 'saint-michel-yaounde' } },
      include: { class: true, matiere: true, teacher: true }
    });
    console.log(`saint-michel-yaounde has ${assignments.length} assignments.`);
    if (assignments.length > 0) {
      console.log('Sample assignment:', assignments[0].class.name, assignments[0].matiere.name, assignments[0].teacher.name);
    }
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
