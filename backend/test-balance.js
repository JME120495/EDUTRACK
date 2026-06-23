const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const jwt = require('jsonwebtoken');

async function testBalance() {
  try {
    const school = await prisma.school.findFirst();
    if (!school) return console.log('No school');
    
    const user = await prisma.user.findFirst({ where: { schoolId: school.id, role: 'INTENDANT' } });
    if (user) {
      const token = jwt.sign(
        { userId: user.id, role: user.role, schoolId: user.schoolId },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );
      console.log('Test Token:', token);
    }
    
    console.log('Testing for school:', school.id);
    const lines = await prisma.accountingLine.findMany({
      where: {
        entry: {
          schoolId: school.id,
          status: 'VALIDATED'
        }
      },
      include: {
        account: true
      }
    });

    console.log(`Found ${lines.length} lines.`);
    
    const balanceMap = {};
    
    lines.forEach(line => {
      const accNum = line.account.number;
      if (!balanceMap[accNum]) {
        balanceMap[accNum] = {
          account: line.account,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0
        };
      }
      balanceMap[accNum].totalDebit += line.debit;
      balanceMap[accNum].totalCredit += line.credit;
    });

    const trialBalance = Object.values(balanceMap).map(b => {
      b.balance = b.totalDebit - b.totalCredit;
      return b;
    }).sort((a, b) => a.account.number.localeCompare(b.account.number));

    console.log('Balance calculation successful, count:', trialBalance.length);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testBalance();
