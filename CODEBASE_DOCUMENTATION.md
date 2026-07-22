# ClearEarth ERP — Codebase Documentation

**Scope:** Application source under `clearearth-backend` and `clearearth-frontend/src` (excludes `node_modules`, build output, `.git`).  
**API base (default):** `/api/v1` — from `config.app.version` (`API_VERSION` env).  
**Last major update:** 2026-07 — adds quotation/PO approve-with-pin workflow, receivables/payables receipt & statement PDFs, GRN PDF route, contact `both` type, PO `created_by`/`reference_number`, and the AdminJS super-admin DB panel.

---

## 1. Project overview

Multi-tenant ERP for UAE recycling/waste operations and finance.

**CRM & sales:** leads (with manager/PIN approval workflow), contacts, companies, suppliers, products, deals (OTC/OTP/FoC, WDS, inspections, client location share, collection fields), quotations, service orders.

**Billing & accounts:** proforma invoices, tax invoices, purchase orders and **purchase bills** (`document_type = bill`), receivables/payables with payment history, posted expenses ledger (work-order task lines + manual entries with tenant **expense categories**), **chart of accounts**, **journal entries**, **fiscal years**, financial reports (trial balance, GL, P&L, balance sheet, cash flow, equity, VAT).

**Operations:** work orders (created only from approved service quotation or approved PO — not bills), tasks with expenses/evidence, work types, driver pickups, **GRN** (goods received notes + inventory), role-aware **dashboard**.

**Platform:** roles/permissions (incl. `sales_manager`, `operations_manager`, `accounts`, `driver`), in-app **notifications**, PDFs (Puppeteer), uploads, company settings (incl. lead approval PIN). JWT carries `userId` and `tenantId`; data scoped by `tenant_id`.

**Data scope:** `sales` role sees own CRM records (`scopeHelper.scopeUserId`). **`sales_manager` is not scoped** — sees all tenant CRM data like admin. `operations_manager` sees deals without financial amounts (`dealFinancials.js`). `accounts` has finance-focused menus and read-only CRM access.

---

## 2. Architecture & stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite 6, MUI 7, React Router 7, Formik, `fetch` API client (`src/services/api.js`) |
| Backend | Express 4, Sequelize 6, MySQL/MariaDB, JWT, Multer, Winston, Puppeteer (PDF) |
| Config | `dotenv`, `helmet`, `cors`, `compression` (PDF routes excluded from gzip) |

### 2.1 Roles, permissions, and sidebar

| Role | Scope / visibility | Typical permissions |
|------|-------------------|---------------------|
| `super_admin` | All tenants (bypass) | All |
| `tenant_admin`, `admin` | Full tenant | All (re-synced in migration) |
| `sales_manager` | **All** CRM (no `scopeUserId`) | `leads.*`, `deals.*`, `contacts.*`, `companies.*`, `quotations.*`, `purchase_orders.*`, `suppliers.*`, **`leads.approve`**, `inspection_*`, `users.read`, `grn.read` |
| `sales` | Own leads/deals/contacts/companies | Same CRM modules (scoped); **`suppliers.read/create/update`**; **not** `leads.approve` |
| `inspection_team` | Inspection pipeline | `inspection_requests.*`, `inspection_reports.*`, `users.read`, `grn.read` |
| `operations_manager` | Operations; deals **without amounts** | `operations.*`, `deals.read` only (no deal write), `quotations.read`, `purchase_orders.read`, `grn.*`, `users.read` |
| `accounts` | Finance module | `accounting.*`, `reports.*`, `dashboard.read`, read-only `leads/companies/suppliers/contacts/deals`, `quotations.read`, `purchase_orders.read` |
| `driver` | Assigned pickups | `deals.read`, `operations.read`, `grn.read`; `/driver/*` routes use `authorizeRole` |

**Permission modules** (beyond doc-era `MODULES` in constants): `quotations`, `purchase_orders`, `accounting`, `reports`, `operations`, `grn`, `dashboard`. Many finance routes accept **`accounting.*` OR legacy `deals.*`** fallback. `operations_manager` with any `operations.*` perm satisfies `operations.<action>` checks (`auth.js`).

**Frontend sidebar** (`ErpMenuItems.js`): `sales` → CRM only; `operations_manager` → Deals, GRN, Work Orders; `accounts` → standalone Deals + Clients & Vendors + Service/Purchase + full Accounts dropdown (invoices, GL, reports, fiscal years); `driver` → driver-focused items.

---

## 3. Complete HTTP API reference

All routes below are relative to **`/api/v1`** unless noted. **App-level** routes (on `app.js`): `GET /health`, `GET /`, static `/uploads`, then `use('/api/v1', routes)`.

**Route modules** (`src/routes/index.js`): `auth`, `users`, `roles`, `contacts`, `companies`, `suppliers`, `leads`, `products`, `deals`, `dropdowns`, `material-types`, `upload`, `terms`, `quotations`, `proforma-invoices`, `tax-invoices`, `purchase-orders`, `inspection-requests`, `work-orders`, `work-types`, **`expense-categories`**, `tenants`, `accounts`, `receivables`, `payables`, **`chart-of-accounts`**, **`journal`**, **`reports`**, **`fiscal-years`**, **`notifications`**, **`grn`**, **`driver`**, **`dashboard`**, **`location-share`**, plus `pdf.routes` mounted first.

### 3.1 PDF (mounted first so `/quotations/:id/pdf` wins)

| Method | Path | Auth | Extra middleware | Handler | Brief |
|--------|------|------|------------------|---------|--------|
| GET | `/quotations/:id/pdf` | `authenticate` | — | `quotationController.getPdf` | Stream quotation PDF (Puppeteer) |
| GET | `/purchase-orders/:id/pdf` | `authenticate` | — | `purchaseOrderController.getPdf` | Stream PO PDF |
| GET | `/grn/:id/pdf` | `authenticate` | — | `grnController.getPdf` | Stream GRN PDF report |

### 3.2 API root

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/` | No | Inline | JSON listing nested endpoint paths |

### 3.3 Auth — `routes/auth.routes.js` → `/auth`

| Method | Path | Auth | Validation / notes | Handler | Brief |
|--------|------|------|--------------------|---------|--------|
| POST | `/auth/register` | No | registerValidation | `register` | **Currently broken** — `auth.service.js` destructures `USER_ROLE` from `src/constants/index.js`, which does not export it (only `USER_STATUS`, `RECORD_STATUS`, `LEAD_STATUS`, `MANAGER_ROLES`, `MODULES`, `ACTIONS` are exported), so any genuinely-new registration 500s with `Cannot read properties of undefined (reading 'TENANT_ADMIN')`. Even once that's fixed, the new `tenant_admin` role is created with **zero permissions assigned** (no call into the permission-seeding logic that `run-migration.js` does for existing tenants), so a freshly-registered admin can log in but every `authorize()`-gated route will 403 until permissions are seeded some other way. Not used in current practice — tenants are provisioned via other means. |
| POST | `/auth/login` | No | loginValidation | `login` | Email/password; returns user, tenant, tokens, permissions |
| POST | `/auth/refresh-token` | No | refreshTokenValidation | `refreshToken` | New access token from refresh token |
| POST | `/auth/logout` | `authenticate` | — | `logout` | Success stub (no blacklist) |
| POST | `/auth/forgot-password` | No | forgotPasswordValidation | `forgotPassword` | Sets reset token (email TODO) |
| POST | `/auth/reset-password` | No | resetPasswordValidation | `resetPassword` | Set password from valid token |
| GET | `/auth/me` | `authenticate` | — | `getCurrentUser` | Current user + role + permissions + tenant |
| PUT | `/auth/change-password` | `authenticate` | — | `changePassword` | Verify current password, set new |

### 3.4 Users — `/users`

| Method | Path | Auth | Permission / validation | Handler | Brief |
|--------|------|------|-------------------------|---------|--------|
| GET | `/users` | Yes | `users.read` | `getAll` | Paginated users for tenant |
| GET | `/users/inspectors` | Yes | `inspection_requests.read` OR `inspection_reports.create` OR `users.read` | `getInspectors` | Users for inspector dropdowns |
| GET | `/users/:id` | Yes | `users.read` | `getById` | Single user |
| POST | `/users` | Yes | `users.create` + createUserValidation | `create` | Create user |
| PUT | `/users/:id` | Yes | `users.update` + updateUserValidation | `update` | Update user |
| DELETE | `/users/:id` | Yes | `users.delete` | `remove` | Delete user |

### 3.5 Roles — `/roles`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/roles` | Yes | `roles.read` OR `users.read` OR `users.create` | `getAll` | List roles (tenant + system) |
| GET | `/roles/permissions/all` | Yes | `roles.read` | `getAllPermissions` | All permissions grouped by module |
| GET | `/roles/:id` | Yes | `roles.read` | `getById` | Role with permissions |
| POST | `/roles` | Yes | `roles.create` | `create` | Create tenant role |
| PUT | `/roles/:id` | Yes | `roles.update` | `update` | Update role |
| POST | `/roles/:id/permissions` | Yes | `roles.update` | `assignPermissions` | Replace role permissions |
| DELETE | `/roles/:id` | Yes | `roles.delete` | `remove` | Delete non-system role |

### 3.6 Contacts — `/contacts`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/contacts` | Yes | `contacts.read` | `getAll` | Paginated; sales scope |
| GET | `/contacts/:id` | Yes | `contacts.read` | `getById` | One contact |
| POST | `/contacts` | Yes | `contacts.create` + createValidation | `create` | Create |
| PUT | `/contacts/:id` | Yes | `contacts.update` + updateValidation | `update` | Update |
| DELETE | `/contacts/:id` | Yes | `contacts.delete` | `remove` | Soft delete |

**`contact_type` (ENUM):** `clients`, `vendors`, **`both`** (contact can be linked as a client and a vendor contact simultaneously).

### 3.7 Companies — `/companies`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/companies` | Yes | `companies.read` | `getAll` | Paginated; sales scope |
| GET | `/companies/:id` | Yes | `companies.read` | `getById` | Detail + contacts |
| POST | `/companies` | Yes | `companies.create` + createValidation | `create` | Create company |
| PUT | `/companies/:id` | Yes | `companies.update` + updateValidation | `update` | Update |
| DELETE | `/companies/:id` | Yes | `companies.delete` | `remove` | Soft delete |
| POST | `/companies/:id/contacts` | Yes | `companies.update` + addContactValidation | `addContact` | Link contact to company |
| DELETE | `/companies/:id/contacts/:contactId` | Yes | `companies.update` | `removeContact` | Unlink contact |

