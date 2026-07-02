const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const xlsx = require('xlsx');

// 1. Create a dummy excel file
const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet([
  ['Nom', 'Matricule', 'Classe', 'Sexe', 'Date Naissance', 'Lieu Naissance', 'Statut', 'Matiere', 'Sequence', 'Note', 'Remarque'],
  ['Test Eleve 1', 'M001', 'Class1', 'M', '2000-01-01', 'Paris', 'Actif', 'Maths', 'Seq1', '15', 'Bien']
]);
xlsx.utils.book_append_sheet(wb, ws, 'ImportData');
xlsx.writeFile(wb, 'test.xlsx');

// 2. Upload it using axios and form-data
async function run() {
  const form = new FormData();
  form.append('file', fs.createReadStream('test.xlsx'));
  form.append('classId', '6b79df65-a1f9-401d-8f75-0737ea47b33a');

  try {
    const res = await axios.post('http://localhost:5000/api/import/excel', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Failed:", err.response ? err.response.data : err.message);
  }
}

run();
