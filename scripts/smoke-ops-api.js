/**
 * Smoke test for the endpoints the Operations mobile app uses.
 *   node scripts/smoke-ops-api.js [baseUrl] [email] [password]
 * Requires a running backend and the data from scripts/seed-ops-demo.js.
 * Mutating checks only touch rows tagged [OPS-DEMO].
 */
const BASE = process.argv[2] || 'http://localhost:3000/api/v1';
const EMAIL = process.argv[3] || 'ops.demo@clearearth.test';
const PASSWORD = process.argv[4] || 'Ops@12345';

let token = null;
let passed = 0;
const failures = [];

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-json */ }
  return { status: res.status, json };
}

async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failures.push(name);
    console.log(`  FAIL ${name}: ${e.message}`);
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

async function main() {
  console.log(`Smoke: ${BASE} as ${EMAIL}`);
  await check('login', async () => {
    const r = await call('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
    expect(r.status === 200, `status ${r.status}`);
    token = r.json.data.accessToken;
    expect(r.json.data.user.role === 'operations_manager', `role ${r.json.data.user.role}`);
  });
  if (!token) process.exit(1);

  await check('auth/me has permissions', async () => {
    const r = await call('GET', '/auth/me');
    expect(r.status === 200 && Array.isArray(r.json.data.permissions), 'no permissions array');
  });

  await check('dashboard overview (+B4 keys)', async () => {
    const r = await call('GET', '/dashboard/overview');
    const d = r.json.data;
    expect(r.status === 200 && Array.isArray(d.kpis), 'no kpis');
    expect(d.counts && typeof d.counts.ordersAwaitingWo === 'number', 'missing counts');
    expect(Array.isArray(d.pendingPickupConfirmations), 'missing pendingPickupConfirmations');
    expect(Array.isArray(d.unassignedTasks), 'missing unassignedTasks');
    expect(Array.isArray(d.todayWorkOrders) && Array.isArray(d.overdueTasks), 'legacy keys missing');
  });

  let woId; let taskId;
  await check('work orders list (+taskSummary)', async () => {
    const r = await call('GET', '/work-orders?pageSize=50&search=OPS-DEMO');
    expect(r.status === 200 && r.json.data.length > 0, 'empty');
    expect(r.json.data[0].taskSummary && typeof r.json.data[0].taskSummary.total === 'number', 'no taskSummary');
    const open = r.json.data.find((w) => w.status === 'in_progress');
    woId = open.id;
  });
  await check('work orders filter overdue=true', async () => {
    const r = await call('GET', '/work-orders?overdue=true&pageSize=50');
    expect(r.status === 200 && r.json.data.every((w) => w.taskSummary.overdue > 0), 'non-overdue returned');
  });
  await check('work orders filter unassigned=true', async () => {
    const r = await call('GET', '/work-orders?unassigned=true&pageSize=50');
    expect(r.status === 200 && r.json.data.length > 0, 'none');
  });
  await check('work orders sort=due', async () => {
    const r = await call('GET', '/work-orders?sort=due&pageSize=50');
    expect(r.status === 200, `status ${r.status}`);
  });
  await check('work order detail (+isOverdue)', async () => {
    const r = await call('GET', `/work-orders/${woId}`);
    expect(r.status === 200 && r.json.data.tasks.length > 0, 'no tasks');
    expect('isOverdue' in r.json.data.tasks[0], 'no isOverdue');
    taskId = r.json.data.tasks.find((t) => t.status !== 'completed').id;
  });
  await check('task notes patch', async () => {
    const r = await call('PATCH', `/work-orders/${woId}/tasks/${taskId}/notes`, { notes: '[OPS-DEMO] smoke note' });
    expect(r.status === 200, `status ${r.status}`);
  });
  await check('task expenses patch (B1)', async () => {
    const r = await call('PATCH', `/work-orders/${woId}/tasks/${taskId}/expenses`, { expenses: [{ description: 'Smoke fuel', amount: 12.5 }] });
    expect(r.status === 200 && r.json.data.length === 1 && Number(r.json.data[0].amount) === 12.5, `status ${r.status}`);
    const clear = await call('PATCH', `/work-orders/${woId}/tasks/${taskId}/expenses`, { expenses: [] });
    expect(clear.status === 200, 'clear failed');
  });
  await check('assignees / drivers lookups', async () => {
    const a = await call('GET', '/users/assignees');
    const d = await call('GET', '/users/drivers');
    expect(a.status === 200 && d.status === 200, `${a.status}/${d.status}`);
  });
  await check('work types', async () => {
    const r = await call('GET', '/work-types');
    expect(r.status === 200 && r.json.data.length > 0, 'empty');
  });

  await check('service orders hasWorkOrder=false (B5)', async () => {
    const r = await call('GET', '/quotations?status=approved&hasWorkOrder=false&pageSize=50');
    expect(r.status === 200 && r.json.data.every((q) => !q.workOrder), 'rows with WO returned');
  });
  await check('service orders hasWorkOrder=true (B5)', async () => {
    const r = await call('GET', '/quotations?status=approved&hasWorkOrder=true&pageSize=50');
    expect(r.status === 200 && r.json.data.length > 0 && r.json.data.every((q) => q.workOrder), 'bad rows');
  });
  await check('purchase orders hasWorkOrder (B5)', async () => {
    const f = await call('GET', '/purchase-orders?status=approved&side=client&hasWorkOrder=false&pageSize=50');
    const t = await call('GET', '/purchase-orders?status=approved&side=client&hasWorkOrder=true&pageSize=50');
    expect(f.status === 200 && t.status === 200, `${f.status}/${t.status}`);
    expect(f.json.data.every((p) => !p.sourceWorkOrder), 'false filter leaked');
  });
  await check('pickup confirm / reschedule', async () => {
    const dash = (await call('GET', '/dashboard/overview')).json.data;
    const pending = dash.pendingPickupConfirmations.find((p) => p.entityType === 'quotation');
    expect(pending, 'no pending quotation pickup');
    const base = '/quotations';
    const rs = await call('POST', `${base}/${pending.id}/request-pickup-reschedule`, { note: 'smoke' });
    expect(rs.status === 200, `reschedule ${rs.status}`);
  });

  await check('GRN list + detail', async () => {
    const l = await call('GET', '/grn?pageSize=50');
    expect(l.status === 200 && l.json.data.length > 0, 'empty');
    const d = await call('GET', `/grn/${l.json.data[0].id}`);
    expect(d.status === 200 && Array.isArray(d.json.data.items), 'no items');
  });
  await check('GRN inventory + stock (B3)', async () => {
    const i = await call('GET', '/grn/inventory?pageSize=20');
    const s = await call('GET', '/grn/inventory/stock');
    expect(i.status === 200 && s.status === 200, `${i.status}/${s.status}`);
    expect(s.json.data.length > 0 && 'totalQuantity' in s.json.data[0], 'stock empty');
  });

  await check('deals list (no amounts)', async () => {
    const r = await call('GET', '/deals?pageSize=5');
    expect(r.status === 200, `status ${r.status}`);
  });
  await check('material types', async () => {
    const r = await call('GET', '/material-types');
    expect(r.status === 200, `status ${r.status}`);
  });
  await check('notifications list', async () => {
    const r = await call('GET', '/notifications?limit=20');
    expect(r.status === 200 && r.json.data.notifications.length > 0, 'empty');
  });
  await check('push token register/remove (B6)', async () => {
    const tok = 'ExponentPushToken[smoke-test-token]';
    const a = await call('POST', '/notifications/push-token', { token: tok, platform: 'android' });
    const b = await call('DELETE', '/notifications/push-token', { token: tok });
    expect(a.status === 200 && b.status === 200, `${a.status}/${b.status}`);
  });
  await check('certificates (permission-gated: 200 or 403)', async () => {
    const r = await call('GET', '/certificate-requests');
    expect([200, 403].includes(r.status), `status ${r.status}`);
  });
  await check('hr leave requests (gated: 200 or 403)', async () => {
    const r = await call('GET', '/hr/leave/requests');
    expect([200, 403].includes(r.status), `status ${r.status}`);
  });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log('Failed:', failures.join(', ')); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