### 3.8 Suppliers — `/suppliers`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/suppliers` | Yes | `suppliers.read` | `getAll` | Paginated |
| GET | `/suppliers/:id` | Yes | `suppliers.read` | `getById` | Detail + contacts |
| POST | `/suppliers` | Yes | `suppliers.create` + createValidation | `create` | Create |
| PUT | `/suppliers/:id` | Yes | `suppliers.update` + updateValidation | `update` | Update |
| DELETE | `/suppliers/:id` | Yes | `suppliers.delete` | `remove` | Soft delete |
| POST | `/suppliers/:id/contacts` | Yes | `suppliers.update` + addContactValidation | `addContact` | Link contact |
| DELETE | `/suppliers/:id/contacts/:contactId` | Yes | `suppliers.update` | `removeContact` | Unlink |

### 3.9 Leads — `/leads`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/leads` | Yes | `leads.read` | `getAll` | Paginated; sales scope |
| GET | `/leads/:id` | Yes | `leads.read` | `getById` | One lead (+ `approvedByUser`) |
| POST | `/leads` | Yes | `leads.create` + createValidation | `create` | Create lead (status `new`) |
| PUT | `/leads/:id` | Yes | `leads.update` + updateValidation | `update` | Update; cannot set `qualified`/`converted` directly |
| POST | `/leads/:id/qualify` | Yes | **`leads.approve`** | `qualify` | **Managers only** — set `qualified`; sets `approved_by` / `approved_at` |
| POST | `/leads/:id/request-approval` | Yes | `leads.update` | `requestApproval` | Status → `pending_approval`; notifies sales managers |
| POST | `/leads/:id/approve-with-pin` | Yes | `leads.update` + `{ pin }` | `approveWithPin` | Self-approve with tenant PIN → `qualified` |
| POST | `/leads/:id/disqualify` | Yes | `leads.update` | `disqualify` | Set disqualified + reason |
| POST | `/leads/:id/convert` | Yes | `leads.update` | `convertToDeal` | Mark converted (deal created separately in UI) |
| DELETE | `/leads/:id` | Yes | `leads.delete` | `remove` | Delete if not converted |

**Lead `status` (ENUM):** `new`, `contacted`, **`pending_approval`**, `qualified`, `disqualified`, `converted`.  
**Approval PIN:** stored as bcrypt hash in `tenants.settings.leadApprovalPinHash` (`src/utils/leadApproval.js`). Admin sets via `PUT /tenants/me/lead-approval-pin`.

### 3.10 Products — `/products` (product services)

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/products` | Yes | **None** (authenticate only) | `getAll` | Paginated catalog |
| GET | `/products/:id` | Yes | — | `getById` | One item |
| POST | `/products` | Yes | — | `create` | Create product/service |
| PUT | `/products/:id` | Yes | — | `update` | Update |
| DELETE | `/products/:id` | Yes | — | `remove` | Soft delete |

### 3.11 Deals — `/deals`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/deals` | Yes | `deals.read` | `getAll` | Paginated; sales scope on `assigned_to` |
| GET | `/deals/:id` | Yes | `deals.read` | `getById` | Full graph (items, WDS, inspection, terms, images, **`workOrders`** + tasks + **`workType`**) |
| POST | `/deals` | Yes | `deals.create` | `create` | Create deal + items + optional WDS/inspection/images/terms |
| PUT | `/deals/:id` | Yes | `deals.update` | `update` | Update deal; **ignores** `paymentStatus`/`paidAmount` from body |
| POST | `/deals/:id/approve` | Yes | `deals.approve` | `approve` | Manager approval → approved status |
| POST | `/deals/:id/request-approval` | Yes | `deals.update` | `requestApproval` | Notifies approvers |
| POST | `/deals/:id/approve-with-pin` | Yes | `deals.update` + `{ pin }` | `approveWithPin` | Self-approve with tenant PIN |
| PATCH | `/deals/:id/collection-details` | Yes | `deals.update` OR `operations.update` | `updateCollectionDetails` | Pickup location / contact fields only |
| DELETE | `/deals/:id` | Yes | `deals.delete` | `remove` | Soft delete |
| POST | `/deals/:id/payment` | Yes | `deals.update` | `updatePayment` | Manual paid amount → `payment_status` (API exists; **deal form no longer exposes payment**) |
| PUT | `/deals/:id/inspection-report` | Yes | `deals.read` OR `inspection_reports.create` OR `inspection_reports.update` | `saveInspectionReport` | Upsert inspection report |

**Deal `status` (ENUM):** `new`, `approved`, `quotation_sent`, `negotiation`, `won`, `lost`. Optional **`loss_reason`** when `lost`.  
**Deal `deal_type`:** `offer_to_charge`, `offer_to_purchase`, `free_of_charge`. **`is_rcm_applicable`** affects VAT on purchase documents.  
**Collection:** `pickup_location`, `pickup_contact_name`, `pickup_contact_number`. Client can submit location via public **`/location-share/pin/:token`**.  
**Financial redaction:** `operations_manager` gets null amounts on deal/items/invoices via `dealFinancials.js`.  
**Notifications:** won/lost status changes notify managers/admins (`notification.service.notifyDealStatusChange`).  
**Line items (`items[]`):** each item may include **`unitOfMeasure`** → **`deal_items.unit_of_measure`**.

### 3.12 Dropdowns — `/dropdowns`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/dropdowns/all` | **No** | `getAllDropdowns` | All categories in one response |
| GET | `/dropdowns/category/:category` | **No** | `getDropdownsByCategory` | One category (see modelMap keys in controller) |
| POST | `/dropdowns` | Yes | `createDropdown` | Admin: create row in category table |
| PUT | `/dropdowns/:id` | Yes | `updateDropdown` | Update row (`category` in body) |
| DELETE | `/dropdowns/:id` | Yes | `deleteDropdown` | Delete (`category` in body) |

### 3.13 Material types — `/material-types`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/material-types` | Yes | `getAll` | Active material types for inspection forms |

### 3.14 Upload — `/upload`

| Method | Path | Auth | Middleware | Handler | Brief |
|--------|------|------|------------|---------|--------|
| POST | `/upload/inspection-document` | Yes | `uploadSingle('file')` | `uploadInspectionDocument` | Save file; return path/url |
| POST | `/upload/deal-image` | Yes | `uploadSingle('file')` | `uploadDealImage` | Deal image path |
| POST | `/upload/company-document` | Yes | `uploadSingle('file')` | `uploadCompanyDocument` | Company/supplier documentation file path |
| POST | `/upload/wds-attachment` | Yes | `uploadSingle('file')` | `uploadWdsAttachment` | WDS attachment path + original name |
| POST | `/upload/tenant-logo` | Yes | `uploadSingle('file')` | `uploadTenantLogo` | Sets `tenant.logo` |
| POST | `/upload/tax-invoice-attachment` | Yes | `uploadSingle('file')` | `uploadTaxInvoiceAttachment` | Stores file; path used when creating/updating tax invoices |
| POST | `/upload/expense-evidence` | Yes | `uploadSingle('file')` | `uploadExpenseEvidence` | Work-order task expense evidence attachment |

### 3.15 Terms and conditions — `/terms`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/terms` | Yes | `getAll` | List (tenant) |
| GET | `/terms/:id` | Yes | `getById` | One |
| POST | `/terms` | Yes | `create` | Create |
| PUT | `/terms/:id` | Yes | `update` | Update |
| DELETE | `/terms/:id` | Yes | `remove` | Delete |

*Note: No `authorize()` permission checks on these routes — any authenticated user.*

### 3.16 Quotations — `/quotations`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/quotations` | Yes | `getAll` | Paginated; sales scope on `prepared_by`; **`deal`** includes **`items`** (DealItem `id` only) for list item counts |
| GET | `/quotations/:id` | Yes | `getById` | One + **`deal`** with **`items`** (DealItem + `productService`) for line-item display |
| POST | `/quotations` | Yes | `create` | Create quotation |
| PUT | `/quotations/:id` | Yes | `update` | **Always returns 400** — `quotation.service.update` is a stub that unconditionally throws `'Quotations cannot be edited after creation'`; the route exists but the feature is disabled (matches frontend "lock quotations after creation") |
| POST | `/quotations/:id/approve` | Yes, `quotations.approve` | `approve` | Manager approval → approved status |
| POST | `/quotations/:id/request-approval` | Yes, `quotations.update` | `requestApproval` | Notifies approvers, same PIN pattern as leads |
| POST | `/quotations/:id/approve-with-pin` | Yes, `quotations.update` | `approveWithPin` | Body `{ pin }` — self-approve with tenant PIN |
| DELETE | `/quotations/:id` | Yes | `remove` | Delete |

*Duplicate PDF route also at §3.1.*

### 3.17 Proforma invoices — `/proforma-invoices`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/proforma-invoices/preview-from-quotation/:quotationId` | Yes | `accounting.read` OR `deals.read` | `previewFromQuotation` | Deal line items + totals for UI before create |
| GET | `/proforma-invoices` | Yes | `accounting.read` OR `deals.read` | `getAll` | Paginated list (quotation, deal, dates) |
| GET | `/proforma-invoices/:id` | Yes | `accounting.read` OR `deals.read` | `getById` | Header + items + optional linked tax invoice |
| POST | `/proforma-invoices` | Yes | `accounting.create` OR `deals.create` | `create` | Body: `quotationId`, dates, amounts, `items[]`; assigns `PF-YYYY-#####` |
| PUT | `/proforma-invoices/:id` | Yes | `accounting.update` OR `deals.update` | `update` | Patch header fields |
| DELETE | `/proforma-invoices/:id` | Yes | `accounting.delete` OR `deals.delete` | `remove` | Delete proforma + line items |

### 3.18 Tax invoices — `/tax-invoices`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/tax-invoices/preview-from-proforma/:proformaInvoiceId` | Yes | `accounting.read` OR `deals.read` | `previewFromProforma` | Defaults for tax invoice create from proforma |
| GET | `/tax-invoices` | Yes | `accounting.read` OR `deals.read` | `getAll` | Paginated |
| GET | `/tax-invoices/:id/pdf` | Yes | `accounting.read` OR `deals.read` | `getPdf` | Stream tax invoice PDF (own route, not in pdf.routes.js) |
| GET | `/tax-invoices/:id` | Yes | `accounting.read` OR `deals.read` | `getById` | Detail + items + proforma link |
| POST | `/tax-invoices` | Yes | `accounting.create` OR `deals.create` | `create` | One tax invoice per proforma; always starts `unpaid` |
| PUT | `/tax-invoices/:id` | Yes | `accounting.update` OR `deals.update` | `update` | Patch remarks etc.; **ignores** manual `paymentStatus`/`paidAmount` from form |
| DELETE | `/tax-invoices/:id` | Yes | `accounting.delete` OR `deals.delete` | `remove` | Delete |

### 3.19 Accounts (billing) — `/accounts`

