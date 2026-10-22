const { AuditLog } = require('../models');

const logAudit = async ({ userId = null, action, entity, entityId = null, details = null, ipAddress = null }) => {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      entity,
      entity_id: entityId ? String(entityId) : null,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ip_address: ipAddress
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};

module.exports = {
  logAudit
};
