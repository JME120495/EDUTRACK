async function testLogin() {
  try {
    const res = await fetch('https://edutrack-tky6.vercel.app/_/backend/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://edutrack-tky6.vercel.app'
      },
      body: JSON.stringify({ email: 'jmetradingacademy@gmail.com', password: 'password123' })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (err) {
    console.error(err);
  }
}
testLogin();