All routes **authenticate**. Permissions use **`accounting.*`** with legacy **`deals.*`** fallback where noted.

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/accounts/expenses` | Yes | `accounting.read` OR `deals.read` | `listExpenses` | Paginated expenses ledger; filters: search, category, date range, `paymentStatus` |
| POST | `/accounts/expenses` | Yes | `accounting.update` | `createExpense` | Manual ledger row; category validated against **`expense_categories`**; payment status **derived** from `paidAmount` |
| GET | `/accounts/expenses/:id/payments` | Yes | `accounting.read` OR `deals.read` | `listExpensePayments` | Payment transaction history for expense |
| PATCH | `/accounts/expenses/:id/payment` | Yes | `accounting.update` | `updateExpensePayment` | Record payment → updates `paid_amount`, `payment_status`, journal entry |
| GET | `/accounts/work-orders` | Yes | `accounting.read` OR `deals.read` | `listWorkOrders` | Work orders for Accounts |
| GET | `/accounts/work-orders/:id` | Yes | `accounting.read` OR `deals.read` | `getWorkOrder` | WO detail; tasks include `expenses` with `accounts_status` |
| POST | `/accounts/work-orders/:workOrderId/task-expenses/:taskExpenseId/approve` | Yes | `accounting.update` | `approveTaskExpense` | Approve line → **Expense** row |
| POST | `/accounts/work-orders/:workOrderId/task-expenses/:taskExpenseId/reject` | Yes | `accounting.update` | `rejectTaskExpense` | Reject pending line |

### 3.20 Purchase orders — `/purchase-orders`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/purchase-orders` | Yes | `getAll` | Paginated; includes nested `sourceWorkOrder` / `purchaseBills` where applicable |
| GET | `/purchase-orders/:id` | Yes | `getById` | Items + terms |
| POST | `/purchase-orders` | Yes | `create` | Company XOR supplier + items + terms; **`document_type`**: `quotation` (default) or `bill`; records `created_by` |
| PUT | `/purchase-orders/:id` | Yes | `update` | Update; bill qty recalc server-side when applicable |
| POST | `/purchase-orders/:id/approve` | Yes, `purchase_orders.approve` | `approve` | Manager approval → approved status |
| POST | `/purchase-orders/:id/request-approval` | Yes, `purchase_orders.update` | `requestApproval` | Sets `approval_requested_at`, notifies approvers |
| POST | `/purchase-orders/:id/approve-with-pin` | Yes, `purchase_orders.update` | `approveWithPin` | Body `{ pin }` — self-approve with tenant PIN; sets `approved_by`/`approved_at` |
| DELETE | `/purchase-orders/:id` | Yes | `remove` | Delete |

**New fields since last doc pass:** `purchase_orders.created_by` (creator FK), `purchase_orders.reference_number`, plus the approval-workflow columns `approval_requested_at`, `approved_by`, `approved_at` — mirrors the quotation/lead approve-with-pin pattern.

**Purchase bills:** `document_type = 'bill'`, linked via `work_order_id`. Auto-created on WO **completed** for OTP deals — client bill (`company_id`) + vendor bill (`supplier_id`) via `ensurePurchaseBillForWorkOrder`. PDF title shows "Purchase Bill" for bills. Bills cannot spawn new work orders.

### 3.21 Inspection requests — `/inspection-requests`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/inspection-requests` | Yes | `inspection_requests.read` | `getAll` | List from deals with inspection |
| GET | `/inspection-requests/:id` | Yes | `inspection_requests.read` | `getById` | Single request detail |
| PATCH | `/inspection-requests/:id/status` | Yes | `inspection_requests.update` | `updateStatus` | Body `{ status }` — pipeline statuses |
| PATCH | `/inspection-requests/:id/priority` | Yes | `inspection_requests.update` | `updatePriority` | Set priority |
| POST | `/inspection-requests/:id/accept` | Yes | `inspection_requests.update` | `acceptRequest` | Accept before pipeline |
| POST | `/inspection-requests/:id/reject` | Yes | `inspection_requests.update` | `rejectRequest` | Reject with reason; notifies requester |

### 3.22 Work orders — `/work-orders`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/work-orders` | Yes | `operations.read` OR `deals.read` | `getAll` | Paginated |
| GET | `/work-orders/:id` | Yes | `operations.read` OR `deals.read` | `getById` | Detail + tasks + `purchaseBills` |
| POST | `/work-orders` | Yes | `operations.create` OR `deals.create` | `create` | **Requires** `quotationId` XOR `purchaseOrderId` (approved; not a bill); one WO per source |
| PUT | `/work-orders/:id` | Yes | `operations.update` OR `deals.update` | `update` | Update WO + replace tasks if sent |
| PATCH | `/work-orders/:id/tasks/:taskId/status` | Yes | `operations.update` OR `deals.update` | `updateTaskStatus` | Body `{ status }` |
| PATCH | `/work-orders/:id/tasks/:taskId/notes` | Yes | `operations.update` OR `deals.update` | `updateTaskNotes` | Inline task notes |
| PATCH | `/work-orders/:id/tasks/:taskId/assign` | Yes | `operations.update` OR `deals.update` | `updateTaskAssignment` | Assign driver/user to task |
| DELETE | `/work-orders/:id` | Yes | `operations.delete` OR `deals.delete` | `remove` | Delete WO + tasks |

**WO `status`:** `new`, `in_progress`, `completed`, `cancelled`. FKs: `quotation_id`, `purchase_order_id` (unique each).  
**On completed:** auto `ensurePurchaseBillForWorkOrder` + `ensureGrnForWorkOrder`.  
**No standalone create** in UI — only from approved service order or PO list.  
**Task payload:** `workTypeId`, `expenses[]` (with optional `evidencePath`), `sort_order`, `assignedTo`, etc.

### 3.23 Receivables — `/receivables`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/receivables` | Yes | `accounting.read` OR `deals.read` | `list` | Outstanding tax invoices (`balance_due > 0`) |
| GET | `/receivables/aging-summary` | Yes | `accounting.read` OR `deals.read` | `agingSummary` | Aging buckets per company |
| GET | `/receivables/payments/:paymentId/receipt/pdf` | Yes | `accounting.read` OR `deals.read` | `getReceiptPdf` | Stream AR payment receipt PDF |
| GET | `/receivables/companies/:companyId/statement/pdf` | Yes | `accounting.read` OR `deals.read` | `getStatementPdf` | Stream statement of account PDF for a company |
| GET | `/receivables/:id/payments` | Yes | `accounting.read` OR `deals.read` | `listPayments` | Payment transaction history |
| POST | `/receivables/:id/payment` | Yes | `accounting.update` | `recordPayment` | Record payment + journal entry; payment gets a `receipt_number` |

### 3.24 Payables — `/payables`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/payables` | Yes | `accounting.read` OR `deals.read` | `list` | Outstanding approved POs |
| GET | `/payables/payment-receipts` | Yes | `accounting.read` OR `deals.read` | `listPaymentReceipts` | Paginated list of AP payment receipts |
| GET | `/payables/payment-receipts/:paymentId` | Yes | `accounting.read` OR `deals.read` | `getPaymentReceipt` | Single AP payment receipt detail |
| GET | `/payables/aging-summary` | Yes | `accounting.read` OR `deals.read` | `agingSummary` | Aging buckets per supplier |
| GET | `/payables/:id/payments` | Yes | `accounting.read` OR `deals.read` | `listPayments` | Payment transaction history |
| POST | `/payables/:id/payment` | Yes | `accounting.update` | `recordPayment` | Record payment + optional `dueDate` |

### 3.25 Work types — `/work-types`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/work-types` | Yes | `operations.read` OR `deals.read` | `getAll` | Tenant catalog |
| GET | `/work-types/:id` | Yes | `operations.read` OR `deals.read` | `getById` | One row |
| POST | `/work-types` | Yes | `operations.create` OR `deals.create` | `create` | Create type |
| PUT | `/work-types/:id` | Yes | `operations.update` OR `deals.update` | `update` | Update |
| DELETE | `/work-types/:id` | Yes | `operations.delete` OR `deals.delete` | `remove` | Blocked if tasks reference it |

### 3.26 Expense categories — `/expense-categories`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/expense-categories` | Yes | `accounting.read` | `getAll` | Tenant-scoped categories for manual expenses |
| GET | `/expense-categories/:id` | Yes | `accounting.read` | `getById` | One row |
| POST | `/expense-categories` | Yes | `accounting.create` | `create` | Create (+ "Add New" in UI) |
| PUT | `/expense-categories/:id` | Yes | `accounting.update` | `update` | Update |
| DELETE | `/expense-categories/:id` | Yes | `accounting.delete` | `remove` | Delete |

### 3.27 Tenants — `/tenants`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/tenants/logo` | **No** | — | `getPublicLogo` | Public tenant logo |
| GET | `/tenants/me` | Yes | — | `getMyTenant` | Profile + `lead_approval_pin_configured` (hash never returned) |
| PUT | `/tenants/me` | Yes | `users.read` + `users.update` | `updateMyTenant` | Update org fields |
| PUT | `/tenants/me/lead-approval-pin` | Yes | `users.update` (admin role enforced in controller) | `updateLeadApprovalPin` | Set/change lead self-approval PIN |

### 3.28 Notifications — `/notifications`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/notifications` | Yes | `getMine` | User's notifications + unread count |
| PATCH | `/notifications/read-all` | Yes | `markAllRead` | Mark all read |
| PATCH | `/notifications/:id/read` | Yes | `markRead` | Mark one read |

**Types:** `lead_approval_requested`, `deal_status_change`, `inspection_rejected`. Entity links in UI header bell.

### 3.29 Dashboard — `/dashboard`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/dashboard/overview` | Yes | `overview` | Role-aware KPIs (`dashboard.service.js`) |

### 3.30 GRN — `/grn`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/grn` | Yes | `grn.read` | `list` | Paginated goods received notes |
| GET | `/grn/:id` | Yes | `grn.read` | `getById` | Detail + items + images |
| POST | `/grn` | Yes | `grn.create` | `create` | Create GRN |
| PATCH | `/grn/:id` | Yes | `grn.update` | `update` | Update header/items |
| POST | `/grn/:id/approve` | Yes | `grn.update` | `approve` | Approve → increments **inventory** |
| POST | `/grn/:id/items/:itemId/images` | Yes | `grn.update` + upload | `uploadItemImages` | Attach item photos |

### 3.31 Driver — `/driver`

| Method | Path | Auth | Role | Handler | Brief |
|--------|------|------|------|---------|--------|
| GET | `/driver/pickups` | Yes | `driver`, `admin`, `tenant_admin`, `operations_manager` | `listPickups` | Assigned pickup tasks |
| POST | `/driver/pickups/:taskId/start` | Yes | same | `startPickup` | Start pickup |
| POST | `/driver/pickups/:taskId/complete` | Yes | same | `markPickedUp` | Complete pickup |

