const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
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

// 1. Generation of Payslip PDF
async function generatePayslipPDF(payslipId) {
  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      user: {
        include: {
          school: true,
          contracts: {
            where: { status: 'ACTIVE' },
            take: 1
          }
        }
      }
    }
  });

  if (!payslip) throw new Error('Payslip not found');

  const user = payslip.user;
  const school = user.school;
  const contract = user.contracts[0];
  const targetPath = path.join(__dirname, '..', '..', 'public', 'payslips', `${payslip.id}.pdf`);
  ensureDirectoryExistence(targetPath);

  const logoBuffer = await getImageBuffer(school.logo);
  const primaryColor = school.pdfPrimaryColor || '#1E3A5F';
  const secondaryColor = school.pdfSecondaryColor || '#F5A623';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const writeStream = fs.createWriteStream(targetPath);
    doc.pipe(writeStream);

    // Decorative page border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(1)
       .stroke(primaryColor);

    // School Logo & Header
    let textX = 40;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 40, 35, { fit: [50, 50] });
        textX = 100;
      } catch (err) {
        console.error('Logo render error:', err);
      }
    }

    doc.fillColor(primaryColor)
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(school.name.toUpperCase(), textX, 35);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#555555')
       .text(`${school.address || ''} | Tél: ${school.phone || ''} | ${school.email || ''}`, textX, 55);

    // Payslip Period Banner
    doc.fillColor(primaryColor)
       .rect(doc.page.width - 220, 35, 180, 40)
       .fill();

    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthStr = months[payslip.month - 1] || payslip.month.toString();

    doc.fillColor('#FFFFFF')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('BULLETIN DE PAIE', doc.page.width - 210, 42)
       .fontSize(9)
       .text(`Période: ${monthStr} ${payslip.year}`, doc.page.width - 210, 56);

    doc.moveDown(3);

    // Separator line
    doc.moveTo(40, 100).lineTo(doc.page.width - 40, 100).stroke('#CCCCCC');

    // Employee & Contract Info
    doc.fillColor('#F9FAFB')
       .rect(40, 110, doc.page.width - 80, 80)
       .fill();

    doc.fillColor(primaryColor)
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('INFORMATIONS SALARIÉ / EMPLOYEE DETAILS', 50, 120);

    doc.fillColor('#333333')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(`Nom complet : ${user.name}`, 50, 140)
       .font('Helvetica')
       .text(`Fonction / Rôle : ${user.role === 'TEACHER' ? 'Enseignant (Teacher)' : 'Personnel (Staff)'}`, 50, 155)
       .text(`Tél : ${user.phone || 'N/A'}`, 50, 170);

    const contractType = contract ? contract.type : 'N/A';
    const baseSalary = payslip.baseSalary;
    doc.text(`Type de Contrat : ${contractType}`, doc.page.width / 2 + 20, 140)
       .text(`Salaire de base : ${baseSalary.toLocaleString()} FCFA`, doc.page.width / 2 + 20, 155)
       .text(`Statut paiement : ${payslip.status === 'PAID' ? 'PAYÉ (PAID)' : 'EN ATTENTE (PENDING)'}`, doc.page.width / 2 + 20, 170);

    // Earnings & Deductions Table
    const tableTop = 210;
    doc.fillColor(primaryColor)
       .rect(40, tableTop, doc.page.width - 80, 20)
       .fill();

    doc.fillColor('#FFFFFF')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('DÉSIGNATION / DESCRIPTION', 50, tableTop + 6)
       .text('GAIN (EARNINGS)', doc.page.width - 250, tableTop + 6, { width: 100, align: 'right' })
       .text('RETENUE (DEDUCTIONS)', doc.page.width - 140, tableTop + 6, { width: 100, align: 'right' });

    let currentY = tableTop + 20;

    const addTableRow = (desc, gain, loss) => {
      doc.fillColor('#FFFFFF')
         .rect(40, currentY, doc.page.width - 80, 20)
         .fill();
      
      // Draw background stripe on alternating rows
      if (Math.round(currentY / 20) % 2 === 0) {
        doc.fillColor('#F9FAFB')
           .rect(40, currentY, doc.page.width - 80, 20)
           .fill();
      }

      doc.fillColor('#333333')
         .fontSize(9)
         .font('Helvetica')
         .text(desc, 50, currentY + 6)
         .text(gain > 0 ? `${gain.toLocaleString()} FCFA` : '-', doc.page.width - 250, currentY + 6, { width: 100, align: 'right' })
         .text(loss > 0 ? `${loss.toLocaleString()} FCFA` : '-', doc.page.width - 140, currentY + 6, { width: 100, align: 'right' });

      currentY += 20;
    };

    // Base salary row
    addTableRow('Salaire de base (Base Salary)', payslip.baseSalary, 0);

    // Hourly rate context (if applicable)
    if (payslip.hourlyRate > 0 && payslip.hoursWorked > 0) {
      const hourlyEarnings = payslip.hourlyRate * payslip.hoursWorked;
      addTableRow(`Heures supplémentaires / de cours (${payslip.hoursWorked}h x ${payslip.hourlyRate} FCFA)`, hourlyEarnings, 0);
    }

    // Bonuses row
    if (payslip.bonuses > 0) {
      addTableRow('Primes et indemnités (Bonuses & Allowances)', payslip.bonuses, 0);
    }

    // Standard deductions row
    if (payslip.deductions > 0) {
      addTableRow('Retenues de salaire (Deductions)', 0, payslip.deductions);
    }

    // Advances deducted row
    if (payslip.advancesDeducted > 0) {
      addTableRow('Remboursement d\'avance sur salaire', 0, payslip.advancesDeducted);
    }

    // Total calculations
    const totalEarnings = payslip.baseSalary + (payslip.hourlyRate * payslip.hoursWorked) + payslip.bonuses;
    const totalDeductions = payslip.deductions + payslip.advancesDeducted;

    // Draw bottom border of table
    doc.moveTo(40, currentY).lineTo(doc.page.width - 40, currentY).stroke('#CCCCCC');
    currentY += 10;

    // Summary Block
    doc.fillColor('#F9FAFB')
       .rect(doc.page.width - 280, currentY, 240, 70)
       .fill();

    doc.fillColor('#333333')
       .fontSize(9)
       .font('Helvetica')
       .text(`Total Brut (Gross Earnings):`, doc.page.width - 270, currentY + 10)
       .text(`${totalEarnings.toLocaleString()} FCFA`, doc.page.width - 140, currentY + 10, { width: 90, align: 'right' })
       
       .text(`Total Retenues (Total Deductions):`, doc.page.width - 270, currentY + 25)
       .text(`${totalDeductions.toLocaleString()} FCFA`, doc.page.width - 140, currentY + 25, { width: 90, align: 'right' })
       
       .fillColor(primaryColor)
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(`NET À PAYER (NET SALARY):`, doc.page.width - 270, currentY + 45)
       .text(`${payslip.netSalary.toLocaleString()} FCFA`, doc.page.width - 140, currentY + 45, { width: 90, align: 'right' });

    currentY += 90;

    // Signatures
    doc.fillColor('#333333')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('SIGNATURE DU SALARIÉ', 60, currentY)
       .text('SIGNATURE DE LA DIRECTION', doc.page.width - 200, currentY);

    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#888888')
       .text('(Précédée de la mention "Lu et approuvé")', 60, currentY + 12);

    // Footer info
    doc.fontSize(8)
       .fillColor('#999999')
       .text(`Généré électroniquement par EduTrack le ${new Date(payslip.createdAt).toLocaleDateString('fr-FR')}`, 40, doc.page.height - 50, { align: 'center' });

    doc.end();
    writeStream.on('finish', () => resolve(`/payslips/${payslip.id}.pdf`));
    writeStream.on('error', (err) => reject(err));
  });
}

