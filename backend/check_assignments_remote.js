const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgresql://postgres.fgurqmqswwqavvutsbyy:Jmelec%40mele0n@aws-0-eu-west-1.pooler.supabase.com:6543/postgres'
  });

  try {
    await client.connect();
    
    // Find teacher assignments
    const res = await client.query(`
      SELECT "teacherId", SUM("hoursTaught") as total_hours, COUNT(*) as assignment_count
      FROM "EnseignantMatiereClasse"
      GROUP BY "teacherId"
      ORDER BY total_hours DESC
      LIMIT 5
    `);
    
    console.log('Teacher Hours in DB:');
    console.table(res.rows);
    
    // Check how many hours are 0 vs non-zero
    const countRes = await client.query(`
      SELECT 
        COUNT(CASE WHEN "hoursTaught" > 0 THEN 1 END) as non_zero_count,
        COUNT(CASE WHEN "hoursTaught" = 0 THEN 1 END) as zero_count
      FROM "EnseignantMatiereClasse"
    `);
    
    console.log('Assignment Hours Distribution:');
    console.table(countRes.rows);

  } catch (err) {
    console.error('Connection error', err.stack);
  } finally {
    await client.end();
  }
}

test();
