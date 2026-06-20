const fs = require('fs');
const path = require('path');

const helper = `
function getCountrySlug(countryName) {
  if (!countryName) return 'cm';
  const name = countryName.toLowerCase().trim();
  const map = {
    'cameroun': 'cm', 'cameroon': 'cm',
    'france': 'fr',
    'congo': 'cg', 'rdc': 'cd', 'république démocratique du congo': 'cd',
    'senegal': 'sn', 'sénégal': 'sn',
    'mali': 'ml',
    'cote d\\'ivoire': 'ci', 'côte d\\'ivoire': 'ci',
    'togo': 'tg',
    'benin': 'bj', 'bénin': 'bj',
    'gabon': 'ga',
    'nigeria': 'ng', 'niger': 'ne',
    'tchad': 'td', 'chad': 'td',
    'guinee': 'gn', 'guinée': 'gn',
    'maroc': 'ma', 'morocco': 'ma',
    'afrique du sud': 'za', 'south africa': 'za',
    'kenya': 'ke',
    'rwanda': 'rw',
    'burkina faso': 'bf'
  };
  return map[name] || name.substring(0, 2);
}
`;

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add helper if not there
  if (!content.includes('function getCountrySlug')) {
    content = content.replace("const { auth, requireRole } = require('../middlewares/authMiddleware');", "const { auth, requireRole } = require('../middlewares/authMiddleware');\n" + helper);
    // In eleves.js it might just be auth, requireRole. Let's do a safe replacement after prisma
    if (!content.includes(helper)) {
       content = content.replace("const prisma = require('../db');", "const prisma = require('../db');\n" + helper);
    }
  }

  // Find school.country extraction
  if (!content.includes('const countrySlug = getCountrySlug(school.country);')) {
    content = content.replace("if (!schoolSlug) schoolSlug = 'school';", "if (!schoolSlug) schoolSlug = 'school';\n      const countrySlug = getCountrySlug(school.country);");
  }

  // Replace .com with .${countrySlug}
  content = content.replace(/\.edutrack\.com/g, ".edutrack.${countrySlug}");
  
  fs.writeFileSync(filepath, content, 'utf8');
  console.log('Patched', filepath);
}

patchFile(path.join(__dirname, 'backend', 'src', 'routes', 'users.js'));
patchFile(path.join(__dirname, 'backend', 'src', 'routes', 'eleves.js'));
