const fs = require('fs');
let code = fs.readFileSync('src/routes/import.js', 'utf8');

// Optimize Eleves
code = code.replace(
  /const existingEleves = await prisma\.eleve\.findMany\(\{ where: \{ class: \{ schoolId \} \} \}\);/g,
  `const matriculesInChunk = [...new Set(data.map(row => (row['Matricule Eleve'] || row['Matricule'])?.toString().trim().toUpperCase()).filter(Boolean))];
      const existingEleves = await prisma.eleve.findMany({ where: { class: { schoolId }, matricule: { in: matriculesInChunk } } });`
);

code = code.replace(
  /const allEleves = await prisma\.eleve\.findMany\(\{ where: \{ class: \{ schoolId \} \} \}\);/g,
  `const allEleves = await prisma.eleve.findMany({ where: { class: { schoolId }, matricule: { in: matriculesInChunk } } });`
);

// Optimize Notes
code = code.replace(
  /const existingNotesList = await prisma\.note\.findMany\(\{\s+where: \{ eleve: \{ class: \{ schoolId \} \} \},\s+select: \{ id: true, eleveId: true, matiereId: true, sequenceId: true, value: true \}\s+\}\);/g,
  `const eleveIdsInChunk = existingEleves.map(e => e.id);
      const existingNotesList = await prisma.note.findMany({
        where: { eleveId: { in: eleveIdsInChunk } },
        select: { id: true, eleveId: true, matiereId: true, sequenceId: true, value: true }
      });`
);

fs.writeFileSync('src/routes/import.js', code);
console.log('Optimized import.js');
