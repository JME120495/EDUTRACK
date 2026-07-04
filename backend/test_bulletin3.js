const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateSequenceBulletins } = require('./src/services/bulletinService');

async function main() {
  // Find a class that has subjects and students
  const c = await prisma.classe.findFirst({
    where: {
      eleves: { some: {} },
      taughtSubjects: { some: {} }
    }
  });
  if (!c) {
    console.log("No class found.");
    return;
  }
  const s = await prisma.sequence.findFirst();
  console.log(`Class: ${c.id}, Seq: ${s.id}`);
  const res = await generateSequenceBulletins(c.id, s.id);
  console.log("Success:", res.success);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
