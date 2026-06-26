const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const parent = await prisma.user.findFirst({
    where: { role: 'PARENT' },
    include: { children: true }
  });
  console.log(JSON.stringify(parent, null, 2));
  process.exit(0);
}
run();
