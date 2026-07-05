const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const schoolId = '6b79df65-a1f9-401d-8f75-0737ea47b33a';
  try {
    const slots = await prisma.creneauHoraire.findMany({ where: { schoolId }, orderBy: { order: 'asc' } });
    console.log(`School ${schoolId} slots:`, slots.map(s => ({ start: s.startTime, end: s.endTime, label: s.label })));
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
