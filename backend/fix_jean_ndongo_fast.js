const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const assignments = await prisma.enseignantMatiereClasse.findMany({
      where: { teacher: { name: 'M. Jean Ndongo' } },
      include: {
        matiere: true,
        class: true
      }
    });

    console.log(`Found ${assignments.length} assignments for Jean Ndongo.`);

    const expTeachers = await prisma.user.findMany({
      where: { name: { contains: '(Exp)' } }
    });

    console.log(`Found ${expTeachers.length} Experimental teachers.`);

    let fixedCount = 0;
    
    // Group assignments into chunks to avoid long hangs
    const chunkSize = 50;
    for (let i = 0; i < assignments.length; i += chunkSize) {
      const chunk = assignments.slice(i, i + chunkSize);
      const promises = chunk.map(async (a) => {
        if (!a.matiere || !a.matiere.name) {
          return prisma.enseignantMatiereClasse.delete({ where: { id: a.id } }).catch(e => null);
        }
        
        const subjectName = a.matiere.name.toLowerCase();
        let matchingTeacher = expTeachers.find(t => 
          t.name && t.name.toLowerCase().includes(subjectName)
        );

        if (!matchingTeacher) {
          matchingTeacher = expTeachers[Math.floor(Math.random() * expTeachers.length)];
        }

        if (matchingTeacher) {
          return prisma.enseignantMatiereClasse.update({
            where: { id: a.id },
            data: { teacherId: matchingTeacher.id }
          }).catch(e => null);
        }
      });

      const results = await Promise.all(promises);
      fixedCount += results.filter(r => r !== null).length;
      console.log(`Processed chunk ${i / chunkSize + 1}, fixed ${fixedCount} total so far...`);
    }

    console.log(`Successfully re-assigned ${fixedCount} classes from Jean Ndongo to Experimental Teachers.`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
