const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://postgres.fgurqmqswwqavvutsbyy:Jmelec%40mele0n@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to Supabase via PG!');
    const res = await client.query("SELECT email, role, name FROM \"User\" WHERE name ILIKE '%Jean Essono%' OR role = 'SUPER_ADMIN' LIMIT 5");
    console.log('Users:', res.rows);
    
    // Check if there is an admin
    const adminRes = await client.query("SELECT email, role FROM \"User\" WHERE email = 'admin@edutrack.com' OR email = 'director@edutrack.com'");
    console.log('Admins:', adminRes.rows);
  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

test();
