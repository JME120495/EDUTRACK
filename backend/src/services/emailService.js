/**
 * EduTrack Email Service
 * Uses Brevo (Sendinblue) HTTP API instead of SMTP to avoid port blocking on Render.
 * Brevo free tier: 300 emails/day.
 * 
 * Required env var: BREVO_API_KEY
 * Optional env var: FRONTEND_URL (defaults to http://localhost:5173)
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Low-level function to send an email via Brevo HTTP API.
 * @param {object} options - { to, subject, html, senderName }
 */
const sendEmailViaBrevo = async ({ to, subject, html, senderName = 'EduTrack' }) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn('[EmailService] ⚠️ BREVO_API_KEY not set. Email NOT sent. Subject:', subject, '| To:', to);
    return null;
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: 'edutrack.cm@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || JSON.stringify(data);
    console.error('[EmailService] ❌ Brevo API error:', response.status, errorMsg);
    throw new Error(`Brevo email failed (${response.status}): ${errorMsg}`);
  }

  console.log('[EmailService] ✅ Email sent via Brevo. MessageId:', data.messageId, '| To:', to);
  return data;
};

/**
 * Sends an email with a verification link for a new user account.
 * @param {string} to - The recipient email address.
 * @param {string} token - The unique verification token.
 * @param {string} userName - The name of the user for personalization.
 */
const sendVerificationEmail = async (to, token, userName) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

  console.log('[EmailService] Preparing verification email for:', to);
  console.log('[EmailService] FRONTEND_URL resolved to:', frontendUrl);
  console.log('[EmailService] Verification link:', verificationLink);

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
    await sendEmailViaBrevo({
      to,
      subject: 'EduTrack - Confirmez votre inscription',
      html: htmlContent,
      senderName: 'EduTrack Security',
    });
  } catch (error) {
    console.error('[EmailService] ❌ FAILED to send verification email to', to, ':', error.message);
    throw error;
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
    await sendEmailViaBrevo({
      to,
      subject: 'EduTrack - Réinitialisation de mot de passe',
      html: htmlContent,
      senderName: 'EduTrack Security',
    });
  } catch (error) {
    console.error('[EmailService] ❌ FAILED to send password reset email to', to, ':', error.message);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
