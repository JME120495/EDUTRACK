const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin(email, password) {
  const users = await prisma.user.findMany({
    where: { email },
    include: { school: true }
  });
  console.log(`Users found for ${email}: ${users.length}`);
  if (users.length > 0) {
    const isMatch = await bcrypt.compare(password, users[0].passwordHash);
    console.log(`Password "${password}" match:`, isMatch);
  }
}

async function run() {
  await testLogin('director@edutrack.com', 'Jmelec@mele0n');
  await testLogin('director@edutrack.com', 'Jmelec@mele0N');
  await testLogin('director@edutrack.com', 'admin123');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
