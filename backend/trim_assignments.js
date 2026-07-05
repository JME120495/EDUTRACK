const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function trim() {
  try {
    const teachers = await prisma.user.findMany({
      where: { name: { contains: '(Exp)' } }
    });

    let deleted = 0;
    for (const t of teachers) {
      const assignments = await prisma.enseignantMatiereClasse.findMany({
        where: { teacherId: t.id },
        orderBy: { createdAt: 'desc' } // Delete newest if needed
      });
      
      if (assignments.length > 20) {
        const toDelete = assignments.slice(0, assignments.length - 20);
        for (const a of toDelete) {
          await prisma.enseignantMatiereClasse.delete({ where: { id: a.id } });
          deleted++;
        }
      }
    }
    console.log(`Trimmed ${deleted} assignments to keep max 20 (40 hours) per teacher.`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

trim();
