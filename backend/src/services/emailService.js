const nodemailer = require('nodemailer');

// Ensure transporter is configured with environment variables
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

/**
 * Sends an email with a verification link for a new user account.
 * @param {string} to - The recipient email address.
 * @param {string} token - The unique verification token.
 * @param {string} userName - The name of the user for personalization.
 */
const sendVerificationEmail = async (to, token, userName) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #1E3A5F; text-align: center;">Bienvenue sur EduTrack 🎓</h2>
      <p>Bonjour ${userName || 'Utilisateur'},</p>
      <p>Merci de vous être inscrit sur EduTrack. Afin de sécuriser votre compte et de finaliser votre inscription, veuillez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #f59e0b; color: #1E3A5F; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Confirmer mon e-mail</a>
      </div>
      <p>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</p>
      <p style="word-break: break-all; color: #3b82f6;"><a href="${verificationLink}">${verificationLink}</a></p>
      <p>Ce lien expirera dans 24 heures.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Si vous n'avez pas demandé cette inscription, veuillez ignorer cet e-mail.</p>
    </div>
  `;

  try {
    const smtpUser = process.env.SMTP_USER || 'edutrack.cm@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'gxmi xnfe qusc vhgb';
    
    if (!smtpUser || !smtpPass) {
      console.warn('[EmailService] SMTP credentials not set. Simulated Email verification link:', verificationLink);
      return;
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"EduTrack Security" <${smtpUser}>`,
      to,
      subject: 'EduTrack - Confirmez votre inscription',
      html: htmlContent,
    });
    console.log('[EmailService] Verification email sent: %s', info.messageId);
  } catch (error) {
    console.error('[EmailService] Error sending verification email:', error);
  }
};

/**
 * Sends a password reset email with an OTP code.
 * @param {string} to - The recipient email address.
 * @param {string} otpCode - The 6-digit OTP code for password reset.
 * @param {string} userName - The user's name.
 */
const sendPasswordResetEmail = async (to, otpCode, userName) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
      <h2 style="color: #1E3A5F; text-align: center;">Réinitialisation de votre mot de passe</h2>
      <p>Bonjour ${userName || 'Utilisateur'},</p>
      <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte EduTrack. Voici votre code de sécurité à 6 chiffres :</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="background-color: #f1f5f9; border: 2px dashed #94a3b8; color: #0f172a; padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otpCode}</span>
      </div>
      <p>Ce code expirera dans 15 minutes.</p>
      <p>Entrez ce code sur la page de récupération pour choisir un nouveau mot de passe.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail et sécuriser votre compte.</p>
    </div>
  `;

  try {
    const smtpUser = process.env.SMTP_USER || 'edutrack.cm@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'gxmi xnfe qusc vhgb';

    if (!smtpUser || !smtpPass) {
      console.warn('[EmailService] SMTP credentials not set. Simulated OTP Code:', otpCode);
      return;
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"EduTrack Security" <${smtpUser}>`,
      to,
      subject: 'EduTrack - Réinitialisation de mot de passe',
      html: htmlContent,
    });
    console.log('[EmailService] Password reset email sent: %s', info.messageId);
  } catch (error) {
    console.error('[EmailService] Error sending password reset email:', error);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
