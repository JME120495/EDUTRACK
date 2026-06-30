const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDelete() {
  try {
    const school = await prisma.school.create({
      data: {
        name: 'Test Delete School Deep',
        currency: 'XAF',
        users: {
          create: {
            name: 'Test User',
            email: 'test_delete_deep@edutrack.com',
            passwordHash: '123',
            role: 'DIRECTOR'
          }
        },
        anneesScolaires: {
          create: {
            label: '2025-2026'
          }
        }
      }
    });
    
    console.log('Created dummy school deep:', school.id);
    
    // We need to add a class manually to ensure schoolId is set correctly
    const annee = await prisma.anneeScolaire.findFirst({ where: { schoolId: school.id } });
    await prisma.classe.create({
      data: {
        name: '6ème A',
        schoolId: school.id,
        anneeScolaireId: annee.id
      }
    });
    console.log('Created class');
    
    await prisma.school.delete({
      where: { id: school.id }
    });
    
    console.log('Successfully deleted dummy school deep!');
  } catch (err) {
    console.error('Delete failed with error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDelete();
