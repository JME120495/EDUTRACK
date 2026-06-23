require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testApi() {
  try {
    const user = await prisma.user.findFirst({ where: { role: 'INTENDANT' }, include: { school: true } });
    if (!user) return console.log('No Intendant found');
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        schoolId: user.schoolId,
        subscriptionPlan: user.school.subscriptionPlan || 'PREMIUM',
        name: user.name,
        schoolName: user.school.name,
        currency: user.school.currency
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('Testing production API with token for:', user.email);
    
    const res = await fetch('http://localhost:5000/api/accounting/reports/trial-balance', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testApi();
