const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ where: { email: 'director@edutrack.com' } });
  if (users.length > 0) {
    const isMatch = await bcrypt.compare('password123', users[0].passwordHash);
    console.log(`password123 match:`, isMatch);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
