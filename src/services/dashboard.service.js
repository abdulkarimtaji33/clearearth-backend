/**
 * Role-aware dashboard overview
 */
const db = require('../models');
const { Op, fn, col, literal } = db.Sequelize;
const receivablesService = require('./receivables.service');
const payablesService = require('./payables.service');
const driverService = require('./driver.service');

const OPEN_DEAL_STATUSES = ['new', 'approved', 'quotation_sent', 'negotiation'];
const CLOSED_WON = 'won';
const CLOSED_LOST = 'lost';

function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function countByStatus(model, tenantId, statusField = 'status', extraWhere = {}) {
  const rows = await model.findAll({
    where: { tenant_id: tenantId, ...extraWhere },
    attributes: [statusField, [fn('COUNT', col('id')), 'count']],
    group: [statusField],
    raw: true,
  });
  return rows.reduce((acc, r) => {
    acc[r[statusField]] = parseInt(r.count, 10);
    return acc;
  }, {});
}

async function getAdminOverview(tenantId) {
  const monthFrom = monthStart();
  const [
    arSummary, apSummary, woByStatus, dealsByStatus,
    pendingExpenses, draftGrns, pendingPos, unassignedPickups, revenueRows,
    completedWOsThisMonth, wonDealsThisMonth, recentDeals, recentWorkOrders,
  ] = await Promise.all([
    receivablesService.getAgingSummary(tenantId, {}),
    payablesService.getAgingSummary(tenantId, {}),
    countByStatus(db.WorkOrder, tenantId),
    countByStatus(db.Deal, tenantId),
    db.WorkOrderTaskExpense.count({
      where: { accounts_status: 'pending' },
      include: [{ model: db.WorkOrderTask, as: 'workOrderTask', required: true, include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }] }],
    }).catch(() => 0),
    db.Grn.count({ where: { tenant_id: tenantId, status: { [Op.in]: ['new', 'submitted'] } } }).catch(() => 0),
    db.PurchaseOrder.count({ where: { tenant_id: tenantId, status: 'pending' } }).catch(() => 0),
    db.WorkOrderTask.count({
      where: { assigned_to: null, [Op.or]: [{ type_of_work: { [Op.like]: '%pickup%' } }] },
      include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }],
    }).catch(() => 0),
    db.TaxInvoice.findAll({
      where: { tenant_id: tenantId, payment_status: 'paid', updated_at: { [Op.gte]: monthFrom } },
      attributes: [[fn('SUM', col('paid_amount')), 'total']],
      raw: true,
    }),
    db.WorkOrder.count({ where: { tenant_id: tenantId, status: 'completed', updated_at: { [Op.gte]: monthFrom } } }).catch(() => 0),
    db.Deal.count({ where: { tenant_id: tenantId, status: 'won', updated_at: { [Op.gte]: monthFrom } } }).catch(() => 0),
    db.Deal.findAll({
      where: { tenant_id: tenantId },
      attributes: ['id', 'deal_number', 'title', 'status', 'total', 'updated_at'],
      order: [['updated_at', 'DESC']],
      limit: 6,
    }).catch(() => []),
    db.WorkOrder.findAll({
      where: { tenant_id: tenantId },
      attributes: ['id', 'title', 'status', 'updated_at'],
      order: [['updated_at', 'DESC']],
      limit: 5,
    }).catch(() => []),
  ]);

  const outstandingAr = Object.values(arSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const outstandingAp = Object.values(apSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  return {
    role: 'admin',
    kpis: [
      { label: 'Revenue (paid) this month', value: parseFloat(revenueRows[0]?.total || 0), format: 'currency' },
      { label: 'Outstanding AR', value: outstandingAr, format: 'currency' },
      { label: 'Outstanding AP', value: outstandingAp, format: 'currency' },
      { label: 'Open deals', value: OPEN_DEAL_STATUSES.reduce((s, st) => s + (dealsByStatus[st] || 0), 0), format: 'number' },
    ],
    stats: {
      completedWOsThisMonth,
      wonDealsThisMonth,
    },
    actionables: [
      { id: 'expenses', label: 'Expense approvals pending', count: pendingExpenses, href: '/erp/accounts/work-orders' },
      { id: 'grn', label: 'GRNs awaiting approval', count: draftGrns, href: '/erp/grn' },
      { id: 'po', label: 'POs pending approval', count: pendingPos, href: '/erp/purchase-orders' },
      { id: 'pickup', label: 'Unassigned pickup tasks', count: unassignedPickups, href: '/erp/work-orders' },
    ].filter((a) => a.count > 0),
    charts: {
      workOrdersByStatus: woByStatus,
      dealsByStatus,
    },
    recentDeals: recentDeals.map((d) => d.get({ plain: true })),
    recentWorkOrders: recentWorkOrders.map((w) => w.get({ plain: true })),
  };
}

async function getSalesOverview(tenantId, userId) {
  const deals = await db.Deal.findAll({
    where: { tenant_id: tenantId, assigned_to: userId },
    attributes: ['id', 'deal_number', 'title', 'status', 'total', 'updated_at', 'pickup_location'],
    order: [['updated_at', 'DESC']],
    limit: 100,
  });

  const open = deals.filter((d) => OPEN_DEAL_STATUSES.includes(d.status));
  const wonMonth = deals.filter((d) => d.status === CLOSED_WON && d.updated_at >= new Date(monthStart()));
  const stale = open.filter((d) => d.updated_at < new Date(daysAgo(7)));
  const missingPickup = deals.filter((d) => d.status === CLOSED_WON && !d.pickup_location);

  const pipeline = OPEN_DEAL_STATUSES.map((st) => ({
    status: st,
    count: open.filter((d) => d.status === st).length,
    value: open.filter((d) => d.status === st).reduce((s, d) => s + parseFloat(d.total || 0), 0),
  }));

  return {
    role: 'sales',
    kpis: [
      { label: 'My open deals', value: open.length, sub: `AED ${open.reduce((s, d) => s + parseFloat(d.total || 0), 0).toLocaleString()}`, format: 'number' },
      { label: 'Won this month', value: wonMonth.length, format: 'number' },
      { label: 'Needs follow-up', value: stale.length, format: 'number' },
      { label: 'Missing collection info', value: missingPickup.length, format: 'number' },
    ],
    actionables: [
      ...stale.slice(0, 5).map((d) => ({ id: `deal-${d.id}`, label: `${d.deal_number} — no update 7+ days`, href: `/erp/deals/view/${d.id}` })),
      ...missingPickup.slice(0, 3).map((d) => ({ id: `pickup-${d.id}`, label: `${d.deal_number} — add collection details`, href: `/erp/deals/edit/${d.id}` })),
    ],
    pipeline,
    recentDeals: deals.slice(0, 10).map((d) => d.get({ plain: true })),
  };
}

async function getSalesManagerOverview(tenantId) {
  const deals = await db.Deal.findAll({
    where: { tenant_id: tenantId, status: { [Op.notIn]: [CLOSED_LOST] } },
    attributes: ['id', 'status', 'total', 'updated_at', 'assigned_to'],
    include: [{ model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false }],
  });

  const pipelineValue = deals.reduce((s, d) => s + parseFloat(d.total || 0), 0);
  const won = deals.filter((d) => d.status === CLOSED_WON);
  const stale = deals.filter((d) => OPEN_DEAL_STATUSES.includes(d.status) && d.updated_at < new Date(daysAgo(10)));

  const byRep = {};
  won.forEach((d) => {
    const key = d.assigned_to || 'unassigned';
    if (!byRep[key]) byRep[key] = { user: d.assignedUser, total: 0, count: 0 };
    byRep[key].total += parseFloat(d.total || 0);
    byRep[key].count += 1;
  });

  return {
    role: 'sales_manager',
    kpis: [
      { label: 'Pipeline value', value: pipelineValue, format: 'currency' },
      { label: 'Won deals', value: won.length, format: 'number' },
      { label: 'Stale deals (10d+)', value: stale.length, format: 'number' },
      { label: 'Active deals', value: deals.filter((d) => OPEN_DEAL_STATUSES.includes(d.status)).length, format: 'number' },
    ],
    actionables: stale.slice(0, 8).map((d) => ({ id: `stale-${d.id}`, label: `Deal #${d.id} stale`, href: `/erp/deals/view/${d.id}` })),
    leaderboard: Object.values(byRep).sort((a, b) => b.total - a.total).slice(0, 8),
    pipeline: OPEN_DEAL_STATUSES.map((st) => ({
      status: st,
      count: deals.filter((d) => d.status === st).length,
    })),
  };
}

async function getInspectionOverview(tenantId, userId) {
  const weekStart = daysAgo(7);

  const [openRequests, completedThisWeek, completedThisMonth] = await Promise.all([
    db.DealInspectionRequest.findAll({
      include: [
        { model: db.Deal, as: 'deal', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'deal_number', 'title'] },
        { model: db.MaterialType, as: 'materialType', required: false },
      ],
      where: {
        status: { [Op.notIn]: ['report_submitted', 'inspection_completed'] },
      },
      order: [
        [db.sequelize.literal(`FIELD(priority, 'critical', 'high', 'medium', 'low')`), 'ASC'],
        ['created_at', 'ASC'],
      ],
      limit: 50,
    }),
    db.DealInspectionRequest.count({
      include: [{ model: db.Deal, as: 'deal', required: true, where: { tenant_id: tenantId } }],
      where: {
        status: { [Op.in]: ['report_submitted', 'inspection_completed'] },
        updated_at: { [Op.gte]: weekStart },
      },
    }).catch(() => 0),
    db.DealInspectionRequest.count({
      include: [{ model: db.Deal, as: 'deal', required: true, where: { tenant_id: tenantId } }],
      where: {
        status: { [Op.in]: ['report_submitted', 'inspection_completed'] },
        updated_at: { [Op.gte]: monthStart() },
      },
    }).catch(() => 0),
  ]);

  const newCount = openRequests.filter((r) => r.status === 'request_submitted').length;
  const inProgress = openRequests.filter((r) => r.status === 'team_assigned').length;

  return {
    role: 'inspection_team',
    kpis: [
      { label: 'New requests', value: newCount, format: 'number', highlight: newCount > 0 },
      { label: 'In progress', value: inProgress, format: 'number' },
      { label: 'Completed this week', value: completedThisWeek, format: 'number' },
      { label: 'Completed this month', value: completedThisMonth, format: 'number' },
    ],
    actionables: openRequests.slice(0, 15).map((r) => ({
      id: `insp-${r.id}`,
      label: `${r.deal?.deal_number || 'Deal'} — ${r.deal?.title || ''} (${(r.status || '').replace(/_/g, ' ')})`,
      href: `/erp/inspection-requests/${r.id}`,
      priority: r.priority,
    })),
  };
}

