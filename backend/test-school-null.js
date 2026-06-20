const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ where: { email: 'director@edutrack.com' }, include: { school: true } });
  console.log(users.length > 0 ? users[0].school : 'No user');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
