const jwt = require('jsonwebtoken');
const prisma = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
  process.exit(1);
}

const userCache = new Map();

async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication token missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const now = Date.now();
    let user = null;

    // Check 1-minute TTL cache to avoid N+1 DB lookups across multiple components rendering
    const cached = userCache.get(decoded.userId);
    if (cached && now - cached.timestamp < 60000) {
      user = cached.user;
    } else {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { school: true }
      });
      if (user) {
        userCache.set(decoded.userId, { user, timestamp: now });
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
}

function requirePlan(allowedPlans) {
  return (req, res, next) => {
    if (!req.user || !req.user.school || !req.user.school.subscriptionPlan) {
      return res.status(403).json({ message: 'Access denied: No subscription plan found' });
    }
    const currentPlan = req.user.school.subscriptionPlan;
    if (!allowedPlans.includes(currentPlan)) {
      return res.status(403).json({ message: `Access denied: requires one of plans ${allowedPlans.join(', ')}` });
    }
    next();
  };
}

module.exports = {
  auth,
  requireRole,
  requirePlan,
  JWT_SECRET
};
