const xlsx = require('xlsx');

const wb = xlsx.readFile('EduTrac_Demo_1000.xlsx');
console.log('SheetNames:', wb.SheetNames);

if (wb.SheetNames.includes('Classes')) {
  const data = xlsx.utils.sheet_to_json(wb.Sheets['Classes']);
  console.log('Classes length:', data.length);
  console.log('First Class:', data[0]);
}

if (wb.SheetNames.includes('Eleves')) {
  const data = xlsx.utils.sheet_to_json(wb.Sheets['Eleves']);
  console.log('Eleves length:', data.length);
  console.log('First Eleve:', data[0]);
}
