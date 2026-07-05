const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const schoolId = 'f27a20ff-4e7d-4962-90b8-f3aea1fb8765';
  try {
    const assignments = await prisma.enseignantMatiereClasse.findMany({ where: { class: { schoolId } } });
    console.log(`School ${schoolId} has ${assignments.length} assignments`);
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
