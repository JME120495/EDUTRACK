const http = require('http');

async function testLocal() {
  console.log('Testing local API for 404...');
  try {
    const res = await fetch('http://localhost:5000/api/creneaux/generate-default', {
      method: 'POST'
    });
    console.log('Local status:', res.status);
    const text = await res.text();
    console.log('Local response:', text.substring(0, 200));
  } catch(e) {
    console.log('Local test failed:', e.message);
  }
}

testLocal();
