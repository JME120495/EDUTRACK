const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const assignments = await prisma.enseignantMatiereClasse.findMany({
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true, schoolId: true } },
      }
    });

    const teacherHours = {};
    const schoolIds = new Set();
    
    assignments.forEach(a => {
      schoolIds.add(a.class.schoolId);
      const tId = a.teacher.id;
      if (!teacherHours[tId]) {
        teacherHours[tId] = { name: a.teacher.name, total_hours: 0, assignment_count: 0 };
      }
      teacherHours[tId].total_hours += (a.hoursTaught || 2); // Default to 2 to match generator logic
      teacherHours[tId].assignment_count += 1;
    });

    console.log(`Found assignments in ${schoolIds.size} schools.`);
    console.log('Teacher totals (assuming 2h default for 0h):');
    console.table(Object.values(teacherHours).sort((a, b) => b.total_hours - a.total_hours));

  } catch (err) {
    console.error('Error', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