### 3.32 Chart of accounts — `/chart-of-accounts`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/chart-of-accounts` | Yes | `accounting.read` OR `deals.read` | `listAccounts` | COA tree/list |
| POST | `/chart-of-accounts/seed` | Yes | `accounting.update` OR `deals.update` | `seedAccounts` | Seed default accounts |
| POST | `/chart-of-accounts` | Yes | `accounting.update` OR `deals.update` | `createAccount` | Create account |
| GET | `/chart-of-accounts/:id` | Yes | `accounting.read` OR `deals.read` | `getAccount` | One account |
| PUT | `/chart-of-accounts/:id` | Yes | `accounting.update` OR `deals.update` | `updateAccount` | Update |
| DELETE | `/chart-of-accounts/:id` | Yes | `accounting.update` OR `deals.update` | `deleteAccount` | Delete |

### 3.33 Journal — `/journal`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/journal` | Yes | `accounting.read` OR `deals.read` | `listEntries` | Paginated journal entries |
| POST | `/journal` | Yes | `accounting.update` OR `deals.update` | `createManualEntry` | Manual JE |
| POST | `/journal/opening-balances` | Yes | `accounting.update` OR `deals.update` | `postOpeningBalances` | Opening balances |
| GET | `/journal/:id` | Yes | `accounting.read` OR `deals.read` | `getEntry` | Entry + lines |
| POST | `/journal/:id/void` | Yes | `accounting.update` OR `deals.update` | `voidEntry` | Void entry |

Auto-posting also occurs on receivable/payable/expense payments and PO approval (`journalEntry.service.js`).

### 3.34 Financial reports — `/reports`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/reports/trial-balance` | Yes | `reports.read` OR `accounting.read` OR `deals.read` | `getTrialBalance` | Trial balance |
| GET | `/reports/general-ledger` | Yes | same | `getGeneralLedger` | General ledger |
| GET | `/reports/income-statement` | Yes | same | `getIncomeStatement` | P&L |
| GET | `/reports/balance-sheet` | Yes | same | `getBalanceSheet` | Balance sheet |
| GET | `/reports/cash-flow` | Yes | same | `getCashFlowStatement` | Cash flow |
| GET | `/reports/changes-in-equity` | Yes | same | `getChangesInEquity` | Changes in equity |
| GET | `/reports/vat-report` | Yes | same | `getVatReport` | VAT report |

### 3.35 Fiscal years — `/fiscal-years`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/fiscal-years` | Yes | `accounting.read` OR `deals.read` | `listFiscalYears` | List FYs |
| POST | `/fiscal-years` | Yes | `accounting.update` OR `deals.update` | `createFiscalYear` | Create FY + periods |
| POST | `/fiscal-years/:id/close` | Yes | `accounting.update` OR `deals.update` | `closeFiscalYear` | Close year |
| GET | `/fiscal-years/:id/periods` | Yes | `accounting.read` OR `deals.read` | `listPeriods` | Accounting periods |
| POST | `/fiscal-years/:id/periods/:periodId/close` | Yes | `accounting.update` OR `deals.update` | `closePeriod` | Close period |
| POST | `/fiscal-years/:id/periods/:periodId/reopen` | Yes | `accounting.update` OR `deals.update` | `reopenPeriod` | Reopen period |

### 3.36 Location share — `/location-share`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| POST | `/location-share/deals/:dealId/token` | Yes | `deals.update` OR `operations.update` | `generateToken` | Create 7-day client link |
| GET | `/location-share/pin/:token` | **No** | `getTokenInfo` | Public: deal context for picker |
| POST | `/location-share/pin/:token` | **No** | `submitLocation` | Public: client submits `pickupLocation` |

### 3.37 Users — additional endpoints

Beyond §3.4: `GET /users/drivers`, `GET /users/assignees`, `PUT /users/:id/password`.

### 3.38 Admin panel (AdminJS) — `/system-console` *(new, not a JSON API)*

Mounted directly on `app.js` (not under `/api/v1`, not JWT-protected) via `src/admin/setup.js`, using `@adminjs/express` + `@adminjs/sequelize`. Path is configurable via `ADMIN_PANEL_PATH` env (default `/system-console`).

- **Auth:** session-based (`express-session`, `ADMIN_SESSION_SECRET`/`ADMIN_COOKIE_SECRET`), separate login form — not the tenant JWT flow, and not tenant-scoped (super-admin DB console).
- **Access:** full write access to every model/column (including normally-protected fields), true hard-delete (bypasses Sequelize `paranoid` soft-delete), and read views show soft-deleted rows (`paranoid: false` on reads) so deleted records remain inspectable/restorable.
- **CSP:** `app.js` relaxes Content-Security-Policy specifically for the `/system-console` path so AdminJS's inline scripts/styles render.
- **Purpose:** operational/support tool for direct DB inspection and fixes across all tenants — not part of the tenant-facing product and intentionally excluded from the Postman collection (session-cookie login, not a stable JSON API).

---

## 4. Controllers — every exported handler

| File | Function | Brief |
|------|------------|--------|
| `auth.controller.js` | `register` | Body → `authService.register` → 201 |
| | `login` | Body → `authService.login` |
| | `refreshToken` | Body.refreshToken → new access token |
| | `logout` | Success only |
| | `forgotPassword` | Email → service |
| | `resetPassword` | Token + password → service |
| | `getCurrentUser` | `authService.getCurrentUser(req.user.id)` |
| | `changePassword` | Current + new password |
| `user.controller.js` | `getAll` | Query filters + pagination → `userService.getAll` |
| | `getInspectors` | `userService.getInspectors` |
| | `getById` | `userService.getById` |
| | `create` | `userService.create` |
| | `update` | `userService.update` |
| | `remove` | `userService.remove` |
| `role.controller.js` | `getAll` | `roleService.getAll` |
| | `getById` | `roleService.getById` |
| | `create` | `roleService.create` |
| | `update` | `roleService.update` |
| | `remove` | `roleService.remove` |
| | `getAllPermissions` | `roleService.getAllPermissions` |
| | `assignPermissions` | `roleService.assignPermissionsToRole` |
| `contact.controller.js` | `getAll` | Pagination + `getSalesScope` → `contactService.getAll` |
| | `getById` | Scope → `getById` |
| | `create` | Scope → `create` |
| | `update` | Scope → `update` |
| | `remove` | Scope → `remove` |
| `company.controller.js` | `getAll` | Same pattern + sales |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| | `addContact` | `companyService.addContact` |
| | `removeContact` | `companyService.removeContact` |
| `supplier.controller.js` | `getAll` | `supplierService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| | `addContact` | |
| | `removeContact` | |
| `lead.controller.js` | `getAll` | `getSalesScope` → `leadService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `qualify` | Manager-only; `leads.approve` |
| | `requestApproval` | PIN workflow — notify managers |
| | `approveWithPin` | Self-approve with tenant PIN |
| | `disqualify` | Reason → `disqualify` |
| | `convertToDeal` | Body → `convertToDeal` |
| | `remove` | |
| `productService.controller.js` | `getAll` | Query → `productServiceService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| `deal.controller.js` | `getAll` | Many query filters + `getSalesScope` |
| | `getById` | May redact financials for `operations_manager` |
| | `create` | |
| | `update` | Ignores payment fields from form |
| | `approve` | Manager approval → approved status |
| | `requestApproval` | Notify approvers |
| | `approveWithPin` | Body `{ pin }` self-approve |
| | `updateCollectionDetails` | Pickup fields only |
| | `updatePayment` | Body.paidAmount (API; not in deal form UI) |
| | `remove` | |
| | `saveInspectionReport` | Body → `saveInspectionReport` |
| `dropdown.controller.js` | `getDropdownsByCategory` | Sequelize find on `modelMap[category]` |
| | `getAllDropdowns` | Parallel findAll on all dropdown models |
| | `createDropdown` | `Model.create` from body |
| | `updateDropdown` | findByPk + update |
| | `deleteDropdown` | findByPk + destroy |
| `materialType.controller.js` | `getAll` | `MaterialType.findAll` active ordered |
| `quotation.controller.js` | `getAll` | `getSalesScope` + `quotationService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `approve` | Manager approval → approved status |
| | `requestApproval` | Notify approvers |
| | `approveWithPin` | Body `{ pin }` self-approve |
| | `remove` | |
| | `getPdf` | `pdfService.generateQuotationPdf` → `Content-Type: application/pdf` |
| `purchaseOrder.controller.js` | `getAll` | `purchaseOrderService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `approve` | Manager approval → approved status |
| | `requestApproval` | Sets `approval_requested_at` |
| | `approveWithPin` | Body `{ pin }` self-approve |
| | `remove` | |
| | `getPdf` | `generatePurchaseOrderPdf` |
| `inspectionRequest.controller.js` | `getAll` | Pagination + optional scope → `inspectionRequestService.getAll` |
| | `getById` | |
| | `updateStatus` | Body.status |
| | `updatePriority` | Body.priority |
| | `acceptRequest` | Accept inspection |
| | `rejectRequest` | Reject + notify requester |
| `workOrder.controller.js` | `getAll` | Pagination → `workOrderService.getAll` |
| | `getById` | |
| | `create` | Requires quotation or PO; `{ userId }` scope |
| | `update` | |
| | `updateTaskStatus` | Body.status |
| | `updateTaskNotes` | Body.notes |
| | `updateTaskAssignment` | Body.assignedTo |
| | `remove` | |
| `tenant.controller.js` | `getMyTenant` | `tenantService.getById` + PIN configured flag |
| | `getPublicLogo` | Public logo for branding |
| | `updateMyTenant` | `tenantService.update` |
| | `updateLeadApprovalPin` | Admin only |
| `notification.controller.js` | `getMine`, `markRead`, `markAllRead` | User notifications |
| `dashboard.controller.js` | `overview` | Role-aware dashboard |
| `expenseCategory.controller.js` | CRUD | Tenant expense categories |
| `grn.controller.js` | `list`, `getById`, `create`, `update`, `approve`, `uploadItemImages`, `getPdf` | GRN lifecycle + PDF report |
| `driver.controller.js` | `listPickups`, `startPickup`, `markPickedUp` | Driver mobile flow |
| `chartOfAccounts.controller.js` | COA CRUD + `seedAccounts` | |
| `journal.controller.js` | Journal list/create/void/opening balances | |
| `reports.controller.js` | Seven financial report endpoints | |
| `fiscalYear.controller.js` | FY + period close/reopen | |
| `locationShare.controller.js` | `generateToken`, `getTokenInfo`, `submitLocation` | Public client location |
| `upload.controller.js` | `uploadInspectionDocument` | Relative path + URL JSON |
| | `uploadDealImage` | Same |
| | `uploadCompanyDocument` | Company docs |
| | `uploadWdsAttachment` | Same + fileName |
| | `uploadTenantLogo` | Saves path on `Tenant.logo` |
| | `uploadTaxInvoiceAttachment` | Path for tax invoice supporting docs |
| | `uploadExpenseEvidence` | Work-order task expense evidence |
| `termsAndConditions.controller.js` | `getAll` | `termsService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| `workType.controller.js` | `getAll`, `getById`, `create`, `update`, `remove` | `workType.service` — CRUD for `WorkType` |
| `proformaInvoice.controller.js` | `previewFromQuotation`, `getAll`, `getById`, `create`, `update`, `remove` | `proformaInvoice.service`; `getSalesScope` on preview/list/getById |
| `taxInvoice.controller.js` | `previewFromProforma`, `getAll`, `getById`, `create`, `update`, `remove`, `getPdf` | `taxInvoice.service`; `getSalesScope` on preview/list/getById; PDF route lives in `taxInvoice.routes.js` itself, not `pdf.routes.js` |
| `accounts.controller.js` | `listWorkOrders`, `getWorkOrder`, `listExpenses`, `createExpense`, `listExpensePayments`, `approveTaskExpense`, `rejectTaskExpense`, `updateExpensePayment` | `workOrder.service` + `expense.service` |
| `receivables.controller.js` | `list`, `recordPayment`, `listPayments`, `agingSummary`, `getReceiptPdf`, `getStatementPdf` | `receivables.service` + journal posting + AR PDFs |
| `payables.controller.js` | `list`, `recordPayment`, `listPayments`, `agingSummary`, `listPaymentReceipts`, `getPaymentReceipt` | `payables.service` |

