const fs = require('fs');

// Patch hr.js
const hrPath = 'backend/src/routes/hr.js';
let hrContent = fs.readFileSync(hrPath, 'utf8');
hrContent = hrContent.replace(/\['DIRECTOR', 'INTENDANT'\]/g, "['DIRECTOR', 'INTENDANT', 'CENSEUR']");
fs.writeFileSync(hrPath, hrContent);
console.log('Patched hr.js');

// Patch App.jsx
const appPath = 'frontend/src/App.jsx';
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(
  /<Route path="\/hr" element=\{[\s\S]*?<RoleRoute roles=\{?\['DIRECTOR', 'INTENDANT'\]\}?>/g,
  '<Route path="/hr" element={\n            <RoleRoute roles={[\'DIRECTOR\', \'INTENDANT\', \'CENSEUR\']}>'
);
fs.writeFileSync(appPath, appContent);
console.log('Patched App.jsx');
