const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const slots = await prisma.creneauHoraire.findMany();
    for (const s of slots) {
      if (!s.startTime.includes(':') || !s.endTime.includes(':')) {
        console.log(`Bad slot format in school ${s.schoolId}: ${s.startTime} - ${s.endTime}`);
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
