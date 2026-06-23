async function testHealth() {
  try {
    const res = await fetch('https://edutrack-tky6.vercel.app/_/backend/health');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error(err);
  }
}
testHealth();
