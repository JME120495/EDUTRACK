const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateSequenceBulletins } = require('./src/services/bulletinService');

async function main() {
  // Find a class that has subjects and students
  const c = await prisma.classe.findFirst({
    where: {
      eleves: { some: {} },
      EnseignantMatiereClasse: { some: {} }
    }
  });
  const s = await prisma.sequence.findFirst();
  console.log(`Class: ${c.id}, Seq: ${s.id}`);
  const res = await generateSequenceBulletins(c.id, s.id);
  console.log(res);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
