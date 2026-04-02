const { AuditLog } = require('../models');

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const logEntry = {
          user_id: req.user ? req.user.id : null,
          username: req.user ? req.user.username : 'anonymous',
          action,
          entity,
          entity_id: data?.id || req.params?.id || null,
          details: {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
          },
          ip_address: req.ip || req.connection?.remoteAddress,
        };

        // Fire and forget - don't block the response
        AuditLog.create(logEntry).catch((err) => {
          console.error('Audit log error:', err.message);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = auditLog;
