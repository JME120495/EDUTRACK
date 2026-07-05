const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixHours() {
  try {
    const res = await prisma.enseignantMatiereClasse.updateMany({
      where: {
        teacher: { name: { contains: '(Exp)' } },
        hoursTaught: { gt: 2 }
      },
      data: {
        hoursTaught: 2
      }
    });
    
    console.log(`Updated ${res.count} assignments that had > 2 hours.`);

    // Also just check if anyone has > 20 assignments now
    const teachers = await prisma.user.findMany({
      where: { name: { contains: '(Exp)' } }
    });

    let deleted = 0;
    for (const t of teachers) {
      const assignments = await prisma.enseignantMatiereClasse.findMany({
        where: { teacherId: t.id },
        orderBy: { createdAt: 'desc' }
      });
      
      if (assignments.length > 20) {
        const toDelete = assignments.slice(0, assignments.length - 20);
        for (const a of toDelete) {
          await prisma.enseignantMatiereClasse.delete({ where: { id: a.id } });
          deleted++;
        }
      }
    }
    console.log(`Trimmed ${deleted} assignments to keep max 20 per teacher.`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fixHours();
