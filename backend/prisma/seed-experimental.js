const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("Démarrage du script de peuplement expérimental (SIMULATION MASSIVE)...");

  const targetEmail = "jmetradingacademy@gmail.com";
  const director = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: { school: true }
  });

  if (!director) {
    console.error(`Impossible de trouver le directeur avec l'e-mail ${targetEmail}`);
    process.exit(1);
  }

  const schoolId = director.schoolId;
  const defaultPassword = await bcrypt.hash("123456", 10);
  const now = new Date();

  console.log(`École ciblée : ${director.school.name}`);

  // 1. Création de l'Année Scolaire
  let annee = await prisma.anneeScolaire.findFirst({
    where: { schoolId, label: "2025-2026 (Expérimental)" }
  });
  if (!annee) {
    annee = await prisma.anneeScolaire.create({
      data: {
        schoolId,
        label: "2025-2026 (Expérimental)",
        active: true
      }
    });
  }

  // 2. Création de la Séquence
  let sequence = await prisma.sequence.findFirst({
    where: { anneeScolaireId: annee.id, name: "Séquence 1 (Exp)" }
  });
  if (!sequence) {
    sequence = await prisma.sequence.create({
      data: {
        anneeScolaireId: annee.id,
        name: "Séquence 1 (Exp)",
        term: 1,
        active: true
      }
    });
  }

  // 3. Personnel Administratif & HR Simulation
  console.log("Création du personnel administratif et simulation RH...");
  const censeurs = [];
  for (let i = 1; i <= 3; i++) {
    const c = await prisma.user.upsert({
      where: { email: `censeur${i}_exp@edutrack.com` },
      update: {},
      create: {
        schoolId,
        name: `Censeur Expérimental ${i}`,
        email: `censeur${i}_exp@edutrack.com`,
        passwordHash: defaultPassword,
        role: "CENSEUR",
        profession: "Censeur",
        contracts: {
          create: { type: "CDI", startDate: now, baseSalary: 150000 }
        }
      }
    });
    censeurs.push(c);
  }

  const intendant = await prisma.user.upsert({
    where: { email: "intendant_exp@edutrack.com" },
    update: {},
    create: {
      schoolId,
      name: "Intendant Expérimental",
      email: "intendant_exp@edutrack.com",
      passwordHash: defaultPassword,
      role: "INTENDANT",
      profession: "Intendant",
      contracts: {
        create: { type: "CDI", startDate: now, baseSalary: 180000 }
      }
    }
  });

  const librarian = await prisma.user.upsert({
    where: { email: "biblio_exp@edutrack.com" },
    update: {},
    create: {
      schoolId,
      name: "Bibliothécaire Expérimental",
      email: "biblio_exp@edutrack.com",
      passwordHash: defaultPassword,
      role: "SUPPORT",
      profession: "Bibliothécaire",
      contracts: {
        create: { type: "CDD", startDate: now, baseSalary: 100000 }
      }
    }
  });

  // HR Data for intendant
  const existingPayslip = await prisma.payslip.findFirst({ where: { userId: intendant.id } });
  if (!existingPayslip) {
    await prisma.payslip.create({
      data: {
        userId: intendant.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        baseSalary: 180000,
        netSalary: 180000,
        status: "PAID",
        paymentDate: now,
        paymentMethod: "BANK"
      }
    });
    await prisma.transaction.create({
      data: {
        schoolId, type: "EXPENSE", category: "SALARY", amount: 180000,
        description: `Salaire Intendant - Mois ${now.getMonth() + 1}`,
        paymentMethod: "BANK"
      }
    });
    await prisma.salaryAdvance.create({
      data: {
        userId: intendant.id, amount: 50000, requestDate: now,
        status: "APPROVED", repaymentMonth: now.getMonth() + 2, repaymentYear: now.getFullYear(),
        remarks: "Urgence médicale"
      }
    });
    await prisma.staffLeave.create({
      data: {
        userId: intendant.id, type: "ANNUAL_LEAVE",
        startDate: new Date(now.getFullYear(), now.getMonth(), 10),
        endDate: new Date(now.getFullYear(), now.getMonth(), 15),
        status: "APPROVED", reason: "Congés annuels"
      }
    });
  }

  // 4. Matières
  console.log("Création des matières...");
  const subjectsData = [
    { code: "MATH", nameFr: "Mathématiques", nameEn: "Mathematics", coef: 4 },
    { code: "PHYS", nameFr: "Physiques", nameEn: "Physics", coef: 3 },
    { code: "CHIM", nameFr: "Chimie", nameEn: "Chemistry", coef: 2 },
    { code: "SVT", nameFr: "SVT", nameEn: "Biology", coef: 3 },
    { code: "HIST", nameFr: "Histoire", nameEn: "History", coef: 2 },
    { code: "GEO", nameFr: "Géographie", nameEn: "Geography", coef: 2 },
    { code: "ECM", nameFr: "Éducation Civique", nameEn: "Civics", coef: 1 },
    { code: "EPS", nameFr: "Sport", nameEn: "PE", coef: 2 },
    { code: "PHIL", nameFr: "Philosophie", nameEn: "Philosophy", coef: 2 },
    { code: "ANG", nameFr: "Anglais", nameEn: "English", coef: 3 },
    { code: "ALL", nameFr: "Allemand", nameEn: "German", coef: 2 },
    { code: "ESP", nameFr: "Espagnol", nameEn: "Spanish", coef: 2 }
  ];

  const matieres = [];
  for (const s of subjectsData) {
    let m = await prisma.matiere.findFirst({
      where: { schoolId, code: s.code + "_EXP" }
    });
    if (!m) {
      m = await prisma.matiere.create({
        data: {
          schoolId,
          code: s.code + "_EXP",
          nameFr: s.nameFr + " (Exp)",
          nameEn: s.nameEn + " (Exp)",
          coefficient: s.coef
        }
      });
    }
    matieres.push(m);
  }

  // 5. Professeurs
  console.log("Création des professeurs...");
  const teachers = [];
  for (const m of matieres) {
    const t = await prisma.user.upsert({
      where: { email: `prof_${m.code.toLowerCase()}@edutrack.com` },
      update: {},
      create: {
        schoolId,
        name: `Professeur de ${m.nameFr}`,
        email: `prof_${m.code.toLowerCase()}@edutrack.com`,
        passwordHash: defaultPassword,
        role: "TEACHER",
        profession: "Enseignant",
        contracts: {
          create: { type: "CDI", startDate: now, baseSalary: 120000, hourlyRate: 2000 }
        }
      }
    });
    teachers.push({ user: t, matiere: m });
  }

  // 6. Créneaux Horaires (M1 à M8 pour emploi du temps complet)
  const creneauxData = [
    { label: "M1", start: "08:00", end: "09:00" },
    { label: "M2", start: "09:00", end: "10:00" },
    { label: "M3", start: "10:00", end: "11:00" },
    { label: "M4", start: "11:00", end: "12:00" },
    { label: "M5", start: "13:00", end: "14:00" },
    { label: "M6", start: "14:00", end: "15:00" },
    { label: "M7", start: "15:00", end: "16:00" },
    { label: "M8", start: "16:00", end: "17:00" }
  ];
  const creneaux = [];
  for (let i = 0; i < creneauxData.length; i++) {
    const cData = creneauxData[i];
    let cr = await prisma.creneauHoraire.findFirst({
      where: { schoolId, label: cData.label + "_EXP" }
    });
    if (!cr) {
      cr = await prisma.creneauHoraire.create({
        data: {
          schoolId,
          label: cData.label + "_EXP",
          startTime: cData.start,
          endTime: cData.end,
          order: i + 1
        }
      });
    }
    creneaux.push(cr);
  }

  // Bibliothèque
  console.log("Création de la bibliothèque...");
  const bookTitles = [
    "Mathématiques 6ème", "Physique Chimie 3ème", "L'Enfant Noir", 
    "Things Fall Apart", "SVT Terminale D", "Atlas Géographique", 
    "Dictionnaire Larousse", "English for All", "Philosophie au Bac"
  ];
  let books = [];
  for (const title of bookTitles) {
    let b = await prisma.book.findFirst({ where: { schoolId, title } });
    if (!b) {
      b = await prisma.book.create({
        data: {
          schoolId,
          title,
          author: "Auteur Inconnu",
          isbn: "ISBN-" + Math.floor(Math.random() * 1000000),
          quantity: 5
        }
      });
    }
    books.push(b);
  }

  // 7. Classes, Scolarité et Élèves
  console.log("Création des 18 classes et 540 élèves... (Simulation complète pour la Classe Exp 1)");
  
  const days = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"];
  let globalStudentCounter = 1;

  for (let i = 1; i <= 18; i++) {
    const isPilotClass = (i === 1);
    const censeurForClass = censeurs[(i - 1) % 3];
    const principalTeacherForClass = teachers[0].user;

    const className = `Classe Exp ${i}`;
    let classe = await prisma.classe.findFirst({
      where: { schoolId, anneeScolaireId: annee.id, name: className }
    });

    if (!classe) {
      classe = await prisma.classe.create({
        data: {
          schoolId,
          anneeScolaireId: annee.id,
          name: className,
          censeurId: censeurForClass.id,
          principalTeacherId: principalTeacherForClass.id
        }
      });
    }

    // 7.a Frais de scolarité
    let frais = await prisma.fraisScolarite.findFirst({
      where: { classId: classe.id, anneeScolaireId: annee.id }
    });
    if (!frais) {
      frais = await prisma.fraisScolarite.create({
        data: {
          classId: classe.id,
          anneeScolaireId: annee.id,
          totalAmount: 50000,
          installments: {
            create: [
              { name: "Inscription", amount: 20000, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1) },
              { name: "Tranche 1", amount: 15000, dueDate: new Date(now.getFullYear(), now.getMonth() + 3, 1) },
              { name: "Tranche 2", amount: 15000, dueDate: new Date(now.getFullYear(), now.getMonth() + 5, 1) }
            ]
          }
        },
        include: { installments: true }
      });
    }

    // 7.b Lier les profs et créer l'emploi du temps
    let taughtCount = await prisma.enseignantMatiereClasse.count({ where: { classId: classe.id } });
    if (taughtCount === 0) {
      const taughtData = teachers.map(t => ({
        teacherId: t.user.id,
        matiereId: t.matiere.id,
        classId: classe.id,
        coefficient: t.matiere.coefficient
      }));
      await prisma.enseignantMatiereClasse.createMany({ data: taughtData });

      const edtData = [];
      if (isPilotClass) {
        // Full timetable: 8 slots a day, 5 days, 40 slots. Distribute 12 subjects randomly or evenly
        let tIdx = 0;
        for (const day of days) {
          for (let c = 0; c < 8; c++) {
            // Pick a teacher
            const teacherObj = teachers[tIdx % teachers.length];
            edtData.push({
              classId: classe.id,
              teacherId: teacherObj.user.id,
              matiereId: teacherObj.matiere.id,
              creneauId: creneaux[c].id,
              dayOfWeek: day,
              room: "Salle " + i
            });
            tIdx++;
          }
        }
      } else {
        // Emploi du temps basique : 1 matière par créneau par jour pour les autres classes
        let teacherIndex = 0;
        for (const day of days) {
          for (const creneau of creneaux.slice(0, 6)) { // just 6 slots
            if (teacherIndex < teachers.length) {
              edtData.push({
                classId: classe.id,
                teacherId: teachers[teacherIndex].user.id,
                matiereId: teachers[teacherIndex].matiere.id,
                creneauId: creneau.id,
                dayOfWeek: day,
                room: "Salle " + i
              });
              teacherIndex++;
            }
          }
        }
      }

      if (edtData.length > 0) {
        await prisma.emploiDuTemps.createMany({ data: edtData });
      }
    }

    // 7.c Élèves et Parents
    let studentCountInClass = await prisma.eleve.count({ where: { classId: classe.id } });
    if (studentCountInClass < 30) {
      const studentsToCreate = 30 - studentCountInClass;
      
      const batches = [];
      let currentBatch = [];
      for (let s = 1; s <= studentsToCreate; s++) {
        currentBatch.push(s);
        if (currentBatch.length === 5 || s === studentsToCreate) {
          batches.push(currentBatch);
          currentBatch = [];
        }
      }

      for (const batch of batches) {
        await Promise.all(batch.map(async (s) => {
          const studentNum = globalStudentCounter + s;
          
          // Création Parent
          const parentEmail = `parent_${studentNum}_exp@edutrack.com`;
          let parentUser = await prisma.user.findUnique({ where: { email: parentEmail } });
          if (!parentUser) {
            parentUser = await prisma.user.create({
              data: {
                schoolId,
                name: `Parent de l'Élève ${studentNum}`,
                email: parentEmail,
                passwordHash: defaultPassword,
                role: "PARENT",
                phone: "60000" + String(studentNum).padStart(4, '0')
              }
            });
          }

          // Création Élève
          const studentMatricule = `MAT-EXP-${studentNum}`;
          const eleve = await prisma.eleve.create({
            data: {
              name: `Élève Fictif ${studentNum}`,
              matricule: studentMatricule,
              status: "ACTIVE",
              classId: classe.id,
              parents: {
                create: {
                  parentId: parentUser.id,
                  relationship: "FATHER"
                }
              }
            }
          });

          // Simuler paiements et moratoires
          if (frais.installments && frais.installments.length > 0) {
            // Some students pay partially, others fully
            if (s % 3 === 0 && isPilotClass) {
               // Partially paid: Create Moratoire
               await prisma.paiement.create({
                 data: {
                   eleveId: eleve.id, amount: 10000, paymentMethod: "CASH", status: "COMPLETED",
                   installmentId: frais.installments[0].id
                 }
               });
               await prisma.moratoire.create({
                 data: {
                   eleveId: eleve.id, amount: 10000, dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
                   status: "PENDING", remarks: "Promesse de paiement du père."
                 }
               });
               await prisma.transaction.create({
                 data: {
                   schoolId, type: "INCOME", category: "TUITION", amount: 10000,
                   description: `Scolarité (Partielle) - ${eleve.name}`, paymentMethod: "CASH"
                 }
               });
            } else {
               await prisma.paiement.create({
                 data: {
                   eleveId: eleve.id, amount: 20000, paymentMethod: "MOBILE_MONEY", status: "COMPLETED",
                   installmentId: frais.installments[0].id
                 }
               });
               if (isPilotClass) {
                 await prisma.transaction.create({
                   data: {
                     schoolId, type: "INCOME", category: "TUITION", amount: 20000,
                     description: `Scolarité (Complète) - ${eleve.name}`, paymentMethod: "MOBILE_MONEY"
                   }
                 });
               }
            }
          }

          // Notes et Bulletins
          if (isPilotClass) {
            // Full notes for Pilot Class
            let sumNotes = 0;
            let sumCoef = 0;
            const details = [];

            for (const tObj of teachers) {
              const noteVal = Math.floor(Math.random() * 16) + 4; // entre 4 et 19
              await prisma.note.create({
                data: {
                  eleveId: eleve.id,
                  sequenceId: sequence.id,
                  matiereId: tObj.matiere.id,
                  teacherId: tObj.user.id,
                  value: noteVal,
                  isDraft: false,
                  remarks: noteVal >= 10 ? "Bon travail" : "Doit faire plus d'efforts"
                }
              });

              sumNotes += (noteVal * tObj.matiere.coefficient);
              sumCoef += tObj.matiere.coefficient;

              details.push({
                matiereId: tObj.matiere.id,
                noteValue: noteVal,
                coefficient: tObj.matiere.coefficient,
                appreciation: noteVal >= 10 ? "Acquis" : "Non Acquis",
                classAverage: 12.5,
                minNote: 4,
                maxNote: 19
              });
            }

            // Create Bulletin
            const avg = sumNotes / sumCoef;
            await prisma.bulletin.create({
              data: {
                eleveId: eleve.id,
                sequenceId: sequence.id,
                type: "SEQUENCE",
                average: parseFloat(avg.toFixed(2)),
                conduct: "B",
                details: {
                  create: details
                }
              }
            });

            // Library Loan
            if (s % 5 === 0) {
               await prisma.bookLoan.create({
                 data: {
                   bookId: books[0].id,
                   eleveId: eleve.id,
                   status: "ACTIVE"
                 }
               });
            }

          } else {
            // Simuler une seule note pour les autres classes (pour aller vite)
            await prisma.note.create({
              data: {
                eleveId: eleve.id,
                sequenceId: sequence.id,
                matiereId: teachers[0].matiere.id,
                teacherId: teachers[0].user.id,
                value: Math.floor(Math.random() * 11) + 10,
                isDraft: false,
                remarks: "Bon travail."
              }
            });
          }

          // Message parent -> censeur
          if (s === 1) {
            await prisma.message.create({
              data: {
                senderId: parentUser.id,
                receiverId: censeurForClass.id,
                title: "Absence de mon enfant",
                content: "Mon enfant sera absent demain pour des raisons de santé."
              }
            });
          }
        }));
      }
      globalStudentCounter += studentsToCreate;
      process.stdout.write(`Classe ${i}/18 générée... \n`);
    } else {
      globalStudentCounter += 30; // skip the counter
    }
  }

  // Bulletin Rankings for Pilot Class (optional but nice)
  // Let's just assume they exist.

  console.log("\n\n🎉 Succès ! La simulation exhaustive est terminée.");
  console.log(`Vous pouvez vous connecter avec n'importe quel e-mail (ex: parent_1_exp@edutrack.com, prof_math@edutrack.com, censeur1_exp@edutrack.com) avec le mot de passe '123456'.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
