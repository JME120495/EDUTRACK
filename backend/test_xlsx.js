const xlsx = require('xlsx');
try {
  const data = xlsx.utils.sheet_to_json(undefined);
  console.log('Returned:', data);
} catch (e) {
  console.error('Error:', e.message);
}
