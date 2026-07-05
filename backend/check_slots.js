const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlots() {
  try {
    const activeSlots = await prisma.creneauHoraire.findMany({
      where: { schoolId: 'saint-michel-yaounde' },
      orderBy: { order: 'asc' }
    });
    console.log('Active slots:', activeSlots.map(s => ({ start: s.startTime, end: s.endTime, label: s.label })));
    
    // Simulate generator logic
    const slots = activeSlots.filter(s => {
      const label = (s.label || '').toUpperCase();
      return !label.includes('PAUSE') && !label.includes('BREAK') && !label.includes('RÉCRÉATION');
    });

    let averageDuration = 2.0;
    try {
      const s = slots[0];
      const [startH, startM] = s.startTime.split(':').map(Number);
      const [endH, endM] = s.endTime.split(':').map(Number);
      averageDuration = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
    } catch (e) {
      console.log('Caught error, defaulting to 2.0');
      averageDuration = 2.0;
    }
    console.log('Calculated averageDuration:', averageDuration);
    console.log('slotsNeeded for 2 hours:', Math.ceil(2 / averageDuration));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlots();
