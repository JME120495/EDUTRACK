const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function check() {
  const email = 'jmetradingacademy@gmail.com';
  const users = await prisma.user.findMany({ where: { email } });
  console.log('Found users:', users.length);
  for (const u of users) {
    console.log(`User ID: ${u.id}, Role: ${u.role}, Email verified: ${u.emailVerified}`);
    console.log(`Password Hash: ${u.passwordHash}`);
    const isMatch = await bcrypt.compare('123456', u.passwordHash); // Trying typical password '123456'
    console.log(`Matches 123456? : ${isMatch}`);
    
    // Also try the password typed in the video. It's 6 dots. Let's try "password", "azerty", "qwerty"
  }
}
check().catch(console.error).finally(() => prisma.$disconnect());