async function getOperationsOverview(tenantId) {
  const today = new Date().toISOString().slice(0, 10);

  const [woInProgress, overdueTasks, pendingExpenses, draftGrns, unassignedPickups, overdueTaskRows, driverActivity] = await Promise.all([
    db.WorkOrder.count({ where: { tenant_id: tenantId, status: 'in_progress' } }),
    db.WorkOrderTask.count({
      where: { status: { [Op.ne]: 'completed' }, end_date: { [Op.lt]: today } },
      include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }],
    }).catch(() => 0),
    db.WorkOrderTaskExpense.count({
      where: { accounts_status: 'pending' },
      include: [{ model: db.WorkOrderTask, as: 'workOrderTask', required: true, include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }] }],
    }).catch(() => 0),
    db.Grn.count({ where: { tenant_id: tenantId, status: { [Op.in]: ['new', 'submitted'] } } }).catch(() => 0),
    db.WorkOrderTask.findAll({
      where: { assigned_to: null, type_of_work: { [Op.like]: '%pickup%' } },
      include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'title'] }],
      limit: 10,
    }).catch(() => []),
    db.WorkOrderTask.findAll({
      where: { status: { [Op.ne]: 'completed' }, end_date: { [Op.lt]: today } },
      include: [
        { model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'title'] },
        { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
      ],
      order: [['end_date', 'ASC']],
      limit: 10,
    }).catch(() => []),
    db.WorkOrderTask.findAll({
      where: {
        assigned_to: { [Op.ne]: null },
        [Op.or]: [{ type_of_work: { [Op.like]: '%pickup%' } }],
        status: { [Op.ne]: 'completed' },
      },
      include: [
        { model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId }, attributes: ['id', 'title'] },
        { model: db.User, as: 'assignedUser', attributes: ['id', 'first_name', 'last_name'], required: false },
      ],
      limit: 10,
    }).catch(() => []),
  ]);

  return {
    role: 'operations_manager',
    kpis: [
      { label: 'Work orders in progress', value: woInProgress, format: 'number' },
      { label: 'Overdue tasks', value: overdueTasks, format: 'number', highlight: overdueTasks > 0 },
      { label: 'Expenses pending', value: pendingExpenses, format: 'number' },
      { label: 'GRNs pending', value: draftGrns, format: 'number' },
    ],
    actionables: [
      pendingExpenses > 0 && { id: 'exp', label: `${pendingExpenses} expense(s) need approval`, count: pendingExpenses, href: '/erp/accounts/work-orders' },
      draftGrns > 0 && { id: 'grn', label: `${draftGrns} GRN(s) pending review`, count: draftGrns, href: '/erp/grn' },
      ...unassignedPickups.map((t) => ({ id: `pickup-${t.id}`, label: `Unassigned pickup: ${t.workOrder?.title || 'WO'}`, href: `/erp/work-orders/edit/${t.work_order_id}` })),
    ].filter(Boolean),
    overdueTasks: overdueTaskRows.map((t) => {
      const plain = t.get({ plain: true });
      return {
        taskId: plain.id,
        workOrderId: plain.work_order_id,
        workOrderTitle: plain.workOrder?.title || `WO #${plain.work_order_id}`,
        assignedTo: plain.assignedUser
          ? `${plain.assignedUser.first_name} ${plain.assignedUser.last_name}`
          : 'Unassigned',
        endDate: plain.end_date,
        status: plain.status,
        typeOfWork: plain.type_of_work,
      };
    }),
    driverActivity: driverActivity.map((t) => {
      const plain = t.get({ plain: true });
      return {
        taskId: plain.id,
        workOrderTitle: plain.workOrder?.title || `WO #${plain.work_order_id}`,
        driverName: plain.assignedUser
          ? `${plain.assignedUser.first_name} ${plain.assignedUser.last_name}`
          : 'Unknown',
        status: plain.status,
        startDate: plain.start_date,
      };
    }),
  };
}

