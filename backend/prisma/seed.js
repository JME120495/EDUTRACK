const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create School
  const school = await prisma.school.upsert({
    where: { id: 'saint-michel-yaounde' },
    update: {},
    create: {
      id: 'saint-michel-yaounde',
      name: 'Collège Saint-Michel de Yaoundé',
      logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=200&auto=format&fit=crop',
      defaultLanguage: 'FR',
      phone: '+237222334455',
      address: 'Nlongkak, Yaoundé, Cameroun',
      email: 'contact@saintmichel.edutrack.com'
    }
  });

  // 2. Hash default passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create Users (Director, Teachers, Parents)
  const director = await prisma.user.upsert({
    where: { email: 'director@edutrack.com' },
    update: {},
    create: {
      name: 'M. Charles Atangana',
      email: 'director@edutrack.com',
      passwordHash,
      role: 'DIRECTOR',
      phone: '+237699999999',
      language: 'FR',
      schoolId: school.id
    }
  });

  const teacher1 = await prisma.user.upsert({
    where: { email: 'jean.ndongo@edutrack.com' },
    update: {},
    create: {
      name: 'M. Jean Ndongo',
      email: 'jean.ndongo@edutrack.com',
      passwordHash,
      role: 'TEACHER',
      phone: '+237677777771',
      language: 'FR',
      schoolId: school.id
    }
  });

  const teacher2 = await prisma.user.upsert({
    where: { email: 'marie.tate@edutrack.com' },
    update: {},
    create: {
      name: 'Mme. Marie Tate',
      email: 'marie.tate@edutrack.com',
      passwordHash,
      role: 'TEACHER',
      phone: '+237677777772',
      language: 'EN',
      schoolId: school.id
    }
  });

  const teacher3 = await prisma.user.upsert({
    where: { email: 'paul.nkolo@edutrack.com' },
    update: {},
    create: {
      name: 'M. Paul Nkolo',
      email: 'paul.nkolo@edutrack.com',
      passwordHash,
      role: 'TEACHER',
      phone: '+237677777773',
      language: 'FR',
      schoolId: school.id
    }
  });

  const parent1 = await prisma.user.upsert({
    where: { email: 'parent1@edutrack.com' },
    update: {},
    create: {
      name: 'M. Henri Eyebe',
      email: 'parent1@edutrack.com',
      passwordHash,
      role: 'PARENT',
      phone: '+237670000001',
      language: 'FR',
      schoolId: school.id
    }
  });

  const parent2 = await prisma.user.upsert({
    where: { email: 'parent2@edutrack.com' },
    update: {},
    create: {
      name: 'Mme. Alice Ngo',
      email: 'parent2@edutrack.com',
      passwordHash,
      role: 'PARENT',
      phone: '+237670000002',
      language: 'FR',
      schoolId: school.id
    }
  });

  const parent3 = await prisma.user.upsert({
    where: { email: 'parent3@edutrack.com' },
    update: {},
    create: {
      name: 'Mr. David Smith',
      email: 'parent3@edutrack.com',
      passwordHash,
      role: 'PARENT',
      phone: '+237670000003',
      language: 'EN',
      schoolId: school.id
    }
  });

  // 4. Create Academic Year (2025-2026)
  const activeYear = await prisma.anneeScolaire.create({
    data: {
      schoolId: school.id,
      label: '2025-2026',
      active: true
    }
  });

  // 5. Create 6 Sequences for the active year
  const sequences = [];
  const seqDefs = [
    { name: 'Séquence 1', term: 1, active: true },
    { name: 'Séquence 2', term: 1, active: false },
    { name: 'Séquence 3', term: 2, active: false },
    { name: 'Séquence 4', term: 2, active: false },
    { name: 'Séquence 5', term: 3, active: false },
    { name: 'Séquence 6', term: 3, active: false }
  ];

  for (const s of seqDefs) {
    const sequence = await prisma.sequence.create({
      data: {
        anneeScolaireId: activeYear.id,
        name: s.name,
        term: s.term,
        active: s.active
      }
    });
    sequences.push(sequence);
  }

  // 6. Create Classes
  const classNames = ['6ème A', '5ème A', '4ème A', '3ème A', '2nde A'];
  const classes = [];
  for (const name of classNames) {
    const is3eme = name === '3ème A';
    const c = await prisma.classe.create({
      data: {
        schoolId: school.id,
        anneeScolaireId: activeYear.id,
        name,
        principalTeacherId: is3eme ? teacher3.id : null // Paul Nkolo is principal teacher for 3ème A
      }
    });
    classes.push(c);
  }

  const class3eme = classes.find(c => c.name === '3ème A');

  // 7. Create custom default Time slots (Creneaux Horaires)
  const slotsData = [
    { startTime: '08:00', endTime: '10:00', label: 'M1', order: 1 },
    { startTime: '10:00', endTime: '12:00', label: 'M2', order: 2 },
    { startTime: '12:00', endTime: '12:30', label: 'PAUSE', order: 3 },
    { startTime: '12:30', endTime: '14:30', label: 'A1', order: 4 },
    { startTime: '14:30', endTime: '16:30', label: 'A2', order: 5 }
  ];

  const slots = [];
  for (const slot of slotsData) {
    const s = await prisma.creneauHoraire.create({
      data: {
        schoolId: school.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
        order: slot.order
      }
    });
    slots.push(s);
  }

  // 8. Create Subjects (Matieres)
  const matieresData = [
    { nameFr: 'Mathématiques', nameEn: 'Mathematics', code: 'MATH', coefficient: 4.0 },
    { nameFr: 'Français', nameEn: 'French', code: 'FRAN', coefficient: 3.0 },
    { nameFr: 'Anglais', nameEn: 'English', code: 'ANGL', coefficient: 3.0 },
    { nameFr: 'Histoire-Géographie', nameEn: 'History-Geography', code: 'HIST', coefficient: 2.0 },
    { nameFr: 'Physique-Chimie', nameEn: 'Physics-Chemistry', code: 'PHYS', coefficient: 3.0 }
  ];

  const matieres = [];
  for (const m of matieresData) {
    const mat = await prisma.matiere.create({
      data: {
        schoolId: school.id,
        nameFr: m.nameFr,
        nameEn: m.nameEn,
        code: m.code,
        coefficient: m.coefficient
      }
    });
    matieres.push(mat);
  }

  const math = matieres.find(m => m.code === 'MATH');
  const french = matieres.find(m => m.code === 'FRAN');
  const english = matieres.find(m => m.code === 'ANGL');
  const history = matieres.find(m => m.code === 'HIST');
  const physics = matieres.find(m => m.code === 'PHYS');

  // 9. Assign Teachers to Subjects in 3ème A (EnseignantMatiereClasse)
  await prisma.enseignantMatiereClasse.createMany({
    data: [
      { teacherId: teacher1.id, matiereId: math.id, classId: class3eme.id },
      { teacherId: teacher1.id, matiereId: physics.id, classId: class3eme.id },
      { teacherId: teacher2.id, matiereId: french.id, classId: class3eme.id },
      { teacherId: teacher2.id, matiereId: english.id, classId: class3eme.id },
      { teacherId: teacher3.id, matiereId: history.id, classId: class3eme.id }
    ]
  });

  // 10. Configure Timetable for 3ème A
  // Lundi Matin 1: Math
  await prisma.emploiDuTemps.create({
    data: { classId: class3eme.id, teacherId: teacher1.id, matiereId: math.id, creneauId: slots[0].id, dayOfWeek: 'LUNDI', room: 'Salle 3A' }
  });
  // Lundi Matin 2: French
  await prisma.emploiDuTemps.create({
    data: { classId: class3eme.id, teacherId: teacher2.id, matiereId: french.id, creneauId: slots[1].id, dayOfWeek: 'LUNDI', room: 'Salle 3A' }
  });
  // Mardi Matin 1: Physics
  await prisma.emploiDuTemps.create({
    data: { classId: class3eme.id, teacherId: teacher1.id, matiereId: physics.id, creneauId: slots[0].id, dayOfWeek: 'MARDI', room: 'Laboratoire' }
  });
  // Mardi Matin 2: History
  await prisma.emploiDuTemps.create({
    data: { classId: class3eme.id, teacherId: teacher3.id, matiereId: history.id, creneauId: slots[1].id, dayOfWeek: 'MARDI', room: 'Salle 3A' }
  });
  // Mercredi Matin 1: English
  await prisma.emploiDuTemps.create({
    data: { classId: class3eme.id, teacherId: teacher2.id, matiereId: english.id, creneauId: slots[0].id, dayOfWeek: 'MERCREDI', room: 'Salle 3A' }
  });

  // 11. Create 30 Students, with 10 in 3ème A
  const firstNames = ['Paul', 'Jean', 'Marie', 'Sophie', 'Pierre', 'Luc', 'Henri', 'Louise', 'Anne', 'Marc', 'Alice', 'Eric', 'Thomas', 'David', 'Laura', 'Sarah', 'Julie', 'Nicolas', 'Emilie', 'Olivier', 'Chantal', 'Serge', 'Gérard', 'Véronique', 'Monique', 'Robert', 'Alain', 'Claude', 'Christian', 'Suzanne'];
  const lastNames = ['Atangana', 'Ndongo', 'Ngo', 'Eyebe', 'Nkolo', 'Mbia', 'Mbarga', 'Eboa', 'Tchante', 'Kamga', 'Fouda', 'Belinga', 'Simo', 'Fotso', 'Ekani', 'Nlate', 'Mballa', 'Biya', 'Assoumou', 'Abessolo', 'Owona', 'Nomo', 'Manga', 'Mvogo', 'Balla', 'Abena', 'Zambo', 'Talla', 'Wabo', 'Kengne'];

  const students = [];
  for (let i = 0; i < 30; i++) {
    let classIdx;
    if (i < 10) {
      classIdx = classes.indexOf(class3eme);
    } else {
      const otherClasses = classes.filter(c => c.id !== class3eme.id);
      const targetClass = otherClasses[(i - 10) % otherClasses.length];
      classIdx = classes.indexOf(targetClass);
    }
    const targetClass = classes[classIdx];

    const student = await prisma.eleve.create({
      data: {
        name: `${firstNames[i]} ${lastNames[i]}`,
        matricule: `MAT-${202600 + i}`,
        gender: i % 2 === 0 ? 'M' : 'F',
        address: 'Yaoundé',
        dateOfBirth: new Date(2011, i % 12, (i * 3) % 28 + 1),
        classId: targetClass.id,
        status: 'ACTIVE'
      }
    });
    students.push(student);
  }

  // Link Parents to students in 3ème A
  // Parent 1 -> Student 0 & Student 1
  await prisma.parentEleve.create({ data: { parentId: parent1.id, eleveId: students[0].id, relationship: 'FATHER' } });
  await prisma.parentEleve.create({ data: { parentId: parent1.id, eleveId: students[1].id, relationship: 'FATHER' } });

  // Parent 2 -> Student 2
  await prisma.parentEleve.create({ data: { parentId: parent2.id, eleveId: students[2].id, relationship: 'MOTHER' } });

  // Parent 3 -> Student 3
  await prisma.parentEleve.create({ data: { parentId: parent3.id, eleveId: students[3].id, relationship: 'FATHER' } });

  // 12. Enter grades for Séquence 1 for all 3ème A students
  // Subject Math, French, English, History, Physics
  const seq1 = sequences[0];
  const students3eme = students.filter(s => s.classId === class3eme.id);

  // Hardcode grades to guarantee realistic class statistics
  // Student 0: Paul Atangana (Excellent)
  // Student 1: Jean Ndongo (Bien)
  // Student 2: Marie Ngo (Passable)
  // Student 3: Sophie Eyebe (Insuffisant)
  const gradesMatrix = [
    [18.5, 17.0, 16.5, 19.0, 18.0], // student 0
    [15.0, 14.5, 16.0, 13.0, 15.5], // student 1
    [12.0, 11.5, 10.0, 12.5, 11.0], // student 2
    [9.0, 8.5, 9.5, 10.0, 7.5],     // student 3
    [14.0, 15.0, 13.5, 14.0, 14.5], // student 4
    [11.0, 10.0, 12.0, 9.5, 10.5],  // student 5
    [16.5, 17.5, 15.0, 16.0, 17.0], // student 6
    [8.0, 9.0, 10.0, 8.5, 9.0],     // student 7
    [13.0, 12.5, 14.0, 13.0, 12.0], // student 8
    [10.5, 11.0, 9.5, 11.0, 10.0]   // student 9
  ];

  for (let sIdx = 0; sIdx < students3eme.length; sIdx++) {
    const student = students3eme[sIdx];
    const gradesRow = gradesMatrix[sIdx];

    const subjectGrades = [
      { matiereId: math.id, teacherId: teacher1.id, value: gradesRow[0] },
      { matiereId: french.id, teacherId: teacher2.id, value: gradesRow[1] },
      { matiereId: english.id, teacherId: teacher2.id, value: gradesRow[2] },
      { matiereId: history.id, teacherId: teacher3.id, value: gradesRow[3] },
      { matiereId: physics.id, teacherId: teacher1.id, value: gradesRow[4] }
    ];

    for (const sg of subjectGrades) {
      await prisma.note.create({
        data: {
          eleveId: student.id,
          sequenceId: seq1.id,
          matiereId: sg.matiereId,
          teacherId: sg.teacherId,
          value: sg.value,
          isDraft: false // validated
        }
      });
    }
  }

  // 13. Set Tuition Fees for 3ème A and generate payments
  await prisma.fraisScolarite.create({
    data: {
      classId: class3eme.id,
      anneeScolaireId: activeYear.id,
      totalAmount: 150000.0 // 150 000 FCFA
    }
  });

  // Create payments
  // Student 0: Paid fully (150,000)
  await prisma.paiement.create({
    data: { eleveId: students3eme[0].id, amount: 100000.0, paymentMethod: 'MOBILE_MONEY', status: 'COMPLETED', transactionReference: 'TX-MM-001', payerPhone: '+237670000001', remarks: 'Tranche 1' }
  });
  await prisma.paiement.create({
    data: { eleveId: students3eme[0].id, amount: 50000.0, paymentMethod: 'WAVE', status: 'COMPLETED', transactionReference: 'TX-W-002', payerPhone: '+237670000001', remarks: 'Solde' }
  });

  // Student 1: Paid partially (100,000)
  await prisma.paiement.create({
    data: { eleveId: students3eme[1].id, amount: 100000.0, paymentMethod: 'CASH', status: 'COMPLETED', transactionReference: 'MAN-003', remarks: 'Tranche 1' }
  });

  // Student 2: Paid partially (50,000)
  await prisma.paiement.create({
    data: { eleveId: students3eme[2].id, amount: 50000.0, paymentMethod: 'BANK', status: 'COMPLETED', transactionReference: 'TX-B-004', remarks: 'Acompte' }
  });

  // Student 3: Defaulted (0 paid)
  // Student 4: Paid fully (150,000)
  await prisma.paiement.create({
    data: { eleveId: students3eme[4].id, amount: 150000.0, paymentMethod: 'MOBILE_MONEY', status: 'COMPLETED', transactionReference: 'TX-MM-005', payerPhone: '+237677777777', remarks: 'Paiement unique scolarité' }
  });

  // Student 5: Defaulted (0 paid)
  // Student 6: Paid partially (80,000)
  await prisma.paiement.create({
    data: { eleveId: students3eme[6].id, amount: 80000.0, paymentMethod: 'MOBILE_MONEY', status: 'COMPLETED', transactionReference: 'TX-MM-006' }
  });

  // Student 7: Defaulted (0 paid)

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
