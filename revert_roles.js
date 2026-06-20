const fs = require('fs');

// Patch hr.js
const hrPath = 'backend/src/routes/hr.js';
let hrContent = fs.readFileSync(hrPath, 'utf8');
hrContent = hrContent.replace(/\['DIRECTOR', 'INTENDANT', 'CENSEUR'\]/g, "['DIRECTOR', 'INTENDANT']");
fs.writeFileSync(hrPath, hrContent);
console.log('Reverted hr.js');

// Patch App.jsx
const appPath = 'frontend/src/App.jsx';
let appContent = fs.readFileSync(appPath, 'utf8');
appContent = appContent.replace(
  /<Route path="\/hr" element=\{\s*<RoleRoute roles=\{\['DIRECTOR', 'INTENDANT', 'CENSEUR'\]\}>/g,
  '<Route path="/hr" element={\n            <RoleRoute roles={[\'DIRECTOR\', \'INTENDANT\']}>'
);
fs.writeFileSync(appPath, appContent);
console.log('Reverted App.jsx');