async function getDriverOverview(tenantId, userId) {
  const pickups = await driverService.listPickups(tenantId, userId);
  const today = new Date().toISOString().slice(0, 10);

  const overdue   = pickups.filter((p) => p.priority === 'overdue');
  const todayList = pickups.filter((p) => p.priority === 'today');
  const upcoming  = pickups.filter((p) => p.priority === 'upcoming');
  const completedToday = pickups.filter((p) => p.taskStatus === 'completed' && p.endDate === today);

  return {
    role: 'driver',
    kpis: [
      { label: 'Overdue', value: overdue.length, format: 'number', highlight: overdue.length > 0, color: 'error' },
      { label: 'Due today', value: todayList.length, format: 'number', highlight: todayList.length > 0, color: 'warning' },
      { label: 'Upcoming', value: upcoming.length, format: 'number' },
      { label: 'Done today', value: completedToday.length, format: 'number', color: 'success' },
    ],
    overdue,
    today: todayList,
    upcoming,
    completedToday,
  };
}

async function getSuperAdminOverview() {
  const [tenants, users, newTenants] = await Promise.all([
    db.Tenant.count({ where: { status: 'active' } }).catch(() => db.Tenant.count()),
    db.User.count(),
    db.Tenant.count({ where: { created_at: { [Op.gte]: monthStart() } } }).catch(() => 0),
  ]);

  const tenantRows = await db.Tenant.findAll({
    attributes: ['id', 'company_name', 'status', 'created_at'],
    order: [['created_at', 'DESC']],
    limit: 20,
  });

  return {
    role: 'super_admin',
    kpis: [
      { label: 'Active tenants', value: tenants, format: 'number' },
      { label: 'Total users', value: users, format: 'number' },
      { label: 'New tenants (month)', value: newTenants, format: 'number' },
    ],
    tenants: tenantRows.map((t) => t.get({ plain: true })),
  };
}