---

## 5. Services — every exported function

| File | Function | Brief |
|------|------------|--------|
| `auth.service.js` | `register` | Transaction: Tenant, Role tenant_admin, User; JWT pair |
| | `login` | Validate user/tenant/password; last_login; JWT + permissions |
| | `refreshToken` | Verify refresh JWT; issue access token |
| | `forgotPassword` | Reset token + expiry (email TODO) |
| | `resetPassword` | Hash password; clear tokens |
| | `getCurrentUser` | User + role + permissions + tenant |
| | `changePassword` | Verify old hash; update password |
| `user.service.js` | `getAll` | Users for tenant with role; search/pagination |
| | `getInspectors` | Users whose role name is `inspection_team` |
| | `getById` | |
| | `create` | Hash password; assign role |
| | `update` | Optional password hash |
| | `remove` | Destroy user |
| `role.service.js` | `getAll` | Tenant + global roles; search/date filters |
| | `getById` | |
| | `create` | Unique name; optional `setPermissions` |
| | `update` | Block system roles for rename/delete rules |
| | `remove` | Block if users assigned |
| | `getAllPermissions` | All permissions grouped by module |
| | `assignPermissionsToRole` | `setPermissions` on role |
| `contact.service.js` | `getAll` | Filters + sales contact ID restriction |
| | `getById` | |
| | `create` | `created_by` for sales |
| | `update` | |
| | `remove` | |
| `company.service.js` | `getAll` | Sales: accessible company IDs |
| | `getById` | Includes contacts; appends **`plain.finance`** via `loadCompanyFinanceSnapshot`: deals (count + recent), quotations, proforma invoices, tax invoices, work orders |
| | `create` | |
| | `update` | |
| | `remove` | |
| | `addContact` | `company_contacts` junction |
| | `removeContact` | |
| `supplier.service.js` | `getAll` | Search/filters |
| | `getById` | Includes contacts; appends **`plain.finance`**: purchase orders (count + recent), expenses linked to supplier, outstanding payables balance |
| | `create` | Optional nested contacts |
| | `update` | |
| | `remove` | |
| | `addContact` | Junction |
| | `removeContact` | |
| `lead.service.js` | `getAll` | Sales: assigned OR created_by |
| | `getById` | Includes `approvedByUser` |
| | `create` | Sets lead_number; status `new` |
| | `update` | Block qualified/converted via form; editable statuses only |
| | `qualify` | Manager-only (`isManagerRole`) |
| | `requestApproval` | `pending_approval` + `notifyLeadApprovalRequested` |
| | `approveWithPin` | Verify PIN → qualify |
| | `disqualify` | |
| | `convertToDeal` | Status converted + timestamp |
| | `remove` | Block if converted |
| `productService.service.js` | `getAll` | Filters on catalog |
| | `getById` | |
| | `create` | `findOrCreate` ProductCategory |
| | `update` | |
| | `remove` | |
| `deal.service.js` | `_validateDownstreamSupplier` | Ensures partner ≠ primary and exists |
| | `calculateDealTotals` | Subtotal, VAT, total from line items |
| | `getAll` | Rich filters + includes |
| | `getById` | Full graph incl. **`workOrders`** → **`tasks`** → **`workType`** (sorted newest WO first, tasks by `id`) |
| | `create` | Transaction: Deal, items (incl. `unit_of_measure` per line), WDS, inspection, images, DealTerm, update lead converted |
| | `update` | Preserves `payment_status`/`paid_amount`; syncs WDS, inspection, terms, items |
| | `updatePayment` | Manual API only |
| | `updateCollectionDetails` | Pickup fields |
| | `remove` | destroy |
| | `saveInspectionReport` | Upsert DealInspectionReport |
| `quotation.service.js` | `getAll` | Join deal for search; **`deal.items`** (lightweight ids) nested for UI counts; `subQuery: false` + `distinct` |
| | `getById` | Scope prepared_by for sales; **`deal.items`** + `productService` for line items |
| | `create` | Validates deal + user |
| | `update` | |
| | `remove` | |
| `proformaInvoice.service.js` | `getPreviewFromQuotation` | Deal items + quotation snapshot for create form |
| | `getAll`, `getById` | Paginated list + detail with items, quotation, deal, optional `taxInvoice` |
| | `create` | Transaction: `ProformaInvoice` + `ProformaInvoiceItem` rows; `deal_id` from quotation |
| | `update`, `remove` | Patch header / delete |
| `taxInvoice.service.js` | `getPreviewFromProforma` | Proforma + suggested tax invoice fields |
| | `getAll`, `getById` | List/detail with items + proforma link |
| | `create` | One tax invoice per proforma; always `unpaid` |
| | `update`, `remove` | Patch (ignores manual payment fields from form) / delete |
| `expense.service.js` | `approveTaskExpense` | Validates pending task expense; creates **`Expense`** row (`work_order_task_expense_id` linked); sets approved |
| | `rejectTaskExpense` | Sets `accounts_status` rejected |
| | `createManualExpense` | Manual ledger row; category via **`expense_categories`**; payment status **derived** from `paidAmount` |
| | `updateExpensePayment` | Record a payment against an expense: cumulates `paid_amount`, sets `payment_status` → `partial` or `paid`; rejects if new total exceeds `amount` |
| | `listLedgerExpenses` | Paginated **Expense** with optional `taskExpense` join; supports `paymentStatus` filter |
| `receivables.service.js` | `listReceivables` | Tax invoices with `balance_due > 0`; filters: `companyId`, `dateFrom`, `dateTo`, `search`; computes `balance_due = total - paid_amount`, `overdue_days` |
| | `recordPayment` | Applies payment to a tax invoice: adds to `paid_amount`, sets `payment_status` (`unpaid`/`partial`/`paid`) |
| | `getAgingSummary` | Groups outstanding receivables by company into aging buckets (current 0-30, 31-60, 61-90, 90+) |
| `payables.service.js` | `listPayables` | Approved POs with `balance_due > 0`; filters: `supplierId`, `dateFrom`, `dateTo`, `search`; computes `balance_due`, `overdue_days` from `due_date` |
| | `recordPayment` | Applies payment to a PO: updates `paid_amount` + optional `due_date`; sets `payment_status` |
| | `getAgingSummary` | Groups outstanding payables by supplier into aging buckets (current 0-30, 31-60, 61-90, 90+) |
| `purchaseOrder.service.js` | `getAll` | Search; nested work order / bills |
| | `getById` | |
| | `_validateParty` | Exactly one of company or supplier |
| | `create` | `document_type` quotation or bill; default status by party |
| | `update` | Replace items/terms; bill qty recalc |
| | `remove` | |
| | `ensurePurchaseBillForWorkOrder` | Auto client + vendor bills on WO complete |
| `inspectionRequest.service.js` | `getAll` | Deals with inspection request; role-based visibility |
| | `getById` | |
| | `updateStatus` | Validates ENUM; updates `deal_inspection_requests.status` |
| `workOrder.service.js` | `getAll` | Search, deal, status; tasks sorted by `sort_order` |
| | `getById` | Deal + tasks + `purchaseBills` + expenses |
| | `create` | Requires approved quotation XOR PO (not bill); unique per source |
| | `update` | Replace tasks + expense rows if provided |
| | `updateTaskStatus` | On WO `completed` → purchase bills + GRN |
| | `updateTaskNotes` | Single task notes |
| | `updateTaskAssignment` | Assign user/driver |
| | `remove` | Deletes tasks then WO |
| `notification.service.js` | `getForUser`, `markRead`, `markAllRead`, `createForUsers` | In-app notifications |
| | `notifyLeadApprovalRequested`, `notifyDealStatusChange`, `notifyInspectionRejected` | Event hooks |
| `expenseCategory.service.js` | CRUD + `resolveCategoryValue` | Tenant categories |
| `dashboard.service.js` | `getOverview` | Role-specific KPIs |
| `grn.service.js` | CRUD + `approve` + `ensureGrnForWorkOrder` | GRN + inventory |
| `driver.service.js` | Pickup list/start/complete | Driver tasks |
| `journalEntry.service.js` | Manual/auto journal posting | GL integration |
| `chartOfAccounts.service.js` | COA CRUD + seed | |
| `fiscalYear.service.js` | FY + period management | |
| `reports.service.js` | Financial report queries | |
| `paymentTransaction.service.js` | Payment history rows | Receivables/payables/expenses |
| `workType.service.js` | `getAll`, `getById`, `create`, `update`, `remove` | Tenant-scoped `work_types`; multiple rows may have **`is_default`**; delete blocked if tasks reference `work_type_id` |
| `termsAndConditions.service.js` | `getAll` | Tenant filter |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| `tenant.service.js` | `getById` | Sanitized settings + `lead_approval_pin_configured` |
| | `update` | Patch org fields |
| | `updateLeadApprovalPin` | Hash PIN in `settings` |
| `pdf.service.js` | `formatDate` | UK date string |
| | `formatNum` | Decimal display |
| | `isApprovedStatus` | Checks approved |
| | `getVat` | TRN from tenant |
| | `renderTemplate` | `{{key}}` replacement in HTML file |
| | `htmlToPdf` | Puppeteer launch → pdf buffer |
| | `generateQuotationPdf` | Load quotation+deal; build HTML; PDF |
| | `generatePurchaseOrderPdf` | Load PO; build HTML; PDF |

