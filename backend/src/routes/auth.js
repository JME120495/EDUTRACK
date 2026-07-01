const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../db');
const { JWT_SECRET, auth } = require('../middlewares/authMiddleware');
const { sendSMS } = require('../services/notifService');
const { auditLog } = require('../services/auditService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Register a new Director/Founder and create a new School
router.post('/register', async (req, res) => {
  const { 
    schoolName, address, country, phone, typeOfSchool, schoolTypes, 
    city, studentCount, currency,
    firstName, lastName, email, password, lang, ref
  } = req.body;
  try {
    if (!schoolName || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Check if referral code exists
    let referredById = null;
    if (ref) {
      const influencer = await prisma.platformUser.findUnique({ where: { referralCode: ref } });
      if (influencer && influencer.role === 'INFLUENCER') {
        referredById = influencer.id;
      }
    }

    // Create a new School
    const school = await prisma.school.create({
      data: {
        name: schoolName,
        address: address || null,
        country: country || 'Cameroun',
        currency: currency || 'XAF',
        phone: phone || null,
        sector: typeOfSchool || null,
        levels: schoolTypes ? JSON.stringify(schoolTypes) : null,
        city: city || null,
        studentCount: studentCount ? parseInt(studentCount, 10) : null,
        subscriptionPlan: 'PREMIUM', // Give premium by default for now
        referredById: referredById
      }
    });

    // Hash password and create User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await prisma.user.create({
      data: {
        schoolId: school.id,
        name: fullName,
        email,
        passwordHash,
        role: 'DIRECTOR',
        language: lang || 'FR',
        emailVerified: false,
        verificationToken,
        verificationExpires
      }
    });

    await auditLog(req, 'REGISTER', 'User', user.id, { role: user.role, schoolId: user.schoolId });
    
    // Send verification email asynchronously so it doesn't block the response
    sendVerificationEmail(email, verificationToken, user.name).catch(e => 
      console.error('[Auth] Background email sending failed:', e)
    );

    res.status(201).json({
      message: 'Inscription réussie. Veuillez vérifier votre boîte mail.',
      requiresVerification: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: school.name
      }
    });
  } catch (err) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue', error: err.message, stack: err.stack });
  }
});

// Login with email and password (Directors & Teachers & optionally Parents)
router.post('/login', async (req, res) => {
  const { email, password, schoolId } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    const cleanEmail = email.trim();

    // Try finding by email or phone
    let users = [];
    if (cleanEmail.includes('@')) {
      // NOTE: email is currently globally unique in DB, but this supports if it changes
      users = await prisma.user.findMany({
        where: { email: cleanEmail },
        include: { school: true }
      });
    } else {
      users = await prisma.user.findMany({
        where: { phone: cleanEmail },
        include: { school: true }
      });
    }

    if (users.length === 0) {
      await auditLog(req, 'LOGIN_FAILED', 'User', null, { email, reason: 'user_not_found' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Filter by matching password
    const validUsers = [];
    for (const u of users) {
      const isMatch = await bcrypt.compare(password, u.passwordHash);
      if (isMatch) validUsers.push(u);
    }

    if (validUsers.length === 0) {
      await auditLog(req, 'LOGIN_FAILED', 'User', users[0].id, { email, reason: 'wrong_password' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If multiple valid accounts but no schoolId provided, return list of schools
    if (validUsers.length > 1 && !schoolId) {
      const schools = validUsers.map(u => ({ id: u.schoolId, name: u.school.name }));
      return res.json({ action: 'SELECT_SCHOOL', schools });
    }

    let user = validUsers[0];
    if (schoolId) {
      const selected = validUsers.find(u => u.schoolId === schoolId);
      if (!selected) {
        return res.status(400).json({ message: 'Invalid school selected' });
      }
      user = selected;
    }

    // Enforced Email Verification for Directors
    if (!user.emailVerified && user.role === 'DIRECTOR') {
      return res.status(403).json({ message: 'Veuillez vérifier votre adresse e-mail avant de vous connecter.' });
    }

    // V-004 FIX: JWT payload contains only essential claims (no PII)
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        schoolId: user.schoolId,
        subscriptionPlan: user.school.subscriptionPlan || 'PREMIUM',
        name: user.name,
        schoolName: user.school.name,
        currency: user.school.currency
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await auditLog(req, 'LOGIN', 'User', user.id, { role: user.role, schoolId: user.schoolId });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        language: user.language,
        schoolId: user.schoolId,
        schoolName: user.school.name
      }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ message: 'An internal error occurred', error: err.message, stack: err.stack });
  }
});

// Parent request OTP via SMS
router.post('/parent/request-otp', async (req, res) => {
  const { phone } = req.body; // e.g. "+237670000000"
  try {
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const users = await prisma.user.findMany({
      where: { phone, role: 'PARENT' },
      include: { school: true }
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'No parent account found with this phone number' });
    }

    // Generate 6 digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.updateMany({
      where: { phone, role: 'PARENT' },
      data: { otpCode, otpExpires }
    });

    const userToMessage = users[0];
    const msg = userToMessage.language === 'FR' 
      ? `EduTrack: Votre code de connexion est ${otpCode}. Expire dans 10 min.`
      : `EduTrack: Your login code is ${otpCode}. Expires in 10 mins.`;

    await sendSMS(phone, msg);

    const schools = users.map(u => ({ id: u.schoolId, name: u.school.name }));

    // Only include OTP code in response during development OR for experimental phone numbers
    const response = { message: 'OTP sent successfully', schools };
    if (process.env.NODE_ENV === 'development' || phone.startsWith('60000')) {
      response.devCode = otpCode;
    }
    res.json(response);
  } catch (err) {
    console.error('[Auth] OTP request error:', err);
    res.status(500).json({ message: 'An internal error occurred' });
  }
});

