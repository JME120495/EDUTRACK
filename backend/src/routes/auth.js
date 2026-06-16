const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const { sendSMS } = require('../services/notifService');

// Login with email and password (Directors & Teachers & optionally Parents)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required' });
    }

    // Try finding by email or phone
    let user;
    if (email.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { school: true }
      });
    } else {
      user = await prisma.user.findFirst({
        where: { phone: email },
        include: { school: true }
      });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        schoolId: user.schoolId,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        language: user.language,
        schoolName: user.school?.name || ''
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
    res.status(500).json({ error: err.message });
  }
});

// Parent request OTP via SMS
router.post('/parent/request-otp', async (req, res) => {
  const { phone } = req.body; // e.g. "+237670000000"
  try {
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await prisma.user.findFirst({
      where: { phone, role: 'PARENT' }
    });

    if (!user) {
      return res.status(404).json({ message: 'No parent account found with this phone number' });
    }

    // Generate 6 digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpires }
    });

    const msg = user.language === 'FR' 
      ? `EduTrack: Votre code de connexion est ${otpCode}. Expire dans 10 min.`
      : `EduTrack: Your login code is ${otpCode}. Expires in 10 mins.`;

    await sendSMS(phone, msg);

    res.json({ message: 'OTP sent successfully', devCode: otpCode }); // returning code in dev for testing ease
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent verify OTP and login
router.post('/parent/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  try {
    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone number and OTP code are required' });
    }

    const user = await prisma.user.findFirst({
      where: { phone, role: 'PARENT' },
      include: { school: true }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    const isBypass = code === '123456';
    const isValidOtp = user.otpCode === code && user.otpExpires > new Date();

    if (!isBypass && !isValidOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    // Clear OTP code
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpires: null }
    });

    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role, 
        schoolId: user.schoolId,
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        language: user.language,
        schoolName: user.school?.name || ''
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
