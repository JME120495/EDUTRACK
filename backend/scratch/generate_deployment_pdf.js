const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '..', '..', 'DEPLOYMENT_OFFLINE.md');
const outputPath = path.join(__dirname, '..', '..', 'DEPLOYMENT_OFFLINE.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

const markdown = fs.readFileSync(inputPath, 'utf8');
const lines = markdown.split('\n');

const PRIMARY = '#1E3A5F'; 
const SECONDARY = '#4F46E5'; 
const TEXT_DARK = '#334155'; 

doc.rect(0, 0, 595.28, 841.89).fill('#F8FAFC');
doc.rect(0, 0, 15, 841.89).fill(PRIMARY);

doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(24).text('EduTrack : Serveur Local (Intranet)', 50, 60);
doc.moveDown(1);

for (let line of lines) {
  line = line.trim();
  if (line === '' || line === '---') {
    doc.moveDown(0.5);
    continue;
  }
  
  if (line.startsWith('# ')) {
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(20).text(line.substring(2));
    doc.moveDown(0.5);
  } else if (line.startsWith('## ')) {
    doc.fillColor(SECONDARY).font('Helvetica-Bold').fontSize(16).text(line.substring(3));
    doc.moveDown(0.5);
  } else if (line.startsWith('### ')) {
    doc.fillColor(PRIMARY).font('Helvetica-Bold').fontSize(14).text(line.substring(4));
    doc.moveDown(0.3);
  } else if (line.startsWith('- ') || line.startsWith('* ')) {
    doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(11).text('  •  ' + line.substring(2));
  } else if (/^\d+\./.test(line)) {
    doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(11).text(line);
  } else {
    // Basic bolding parse
    let text = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');
    doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(11).text(text, { align: 'justify' });
  }
}

doc.end();

writeStream.on('finish', () => {
  console.log('PDF Generated successfully!');
});
