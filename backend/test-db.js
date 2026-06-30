const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log("SUCCESS: Connected to the database.");
    const users = await prisma.user.count();
    console.log("Number of users:", users);
  } catch (e) {
    console.error("FAIL: Could not connect to the database.", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();