// Parent verify OTP
router.post('/parent/verify-otp', async (req, res) => {
  const { phone, code, schoolId } = req.body;
  try {
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone number and code are required' });
    }

    let whereClause = { phone, otpCode: code, role: 'PARENT' };
    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    // findFirst will pick the first if schoolId is omitted (e.g. they only have 1 school)
    const user = await prisma.user.findFirst({
      where: whereClause,
      include: { school: true }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: 'OTP code has expired' });
    }

    // Clear OTP for ALL accounts matching this phone, since they successfully consumed it
    await prisma.user.updateMany({
      where: { phone, role: 'PARENT' },
      data: { otpCode: null, otpExpires: null }
    });

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        schoolId: user.schoolId,
        subscriptionPlan: user.school.subscriptionPlan || 'PREMIUM',
        name: user.name,
        schoolName: user.school.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await auditLog(req, 'LOGIN_OTP', 'User', user.id, { role: user.role, schoolId: user.schoolId });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        language: user.language,
        schoolId: user.schoolId,
        schoolName: user.school.name
      }
    });
  } catch (err) {
    console.error('[Auth] Verify OTP error:', err);
    res.status(500).json({ message: 'An internal error occurred' });
  }
});

// Parent fetch their linked children
router.get('/parent/children', auth, async (req, res) => {
  try {
    if (req.user.role !== 'PARENT') {
      return res.status(403).json({ message: 'Only parents can fetch their children' });
    }

    const parent = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        children: {
          include: {
            eleve: {
              include: {
                class: true
              }
            }
          }
        }
      }
    });

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    const linkedChildren = parent.children.map(c => c.eleve);
    res.json(linkedChildren);
  } catch (err) {
    console.error('[Auth] Fetch children error:', err);
    res.status(500).json({ message: 'An internal error occurred' });
  }
});

// Forgot Password - Request OTP for any user
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "L'email est requis" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Aucun compte trouvé avec cet email' });
    }

    // Generate 6 digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpires }
    });

    // Send the password reset email
    await sendPasswordResetEmail(user.email, otpCode, user.name);

    const response = { message: 'Code de réinitialisation envoyé à votre adresse e-mail' };
    if (process.env.NODE_ENV === 'development') {
      response.devCode = otpCode; // Simulated email content
    }

    res.json(response);
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue' });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  try {
    if (!token) return res.status(400).json({ message: 'Token de vérification manquant' });

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    
    if (!user) {
      return res.status(400).json({ message: 'Jeton invalide ou introuvable' });
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      return res.status(400).json({ message: 'Le lien de vérification a expiré' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null
      }
    });

    res.json({ message: 'Votre adresse e-mail a été confirmée avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (err) {
    console.error('[Auth] Verify email error:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue' });
  }
});

// Reset Password - Verify OTP and update password
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "L'email, le code et le nouveau mot de passe sont requis" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const isValidOtp = user.otpCode === code && user.otpExpires > new Date();
    if (!isValidOtp) {
      return res.status(400).json({ message: 'Code invalide ou expiré' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update user password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otpCode: null,
        otpExpires: null
      }
    });

    await auditLog(req, 'PASSWORD_RESET', 'User', user.id, { role: user.role });

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ message: 'Une erreur interne est survenue' });
  }
});

// ⚠️ TEMPORARY DEBUG ENDPOINT — Remove after fixing email issue
router.post('/test-email', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ message: 'Provide "to" email address' });
  
  const nodemailer = require('nodemailer');
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      SMTP_USER: process.env.SMTP_USER ? '✅ SET' : '❌ NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? '✅ SET' : '❌ NOT SET',
      FRONTEND_URL: process.env.FRONTEND_URL || '❌ NOT SET (will fallback to localhost)',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    }
  };

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'edutrack.cm@gmail.com',
        pass: process.env.SMTP_PASS || 'gxmi xnfe qusc vhgb',
      },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });

    // Step 1: Verify SMTP connection
    diagnostics.smtpVerify = 'testing...';
    await transporter.verify();
    diagnostics.smtpVerify = '✅ SMTP connection OK';

    // Step 2: Send test email
    const info = await transporter.sendMail({
      from: `"EduTrack Test" <${process.env.SMTP_USER || 'edutrack.cm@gmail.com'}>`,
      to,
      subject: '[TEST] EduTrack Email Diagnostic',
      html: `<h2>✅ Email fonctionne!</h2><p>Ce mail a été envoyé depuis le serveur de production à ${new Date().toISOString()}</p>`,
    });
    
    diagnostics.emailSent = '✅ SUCCESS';
    diagnostics.messageId = info.messageId;
    diagnostics.response = info.response;
    
    res.json(diagnostics);
  } catch (error) {
    diagnostics.error = error.message;
    diagnostics.errorCode = error.code;
    diagnostics.errorCommand = error.command;
    diagnostics.emailSent = '❌ FAILED';
    res.status(500).json(diagnostics);
  }
});

module.exports = router;