async function getAccountsOverview(tenantId) {
  const [arSummary, apSummary, pendingExpenses] = await Promise.all([
    receivablesService.getAgingSummary(tenantId, {}),
    payablesService.getAgingSummary(tenantId, {}),
    db.WorkOrderTaskExpense.count({
      where: { accounts_status: 'pending' },
      include: [{ model: db.WorkOrderTask, as: 'workOrderTask', required: true, include: [{ model: db.WorkOrder, as: 'workOrder', required: true, where: { tenant_id: tenantId } }] }],
    }).catch(() => 0),
  ]);

  const outstandingAr = Object.values(arSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const outstandingAp = Object.values(apSummary.buckets || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  return {
    role: 'accounts',
    kpis: [
      { label: 'Outstanding AR', value: outstandingAr, format: 'currency' },
      { label: 'Outstanding AP', value: outstandingAp, format: 'currency' },
      { label: 'Expense approvals', value: pendingExpenses, format: 'number' },
    ],
    arAgingBuckets: arSummary.buckets || {},
    apAgingBuckets: apSummary.buckets || {},
    actionables: [
      { id: 'recv', label: 'Review receivables', href: '/erp/receivables' },
      { id: 'pay', label: 'Review payables', href: '/erp/payables' },
      pendingExpenses > 0 && { id: 'exp', label: `${pendingExpenses} expenses to approve`, href: '/erp/accounts/work-orders' },
    ].filter(Boolean),
  };
}

const getOverview = async (tenantId, user) => {
  const roleName = user?.role?.name || user?.Role?.name || 'sales';

  switch (roleName) {
    case 'super_admin':
      return getSuperAdminOverview();
    case 'tenant_admin':
    case 'admin':
      return getAdminOverview(tenantId);
    case 'sales_manager':
      return getSalesManagerOverview(tenantId);
    case 'sales':
      return getSalesOverview(tenantId, user.id);
    case 'inspection_team':
      return getInspectionOverview(tenantId, user.id);
    case 'operations_manager':
      return getOperationsOverview(tenantId);
    case 'driver':
      return getDriverOverview(tenantId, user.id);
    case 'accounts':
      return getAccountsOverview(tenantId);
    default:
      return getSalesOverview(tenantId, user.id);
  }
};

module.exports = { getOverview };
