const prisma = require('../db');

/**
 * V-006 FIX: Middleware to verify a resource belongs to the user's school.
 * This prevents cross-tenant data access in a multi-school SaaS.
 * 
 * @param {string} model - Prisma model name (e.g., 'eleve', 'classe')
 * @param {string} idParam - Request parameter name containing the resource ID (default: 'id')
 * @param {string} schoolPath - Path to schoolId in the model (e.g., 'class.schoolId' for students)
 */
function ensureSchoolOwnership(model, idParam = 'id', schoolPath = 'schoolId') {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      if (!resourceId) return next();

      const include = {};
      let checkPath = schoolPath;

      // Handle nested schoolId paths (e.g., 'class.schoolId')
      if (schoolPath.includes('.')) {
        const parts = schoolPath.split('.');
        const relation = parts[0];
        include[relation] = true;
        checkPath = schoolPath;
      }

      const resource = await prisma[model].findUnique({
        where: { id: resourceId },
        include: Object.keys(include).length > 0 ? include : undefined,
      });

      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Resolve nested schoolId
      let resolvedSchoolId;
      if (schoolPath.includes('.')) {
        const parts = schoolPath.split('.');
        let current = resource;
        for (const part of parts) {
          current = current?.[part];
        }
        resolvedSchoolId = current;
      } else {
        resolvedSchoolId = resource[schoolPath];
      }

      if (resolvedSchoolId !== req.user.schoolId) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Attach the resource for reuse in the handler
      req.resource = resource;
      next();
    } catch (err) {
      console.error('[Ownership Check] Error:', err);
      return res.status(500).json({ message: 'Internal error during ownership verification' });
    }
  };
}

/**
 * V-007 FIX: Middleware to verify a parent can only access their own children's data.
 * Non-parent roles pass through without restriction.
 */
function ensureParentAccess(eleveIdParam = 'eleveId') {
  return async (req, res, next) => {
    // Non-parent roles have full access (subject to other school-level restrictions)
    if (req.user.role !== 'PARENT') return next();

    try {
      const eleveId = req.params[eleveIdParam] || req.query[eleveIdParam] || req.body?.eleveId;
      if (!eleveId) return next();

      const link = await prisma.parentEleve.findFirst({
        where: {
          parentId: req.user.id,
          eleveId: eleveId,
        },
      });

      if (!link) {
        return res.status(403).json({ message: 'Access denied: you can only view your own children\'s data' });
      }

      next();
    } catch (err) {
      console.error('[Parent Access Check] Error:', err);
      return res.status(500).json({ message: 'Internal error during access verification' });
    }
  };
}

module.exports = {
  ensureSchoolOwnership,
  ensureParentAccess,
};
