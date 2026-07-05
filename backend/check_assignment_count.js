const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const assignments = await prisma.enseignantMatiereClasse.findMany({
      where: { class: { schoolId: 'saint-michel-yaounde' } }
    });
    console.log(`saint-michel-yaounde has ${assignments.length} assignments.`);
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
