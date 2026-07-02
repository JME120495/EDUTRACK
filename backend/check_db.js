const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  const users = await prisma.user.findMany();
  console.log("USERS:", users.map(u => ({ id: u.id, role: u.role, name: u.name, schoolId: u.schoolId })));

  const schools = await prisma.school.findMany();
  console.log("SCHOOLS:", schools);

  const classes = await prisma.classe.findMany();
  console.log("CLASSES:", classes.length, classes.length > 0 ? { sample: classes[0] } : 'No classes');

  const eleves = await prisma.eleve.findMany();
  console.log("ELEVES:", eleves.length, eleves.length > 0 ? { sample: eleves[0] } : 'No eleves');

  const annees = await prisma.anneeScolaire.findMany();
  console.log("ANNEES SCOLAIRES:", annees);

  await prisma.$disconnect();
}

checkDB().catch(console.error);
