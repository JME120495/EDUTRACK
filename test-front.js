async function testFront() {
  try {
    const res = await fetch('https://edutrack-tky6.vercel.app/');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response length:', text.length);
  } catch (err) {
    console.error(err);
  }
}
testFront();
