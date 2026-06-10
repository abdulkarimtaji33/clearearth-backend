/**
 * Parse tenants.settings — MySQL stores JSON in LONGTEXT; Sequelize may return a string.
 */
const parseTenantSettings = (raw) => {
  if (raw == null || raw === '') return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      /* ignore invalid JSON */
    }
  }
  return {};
};

/** Remove corrupted keys from an old string-spread bug when saving settings. */
const cleanTenantSettings = (raw) => {
  const settings = parseTenantSettings(raw);
  const cleaned = {};
  for (const [key, value] of Object.entries(settings)) {
    if (/^\d+$/.test(key)) continue;
    cleaned[key] = value;
  }
  return cleaned;
};

module.exports = { parseTenantSettings, cleanTenantSettings };
