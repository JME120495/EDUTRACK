const xlsx = require('xlsx');

const wb = xlsx.readFile('EduTrac_Demo_1000.xlsx');
// add a dummy sheet named "Élèves"
xlsx.utils.book_append_sheet(wb, xlsx.utils.aoa_to_sheet([['Nom', 'Matricule']]), 'Élèves');

// This simulates the import.js logic
const sheetNames = wb.SheetNames;
console.log('Available sheets:', sheetNames);

// How to robustly find the Eleves sheet:
const findSheet = (names, possibleNames) => {
  const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return names.find(n => possibleNames.includes(normalize(n)));
};

const elevesSheet = findSheet(sheetNames, ['eleves']);
console.log('Found Eleves sheet as:', elevesSheet);

const matieresSheet = findSheet(sheetNames, ['matieres']);
console.log('Found Matieres sheet as:', matieresSheet);
