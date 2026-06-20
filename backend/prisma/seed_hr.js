const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding HR and templates data...');

  const schoolId = 'saint-michel-yaounde';

  // 1. Seed Certificate Templates
  const frTemplate = await prisma.documentTemplate.create({
    data: {
      schoolId,
      title: 'Attestation de Scolarité',
      language: 'FR',
      content: 'Je soussigné, Directeur du Collège Saint-Michel, certifie par la présente que l\'élève {NOM_ELEVE}, né(e) le {DATE_NAISSANCE}, matricule {MATRICULE}, est régulièrement inscrit(e) dans notre établissement pour l\'année scolaire {ANNEE_SCOLAIRE} en classe de {CLASSE}.\n\nCette attestation est délivrée pour servir et valoir ce que de droit.'
    }
  });

  const enTemplate = await prisma.documentTemplate.create({
    data: {
      schoolId,
      title: 'Certificate of Enrollment',
      language: 'EN',
      content: 'I, the undersigned, Principal of Collège Saint-Michel, hereby certify that the student {NOM_ELEVE}, born on {DATE_NAISSANCE}, ID number {MATRICULE}, is regularly enrolled in our institution for the {ANNEE_SCOLAIRE} academic year in class {CLASSE}.\n\nThis certificate is issued to serve where necessary.'
    }
  });

  // 2. Find teacher M. Jean Ndongo
  const teacher = await prisma.user.findFirst({
    where: { email: 'jean.ndongo@edutrack.com' }
  });

  if (teacher) {
    // Create an active contract for him
    await prisma.contract.create({
      data: {
        userId: teacher.id,
        type: 'CDI',
        startDate: new Date('2025-09-01'),
        baseSalary: 250000.0,
        hourlyRate: 5000.0,
        status: 'ACTIVE',
        terms: 'Contrat d\'enseignement à durée indéterminée.'
      }
    });

    // Create a mock salary advance for him
    await prisma.salaryAdvance.create({
      data: {
        userId: teacher.id,
        amount: 30000.0,
        requestDate: new Date(),
        status: 'APPROVED',
        repaymentMonth: new Date().getMonth() + 1,
        repaymentYear: new Date().getFullYear(),
        remarks: 'Avance rentrée scolaire'
      }
    });

    // Create a mock leave request
    await prisma.staffLeave.create({
      data: {
        userId: teacher.id,
        type: 'PERMISSION',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        status: 'PENDING',
        reason: 'Affaires familiales urgentes'
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
