const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    'info',
    'warn',
    'error'
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 200) {
    console.warn(`[PRISMA SLOW QUERY] Duration: ${e.duration}ms | Query: ${e.query}`);
  }
});

module.exports = prisma;
