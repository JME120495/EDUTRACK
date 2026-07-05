const API = 'https://edutrack-api-1du4.onrender.com/api';

async function test() {
  console.log('=== Checking deployed API ===\n');

  try {
    const healthRes = await fetch(API.replace('/api', '/health'));
    const healthData = await healthRes.json().catch(() => null);
    console.log('Health:', healthRes.status, JSON.stringify(healthData));
    
    // Check if the route exists by making a request with no auth
    // If it returns 401, the route exists. If 404, it doesn't.
    const res = await fetch(`${API}/creneaux/generate-default`, {
      method: 'POST'
    });
    console.log('Status for /generate-default:', res.status);
    const data = await res.text();
    console.log('Response:', data);
  } catch(e) {
    console.log('FAIL:', e.message);
  }
}

test();