---

## 6. Middleware — exports

| File | Export | Brief |
|------|--------|--------|
| `auth.js` | `authenticate` | JWT required; loads user + permissions |
| | `authorize(...permissions)` | Requires any permission; super_admin bypass |
| | `authorizeRole(...roles)` | Role name match |
| | `optionalAuth` | Sets user if valid token, no error |
| `errorHandler.js` | `errorHandler` | Maps errors → JSON |
| | `notFoundHandler` | 404 ApiError |
| | `asyncHandler` | Promise.catch → next |
| `multiTenant.js` | `tenantContext` | Header tenant if missing |
| | `requireTenant` | 400 if no tenant |
| | `applyTenantScope` | Sequelize scope helper |
| | `addTenantHooks` | Sequelize hooks for tenant_id |
| | `getTenantModel` | Wrapped find/create/update with tenant |
| `auditLog.js` | `createAuditLog` | Insert AuditLog row |
| | `auditCreate` / `auditUpdate` / `auditDelete` / `auditView` / `auditExport` | res.json wrappers |
| `upload.js` | `uploadSingle`, `uploadMultiple`, `uploadFields` | Multer factories |
| | `deleteFile` | fs.unlink |
| | `getFileUrl` | `/uploads/...` URL |
| `validator.js` | `validate` | express-validator → ApiError.validationError |

---

## 7. Utils — functions

