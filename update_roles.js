const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'backend', 'src', 'routes');

function updateFile(file, searchStr, replaceStr) {
  const filePath = path.join(routesDir, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(new RegExp(searchStr, 'g'), replaceStr);
  fs.writeFileSync(filePath, content);
}

// INTENDANT routes
updateFile('paiements.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'INTENDANT'])");
updateFile('finance.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'INTENDANT'])");
updateFile('hr.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'INTENDANT'])");

// CENSEUR routes
updateFile('eleves.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'CENSEUR'])");
updateFile('classes.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'CENSEUR'])");
updateFile('timetable.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'CENSEUR'])");
updateFile('bulletins.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'CENSEUR'])");
updateFile('notes.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'CENSEUR'])");
updateFile('matieres.js', "requireRole\\(\\['DIRECTOR'\\]\\)", "requireRole(['DIRECTOR', 'CENSEUR'])");

console.log('Roles updated in backend routes.');
