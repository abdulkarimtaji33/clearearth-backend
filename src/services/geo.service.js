/**
 * World countries and cities for the company form (and any other address picker).
 *
 * The existing `countries` / `uae_cities` dropdown tables are kept: their values are what companies already store
 * ("UAE", "KSA", "Dubai"...), so those stay first in the lists and keep their stored value. Everything else comes
 * from the `country-state-city` dataset, loaded lazily (it is ~55 MB in memory) and cached.
 */
const db = require('../models');

let lib = null;
const geo = () => {
  if (!lib) lib = require('country-state-city');
  return lib;
};
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
// Stored values from the old dropdown that are not the country's name
const VALUE_ISO = { uae: 'AE', ksa: 'SA' };

let countryCache = null;
const cityCache = new Map();

async function dbCountries() {
  return db.Country.findAll({ where: { is_active: true }, order: [['display_order', 'ASC'], ['display_name', 'ASC']], attributes: ['value', 'display_name'] });
}

/** [{ value, display_name, iso }]: dropdown-table countries first, then every other country A to Z. */
async function listCountries() {
  if (countryCache && Date.now() - countryCache.at < 5 * 60 * 1000) return countryCache.rows;
  const { Country } = geo();
  const all = Country.getAllCountries();
  const byName = new Map(all.map((c) => [norm(c.name), c]));
  const rows = [];
  const used = new Set();
  for (const r of await dbCountries()) {
    const iso = VALUE_ISO[norm(r.value)] || byName.get(norm(r.display_name))?.isoCode || null;
    rows.push({ value: r.value, display_name: r.display_name, iso });
    if (iso) used.add(iso);
  }
  all
    .filter((c) => !used.has(c.isoCode))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((c) => rows.push({ value: c.name, display_name: c.name, iso: c.isoCode }));
  countryCache = { at: Date.now(), rows };
  return rows;
}

/** Cities for a country given by stored value, display name or ISO code. Dropdown-table cities come first. */
async function listCities(countryRef) {
  const ref = norm(countryRef);
  if (!ref) return [];
  const countries = await listCountries();
  const hit = countries.find((c) => norm(c.value) === ref || norm(c.display_name) === ref || norm(c.iso) === ref);
  const iso = hit?.iso || VALUE_ISO[ref] || null;
  if (!iso) return [];
  if (cityCache.has(iso)) return cityCache.get(iso);

  const { City } = geo();
  const libNames = new Map();
  for (const c of City.getCitiesOfCountry(iso) || []) {
    const k = norm(c.name);
    if (!libNames.has(k)) libNames.set(k, c.name);
  }
  const out = [];
  const seen = new Set();
  const push = (value) => { const k = norm(value); if (!seen.has(k)) { seen.add(k); out.push({ value, display_name: value }); } };

  // The old dropdown stores UAE and Saudi cities together; keep each city under the country it belongs to.
  if (iso === 'AE' || iso === 'SA') {
    const saNames = new Set((City.getCitiesOfCountry('SA') || []).map((c) => norm(c.name)));
    const rows = await db.UaeCity.findAll({ where: { is_active: true }, order: [['display_order', 'ASC'], ['display_name', 'ASC']], attributes: ['value'] });
    for (const r of rows) {
      const inSa = saNames.has(norm(r.value));
      if (iso === 'SA' ? inSa : !inSa) push(r.value);
    }
  }
  [...libNames.values()].sort((a, b) => a.localeCompare(b)).forEach(push);
  cityCache.set(iso, out);
  return out;
}

const clearCache = () => { countryCache = null; cityCache.clear(); };

module.exports = { listCountries, listCities, clearCache };