| File | Function | Brief |
|------|----------|--------|
| `apiError.js` | `constructor` | message, statusCode, errors |
| | `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `validationError`, `internalError` | Static factories |
| `apiResponse.js` | `success`, `created`, `noContent`, `paginated`, `error`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `validationError`, `serverError` | JSON helpers |
| `helpers.js` | `hashPassword`, `comparePassword` | bcrypt |
| | `generateToken`, `generateRefreshToken`, `verifyToken`, `verifyRefreshToken` | JWT |
| | `generateRandomString` | crypto |
| | `generateInvoiceNumber`, `generateLotNumber` | String codes |
| | `getPaginationParams` | Page, pageSize, offset, limit |
| | `calculateVAT`, `calculateAmountWithVAT` | VAT math |
| | `formatCurrency`, `formatDate` | Display |
| | `sanitizeObject`, `deepClone`, `isEmpty` | Objects |
| | `slugify`, `generateOTP`, `maskEmail`, `maskPhone` | Misc |
| | `calculateAge`, `sleep` | Misc |
| `logger.js` | (default export) | Winston + file transports + `logger.stream` for morgan |
| `scopeHelper.js` | `getSalesScope` | `{ scopeUserId }` for **`sales` only** (not `sales_manager`) |
| | `getSalesRelatedCompanyIds` | SQL union leads/deals |
| | `getSalesAccessibleCompanyIds` | + companies created_by |
| | `getSalesRelatedContactIds` | Leads/deals + company-linked contacts |
| `leadApproval.js` | `isManagerRole`, `verifyLeadApprovalPin`, `setLeadApprovalPin`, etc. | Lead PIN workflow |
| `dealFinancials.js` | `shouldHideDealFinancials`, `sanitizeDealPayload` | Redact amounts for operations_manager |
| `dateRangeWhere.js` | `applyCreatedAtFilter` | `created_at` range |
| | `applyDateOnlyColumnFilter` | DATE column range |

---

## 8. Database module (`src/database/index.js`)

| Export | Brief |
|--------|--------|
| `sequelize` | Sequelize instance |
| `Sequelize` | Class |
| `testConnection` | `authenticate()` |
| `syncDatabase` | Dev-only sync |
| `closeConnection` | `sequelize.close()` |

---

## 9. Frontend `src/services/api.js` — `ApiService` methods

| Method | Brief |
|--------|--------|
| `constructor()` | Sets `baseURL` from `VITE_API_URL` or default |
| `getUploadUrl(path)` | Prefix `/uploads/` for stored relative paths |
| `getAuthToken()` | Read `accessToken` from localStorage |
| `setAuthToken(token)` | Store access token |
| `setRefreshToken(token)` | Store refresh token |
| `clearTokens()` | Remove both tokens |
| `request(endpoint, options)` | `fetch` JSON; Bearer header; parse JSON; 401 → clear + `/auth/login` |
| `get(endpoint, params)` | QueryString from `params` |
| `post(endpoint, data)` | JSON body |
| `put(endpoint, data)` | JSON body |
| `delete(endpoint)` | DELETE |
| `register(data)` | POST `/auth/register`; stores tokens on success |
| `login(data)` | POST `/auth/login`; stores tokens |
| `logout()` | POST `/auth/logout`; always clearTokens |
| `getCurrentUser()` | GET `/auth/me` |
| `changePassword(data)` | PUT `/auth/change-password` |
| `getContacts(params)` | GET `/contacts` |
| `getContact(id)` | GET `/contacts/:id` |
| `createContact(data)` | POST `/contacts` |
| `updateContact(id, data)` | PUT `/contacts/:id` |
| `deleteContact(id)` | DELETE `/contacts/:id` |
| `getCompanies(params)` | GET `/companies` |
| `getCompany(id)` | GET `/companies/:id` |
| `createCompany(data)` | POST `/companies` |
| `updateCompany(id, data)` | PUT `/companies/:id` |
| `deleteCompany(id)` | DELETE `/companies/:id` |
| `getSuppliers(params)` | GET `/suppliers` |
| `getSupplier(id)` | GET `/suppliers/:id` |
| `createSupplier(data)` | POST `/suppliers` |
| `updateSupplier(id, data)` | PUT `/suppliers/:id` |
| `deleteSupplier(id)` | DELETE `/suppliers/:id` |
| `getLeads(params)` | GET `/leads` |
| `getLead(id)` | GET `/leads/:id` |
| `createLead(data)` | POST `/leads` |
| `updateLead(id, data)` | PUT `/leads/:id` |
| `deleteLead(id)` | DELETE `/leads/:id` |
| `qualifyLead(id, data)` | POST `/leads/:id/qualify` (managers) |
| `requestLeadApproval(id)` | POST `/leads/:id/request-approval` |
| `approveLeadWithPin(id, pin)` | POST `/leads/:id/approve-with-pin` |
| `disqualifyLead(id, data)` | POST `/leads/:id/disqualify` |
| `convertLead(id, data)` | POST `/leads/:id/convert` |
| `getProducts(params)` | GET `/products` |
| `getProduct(id)` | GET `/products/:id` |
| `createProduct(data)` | POST `/products` |
| `updateProduct(id, data)` | PUT `/products/:id` |
| `deleteProduct(id)` | DELETE `/products/:id` |
| `getDeals(params)` | GET `/deals` |
| `getDeal(id)` | GET `/deals/:id` |
| `createDeal(data)` | POST `/deals` |
| `updateDeal(id, data)` | PUT `/deals/:id` |
| `updateDealCollectionDetails(id, data)` | PATCH `/deals/:id/collection-details` |
| `deleteDeal(id)` | DELETE `/deals/:id` |
| `updateDealPayment(id, paidAmount)` | POST `/deals/:id/payment` |
| `generateLocationShareToken(dealId)` | POST `/location-share/deals/:dealId/token` |
| `getLocationShareInfo(token)` | GET `/location-share/pin/:token` (public) |
| `submitClientLocation(token, pickupLocation)` | POST `/location-share/pin/:token` (public) |
| `saveInspectionReport(dealId, data)` | PUT `/deals/:dealId/inspection-report` |
| `getInspectionRequests(params)` | GET `/inspection-requests` |
| `getInspectionRequest(id)` | GET `/inspection-requests/:id` |
| `updateInspectionRequestStatus(id, status)` | PATCH `/inspection-requests/:id/status` |
| `updateInspectionRequestPriority(id, priority)` | PATCH `/inspection-requests/:id/priority` |
| `acceptInspectionRequest(id)` | POST `/inspection-requests/:id/accept` |
| `rejectInspectionRequest(id, data)` | POST `/inspection-requests/:id/reject` |
| `getNotifications(params)` | GET `/notifications` |
| `markNotificationRead(id)` | PATCH `/notifications/:id/read` |
| `markAllNotificationsRead()` | PATCH `/notifications/read-all` |
| `getInspectors()` | GET `/users/inspectors` |
| `getAssignees()` | GET `/users/assignees` |
| `getDrivers()` | GET `/users/drivers` |
| `getQuotations(params)` | GET `/quotations` |
| `getQuotation(id)` | GET `/quotations/:id` |
| `createQuotation(data)` | POST `/quotations` |
| `updateQuotation(id, data)` | PUT `/quotations/:id` |
| `approveQuotation(id)` | POST `/quotations/:id/approve` |
| `requestQuotationApproval(id)` | POST `/quotations/:id/request-approval` |
| `approveQuotationWithPin(id, pin)` | POST `/quotations/:id/approve-with-pin` |
| `deleteQuotation(id)` | DELETE `/quotations/:id` |
| `downloadQuotationPdf(id, { documentType })` | GET blob `/quotations/:id/pdf`; trigger download |
| `getProformaPreviewFromQuotation(quotationId)` | GET `/proforma-invoices/preview-from-quotation/:quotationId` |
| `getProformaInvoices(params)` | GET `/proforma-invoices` |
| `getProformaInvoice(id)` | GET `/proforma-invoices/:id` |
| `createProformaInvoice(data)` | POST `/proforma-invoices` |
| `updateProformaInvoice(id, data)` | PUT `/proforma-invoices/:id` |
| `deleteProformaInvoice(id)` | DELETE `/proforma-invoices/:id` |
| `getTaxPreviewFromProforma(proformaInvoiceId)` | GET `/tax-invoices/preview-from-proforma/:proformaInvoiceId` |
| `getTaxInvoices(params)` | GET `/tax-invoices` |
| `getTaxInvoice(id)` | GET `/tax-invoices/:id` |
| `createTaxInvoice(data)` | POST `/tax-invoices` |
| `updateTaxInvoice(id, data)` | PUT `/tax-invoices/:id` |
| `deleteTaxInvoice(id)` | DELETE `/tax-invoices/:id` |
| `downloadTaxInvoicePdf(id)` | GET blob `/tax-invoices/:id/pdf` |
| `uploadTaxInvoiceAttachment(file)` | POST FormData `/upload/tax-invoice-attachment` |
| `getAccountsWorkOrders(params)` | GET `/accounts/work-orders` |
| `getAccountsWorkOrder(id)` | GET `/accounts/work-orders/:id` |
| `getAccountsExpenses(params)` | GET `/accounts/expenses` |
| `createAccountsExpense(data)` | POST `/accounts/expenses` |
| `approveAccountsTaskExpense(workOrderId, taskExpenseId, data)` | POST `/accounts/work-orders/:workOrderId/task-expenses/:taskExpenseId/approve` |
| `rejectAccountsTaskExpense(workOrderId, taskExpenseId)` | POST `/accounts/work-orders/:workOrderId/task-expenses/:taskExpenseId/reject` |
| `patchAccountsExpensePayment(id, data)` | PATCH `/accounts/expenses/:id/payment` |
| `getExpensePayments(id)` | GET `/accounts/expenses/:id/payments` |
| `getReceivables(params)` | GET `/receivables` |
| `postReceivablePayment(id, data)` | POST `/receivables/:id/payment` |
| `getReceivablePayments(id)` | GET `/receivables/:id/payments` |
| `getReceivablesAgingSummary(params)` | GET `/receivables/aging-summary` |
| `downloadReceivableReceiptPdf(paymentId)` | GET blob `/receivables/payments/:paymentId/receipt/pdf` |
| `downloadCompanyStatementPdf(companyId, params)` | GET blob `/receivables/companies/:companyId/statement/pdf` |
| `getPayables(params)` | GET `/payables` |
| `postPayablePayment(id, data)` | POST `/payables/:id/payment` |
| `getPayablePayments(id)` | GET `/payables/:id/payments` |
| `getPayablesAgingSummary(params)` | GET `/payables/aging-summary` |
| `getPurchasePaymentReceipts(params)` | GET `/payables/payment-receipts` |
| `getPurchasePaymentReceipt(paymentId)` | GET `/payables/payment-receipts/:paymentId` |
| `getExpenseCategories(params)` | GET `/expense-categories` |
| `createExpenseCategory(data)` | POST `/expense-categories` |
| `getGrns(params)` / `getGrn(id)` / `createGrn` / `updateGrn` / `approveGrn` | `/grn` CRUD + approve |
| `downloadGrnPdf(id)` | GET blob `/grn/:id/pdf` |
| `getDashboardOverview()` | GET `/dashboard/overview` |
| `getDriverPickups()` / `startDriverPickup` / `completeDriverPickup` | `/driver/pickups` |
| `getFiscalYears()` … `reopenPeriod(fyId, periodId)` | `/fiscal-years` |
| `getChartOfAccounts()` … `seedChartOfAccounts()` | `/chart-of-accounts` |
| `getJournalEntries()` … `voidJournalEntry(id)` | `/journal` |
| `getTrialBalance()` … `getVatReport()` | `/reports/*` |
| `getPurchaseOrders(params)` | GET `/purchase-orders` |
| `getPurchaseOrder(id)` | GET `/purchase-orders/:id` |
| `createPurchaseOrder(data)` | POST `/purchase-orders` |
| `updatePurchaseOrder(id, data)` | PUT `/purchase-orders/:id` |
| `approvePurchaseOrder(id)` | POST `/purchase-orders/:id/approve` |
| `requestPurchaseOrderApproval(id)` | POST `/purchase-orders/:id/request-approval` |
| `approvePurchaseOrderWithPin(id, pin)` | POST `/purchase-orders/:id/approve-with-pin` |
| `deletePurchaseOrder(id)` | DELETE `/purchase-orders/:id` |
| `downloadPurchaseOrderPdf(id, { documentType })` | GET blob `/purchase-orders/:id/pdf` |
| `getTermsAndConditions(params)` | GET `/terms` |
| `getTermsAndConditionsById(id)` | GET `/terms/:id` |
| `createTermsAndConditions(data)` | POST `/terms` |
| `updateTermsAndConditions(id, data)` | PUT `/terms/:id` |
| `deleteTermsAndConditions(id)` | DELETE `/terms/:id` |
| `getMaterialTypes()` | GET `/material-types` |
| `uploadDealImage(file)` | POST FormData `/upload/deal-image` |
| `uploadWdsAttachment(file)` | POST FormData `/upload/wds-attachment` |
| `uploadInspectionDocument(file)` | POST FormData `/upload/inspection-document` |
| `uploadExpenseEvidence(file)` | POST FormData `/upload/expense-evidence` |
| `getTenant()` | GET `/tenants/me` |
| `getPublicLogo()` | GET `/tenants/logo` (no auth) |
| `updateTenant(data)` | PUT `/tenants/me` |
| `updateLeadApprovalPin(pin)` | PUT `/tenants/me/lead-approval-pin` |
| `uploadTenantLogo(file)` | POST FormData `/upload/tenant-logo` |
| `getAllDropdowns()` | GET `/dropdowns/all` |
| `getDropdownsByCategory(category)` | GET `/dropdowns/category/:category` |
| `createDropdown(data)` | POST `/dropdowns` |
| `updateDropdown(id, data)` | PUT `/dropdowns/:id` |
| `deleteDropdown(id)` | DELETE `/dropdowns/:id` |
| `getUsers(params)` | GET `/users` |
| `getUser(id)` | GET `/users/:id` |
| `createUser(data)` | POST `/users` |
| `updateUser(id, data)` | PUT `/users/:id` |
| `deleteUser(id)` | DELETE `/users/:id` |
| `getRoles(params)` | GET `/roles` |
| `getRole(id)` | GET `/roles/:id` |
| `createRole(data)` | POST `/roles` |
| `updateRole(id, data)` | PUT `/roles/:id` |
| `deleteRole(id)` | DELETE `/roles/:id` |
| `assignRolePermissions(roleId, permissionIds)` | POST `/roles/:roleId/permissions` |
| `getAllPermissions()` | GET `/roles/permissions/all` |
| `getWorkOrders(params)` | GET `/work-orders` |
| `getWorkOrder(id)` | GET `/work-orders/:id` |
| `createWorkOrder(data)` | POST `/work-orders` |
| `updateWorkOrder(id, data)` | PUT `/work-orders/:id` |
| `deleteWorkOrder(id)` | DELETE `/work-orders/:id` |
| `updateWorkOrderTaskStatus(workOrderId, taskId, status)` | PATCH `/work-orders/:id/tasks/:taskId/status` |
| `updateWorkOrderTaskNotes(workOrderId, taskId, notes)` | PATCH `/work-orders/:id/tasks/:taskId/notes` |
| `updateWorkOrderTaskAssignment(workOrderId, taskId, assignedTo)` | PATCH `/work-orders/:id/tasks/:taskId/assign` |
| `getWorkTypes(params)` | GET `/work-types` |
| `getWorkType(id)` | GET `/work-types/:id` |
| `createWorkType(data)` | POST `/work-types` |
| `updateWorkType(id, data)` | PUT `/work-types/:id` |
| `deleteWorkType(id)` | DELETE `/work-types/:id` |
| `_filenameFromContentDisposition(disposition, fallback)` | Parse `filename` from header |

**Default export:** `apiService` singleton.

### 9.1 Frontend router (`clearearth-frontend/src/routes/Router.js`)

Lazy routes use `lazyWithChunkReload` + auto-reload on stale deploy chunks (`utils/chunkReload.js`, `ChunkLoadErrorElement`).

| Path pattern | Screen component |
|--------------|------------------|
| `/`, `/erp`, `/erp/dashboard` | **DashboardRouter** (role-aware) |
| `/erp/contacts`, `.../create`, `.../edit/:id` | Contact list / form |
| `/erp/companies`, `.../create`, `.../edit/:id`, `.../view/:id` | Companies |
| `/erp/suppliers`, `.../create`, `.../edit/:id`, `.../view/:id` | Suppliers |
| `/erp/leads`, `.../create`, `.../edit/:id` | Leads (+ post-save approval PIN / request dialog) |
| `/erp/products`, `.../create`, `.../edit/:id` | Products |
| `/erp/deals`, `.../create`, `.../edit/:id`, `.../view/:id` | Deals (no payment fields on form; amounts via invoices) |
| `/erp/terms`, `.../create`, `.../edit/:id` | Terms |
| `/erp/quotations`, `/erp/service-orders` | Service quotations / approved service orders |
| `/erp/client-purchase-quotations`, `/erp/vendor-purchase-quotations` | Client/vendor purchase quotations |
| `/erp/client-purchase-orders`, `/erp/supplier-purchase-orders` | Approved POs + purchase bill create/open |
| `/erp/quotations/create`, `.../view/:id`, `.../edit/:id` | QuotationForm / QuotationView |
| `/erp/proforma-invoices`, `.../create/:quotationId`, `.../view/:id` | Proforma |
| `/erp/tax-invoices`, `.../create/:proformaId`, `.../view/:id`, `.../edit/:id` | Tax invoices |
| `/erp/accounts/expenses`, `.../create`, `.../work-orders`, `.../work-orders/view/:id` | Expenses (+ categories Add New), Accounts WO approve/reject |
| `/erp/receivables`, `/erp/receivables/aging` | Receivables + aging |
| `/erp/payables`, `/erp/payables/aging` | Payables + aging |
| `/erp/payment-receipts`, `.../:id` | Purchase (AP) payment receipts list / view |
| `/erp/account/password` | Self-service change password (all roles) |
| `/erp/purchase-orders`, `.../create`, `.../view/:id`, `.../edit/:id` | PO form/view (`?bill=1` for purchase bills) |
| `/erp/grn`, `.../create`, `.../edit/:id`, `.../view/:id` | GRN module |
| `/erp/chart-of-accounts` | ChartOfAccountsList |
| `/erp/journal`, `.../create`, `.../view/:id`, `/erp/opening-balances` | Journal + opening balances |
| `/erp/reports/trial-balance`, `general-ledger`, `income-statement`, `balance-sheet`, `cash-flow`, `changes-in-equity`, `vat-report` | Financial reports |
| `/erp/settings/fiscal-years` | FiscalYearManager |
| `/erp/settings/company` | CompanySettings (+ lead approval PIN for admins) |
| `/erp/roles`, `.../create`, `.../edit/:id` | Roles |
| `/erp/users`, `.../create`, `.../edit/:id` | Users |
| `/erp/inspection-requests`, `/erp/inspection-requests/:id` | Inspection list / detail |
| `/erp/work-orders`, `.../view/:id`, `.../edit/:id` | Work orders (**no** standalone create — from quotation/PO) |
| `/location-pin/:token` | **ClientLocationPicker** (public) |
| `/auth/login`, etc. | Auth / error / maintenance |

### 9.2 `AuthContext` (`src/context/AuthContext.jsx`)

| Export / method | Brief |
|-----------------|--------|
| `AuthProvider` | Wraps children; holds user, tenant, permissions, loading, isAuthenticated |
| `loadUser` | If token: `GET /auth/me`; sets state; caches tenant logo in sessionStorage |
| `login` | `api.login` → set state → `loadUser` |
| `register` | Same pattern |
| `logout` | `api.logout` → clear state |
| `hasPermission(permission)` | `super_admin` → true; else permissions array |
| `hasAnyPermission(list)` | Any match |
| `hasRole(role)` | Compare role name |
| `hasAdminDashboardAccess` | admin, tenant_admin, super_admin |
| `useAuth` | Context consumer |

---

## 10. SQL & migrations (short)

- **`clearearth_erp.sql`:** Full phpMyAdmin dump (schema + data) for `clearearth_erp`.
- **`src/database/migrate.js`:** Runs every `migrations/*.js` in filename order; no migration metadata table.
- **`run-migration.js`:** **Primary production migration** — idempotent raw SQL + role/permission seeds. Notable batches:
  - CRM: `leads.created_by`, **`leads.approve`** permission, lead approval columns + `pending_approval` status
  - Deals: `deal_type`, WDS, `is_rcm_applicable`, collection fields, `deal_location_tokens`
  - Operations: `work_orders.quotation_id` / `purchase_order_id` (unique), `sort_order` on tasks, expense evidence, GRN tables + permissions, `driver` role
  - Purchase: `purchase_orders.document_type`, `work_order_id`, purchase bill auto-flow support
  - Accounting: `chart_of_accounts`, `journal_entries`, `journal_entry_lines`, `fiscal_years`, `accounting_periods`, `payment_transactions`, `expense_categories` seed
  - ERP enhancements: `notifications`, inspection priority/accept-reject, status `draft` → `new` renames
  - Permissions: `quotations.*`, `purchase_orders.*`, `accounting.*`, `reports.*`, `operations.*`, `grn.*`, `dashboard.read`; suppliers for sales/sales_manager; accounts role matrix
- **Sequelize migrations** (`src/database/migrations/`): includes `20260223*` initial schema, `20260224` deal-type/WDS, `20260403` status updates, `20260424` RCM, `20260525` ERP enhancements, `20260530` journal counterparty + payment_transactions + GRN + collection fields + deal location tokens, `20260601` deal location tokens, `20260611` pickup task fields, and (new since last doc pass) `20260709000000-purchase-order-created-by`, `20260709100000-contact-type-both`, `20260709120000-payment-transaction-receipt-number`, `20260711000000-grn-item-extra-fields` (adds `grn_items.make/model/serial_number/units`).
- **Scripts:** `scripts/deploy-production.sh`, `scripts/deploy-all-production.sh` (both VPS), `scripts/nginx-clearearth-snippet.conf` (cache: immutable `/assets/`, no-cache `index.html`), `src/scripts/migrate-historical-journal-entries.js`.

---

## 11. Sequelize models (`src/models/*.js`)

Each file default-exports a **factory** `(sequelize, DataTypes) => Model` with `Model.associate(db)`. Wired in `models/index.js`.

**Core:** `Tenant` (`settings` JSON incl. lead PIN hash), `User`, `Role`, `Permission`, `RolePermission`, `AuditLog`, **`Notification`**.

**CRM:** `Contact`, `Company`, `CompanyContact`, `Supplier`, `SupplierContact`, **`Lead`** (`pending_approval`, `approval_requested_at`, `approved_by`, `approved_at`).

**Deals:** `Deal` (`deal_type`, `is_rcm_applicable`, pickup fields, `payment_status`/`paid_amount`), `DealItem`, `DealWds`, `DealWdsAttachment`, `DealInspectionRequest` (priority, accept/reject), `DealInspectionReport`, `DealImage`, `DealTerm`, **`DealLocationToken`**.

**Catalog / dropdowns:** `ProductService`, `MaterialType`, `TermsAndConditions`, designation/industry/city/country/lead-source/etc. lookup tables.

**Sales docs:** `Quotation`, `ProformaInvoice`, `ProformaInvoiceItem`, `TaxInvoice`, `TaxInvoiceItem`, **`PurchaseOrder`** (`document_type`, `work_order_id`, payment fields), `PurchaseOrderItem`, `PurchaseOrderTerm`.

**Operations:** **`WorkOrder`** (`quotation_id`, `purchase_order_id`), `WorkOrderTask` (`sort_order`, `work_type_id`), `WorkOrderTaskExpense` (evidence, `accounts_status`), `WorkType`, **`Grn`**, `GrnItem`, `GrnImage`, **`Inventory`**.

**Accounting:** **`Expense`** (ledger), **`ExpenseCategory`**, `FiscalYear`, `AccountingPeriod`, `ChartOfAccounts`, `JournalEntry`, `JournalEntryLine`, **`PaymentTransaction`**.

---

## 12. Frontend entry (`main.jsx`, `App.jsx`)

| File | Role |
|------|------|
| `main.jsx` | React `createRoot`; `installGlobalChunkReloadHandlers()` for post-deploy chunk errors; Customizer + Auth providers |
| `App.jsx` | `ThemeProvider` + `RTL` + `RouterProvider(router)` |

---

## 13. Backend constants (`src/constants/index.js`)

Exports: `USER_STATUS`, `RECORD_STATUS`, **`LEAD_STATUS`** (incl. `pending_approval`), **`MANAGER_ROLES`**, `MODULES`, `ACTIONS`. Note: live permission modules in DB exceed `MODULES` enum (see §2.1).

---

## 14. Observations

- **Products & terms routes:** Authenticated but no `authorize('products.*')` — any logged-in user for catalog/terms CRUD.
- **Deal payment:** Form UI removed; `payment_status` on deals preserved on update but not accepted from form; receivable payments update tax invoices (not deal row automatically).
- **Permission dual-check:** Many routes accept `accounting.*` OR legacy `deals.*` during migration — prefer `accounting.*` for new accounts users.
- **`sales_manager` vs `sales`:** Only `sales` gets `scopeUserId`; managers see all CRM.
- **`migrate.js` vs `run-migration.js`:** Production uses **`npm run run-migration`**; Sequelize `migrate.js` is secondary.
- **SPA deploy:** Hashed Vite chunks require no-cache `index.html` or auto-reload (`chunkReload.js`) after deploys.
- **`helpers.verifyToken`:** Throws generic `Error` — JWT errors normalized in `errorHandler`.
- **Approve-with-pin now spans 3 modules:** leads, quotations, and purchase orders all share the same `request-approval` + `approve-with-pin` pattern (tenant PIN in `tenants.settings.leadApprovalPinHash`, verified by `leadApproval.js`) — despite the util's name being lead-specific, quotation/PO routes reuse it directly.
- **Frontend dropped lead-approval UI** (commit "Remove lead approval dialogs and PIN UI — leads no longer require approval") while the backend lead routes/columns (`qualify`, `request-approval`, `approve-with-pin`) remain live — leads are effectively auto-qualified from the UI now, but the API still enforces the old workflow if called directly.
- **Admin panel (`/system-console`)** bypasses tenant scoping and soft-delete entirely — treat it as a break-glass tool, not a tenant-facing feature (see §3.38).

---

## 15. Frontend features (non-API reference)

- **Lead approval:** Backend routes (`qualify`/`request-approval`/`approve-with-pin`) still exist, but the frontend no longer shows the PIN/approval dialogs for leads (removed) — leads save straight through. **Quotations and purchase orders now use the same approve-with-pin pattern instead** (`ApprovalWorkflowDialogs.jsx`, `ApproveQuotationConfirmDialog.jsx`); PIN configured in Company Settings (admin).
- **Notifications:** Header bell (`Notifications.js`) polls `/notifications`; links to leads/deals/inspections.
- **Deal & quotation lists:** Inline status change; deal **Lost** prompts for **`loss_reason`**. Deal form has **no payment section** — tracking via tax invoices/receivables.
- **Deal view:** Work progress pipeline; **location share** link for client map pin; operations_manager sees deals **without amounts**.
- **Quotations & POs:** Service orders, client/vendor purchase quotations and orders as separate lists; PO/bill views with PDF download.
- **Work orders:** Created only from approved **service order** or **PO** (Open vs Create button). **WorkOrderView:** drag-reorder tasks, completion report PDF (print-safe), client/vendor **purchase bills** after completion, GRN link, task assign to driver, expense evidence. No global "New work order" button.
- **Purchase bills:** OTP flow — bills auto-created on WO complete; editable qty; PDF; client and vendor bill lists from WO/PO screens (`?bill=1&companyId=` / `supplierId=`).
- **Proforma & tax invoices:** Standard create chain; tax invoice payment status read-only / derived from receivable payments.
- **Accounts:** Expenses with **expense category** `SelectWithAddNew`; payment status auto-derived on create. GL: chart of accounts, journal, opening balances, seven reports, fiscal years.
- **Receivables / Payables:** Record payment dialogs + payment history; aging summary views; AR **payment receipt PDF** and **company statement PDF** downloads; AP **payment receipts list** with receipt detail view.
- **GRN:** List/create/edit/view/approve with per-item images plus optional make/model/serial/units fields; **GRN PDF report** download.
- **Word/Excel uploads:** Inspection request document uploads accept Word/Excel MIME types (with by-extension fallback when the browser misreports MIME) and support multi-file drag-and-drop; supporting documents stored as a JSON array (multiple files per request).
- **Driver:** Pickup task start/complete (role-gated menu).
- **Company / Supplier views:** Tabbed finance snapshots (invoices, receivables/payables, work orders/POs).
- **Chunk reload:** After deploy, stale lazy chunks auto-refresh once instead of showing import error screen.

---

## 16. Production VPS deployment (reference)

| Host | URL | SSH |
|------|-----|-----|
| **Primary** | http://72.60.223.25:3333/ | `ssh root@72.60.223.25` |
| **Secondary** | http://72.60.222.81:3333/ | `ssh root@72.60.222.81` |

**Paths:** `/var/www/clearearth-backend`, `/var/www/clearearth-frontend`. **PM2:** `clearearth-api` → `src/server.js` on `127.0.0.1:3000`. **Nginx:** port **3333** only — static `dist/`, proxy `/api` + `/uploads` → 3000. Site config: `/etc/nginx/sites-available/clearearth`. Recommended cache headers in `scripts/nginx-clearearth-snippet.conf`.

**Automated deploy (from dev machine, Git Bash):**

```bash
cd clearearth-backend
npm run deploy:vps        # primary only
npm run deploy:vps:all    # both hosts (DEPLOY_HOSTS comma-separated)
```

Script pulls both repos on server, runs `npm run run-migration`, `pm2 restart clearearth-api`, `npm ci && npm run build` for frontend, reloads nginx.

**Manual deploy:** See **`DEPLOYMENT.md`** and **`DEPLOYMENT_GUIDE.md`**.

**Repos:** `clearearth-backend` + `clearearth-frontend` on GitHub (`abdulkarimtaji33`), branch `main`.

---

*End of documentation.*