// 2. Generation of ID Cards A4 Grid PDF (Students or Parents)
async function generateIDCardsPDF(schoolId, ids, type = 'student') {
  const school = await prisma.school.findUnique({
    where: { id: schoolId }
  });
  if (!school) throw new Error('School not found');

  const targetPath = path.join(__dirname, '..', '..', 'public', 'badges', `${type}s-${Date.now()}.pdf`);
  ensureDirectoryExistence(targetPath);

  const logoBuffer = await getImageBuffer(school.logo);
  const primaryColor = school.pdfPrimaryColor || '#1E3A5F';
  const secondaryColor = school.pdfSecondaryColor || '#F5A623';

  // Load students/parents
  let items = [];
  if (type === 'student') {
    items = await prisma.eleve.findMany({
      where: { id: { in: ids } },
      include: { class: true }
    });
  } else {
    items = await prisma.user.findMany({
      where: { id: { in: ids }, role: 'PARENT' },
      include: { children: { include: { eleve: { include: { class: true } } } } }
    });
  }

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const writeStream = fs.createWriteStream(targetPath);
      doc.pipe(writeStream);

      // Card Dimensions in Points (85.6mm x 53.98mm = ~242 x 153 points)
      // We widen it slightly to 250 x 165 for better layouts
      const cardWidth = 245;
      const cardHeight = 160;
      const marginX = 40;
      const marginY = 40;
      const colGap = 30;
      const rowGap = 20;

      let count = 0;
      for (const item of items) {
        if (count > 0 && count % 8 === 0) {
          doc.addPage();
        }

        const pageIndex = count % 8;
        const col = pageIndex % 2;
        const row = Math.floor(pageIndex / 2);

        const x = marginX + col * (cardWidth + colGap);
        const y = marginY + row * (cardHeight + rowGap);

        // Card Border
        doc.save();
        doc.roundedRect(x, y, cardWidth, cardHeight, 8)
           .lineWidth(1.5)
           .stroke(primaryColor);
        doc.restore();

        // Top Banner
        doc.save();
        doc.fillColor(primaryColor)
           .roundedRect(x + 1, y + 1, cardWidth - 2, 28, 7)
           .fill();
        // Fill the bottom corners of the banner so they are square
        doc.fillColor(primaryColor)
           .rect(x + 1, y + 10, cardWidth - 2, 19)
           .fill();

        // School logo inside banner
        if (logoBuffer) {
          try {
            doc.image(logoBuffer, x + 6, y + 4, { fit: [20, 20] });
          } catch (logoErr) {
            console.error('Card Logo error:', logoErr);
          }
        }

        doc.fillColor('#FFFFFF')
           .fontSize(8)
           .font('Helvetica-Bold')
           .text(school.name.toUpperCase(), x + 30, y + 7, { width: cardWidth - 40, ellipsis: true });

        doc.fontSize(6)
           .font('Helvetica')
           .text(type === 'student' ? 'CARTE SCOLAIRE' : 'CARTE D\'ACCÈS PARENT', x + 30, y + 17, { width: cardWidth - 40 });
        doc.restore();

        // Details Block
        const contentY = y + 35;
        let qrText = '';

        if (type === 'student') {
          // Photo (Left side)
          let studentPhotoPath = null;
          if (item.photoUrl) {
            const photoAbsPath = path.join(__dirname, '..', '..', 'public', item.photoUrl);
            if (fs.existsSync(photoAbsPath)) {
              studentPhotoPath = photoAbsPath;
            }
          }

          const photoX = x + 10;
          const photoY = contentY + 5;
          const photoW = 55;
          const photoH = 65;

          if (studentPhotoPath) {
            try {
              doc.save();
              doc.rect(photoX, photoY, photoW, photoH)
                 .lineWidth(1)
                 .stroke('#CCCCCC');
              doc.image(studentPhotoPath, photoX + 1, photoY + 1, {
                fit: [photoW - 2, photoH - 2],
                align: 'center',
                valign: 'center'
              });
              doc.restore();
            } catch (err) {
              console.error('Draw Student Card Photo error:', err);
            }
          } else {
            // Silhouette box placeholder
            doc.save();
            doc.rect(photoX, photoY, photoW, photoH)
               .lineWidth(1)
               .stroke('#DDDDDD');
            doc.fillColor('#EEEEEE')
               .rect(photoX + 1, photoY + 1, photoW - 2, photoH - 2)
               .fill();
            doc.fillColor('#999999')
               .fontSize(6)
               .font('Helvetica')
               .text('PHOTO', photoX + 16, photoY + 28);
            doc.restore();
          }

          // Student name, matricule, class (Middle side)
          doc.fillColor('#333333')
             .fontSize(8)
             .font('Helvetica-Bold')
             .text(item.name.toUpperCase(), x + 72, contentY + 5, { width: cardWidth - 140, height: 20, ellipsis: true })
             
             .font('Helvetica')
             .fontSize(7)
             .fillColor('#666666')
             .text(`Matricule : `, x + 72, contentY + 25)
             .font('Helvetica-Bold')
             .fillColor('#333333')
             .text(item.matricule, x + 112, contentY + 25)
             
             .font('Helvetica')
             .fillColor('#666666')
             .text(`Classe : `, x + 72, contentY + 37)
             .font('Helvetica-Bold')
             .fillColor('#333333')
             .text(item.class.name, x + 105, contentY + 37);

          qrText = `STUDENT:${item.id}:${item.matricule}`;
        } else {
          // Parent Card Details
          doc.fillColor('#333333')
             .fontSize(8)
             .font('Helvetica-Bold')
             .text(item.name.toUpperCase(), x + 10, contentY + 5, { width: cardWidth - 85, height: 20, ellipsis: true })
             
             .font('Helvetica')
             .fontSize(7)
             .fillColor('#666666')
             .text(`Tél : `, x + 10, contentY + 25)
             .font('Helvetica-Bold')
             .fillColor('#333333')
             .text(item.phone || 'N/A', x + 35, contentY + 25);

          // Render children details
          const childrenList = item.children || [];
          doc.font('Helvetica')
             .fontSize(6)
             .fillColor('#777777')
             .text('ÉLÈVES ASSOCIÉS / CHILDREN:', x + 10, contentY + 38);

          let childY = contentY + 47;
          childrenList.slice(0, 3).forEach(c => {
            const student = c.eleve;
            doc.font('Helvetica-Bold')
               .fontSize(6)
               .fillColor('#333333')
               .text(`- ${student.name} (${student.class.name})`, x + 12, childY, { width: cardWidth - 85, ellipsis: true });
            childY += 10;
          });

          qrText = `PARENT:${item.id}:${item.phone || ''}`;
        }

        // Draw QR Code on the bottom-right corner of card
        const qrSize = 50;
        const qrX = x + cardWidth - qrSize - 10;
        const qrY = y + cardHeight - qrSize - 10;

        try {
          const qrBuffer = await QRCode.toBuffer(qrText, { margin: 1, width: qrSize * 2 });
          doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
        } catch (qrErr) {
          console.error('Draw QR Code error:', qrErr);
        }

        // Card Footer Bar
        doc.save();
        doc.fillColor(secondaryColor)
           .rect(x + 1, y + cardHeight - 8, cardWidth - 2, 7)
           .fill();
        doc.restore();

        count++;
      }

      doc.end();
      writeStream.on('finish', () => resolve(`/badges/${path.basename(targetPath)}`));
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// 3. Generation of Custom Certificate/Attestation PDF
async function generateCertificatePDF(templateId, studentId, customContent) {
  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
    include: { school: true }
  });
  if (!template) throw new Error('Template not found');

  const student = await prisma.eleve.findUnique({
    where: { id: studentId },
    include: { class: { include: { anneeScolaire: true } } }
  });
  if (!student) throw new Error('Student not found');

  const school = template.school;
  const targetPath = path.join(__dirname, '..', '..', 'public', 'certificates', `cert-${student.id}-${Date.now()}.pdf`);
  ensureDirectoryExistence(targetPath);

  const logoBuffer = await getImageBuffer(school.logo);
  const primaryColor = school.pdfPrimaryColor || '#1E3A5F';
  const secondaryColor = school.pdfSecondaryColor || '#F5A623';

  // Replace variables in templates
  let text = customContent || template.content;
  const birthDateStr = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('fr-FR') : 'N/A';
  
  text = text
    .replace(/{NOM_ELEVE}/g, student.name.toUpperCase())
    .replace(/{CLASSE}/g, student.class.name)
    .replace(/{MATRICULE}/g, student.matricule)
    .replace(/{DATE_NAISSANCE}/g, birthDateStr)
    .replace(/{ANNEE_SCOLAIRE}/g, student.class.anneeScolaire.label)
    .replace(/{DATE_JOUR}/g, new Date().toLocaleDateString('fr-FR'));

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const writeStream = fs.createWriteStream(targetPath);
    doc.pipe(writeStream);

    // Elegant certificate border
    doc.save()
       .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .stroke(primaryColor);
    doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
       .lineWidth(1)
       .stroke(secondaryColor);
    doc.restore();

    // School Header
    let textX = 50;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 45, { fit: [60, 60] });
        textX = 125;
      } catch (err) {
        console.error('Logo render error:', err);
      }
    }

    doc.fillColor(primaryColor)
       .fontSize(18)
       .font('Helvetica-Bold')
       .text(school.name.toUpperCase(), textX, 45);

    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#555555')
       .text(`${school.address || ''} | Tél: ${school.phone || ''} | ${school.email || ''}`, textX, 68);

    doc.moveDown(4);

    // Decorative line
    doc.save()
       .moveTo(50, 130)
       .lineTo(doc.page.width - 50, 130)
       .lineWidth(1.5)
       .stroke(secondaryColor);
    doc.restore();

    // Certificate Title
    doc.fillColor(primaryColor)
       .fontSize(22)
       .font('Helvetica-Bold')
       .text(template.title.toUpperCase(), 50, 160, { align: 'center' });

    doc.moveDown(3);

    // Certificate content
    doc.fillColor('#333333')
       .fontSize(12)
       .font('Helvetica')
       .text(text, 60, 230, {
         align: 'justify',
         lineGap: 8,
         width: doc.page.width - 120
       });

    // Date and Signatures block
    const dateY = doc.page.height - 180;
    doc.fillColor('#333333')
       .fontSize(10)
       .font('Helvetica-Oblique')
       .text(`Fait à ${school.address?.split(',')[0] || 'Yaoundé'}, le ${new Date().toLocaleDateString('fr-FR')}`, 60, dateY, { align: 'right' });

    doc.font('Helvetica-Bold')
       .text('Le Directeur / The Principal', 60, dateY + 30, { align: 'right' });

    // Footer decoration
    doc.fontSize(8)
       .fillColor('#999999')
       .text('Document officiel délivré par EduTrack. Toute falsification est passible de poursuites judiciaires.', 50, doc.page.height - 45, { align: 'center' });

    doc.end();
    writeStream.on('finish', () => resolve(`/certificates/${path.basename(targetPath)}`));
    writeStream.on('error', (err) => reject(err));
  });
}

module.exports = {
  generatePayslipPDF,
  generateIDCardsPDF,
  generateCertificatePDF
};
