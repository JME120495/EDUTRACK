const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchool() {
  try {
    const director = await prisma.user.findFirst({
      where: { role: 'DIRECTOR' }
    });
    
    console.log(`Director SchoolId: ${director?.schoolId}`);

    const classSchools = await prisma.classe.findMany({
      select: { schoolId: true },
      distinct: ['schoolId']
    });

    console.log(`Classes exist in SchoolIds: ${classSchools.map(c => c.schoolId).join(', ')}`);

    const assignmentSchools = await prisma.enseignantMatiereClasse.findMany({
      include: { class: { select: { schoolId: true } } }
    });
    
    const uniqueAssignmentSchools = new Set(assignmentSchools.map(a => a.class?.schoolId).filter(Boolean));
    console.log(`Assignments exist in SchoolIds: ${[...uniqueAssignmentSchools].join(', ')}`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchool();
