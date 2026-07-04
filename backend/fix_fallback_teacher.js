const fs = require('fs');
let code = fs.readFileSync('src/routes/import.js', 'utf8');

code = code.replace(
  /const fallbackTeacher = await prisma\.user\.findFirst\(\{ where: \{ schoolId, role: 'TEACHER' \} \}\);/g,
  `let fallbackTeacher = await prisma.user.findFirst({ where: { schoolId, role: 'TEACHER' } });
      if (!fallbackTeacher) {
        fallbackTeacher = await prisma.user.findFirst({ where: { schoolId, role: 'DIRECTOR' } });
      }`
);

fs.writeFileSync('src/routes/import.js', code);
console.log('Optimized fallback teacher in import.js');
