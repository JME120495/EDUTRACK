const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.findFirst({
    where: { email: 'essono.jean@pri.edutrack.cm' }
  });
  console.log("Teacher user ID:", teacher.id);
  
  try {
    const cahiers = await prisma.cahierTexte.findMany({
      where: { teacherId: teacher.id },
      include: {
        matiere: true,
        class: true,
        homeworks: true
      },
      orderBy: { date: 'desc' }
    });
    console.log("Cahier de textes fetched successfully. Count:", cahiers.length);
  } catch (err) {
    console.error("Error querying cahierTexte:", err);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
