const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGetClasses() {
  const schoolId = '6b79df65-a1f9-401d-8f75-0737ea47b33a';
  
  const activeYear = await prisma.anneeScolaire.findFirst({
    where: { schoolId, active: true }
  });
  console.log("ACTIVE YEAR:", activeYear);
  
  if (activeYear) {
    const classes = await prisma.classe.findMany({
      where: { schoolId, anneeScolaireId: activeYear.id }
    });
    console.log("CLASSES FOR ACTIVE YEAR:", classes.length);
  }
  
  const allYears = await prisma.anneeScolaire.findMany({ where: { schoolId }});
  console.log("ALL YEARS FOR SCHOOL:", allYears);
  
  await prisma.$disconnect();
}

checkGetClasses().catch(console.error);
