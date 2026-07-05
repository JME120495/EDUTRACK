const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const schoolId = '6b79df65-a1f9-401d-8f75-0737ea47b33a';
  try {
    const classes = await prisma.classe.findMany({ where: { schoolId } });
    const matieres = await prisma.matiere.findMany({ where: { schoolId } });
    const teachers = await prisma.user.findMany({ where: { schoolId, role: 'TEACHER' } });
    const assignments = await prisma.enseignantMatiereClasse.findMany({ where: { class: { schoolId } } });
    
    console.log(`School ${schoolId}:`);
    console.log(`${classes.length} classes`);
    console.log(`${matieres.length} matieres`);
    console.log(`${teachers.length} teachers`);
    console.log(`${assignments.length} assignments left`);
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
