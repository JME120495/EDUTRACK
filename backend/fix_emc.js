const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMissingEMC() {
  console.log("Fetching all notes with eleve.classId...");
  
  const notes = await prisma.note.findMany({
    select: {
      matiereId: true,
      eleve: {
        select: {
          classId: true
        }
      }
    }
  });
  
  console.log(`Found ${notes.length} notes.`);
  
  // Find distinct pairs of (classId, matiereId)
  const requiredPairs = new Set();
  for (const n of notes) {
    if (n.eleve && n.eleve.classId) {
      requiredPairs.add(`${n.eleve.classId}_${n.matiereId}`);
    }
  }
  
  console.log(`Found ${requiredPairs.size} distinct (classId, matiereId) pairs from notes.`);
  
  // Fetch existing EMCs
  const existingEMCs = await prisma.enseignantMatiereClasse.findMany();
  const existingSet = new Set(existingEMCs.map(e => `${e.classId}_${e.matiereId}`));
  
  console.log(`Found ${existingSet.size} existing EnseignantMatiereClasse records.`);
  
  // Find a fallback teacher
  const fallbackTeacher = await prisma.user.findFirst({
    where: { role: 'TEACHER' }
  });
  
  if (!fallbackTeacher) {
    console.error("No teacher found in the database. Cannot create EMCs.");
    return;
  }
  
  const toCreate = [];
  for (const pairStr of requiredPairs) {
    if (!existingSet.has(pairStr)) {
      const [classId, matiereId] = pairStr.split('_');
      toCreate.push({
        classId,
        matiereId,
        teacherId: fallbackTeacher.id
      });
    }
  }
  
  console.log(`Need to create ${toCreate.length} missing EnseignantMatiereClasse records.`);
  
  if (toCreate.length > 0) {
    const result = await prisma.enseignantMatiereClasse.createMany({
      data: toCreate,
      skipDuplicates: true
    });
    console.log(`Successfully created ${result.count} EnseignantMatiereClasse records.`);
  } else {
    console.log("All necessary EnseignantMatiereClasse records already exist.");
  }
}

fixMissingEMC()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
