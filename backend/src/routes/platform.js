const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// Middleware for Platform Users
const platformAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.platformUserId) return res.status(403).json({ message: 'Invalid platform token' });
    const user = await prisma.platformUser.findUnique({ where: { id: decoded.platformUserId } });
    if (!user) return res.status(401).json({ message: 'Invalid user' });
    req.platformUser = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const requirePlatformRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.platformUser.role)) {
    return res.status(403).json({ message: 'Access denied: insufficient permissions' });
  }
  next();
};

// POST /platform/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.platformUser.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Identifiants invalides' });

    const token = jwt.sign({ platformUserId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, referralCode: user.referralCode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /platform/influencer/dashboard
router.get('/influencer/dashboard', platformAuth, requirePlatformRole(['INFLUENCER']), async (req, res) => {
  try {
    const influencerId = req.platformUser.id;
    
    const schools = await prisma.school.findMany({
      where: { referredById: influencerId },
      select: { id: true, name: true, subscriptionPlan: true, subscriptionExpiresAt: true, createdAt: true }
    });

    const earnings = await prisma.influencerEarning.findMany({
      where: { influencerId },
      include: { school: { select: { name: true } } },
      orderBy: { date: 'desc' }
    });

    const totalEarned = earnings.reduce((sum, e) => sum + e.commission, 0);

    res.json({
      referralCode: req.platformUser.referralCode,
      schoolsCount: schools.length,
      totalEarned,
      schools,
      earnings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /platform/admin/dashboard
router.get('/admin/dashboard', platformAuth, requirePlatformRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const influencers = await prisma.platformUser.findMany({
      where: { role: 'INFLUENCER' },
      include: {
        _count: { select: { referredSchools: true } },
        earnings: true
      }
    });

    const allEarnings = await prisma.influencerEarning.findMany();
    const totalCommissions = allEarnings.reduce((sum, e) => sum + e.commission, 0);
    const totalRevenue = allEarnings.reduce((sum, e) => sum + e.amountPaid, 0);

    const influencerStats = influencers.map(inf => {
      const earned = inf.earnings.reduce((sum, e) => sum + e.commission, 0);
      return {
        id: inf.id,
        name: inf.name,
        email: inf.email,
        referralCode: inf.referralCode,
        schoolsCount: inf._count.referredSchools,
        totalEarned: earned
      };
    });

    res.json({
      totalInfluencers: influencers.length,
      totalRevenue,
      totalCommissionsPaid: totalCommissions,
      influencers: influencerStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /platform/admin/influencers
router.post('/admin/influencers', platformAuth, requirePlatformRole(['SUPER_ADMIN']), async (req, res) => {
  const { name, email, password, referralCode } = req.body;
  try {
    const existing = await prisma.platformUser.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const influencer = await prisma.platformUser.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'INFLUENCER',
        referralCode: referralCode || Math.random().toString(36).substring(2, 10).toUpperCase()
      }
    });
    res.status(201).json({ message: 'Influencer created successfully', influencer: { id: influencer.id, name: influencer.name, referralCode: influencer.referralCode } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INIT SUPER ADMIN (One-time, or protected by a setup key)
router.post('/init-super-admin', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingAdmins = await prisma.platformUser.findMany({ where: { role: 'SUPER_ADMIN' } });
    if (existingAdmins.length > 0) {
      return res.status(400).json({ message: 'Super admin already initialized.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.platformUser.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'SUPER_ADMIN'
      }
    });

    res.status(201).json({ message: 'Super Admin created successfully', email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
