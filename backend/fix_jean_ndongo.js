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
    
    for (const a of assignments) {
      if (!a.matiere || !a.matiere.name) {
        // Orphaned or bad data, delete it
        await prisma.enseignantMatiereClasse.delete({ where: { id: a.id } });
        continue;
      }
      
      // Find a matching experimental teacher for the subject
      const subjectName = a.matiere.name.toLowerCase();
      const matchingTeacher = expTeachers.find(t => 
        t.name && t.name.toLowerCase().includes(subjectName)
      );

      if (matchingTeacher) {
        await prisma.enseignantMatiereClasse.update({
          where: { id: a.id },
          data: { teacherId: matchingTeacher.id }
        });
        fixedCount++;
      } else {
        // Just pick a random experimental teacher
        const randomTeacher = expTeachers[Math.floor(Math.random() * expTeachers.length)];
        if (randomTeacher) {
          await prisma.enseignantMatiereClasse.update({
            where: { id: a.id },
            data: { teacherId: randomTeacher.id }
          });
          fixedCount++;
        }
      }
    }

    console.log(`Successfully re-assigned ${fixedCount} classes from Jean Ndongo to Experimental Teachers.`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
