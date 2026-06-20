const prisma = require('../db');

/**
 * V-023 FIX: Audit logging service
 * Logs security-sensitive actions for compliance and incident investigation.
 * 
 * Usage:
 *   await auditLog(req, 'LOGIN', 'User', userId, { email });
 *   await auditLog(req, 'DELETE', 'Eleve', eleveId);
 */
async function auditLog(req, action, resource, resourceId = null, details = null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req?.user?.id || null,
        action,
        resource,
        resourceId: resourceId || null,
        details: details ? JSON.stringify(details) : null,
        ip: req?.ip || req?.headers?.['x-forwarded-for'] || null,
        userAgent: req?.headers?.['user-agent'] || null,
      },
    });
  } catch (err) {
    // Never let audit logging failure crash the application
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
}

module.exports = { auditLog };
