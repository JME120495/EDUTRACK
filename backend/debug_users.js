const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function getCountrySlug(countryName) {
  if (!countryName) return 'cm';
  const name = countryName.toLowerCase().trim();
  const map = {
    'cameroun': 'cm', 'cameroon': 'cm',
    'france': 'fr',
    'congo': 'cg', 'rdc': 'cd', 'république démocratique du congo': 'cd',
    'senegal': 'sn', 'sénégal': 'sn',
    'mali': 'ml',
    'cote d\'ivoire': 'ci', 'côte d\'ivoire': 'ci',
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

async function test() {
  const req = {
    body: {
      name: 'ESSO',
      email: '',
      password: '123',
      role: 'CENSEUR',
      phone: '123456'
    },
    user: {
      // Find the first director to get their schoolId
      role: 'DIRECTOR'
    }
  };

  const director = await prisma.user.findFirst({ where: { role: 'DIRECTOR' } });
  if (!director) return console.log("No director found");
  req.user.schoolId = director.schoolId;

  const { name, email, password, role, phone } = req.body;

  try {
      const school = await prisma.school.findUnique({ where: { id: req.user.schoolId } });
      const words = school.name.trim().split(/[\\s-]+/);
      let schoolSlug = '';
      if (words.length > 1) {
        schoolSlug = words.map(w => w.charAt(0)).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
      } else {
        schoolSlug = school.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 3);
      }
      if (!schoolSlug) schoolSlug = 'school';
      
      const countrySlug = getCountrySlug(school.country);
      
      const firstName = name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const lastName = name.split(' ').slice(1).join('').toLowerCase().replace(/[^a-z0-9]/g, '');
      const baseName = lastName ? `${firstName}.${lastName}` : firstName;
      
      let finalEmail = `${baseName}@${schoolSlug}.edutrack.${countrySlug}`;
      
      console.log("finalEmail generated:", finalEmail);
  } catch(e) {
      console.log("Error generated:", e);
  }
}

test().finally(() => prisma.$disconnect());
