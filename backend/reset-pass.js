const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { email: 'director@edutrack.com' },
    data: { passwordHash: hash }
  });
  console.log('Password reset successfully to password123');
  await prisma.$disconnect();
}
reset().catch(console.error);
