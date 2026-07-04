const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const schoolId = '6b79df65-a1f9-401d-8f75-0737ea47b33a';
  
  const classes = await prisma.classe.findMany({ 
    where: { schoolId },
    include: {
      _count: {
        select: { eleves: true }
      }
    }
  });
  
  classes.forEach(c => console.log(`${c.name}: ${c._count.eleves} students`));
}

check().catch(console.error).finally(() => prisma.$disconnect());
