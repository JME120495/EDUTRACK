const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testApiFetch() {
  const schoolId = '6b79df65-a1f9-401d-8f75-0737ea47b33a';
  
  // Find a director for this school
  const director = await prisma.user.findFirst({ where: { schoolId, role: 'DIRECTOR' } });
  if (!director) {
    console.log("No director found!");
    return;
  }
  console.log("Found director:", director.email);
  
  // Create a token
  const token = jwt.sign(
    { id: director.id, role: director.role, schoolId: director.schoolId },
    process.env.JWT_SECRET || 'edutrack-super-secret-jwt-key-24h-2026',
    { expiresIn: '1d' }
  );
  
  // Simulate API fetch to localhost (assuming backend runs on 5000)
  // Actually, wait, let's just use Prisma to do exactly what the route does.
  
  const activeYear = await prisma.anneeScolaire.findFirst({
    where: { schoolId, active: true }
  });
  
  const classes = await prisma.classe.findMany({
    where: { schoolId, anneeScolaireId: activeYear.id },
    include: {
      principalTeacher: { select: { id: true, name: true, email: true } },
      censeur: { select: { id: true, name: true, email: true } },
      surveillant: { select: { id: true, name: true, email: true } },
      anneeScolaire: true,
      eleves: {
        where: { status: 'ACTIVE' },
        select: { gender: true, isSick: true, hasDisability: true }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  console.log("Returned classes from route logic:", classes.length);
  if (classes.length > 0) {
     console.log("Sample class name:", classes[0].name, "Students count:", classes[0].eleves.length);
  }
  
  await prisma.$disconnect();
}

testApiFetch().catch(console.error);
