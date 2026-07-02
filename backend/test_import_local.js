require('dotenv').config();
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.user.findFirst({ where: { role: 'DIRECTOR' } });
  if (!admin) return console.log('No admin found');
  
  const jwtSecret = process.env.JWT_SECRET || 'edutrack-super-secret-jwt-key-24h-2026';
  console.log('Using JWT_SECRET:', jwtSecret);
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { id: admin.id, role: admin.role, schoolId: admin.schoolId },
    jwtSecret,
    { expiresIn: '1d' }
  );

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ['Nom de la classe', 'Niveau', 'Capacité'],
    ['6eme A', '6eme', 50]
  ]), 'Classes');
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ['Matricule', 'Nom Complet', 'Sexe', 'Date Naissance', 'Lieu Naissance', 'Classe', 'Statut', 'Nom du Parent', 'Téléphone Parent', 'Relation Parent', 'Malade', 'Handicap', 'Notes Médicales'],
    ['MAT-TEST-1', 'Eleve Test', 'M', '01/01/2010', 'Paris', '6eme A', 'ACTIF', 'Parent Test', '677777777', 'PERE', 'NON', 'NON', '']
  ]), 'Eleves');
  xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([
    ['Matricule Eleve', 'Matière', 'Séquence', 'Note (sur 20)', 'Remarque'],
    ['MAT-TEST-1', 'Maths', 'SEQ1', 15, 'Bien']
  ]), 'Notes');

  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const form = new FormData();
  form.append('file', blob, 'test.xlsx');

  console.log('Sending request...');
  const res = await fetch('http://localhost:5000/api/import/excel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  const data = await res.text();
  console.log('Response Status:', res.status);
  console.log('Response Body:', data);
}
run();
