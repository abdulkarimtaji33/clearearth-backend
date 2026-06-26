const pdfService = require('../src/services/pdf.service');
const db = require('../src/models');

(async () => {
  const [[row]] = await db.sequelize.query('SELECT id, tenant_id FROM purchase_orders ORDER BY id DESC LIMIT 1');
  if (!row) throw new Error('No purchase order found');
  const raw = await pdfService.generatePurchaseOrderPdf(row.id, row.tenant_id);
  const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  if (!buf.length || !buf.toString('ascii', 0, 5).startsWith('%PDF')) throw new Error('Bad PDF');
  console.log(`PO PDF OK id=${row.id} bytes=${buf.length}`);
  process.exit(0);
})().catch((e) => {
  console.error('PO PDF FAIL:', e.message);
  process.exit(1);
});
