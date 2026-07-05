const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateAutomaticTimetable } = require('./src/services/timetableGenerator');

async function test() {
  const schoolId = '6b79df65-a1f9-401d-8f75-0737ea47b33a';
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
