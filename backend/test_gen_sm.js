const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateAutomaticTimetable } = require('./src/services/timetableGenerator');

async function test() {
  const schoolId = 'saint-michel-yaounde';
  try {
    console.log(`Generating for ${schoolId}...`);
    const result = await generateAutomaticTimetable(schoolId);
    console.log('Result:', result.success, result.messageFr || 'Success!');
  } catch(e) {
    console.error('Error:', e);
  } finally {
    prisma.$disconnect();
  }
}
test();
