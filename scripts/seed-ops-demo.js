/**
 * Seed demo data for the Operations mobile app (local/dev only).
 *
 *   node scripts/seed-ops-demo.js            # create (idempotent)
 *   node scripts/seed-ops-demo.js --cleanup  # remove everything this script created
 *
 * Everything created is tagged "[OPS-DEMO]" (work orders, notes, notifications) or uses the
 * @clearearth.test email domain (users). The only pre-existing rows touched are approved
 * quotations / purchase orders whose pickup-date fields are set; their ids and original values
 * are stored in scripts/.seed-ops-demo.manifest.json so --cleanup can restore them.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/models');
const { hashPassword } = require('../src/utils/helpers');

const TAG = '[OPS-DEMO]';
const TENANT_ID = parseInt(process.env.SEED_TENANT_ID || '2', 10);
const PASSWORD = 'Ops@12345';
const MANIFEST = path.join(__dirname, '.seed-ops-demo.manifest.json');
const q = async (sql, replacements = []) => (await db.sequelize.query(sql, { replacements }))[0];

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

async function cleanup() {
  const wos = await q('SELECT id FROM work_orders WHERE tenant_id = ? AND title LIKE ?', [TENANT_ID, `${TAG}%`]);
  const woIds = wos.map((w) => w.id);
  if (woIds.length) {
    const marks = woIds.map(() => '?').join(',');
    const grns = await q(`SELECT id FROM grns WHERE work_order_id IN (${marks})`, woIds);
    const grnIds = grns.map((g) => g.id);
    if (grnIds.length) {
      const gm = grnIds.map(() => '?').join(',');
      await q(`DELETE gi FROM grn_images gi JOIN grn_items i ON i.id = gi.grn_item_id WHERE i.grn_id IN (${gm})`, grnIds);
      await q(`DELETE FROM grn_items WHERE grn_id IN (${gm})`, grnIds);
      await q(`DELETE FROM grns WHERE id IN (${gm})`, grnIds);
    }
    await q(`DELETE e FROM work_order_task_expenses e JOIN work_order_tasks t ON t.id = e.work_order_task_id WHERE t.work_order_id IN (${marks})`, woIds);
    await q(`DELETE a FROM work_order_task_assignees a JOIN work_order_tasks t ON t.id = a.task_id WHERE t.work_order_id IN (${marks})`, woIds);
    await q(`DELETE FROM work_order_tasks WHERE work_order_id IN (${marks})`, woIds);
    await q(`DELETE FROM work_orders WHERE id IN (${marks})`, woIds);
  }
  await q('DELETE FROM notifications WHERE tenant_id = ? AND title LIKE ?', [TENANT_ID, `${TAG}%`]);

  if (fs.existsSync(MANIFEST)) {
    const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
    for (const r of m.quotations || []) {
      await q('UPDATE quotations SET requested_pickup_date = ?, pickup_date_status = ?, confirmed_pickup_date = ?, pickup_reschedule_note = ? WHERE id = ?',
        [r.requested_pickup_date, r.pickup_date_status, r.confirmed_pickup_date, r.pickup_reschedule_note, r.id]);
    }
    for (const r of m.purchaseOrders || []) {
      await q('UPDATE purchase_orders SET requested_pickup_date = ?, pickup_date_status = ?, confirmed_pickup_date = ?, pickup_reschedule_note = ? WHERE id = ?',
        [r.requested_pickup_date, r.pickup_date_status, r.confirmed_pickup_date, r.pickup_reschedule_note, r.id]);
    }
    fs.unlinkSync(MANIFEST);
  }
  await q('DELETE FROM users WHERE tenant_id = ? AND email LIKE ?', [TENANT_ID, '%@clearearth.test']);
  console.log('Cleanup done.');
}

async function ensureUser({ email, first, last, roleName, phone }) {
  const [existing] = await q('SELECT id FROM users WHERE email = ? AND tenant_id = ?', [email, TENANT_ID]);
  if (existing) return existing.id;
  const [role] = await q('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);
  const user = await db.User.create({
    tenant_id: TENANT_ID,
    role_id: role.id,
    username: email.split('@')[0],
    email,
    password: await hashPassword(PASSWORD),
    first_name: first,
    last_name: last,
    phone: phone || null,
    status: 'active',
  });
  return user.id;
}

async function main() {
  if (process.argv.includes('--cleanup')) return cleanup();
  if ((await q('SELECT id FROM work_orders WHERE tenant_id = ? AND title LIKE ? LIMIT 1', [TENANT_ID, `${TAG}%`])).length) {
    console.log('Demo data already present. Run with --cleanup first to reseed.');
    return;
  }

  const opsId = await ensureUser({ email: 'ops.demo@clearearth.test', first: 'Omar', last: 'Haddad', roleName: 'operations_manager', phone: '+971501110001' });
  const drivers = [
    await ensureUser({ email: 'driver.khalid@clearearth.test', first: 'Khalid', last: 'Rahman', roleName: 'driver', phone: '+971501110002' }),
    await ensureUser({ email: 'driver.sanjay@clearearth.test', first: 'Sanjay', last: 'Nair', roleName: 'driver', phone: '+971501110003' }),
    await ensureUser({ email: 'driver.yusuf@clearearth.test', first: 'Yusuf', last: 'Ali', roleName: 'driver', phone: '+971501110004' }),
  ];

  const workTypes = Object.fromEntries((await q('SELECT id, name FROM work_types WHERE tenant_id = ?', [TENANT_ID])).map((w) => [w.name, w.id]));
  const T = (name) => ({ type: name, id: workTypes[name] || null });

  // Approved service quotations (none have work orders yet). Use the first 12 for WOs; the rest for pickup states.
  const quotes = await q("SELECT id, deal_id, requested_pickup_date, pickup_date_status, confirmed_pickup_date, pickup_reschedule_note FROM quotations WHERE tenant_id = ? AND status = 'approved' ORDER BY id", [TENANT_ID]);
  const pos = await q("SELECT id, deal_id, requested_pickup_date, pickup_date_status, confirmed_pickup_date, pickup_reschedule_note FROM purchase_orders WHERE tenant_id = ? AND status = 'approved' AND document_type = 'quotation' AND company_id IS NOT NULL ORDER BY id", [TENANT_ID]);
  const manifest = { quotations: [], purchaseOrders: [] };

  // Pickup-date states on orders that will stay WO-less (the tail of each list).
  const pickupPlan = [
    ['quotations', quotes.slice(12, 15), ['pending', 'pending', 'reschedule_requested']],
    ['purchase_orders', pos.slice(3, 6), ['pending', 'confirmed', 'pending']],
  ];
  for (const [table, rows, states] of pickupPlan) {
    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      manifest[table === 'quotations' ? 'quotations' : 'purchaseOrders'].push(r);
      const requested = day(2 + i);
      const state = states[i];
      await q(`UPDATE ${table} SET requested_pickup_date = ?, pickup_date_status = ?, confirmed_pickup_date = ?, pickup_reschedule_note = ? WHERE id = ?`, [
        requested, state, state === 'confirmed' ? requested : null, state === 'reschedule_requested' ? 'Client site closed that day, can we do the day after?' : null, r.id,
      ]);
    }
  }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  // Work orders: [source, status, title, tasks]
  // task: [workType, assignee idx|null, status, startOffset, endOffset, notes]
  const scenarios = [
    ['q', 'in_progress', 'Hard drive destruction, DIFC', [[T('Pickup'), 0, 'completed', -3, -3], [T('Destruction of material'), 1, 'in_progress', -1, 0], [T('Delivery'), 2, 'not_started', 1, 2]]],
    ['q', 'in_progress', 'E-waste collection, Jebel Ali', [[T('Pickup'), 0, 'in_progress', 0, 0, 'Gate pass needed at Gate 4'], [T('Municipality Inspection'), null, 'not_started', 1, 1], [T('Delivery'), null, 'not_started', 2, 3]]],
    ['q', 'in_progress', 'Confidential paper shredding, Business Bay', [[T('Pickup'), 1, 'completed', -6, -6], [T('Destruction of material'), 1, 'not_started', -4, -2, 'Overdue: waiting on witness'], [T('Delivery'), 2, 'not_started', -1, -1]]],
    ['q', 'new', 'Battery recycling, Al Quoz', [[T('Pickup'), null, 'not_started', 2, 2], [T('Delivery'), null, 'not_started', 3, 3]]],
    ['q', 'new', 'Copper cable scrap, Sharjah', [[T('Pickup'), 2, 'not_started', 0, 0], [T('Delivery'), 2, 'not_started', 1, 1]]],
    ['q', 'new', 'Server decommission, Media City', [[T('Pickup'), 0, 'not_started', 4, 4], [T('Destruction of material'), null, 'not_started', 5, 6]]],
    ['q', 'new', 'Medical waste pickup, Healthcare City', [[T('Pickup'), null, 'not_started', 0, 1, 'Needs special container']]],
    ['q', 'completed', 'Plastic scrap, Ajman', [[T('Pickup'), 1, 'completed', -10, -10], [T('Delivery'), 1, 'completed', -9, -9]]],
    ['q', 'completed', 'Metal turnings, Ras Al Khor', [[T('Pickup'), 0, 'completed', -12, -12], [T('Destruction of material'), 0, 'completed', -11, -11], [T('Delivery'), 2, 'completed', -10, -10]]],
    ['q', 'completed', 'Used oil drums, Jebel Ali', [[T('Pickup'), 2, 'completed', -8, -8], [T('Delivery'), 2, 'completed', -7, -7]]],
    ['q', 'cancelled', 'Cancelled pickup, Dubai South', [[T('Pickup'), null, 'not_started', 1, 1]]],
    ['p', 'in_progress', 'Vendor scrap lot, Industrial Area', [[T('Pickup'), 1, 'in_progress', 0, 1], [T('Delivery'), null, 'not_started', 2, 2]]],
    ['p', 'new', 'Client PO: aluminium offcuts', [[T('Pickup'), null, 'not_started', 1, 1]]],
    ['p', 'new', 'Client PO: office electronics', [[T('Pickup'), 0, 'not_started', 2, 2], [T('Delivery'), 0, 'not_started', 3, 3]]],
    ['p', 'completed', 'Client PO: server racks', [[T('Pickup'), 1, 'completed', -5, -5], [T('Delivery'), 1, 'completed', -4, -4]]],
  ];

  const completedWoIds = [];
  const woIds = [];
  let qi = 0;
  let pi = 0;
  for (const [src, status, title, tasks] of scenarios) {
    let quotationId = null; let purchaseOrderId = null; let dealId = null;
    if (src === 'q') {
      const row = quotes[qi]; qi += 1;
      if (!row) continue;
      quotationId = row.id; dealId = row.deal_id;
    } else {
      const row = pos[pi]; pi += 1;
      if (!row) continue;
      purchaseOrderId = row.id; dealId = row.deal_id;
    }
    const [res] = await db.sequelize.query(
      'INSERT INTO work_orders (tenant_id, deal_id, quotation_id, purchase_order_id, title, notes, status, created_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())',
      { replacements: [TENANT_ID, dealId, quotationId, purchaseOrderId, `${TAG} ${title}`, `${TAG} seeded for the Operations app`, status, opsId] }
    );
    const woId = res;
    woIds.push(woId);
    if (status === 'completed') completedWoIds.push(woId);
    for (let i = 0; i < tasks.length; i += 1) {
      const [wt, assigneeIdx, tStatus, s, e, notes] = tasks[i];
      const assignee = assigneeIdx == null ? null : drivers[assigneeIdx];
      const [taskId] = await db.sequelize.query(
        'INSERT INTO work_order_tasks (work_order_id, type_of_work, work_type_id, assigned_to, status, start_date, end_date, notes, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())',
        { replacements: [woId, wt.type, wt.id, assignee, tStatus, day(s), day(e), notes || null, i] }
      );
      if (assignee) {
        await db.sequelize.query('INSERT IGNORE INTO work_order_task_assignees (task_id, user_id, created_at, updated_at) VALUES (?,?,NOW(),NOW())', { replacements: [taskId, assignee] });
      }
      if (wt.type === 'Pickup' && tStatus === 'completed') {
        await db.sequelize.query(
          'INSERT INTO work_order_task_expenses (work_order_task_id, description, amount, sort_order, accounts_status, created_at, updated_at) VALUES (?,?,?,?,?,NOW(),NOW())',
          { replacements: [taskId, 'Fuel and tolls', 85, 0, 'pending'] }
        );
      }
    }
  }

  // GRNs for completed work orders: new / submitted / approved
  const materialTypes = await q('SELECT id FROM material_types ORDER BY id LIMIT 4');
  const grnStatuses = ['new', 'submitted', 'approved', 'submitted'];
  for (let i = 0; i < completedWoIds.length && i < grnStatuses.length; i += 1) {
    const woId = completedWoIds[i];
    const [wo] = await q('SELECT deal_id FROM work_orders WHERE id = ?', [woId]);
    const num = `GRN-DEMO-${String(i + 1).padStart(4, '0')}`;
    const [grnId] = await db.sequelize.query(
      'INSERT INTO grns (tenant_id, grn_number, work_order_id, deal_id, status, notes, created_by, approved_by, approved_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())',
      { replacements: [TENANT_ID, num, woId, wo.deal_id, grnStatuses[i], `${TAG} received at warehouse`, opsId, grnStatuses[i] === 'approved' ? opsId : null, grnStatuses[i] === 'approved' ? new Date() : null] }
    );
    const itemCount = 2 + (i % 2);
    for (let k = 0; k < itemCount; k += 1) {
      const mt = materialTypes[(i + k) % Math.max(materialTypes.length, 1)];
      await db.sequelize.query(
        'INSERT INTO grn_items (grn_id, item_name, material_type_id, quantity, unit_of_measure, make, model, serial_number, units, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
        { replacements: [grnId, ['Hard drives', 'Server chassis', 'Lead-acid batteries', 'Copper cable'][(i + k) % 4], mt?.id || null, 120 + i * 35 + k * 15, k % 2 ? 'pcs' : 'kg', k % 2 ? 'Dell' : null, k % 2 ? 'R740' : null, k % 2 ? `SN-${1000 + i * 10 + k}` : null, k % 2 ? 4 + k : null, null] }
      );
    }
    if (grnStatuses[i] === 'approved') {
      for (const it of await q('SELECT material_type_id, quantity, unit_of_measure FROM grn_items WHERE grn_id = ? AND material_type_id IS NOT NULL', [grnId])) {
        const [inv] = await q('SELECT id FROM inventory WHERE tenant_id = ? AND material_type_id = ? AND deleted_at IS NULL LIMIT 1', [TENANT_ID, it.material_type_id]);
        if (inv) await q('UPDATE inventory SET total_quantity = total_quantity + ?, last_updated = NOW() WHERE id = ?', [it.quantity, inv.id]);
        else await q('INSERT INTO inventory (tenant_id, warehouse_id, material_type_id, total_quantity, unit_of_measure, total_value, last_updated, created_at, updated_at) VALUES (?,1,?,?,?,0,NOW(),NOW(),NOW())', [TENANT_ID, it.material_type_id, it.quantity, it.unit_of_measure || 'kg']);
      }
    }
  }

  // Notifications for the demo ops user
  const notes = [
    ['grn_submitted', 'GRN submitted', 'GRN-DEMO-0002 was submitted for review.', 'grn'],
    ['expense_submitted', 'Expense submitted', 'A pickup expense of AED 85 needs approval.', 'work_order'],
    ['pickup_date_scheduled', 'Pickup date scheduled', 'Sales requested a pickup date for a new order.', 'quotation'],
    ['quotation_approved', 'Service order approved', 'A service order is ready for a work order.', 'quotation'],
  ];
  for (let i = 0; i < notes.length; i += 1) {
    const [type, title, message, entityType] = notes[i];
    await q('INSERT INTO notifications (tenant_id, user_id, type, title, message, entity_type, entity_id, is_read, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,NOW() - INTERVAL ? HOUR, NOW())',
      [TENANT_ID, opsId, type, `${TAG} ${title}`, message, entityType, woIds[i] || null, i > 2 ? 1 : 0, i * 5]);
  }

  console.log(`Seeded ${woIds.length} work orders, ${Math.min(completedWoIds.length, grnStatuses.length)} GRNs.`);
  console.log(`QA login: ops.demo@clearearth.test / ${PASSWORD}  (tenant ${TENANT_ID})`);
}

main().then(() => process.exit(0)).catch((e) => { console.error('Seed failed:', e.message); process.exit(1); });
