/**
 * Audit trail for access-control changes (roles, permissions, per-user overrides).
 */
const db = require('../models');

/** actor: { userId, tenantId, name } — details is serialised to JSON. */
const log = async (actor = {}, { action, targetType, targetId = null, targetLabel = null, details = null }) => {
  try {
    await db.AccessAuditLog.create({
      tenant_id: actor.tenantId ?? null,
      actor_user_id: actor.userId ?? null,
      actor_name: actor.name || null,
      action,
      target_type: targetType,
      target_id: targetId,
      target_label: targetLabel,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (e) {
    // Auditing must never break the change itself
    console.error('Access audit log failed:', e.message);
  }
};

const list = async (tenantId, { targetType, targetId, page = 1, pageSize = 25 } = {}) => {
  const where = { [db.Sequelize.Op.or]: [{ tenant_id: tenantId }, { tenant_id: null }] };
  if (targetType) where.target_type = targetType;
  if (targetId) where.target_id = targetId;
  const limit = Math.min(Number(pageSize) || 25, 100);
  const offset = ((Number(page) || 1) - 1) * limit;
  const { count, rows } = await db.AccessAuditLog.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    limit,
    offset,
  });
  return {
    total: count,
    rows: rows.map((r) => {
      const plain = r.get({ plain: true });
      try { plain.details = plain.details ? JSON.parse(plain.details) : null; } catch { /* keep raw */ }
      return plain;
    }),
  };
};

module.exports = { log, list };
