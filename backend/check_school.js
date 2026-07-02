const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchool() {
  const schoolId = "6b79df65-a1f9-401d-8f75-0737ea47b33a";
  const classes = await prisma.classe.findMany({ where: { schoolId } });
  console.log("CLASSES for school:", classes.length);

  const eleves = await prisma.eleve.findMany({ where: { class: { schoolId } } });
  console.log("ELEVES for school:", eleves.length);
  
  const teachers = await prisma.user.findMany({ where: { schoolId, role: 'TEACHER' } });
  console.log("TEACHERS for school:", teachers.length);

  const subjects = await prisma.matiere.findMany({ where: { schoolId } });
  console.log("SUBJECTS for school:", subjects.length);

  await prisma.$disconnect();
}

checkSchool().catch(console.error);
