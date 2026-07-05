const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const assignments = await prisma.enseignantMatiereClasse.findMany({
      where: { class: { schoolId: 'saint-michel-yaounde' } },
      include: { class: true, matiere: true, teacher: true }
    });
    console.log(JSON.stringify(assignments, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
