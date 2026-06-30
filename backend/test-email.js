const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
      user: 'edutrack.cm@gmail.com',
      pass: 'gxmi xnfe qusc vhgb',
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

async function testEmail() {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"EduTrack Security" <edutrack.cm@gmail.com>`,
      to: 'edutrack.cm@gmail.com', // send to itself
      subject: 'Test email from Antigravity',
      text: 'If you receive this, SMTP is working.'
    });
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('Email failed to send:', error);
  }
}

testEmail();
