const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyEmail() {
  try {
    const email = 'jmetradingacademy@gmail.com';
    const users = await prisma.user.updateMany({
      where: { email },
      data: { emailVerified: true }
    });
    console.log(`Updated ${users.count} users.`);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

verifyEmail();
