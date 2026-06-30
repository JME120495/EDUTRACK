const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyLatestUser() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    console.log('Latest users:');
    for (const user of users) {
      console.log(`- ${user.email} (Verified: ${user.emailVerified})`);
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true }
        });
        console.log(`=> Force verified ${user.email}!`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verifyLatestUser();
