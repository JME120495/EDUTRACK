const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['DIRECTOR', 'CENSEUR'] } }
    });
    console.log(`Found ${admins.length} admins:`);
    for (const a of admins) {
      console.log(`User ${a.name} (${a.email}) - Role: ${a.role} - SchoolId: ${a.schoolId}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
