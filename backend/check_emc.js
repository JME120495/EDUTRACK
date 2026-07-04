const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.enseignantMatiereClasse.count();
  console.log('EnseignantMatiereClasse count:', count);
  
  const notesCount = await prisma.note.count();
  console.log('Notes count:', notesCount);
}
main().finally(() => prisma.$disconnect());
