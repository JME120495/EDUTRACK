const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("Error: JWT_SECRET env variable must be set to run test_endpoints.js");
  process.exit(1);
}

async function test() {
  console.log('--- Testing API Backend Queries ---');
  
  // 1. Get Parent 1 Details
  const parent = await prisma.user.findFirst({
    where: { phone: '+237670000001', role: 'PARENT' }
  });
  if (!parent) {
    console.error('Parent not found in DB!');
    return;
  }
  console.log(`Parent Found: ${parent.name} (${parent.phone})`);

  // 2. Get Children of Parent 1
  const parentChildren = await prisma.parentEleve.findMany({
    where: { parentId: parent.id },
    include: { eleve: { include: { class: true } } }
  });
  
  if (parentChildren.length === 0) {
    console.error('No children linked to parent!');
    return;
  }
  
  const firstChild = parentChildren[0].eleve;
  console.log(`First Child: ${firstChild.name} in Class ${firstChild.class.name}`);

  // 3. Generate a token for Parent 1
  const token = jwt.sign(
    { userId: parent.id, role: parent.role, schoolId: parent.schoolId, id: parent.id },
    JWT_SECRET
  );

  // 4. Test fetch function simulating API request to the new endpoint
  try {
    
    // Test bulletins for a student query-based endpoint
    console.log(`\nFetching: GET http://localhost:5000/api/bulletins?eleveId=${firstChild.id}`);
    let res = await fetch(`http://localhost:5000/api/bulletins?eleveId=${firstChild.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`Status: ${res.status}`);
    let data = await res.json();
    console.log(`Bulletins Count: ${data.length}`);
    if (data.length > 0) {
      console.log(`First Bulletin ID: ${data[0].id}, Average: ${data[0].average}`);
      console.log(`First Bulletin details (matieres):`, data[0].details.map(d => d.matiere.nameFr));
      console.log(`First Bulletin Parent link verified:`, data[0].eleve.parents[0]?.parent?.name);
      
      // Test PDF retrieval endpoint
      const pdfUrl = `http://localhost:5000/api/bulletins/${data[0].id}/pdf`;
      console.log(`\nFetching PDF: GET ${pdfUrl}`);
      let pdfRes = await fetch(pdfUrl);
      console.log(`PDF Get Status: ${pdfRes.status}`);
      console.log(`PDF Content-Type: ${pdfRes.headers.get('content-type')}`);
    } else {
      console.log('No bulletins found. Let us generate one as Director.');
      
      // Generate bulletin for class
      const directorUser = await prisma.user.findFirst({ where: { role: 'DIRECTOR' } });
      const dirToken = jwt.sign(
        { userId: directorUser.id, role: directorUser.role, schoolId: directorUser.schoolId, id: directorUser.id },
        JWT_SECRET
      );
      
      // Find active sequence
      const activeSeq = await prisma.sequence.findFirst({ where: { active: true } });
      console.log(`Active Sequence: ${activeSeq?.name}`);
      
      console.log(`\nGenerating bulletins for class ${firstChild.class.name} (${firstChild.classId}) and sequence ${activeSeq?.name}`);
      let genRes = await fetch('http://localhost:5000/api/bulletins/generate', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${dirToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: firstChild.classId,
          sequenceId: activeSeq.id
        })
      });
      console.log(`Generate Status: ${genRes.status}`);
      let genData = await genRes.json();
      console.log('Generate Response:', genData);

      // Re-fetch parent bulletins
      console.log(`\nRe-fetching: GET http://localhost:5000/api/bulletins?eleveId=${firstChild.id}`);
      res = await fetch(`http://localhost:5000/api/bulletins?eleveId=${firstChild.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      data = await res.json();
      console.log(`Bulletins Count: ${data.length}`);
      if (data.length > 0) {
        console.log(`Bulletin ID: ${data[0].id}, Average: ${data[0].average}`);
        console.log(`Parent phone is:`, data[0].eleve.parents[0]?.parent?.phone);
        
        // Test PDF retrieval endpoint
        const pdfUrl = `http://localhost:5000/api/bulletins/${data[0].id}/pdf`;
        console.log(`\nFetching PDF: GET ${pdfUrl}`);
        let pdfRes = await fetch(pdfUrl);
        console.log(`PDF Get Status: ${pdfRes.status}`);
        console.log(`PDF Content-Type: ${pdfRes.headers.get('content-type')}`);
      }
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

test().then(() => prisma.$disconnect());
