process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const prisma = require('../db');


function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

async function getImageBuffer(imageUrl) {
  try {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    }
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (e) {
    console.error('Failed to get image buffer for PDF:', e);
    return null;
  }
}

function getAppreciationText(note, lang = 'FR') {
  if (note >= 18) return lang === 'FR' ? "Excellent" : "Excellent";
  if (note >= 16) return lang === 'FR' ? "Très bien" : "Very Good";
  if (note >= 14) return lang === 'FR' ? "Bien" : "Good";
  if (note >= 12) return lang === 'FR' ? "Assez bien" : "Fairly Good";
  if (note >= 10) return lang === 'FR' ? "Passable" : "Pass";
  return lang === 'FR' ? "Insuffisant" : "Insufficient";
}

async function generateBulletinPDF(bulletinId) {
  const bulletin = await prisma.bulletin.findUnique({
    where: { id: bulletinId },
    include: {
      eleve: {
        include: {
          class: {
            include: {
              anneeScolaire: {
                include: { school: true }
              }
            }
          },
          sanctions: {
            orderBy: { date: 'desc' }
          }
        }
      },
      sequence: true,
      details: {
        include: { matiere: true }
      }
    }
  });

  if (!bulletin) throw new Error("Bulletin not found");

  const teacherAssignments = await prisma.enseignantMatiereClasse.findMany({
    where: { classId: bulletin.eleve.classId },
    include: { teacher: true }
  });
  const teacherMap = {};
  teacherAssignments.forEach(assignment => {
    teacherMap[assignment.matiereId] = assignment.teacher.name;
  });

  const studentCount = await prisma.eleve.count({
    where: { classId: bulletin.eleve.classId, status: "ACTIVE" }
  });

  const school = bulletin.eleve.class.anneeScolaire.school;
  const targetPath = path.join(__dirname, '..', '..', 'public', 'bulletins', `${bulletin.id}.pdf`);
  ensureDirectoryExistence(targetPath);

  // Fetch the school logo buffer asynchronously before rendering the PDF kit document
  const logoBuffer = await getImageBuffer(school.logo);

  // Load student photo from disk if available
  let studentPhotoPath = null;
  if (bulletin.eleve.photoUrl) {
    const photoAbsPath = path.join(__dirname, '..', '..', 'public', bulletin.eleve.photoUrl);
    if (fs.existsSync(photoAbsPath)) {
      studentPhotoPath = photoAbsPath;
    }
  }

  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    const writeStream = fs.createWriteStream(targetPath);
    doc.pipe(writeStream);

    writeStream.on('finish', () => {
      resolve(`/bulletins/${bulletin.id}.pdf`);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });



    // Color Palette from School settings
    const primaryColor = school.pdfPrimaryColor || '#1E3A5F';
    const secondaryColor = school.pdfSecondaryColor || '#F5A623';
    const lightGrey = '#F4F6F8';
    const darkGrey = '#333333';
    const showBorder = school.pdfShowBorder !== false;

    // 1. Decorative Page Border
    if (showBorder) {
      doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30)
         .lineWidth(2)
         .stroke(secondaryColor);

      doc.rect(18, 18, doc.page.width - 36, doc.page.height - 36)
         .lineWidth(1)
         .stroke(primaryColor);
    }

    // 2. School Header
    let textX = 35;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 35, 32, { fit: [45, 45] });
        textX = 90;
      } catch (err) {
        console.error('Error drawing logo in PDF:', err);
      }
    }

    doc.fillColor(primaryColor)
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(school.name.toUpperCase(), textX, 35);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(darkGrey)
       .text(`${school.address || ''} | Tél: ${school.phone || ''} | ${school.email || ''}`, textX, 52);

    // School Year / Term / Sequence Banner
    doc.fillColor(primaryColor)
       .rect(doc.page.width - 200, 32, 165, 30)
       .fill();

    const titleText = bulletin.type === 'SEQUENCE' 
      ? bulletin.sequence.name.toUpperCase() 
      : bulletin.type === 'ANNUAL'
        ? 'BULLETIN ANNUEL'
        : `TRIMESTRE ${bulletin.term}`;

    doc.fillColor('#FFFFFF')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(`ANNÉE SCOLAIRE ${bulletin.eleve.class.anneeScolaire.label}`, doc.page.width - 195, 36)
       .text(titleText, doc.page.width - 195, 48);

    doc.moveDown(2);

    // 3. Student & Class Details block (with photo)
    const studentInfoY = 90;
    const infoBlockHeight = 70;
    const photoSize = 58;
    const photoX = doc.page.width - 35 - photoSize - 10;

    doc.fillColor(lightGrey)
       .rect(35, studentInfoY, doc.page.width - 70, infoBlockHeight)
       .fill();

    // Student photo (right-aligned inside info block)
    if (studentPhotoPath) {
      try {
        // Photo border frame
        doc.save();
        doc.rect(photoX - 2, studentInfoY + 5, photoSize + 4, photoSize + 4)
           .lineWidth(1.5)
           .stroke(primaryColor);
        doc.image(studentPhotoPath, photoX, studentInfoY + 7, {
          fit: [photoSize, photoSize],
          align: 'center',
          valign: 'center'
        });
        doc.restore();
      } catch (photoErr) {
        console.error('Error drawing student photo in PDF:', photoErr);
      }
    } else {
      // Placeholder silhouette box
      doc.save();
      doc.rect(photoX - 2, studentInfoY + 5, photoSize + 4, photoSize + 4)
         .lineWidth(0.5)
         .stroke('#CCCCCC');
      doc.fillColor('#DDDDDD')
         .fontSize(8)
         .font('Helvetica')
         .text('PHOTO', photoX + 12, studentInfoY + 30);
      doc.restore();
    }

    doc.fillColor(primaryColor)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text("ÉLÈVE / STUDENT:", 45, studentInfoY + 8)
       .fillColor(darkGrey)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(bulletin.eleve.name, 45, studentInfoY + 22)
       .fontSize(9)
       .font('Helvetica')
       .text(`Matricule: ${bulletin.eleve.matricule}`, 45, studentInfoY + 38)
       .text(`Né(e) le / DOB: ${bulletin.eleve.dateOfBirth ? new Date(bulletin.eleve.dateOfBirth).toLocaleDateString() : 'N/A'}`, 45, studentInfoY + 51);

    doc.fillColor(primaryColor)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text("CLASSE / CLASS:", 280, studentInfoY + 8)
       .fillColor(darkGrey)
       .fontSize(11)
       .text(bulletin.eleve.class.name, 280, studentInfoY + 22)
       .fontSize(9)
       .font('Helvetica')
       .text(`Sexe / Gender: ${bulletin.eleve.gender || 'N/A'}`, 280, studentInfoY + 38)
       .text(`Statut / Status: ${bulletin.eleve.status}`, 280, studentInfoY + 51);

    // 4. Grades Table
    const tableTop = 175;
    const colX = {
      subject: 35,
      coeff: 215,
      note: 255,
      avg: 305,
      min: 355,
      max: 405,
      rank: 455,
      appr: 495
    };

    // Header Row
    doc.fillColor(primaryColor)
       .rect(35, tableTop, doc.page.width - 70, 22)
       .fill();

    doc.fillColor('#FFFFFF')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text("Matière / Subject", colX.subject + 5, tableTop + 7)
       .text("Coeff.", colX.coeff, tableTop + 7)
       .text("Note", colX.note, tableTop + 7)
       .text("Moy. Cl", colX.avg, tableTop + 7)
       .text("Min", colX.min, tableTop + 7)
       .text("Max", colX.max, tableTop + 7)
       .text("Rang", colX.rank, tableTop + 7)
       .text("Appréciation", colX.appr, tableTop + 7);

    let currentY = tableTop + 22;

    bulletin.details.forEach((det, idx) => {
      // Alternating row colors
      if (idx % 2 === 1) {
        doc.fillColor(lightGrey)
           .rect(35, currentY, doc.page.width - 70, 28)
           .fill();
      }

      const teacherName = teacherMap[det.matiereId] || '';

      doc.fillColor(darkGrey)
         .fontSize(8.5)
         .font('Helvetica')
         .text(det.matiere.nameFr + " / " + det.matiere.nameEn, colX.subject + 5, currentY + 5);

      if (teacherName) {
        doc.fillColor('#777777')
           .fontSize(7.5)
           .font('Helvetica-Oblique')
           .text(teacherName, colX.subject + 5, currentY + 16);
      }

      doc.fillColor(darkGrey)
         .font('Helvetica')
         .fontSize(8.5)
         .text(det.coefficient.toString(), colX.coeff, currentY + 9)
         .font('Helvetica-Bold')
         .text(det.noteValue.toFixed(2), colX.note, currentY + 9)
         .font('Helvetica')
         .text(det.classAverage ? det.classAverage.toFixed(2) : '-', colX.avg, currentY + 9)
         .text(det.minNote ? det.minNote.toFixed(2) : '-', colX.min, currentY + 9)
         .text(det.maxNote ? det.maxNote.toFixed(2) : '-', colX.max, currentY + 9)
         .text(det.rank ? `${det.rank}e` : '-', colX.rank, currentY + 9)
         .fontSize(8)
         .text(det.appreciation || '-', colX.appr, currentY + 9);

      // Draw bottom row border
      doc.lineWidth(0.5)
         .strokeColor('#DDDDDD')
         .moveTo(35, currentY + 28)
         .lineTo(doc.page.width - 35, currentY + 28)
         .stroke();

      currentY += 28;
    });

    // Outer table borders
    doc.lineWidth(1)
       .strokeColor(primaryColor)
       .rect(35, tableTop, doc.page.width - 70, currentY - tableTop)
       .stroke();

    // Vertical column lines
    const drawVerticalLine = (xPos) => {
      doc.lineWidth(0.5)
         .strokeColor('#CCCCCC')
         .moveTo(xPos, tableTop)
         .lineTo(xPos, currentY)
         .stroke();
    };

    drawVerticalLine(colX.coeff - 5);
    drawVerticalLine(colX.note - 5);
    drawVerticalLine(colX.avg - 5);
    drawVerticalLine(colX.min - 5);
    drawVerticalLine(colX.max - 5);
    drawVerticalLine(colX.rank - 5);
    drawVerticalLine(colX.appr - 5);

    doc.moveDown(1.5);
    currentY = doc.y + 10;

    // 5. Overall Results summary Box
    doc.fillColor(lightGrey)
       .rect(35, currentY, doc.page.width - 70, 75)
       .fill();

    doc.rect(35, currentY, doc.page.width - 70, 75)
       .lineWidth(1)
       .stroke(secondaryColor);

    const apprObj = getAppreciationText(bulletin.average, 'FR');
    const apprObjEn = getAppreciationText(bulletin.average, 'EN');

    doc.fillColor(primaryColor)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text("RÉSULTATS DE L'ÉLÈVE / STUDENT'S RESULTS", 45, currentY + 10);

    doc.fillColor(darkGrey)
       .fontSize(9)
       .font('Helvetica')
       .text(`MOYENNE GÉNÉRALE / GENERAL AVERAGE: `, 45, currentY + 30)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(`${bulletin.average.toFixed(2)} / 20`, 260, currentY + 29)
       .font('Helvetica')
       .fontSize(9)
       .text(`RANG DANS LA CLASSE / CLASS RANK: `, 45, currentY + 45)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text(`${bulletin.rank ? bulletin.rank + ' / ' + studentCount : 'N/A'}`, 260, currentY + 44)
       .font('Helvetica')
       .fontSize(9)
       .text(`APPRÉCIATION GÉNÉRALE / GENERAL DECISION: `, 45, currentY + 60)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(`${apprObj} - ${apprObjEn}`, 260, currentY + 59);

    // Absences on the right of results box
    doc.fillColor(darkGrey)
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(`ABSENCES:`, 390, currentY + 10)
       .font('Helvetica')
       .fontSize(8.5)
       .text(`Justifiées / Justified: ${bulletin.absencesJustified} hrs`, 390, currentY + 28)
       .text(`Non Justifiées / Unjustified: ${bulletin.absencesUnjustified} hrs`, 390, currentY + 43);

    // 6. Behavior & Discipline summary Box
    const behaviorBoxHeight = 55;
    const behaviorY = currentY + 75 + 8;
    doc.fillColor(lightGrey)
       .rect(35, behaviorY, doc.page.width - 70, behaviorBoxHeight)
       .fill();

    doc.rect(35, behaviorY, doc.page.width - 70, behaviorBoxHeight)
       .lineWidth(1)
       .stroke(primaryColor);

    doc.fillColor(primaryColor)
       .fontSize(9)
       .font('Helvetica-Bold')
       .text("CONDUITE & DISCIPLINE / CONDUCT & DISCIPLINE", 45, behaviorY + 8);

    let sanctionsList = bulletin.disciplinaryAction || '';
    if (bulletin.eleve && bulletin.eleve.sanctions && bulletin.eleve.sanctions.length > 0) {
      const dbSanctions = bulletin.eleve.sanctions.map(s => s.type.replace('_', ' ')).join(', ');
      sanctionsList = sanctionsList && sanctionsList !== 'N/A' ? sanctionsList + ' | ' + dbSanctions : dbSanctions;
    }
    if (!sanctionsList || sanctionsList === '') sanctionsList = 'Aucune / None';

    doc.fillColor(darkGrey)
       .fontSize(8)
       .font('Helvetica')
       .text(`Conduite / Conduct: `, 45, behaviorY + 22)
       .font('Helvetica-Bold')
       .text(bulletin.conduct || 'N/A', 150, behaviorY + 22)
       .font('Helvetica')
       .text(`Sanction / Disciplinary Action: `, 45, behaviorY + 36)
       .font('Helvetica-Bold')
       .text(sanctionsList, 180, behaviorY + 36);

    doc.fillColor(primaryColor)
       .fontSize(9)
       .font('Helvetica-Bold')
       .text("CONSEIL DE CLASSE / CLASS COUNCIL", 345, behaviorY + 8);

    doc.fillColor(darkGrey)
       .fontSize(8)
       .font('Helvetica')
       .text(`Décision / Decision: `, 345, behaviorY + 22)
       .font('Helvetica-Bold')
       .text(bulletin.classCouncilDecision || 'N/A', 435, behaviorY + 22);

    // 7. Signatures Grid
    const sigY = behaviorY + behaviorBoxHeight + 15;

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text("SIGNATURE DU PARENT", 45, sigY)
       .text("LE PROFESSEUR PRINCIPAL", 225, sigY)
       .text("LE DIRECTEUR / HEADMASTER", 415, sigY);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor(darkGrey)
       .text("Parent's Signature", 45, sigY + 10)
       .text("Form Teacher's Signature", 225, sigY + 10)
       .text("Director's Signature & Stamp", 415, sigY + 10);

    // Signatures placeholders box
    doc.rect(40, sigY + 25, 120, 45).lineWidth(0.5).stroke('#CCCCCC');
    doc.rect(220, sigY + 25, 120, 45).lineWidth(0.5).stroke('#CCCCCC');
    doc.rect(410, sigY + 25, 130, 45).lineWidth(0.5).stroke('#CCCCCC');

    // Automatic Signatures marks if signed
    if (bulletin.signedParent) {
      doc.font('Helvetica-Oblique').fontSize(8).text("Signé électroniquement", 50, sigY + 40);
    }
    if (bulletin.signedTeacher) {
      doc.font('Helvetica-Oblique').fontSize(8).text("Signé électroniquement", 230, sigY + 40);
    }
    if (bulletin.signedDirector) {
      doc.font('Helvetica-Oblique').fontSize(8).text("Approuvé par le Directeur", 420, sigY + 40);
    }

    doc.end();

  });
}

module.exports = {
  generateBulletinPDF,
};
