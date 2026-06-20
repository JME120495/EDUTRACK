const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function reset() {
  const hash = await bcrypt.hash('Jmelec@mele0n', 10);
  await prisma.user.update({
    where: { email: 'director@edutrack.com' },
    data: { passwordHash: hash }
  });
  
  // Update other teachers to the same password just in case? No, just director.
  console.log('Password reset successfully to Jmelec@mele0n');
  await prisma.$disconnect();
}
reset().catch(console.error);
