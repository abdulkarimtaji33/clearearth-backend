# ClearEarth ERP — Codebase Documentation

**Scope:** Application source under `clearearth-backend` and `clearearth-frontend/src` (excludes `node_modules`, build output, `.git`).  
**API base (default):** `/api/v1` — from `config.app.version` (`API_VERSION` env).

---

## 1. Project overview

Multi-tenant ERP for UAE recycling/waste: CRM (leads, contacts, companies, suppliers), deals (line items, VAT, WDS, inspections), quotations, purchase orders, work orders, roles/permissions, PDFs (Puppeteer), uploads. JWT carries `userId` and `tenantId`; data scoped by `tenant_id`. **Sales** users are scoped to own records via `scopeHelper` + services.

---

## 2. Architecture & stack

| Layer | Stack |
|-------|--------|
| Frontend | React 19, Vite 6, MUI 7, React Router 7, Formik, `fetch` API client (`src/services/api.js`) |
| Backend | Express 4, Sequelize 6, MySQL/MariaDB, JWT, Multer, Winston, Puppeteer (PDF) |
| Config | `dotenv`, `helmet`, `cors`, `compression` (PDF routes excluded from gzip) |

---

## 3. Complete HTTP API reference

All routes below are relative to **`/api/v1`** unless noted. **App-level** routes (on `app.js`): `GET /health`, `GET /`, static `/uploads`, then `use('/api/v1', routes)`.

### 3.1 PDF (mounted first so `/quotations/:id/pdf` wins)

| Method | Path | Auth | Extra middleware | Handler | Brief |
|--------|------|------|------------------|---------|--------|
| GET | `/quotations/:id/pdf` | `authenticate` | — | `quotationController.getPdf` | Stream quotation PDF (Puppeteer) |
| GET | `/purchase-orders/:id/pdf` | `authenticate` | — | `purchaseOrderController.getPdf` | Stream PO PDF |

### 3.2 API root

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/` | No | Inline | JSON listing nested endpoint paths |

### 3.3 Auth — `routes/auth.routes.js` → `/auth`

| Method | Path | Auth | Validation / notes | Handler | Brief |
|--------|------|------|--------------------|---------|--------|
| POST | `/auth/register` | No | registerValidation | `register` | Create tenant + tenant_admin user; returns tokens |
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
| GET | `/leads/:id` | Yes | `leads.read` | `getById` | One lead |
| POST | `/leads` | Yes | `leads.create` + createValidation | `create` | Create lead |
| PUT | `/leads/:id` | Yes | `leads.update` + updateValidation | `update` | Update |
| POST | `/leads/:id/qualify` | Yes | `leads.update` | `qualify` | Set qualified + notes |
| POST | `/leads/:id/disqualify` | Yes | `leads.update` | `disqualify` | Set disqualified + reason |
| POST | `/leads/:id/convert` | Yes | `leads.update` | `convertToDeal` | Mark converted (deal created separately in UI) |
| DELETE | `/leads/:id` | Yes | `leads.delete` | `remove` | Delete if not converted |

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
| GET | `/deals/:id` | Yes | `deals.read` | `getById` | Full graph (items, WDS, inspection, terms, images) |
| POST | `/deals` | Yes | `deals.create` | `create` | Create deal + items + optional WDS/inspection/images/terms |
| PUT | `/deals/:id` | Yes | `deals.update` | `update` | Update deal |
| DELETE | `/deals/:id` | Yes | `deals.delete` | `remove` | Soft delete |
| POST | `/deals/:id/payment` | Yes | `deals.update` | `updatePayment` | Set paid amount → payment_status |
| PUT | `/deals/:id/inspection-report` | Yes | `deals.read` OR `inspection_reports.create` OR `inspection_reports.update` | `saveInspectionReport` | Upsert inspection report |

**Deal `status` (ENUM):** `new`, `approved`, `quotation_sent`, `negotiation`, `won`, `lost`. Optional **`loss_reason`** (TEXT) when status is `lost`.  
**Line items (`items[]` on create/update):** each item may include **`unitOfMeasure`** (string, matches `units_of_measure.value`) → stored as **`deal_items.unit_of_measure`** (see `DealItem` model).

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
| POST | `/upload/wds-attachment` | Yes | `uploadSingle('file')` | `uploadWdsAttachment` | WDS attachment path + original name |
| POST | `/upload/tenant-logo` | Yes | `uploadSingle('file')` | `uploadTenantLogo` | Sets `tenant.logo` |

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
| PUT | `/quotations/:id` | Yes | `update` | Update |
| DELETE | `/quotations/:id` | Yes | `remove` | Delete |

*Duplicate PDF route also at §3.1.*

### 3.17 Purchase orders — `/purchase-orders`

| Method | Path | Auth | Handler | Brief |
|--------|------|------|---------|--------|
| GET | `/purchase-orders` | Yes | `getAll` | Paginated |
| GET | `/purchase-orders/:id` | Yes | `getById` | Items + terms |
| POST | `/purchase-orders` | Yes | `create` | Company XOR supplier + items + terms; **default status** `draft` (client) / `approved` (supplier/downstream) |
| PUT | `/purchase-orders/:id` | Yes | `update` | Update |
| DELETE | `/purchase-orders/:id` | Yes | `remove` | Delete |

### 3.18 Inspection requests — `/inspection-requests`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/inspection-requests` | Yes | `inspection_requests.read` | `getAll` | List from deals with inspection |
| GET | `/inspection-requests/:id` | Yes | `inspection_requests.read` | `getById` | Single request detail |
| PATCH | `/inspection-requests/:id/status` | Yes | `inspection_requests.update` | `updateStatus` | Body `{ status }` — pipeline: `request_submitted`, `team_assigned`, `inspection_completed`, `report_submitted` |

### 3.19 Work orders — `/work-orders`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/work-orders` | Yes | `deals.read` | `getAll` | Paginated |
| GET | `/work-orders/:id` | Yes | `deals.read` | `getById` | Detail + tasks (tasks include `workType` join when `work_type_id` set) |
| POST | `/work-orders` | Yes | `deals.create` | `create` | Create WO + tasks; `created_by` = user |
| PUT | `/work-orders/:id` | Yes | `deals.update` | `update` | Update WO + replace tasks if sent |
| PATCH | `/work-orders/:id/tasks/:taskId/status` | Yes | `deals.update` | `updateTaskStatus` | Body `{ status }` — `not_started` \| `in_progress` \| `completed` |
| DELETE | `/work-orders/:id` | Yes | `deals.delete` | `remove` | Delete WO + tasks |

**Task payload (create/update `tasks[]`):** `dealId`, `title`, `notes`, `status` on WO; each task supports `workTypeId` (preferred, tenant-scoped `work_types.id`), `typeOfWork` (legacy free text if no id), **`expenses[]`** `{ amount, description? }` (or legacy single **`expense`**), `estimatedDuration`, `startDate`, `endDate`, `assignedTo`, `status`, `notes`. Service resolves `type_of_work` + `work_type_id` from `workTypeId` when present.

### 3.20 Work types (catalog) — `/work-types`

Tenant-scoped labels for work-order task “type of work”. Mounted in `routes/index.js`.

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/work-types` | Yes | `deals.read` | `getAll` | Query: `search`, `activeOnly` (default active only) |
| GET | `/work-types/:id` | Yes | `deals.read` | `getById` | One row |
| POST | `/work-types` | Yes | `deals.create` | `create` | Body: `name`, `displayOrder`, `isActive`, optional **`isDefault`** (many rows may be default per tenant) |
| PUT | `/work-types/:id` | Yes | `deals.update` | `update` | Same; **`isDefault`** toggles that row only (no clearing of other types) |
| DELETE | `/work-types/:id` | Yes | `deals.delete` | `remove` | Blocked if referenced by `work_order_tasks.work_type_id` |

### 3.21 Tenants — `/tenants`

| Method | Path | Auth | Permission | Handler | Brief |
|--------|------|------|------------|---------|--------|
| GET | `/tenants/logo` | **No** | — | `getPublicLogo` | Public tenant logo URL/meta |
| GET | `/tenants/me` | Yes | — | `getMyTenant` | Current tenant profile |
| PUT | `/tenants/me` | Yes | `users.read` AND `users.update` | `updateMyTenant` | Update tenant fields |

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
| | `qualify` | Notes → `qualify` |
| | `disqualify` | Reason → `disqualify` |
| | `convertToDeal` | Body → `convertToDeal` |
| | `remove` | |
| `productService.controller.js` | `getAll` | Query → `productServiceService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| `deal.controller.js` | `getAll` | Many query filters + `getSalesScope` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `updatePayment` | Body.paidAmount |
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
| | `remove` | |
| | `getPdf` | `pdfService.generateQuotationPdf` → `Content-Type: application/pdf` |
| `purchaseOrder.controller.js` | `getAll` | `purchaseOrderService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| | `getPdf` | `generatePurchaseOrderPdf` |
| `inspectionRequest.controller.js` | `getAll` | Pagination + optional scope → `inspectionRequestService.getAll` |
| | `getById` | |
| | `updateStatus` | Body.status → `inspectionRequestService.updateStatus` |
| `workOrder.controller.js` | `getAll` | Pagination → `workOrderService.getAll` |
| | `getById` | |
| | `create` | Passes `{ userId: req.user.id }` as scope |
| | `update` | |
| | `updateTaskStatus` | Body.status |
| | `updateTaskNotes` | Body.notes |
| | `remove` | |
| `tenant.controller.js` | `getMyTenant` | `tenantService.getById(req.tenant.id)` |
| | `getPublicLogo` | Public logo for branding |
| | `updateMyTenant` | `tenantService.update` |
| `upload.controller.js` | `uploadInspectionDocument` | Relative path + URL JSON |
| | `uploadDealImage` | Same |
| | `uploadWdsAttachment` | Same + fileName |
| | `uploadTenantLogo` | Saves path on `Tenant.logo` |
| `termsAndConditions.controller.js` | `getAll` | `termsService.getAll` |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| `workType.controller.js` | `getAll`, `getById`, `create`, `update`, `remove` | `workType.service` — CRUD for `WorkType` |

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
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| | `addContact` | `company_contacts` junction |
| | `removeContact` | |
| `supplier.service.js` | `getAll` | Search/filters |
| | `getById` | Includes contacts |
| | `create` | Optional nested contacts |
| | `update` | |
| | `remove` | |
| | `addContact` | Junction |
| | `removeContact` | |
| `lead.service.js` | `getAll` | Sales: assigned OR created_by |
| | `getById` | |
| | `create` | Sets lead_number to id string; NEW status |
| | `update` | Block if converted |
| | `qualify` | |
| | `disqualify` | |
| | `convertToDeal` | Status converted + timestamp only |
| | `remove` | Block if converted |
| `productService.service.js` | `getAll` | Filters on catalog |
| | `getById` | |
| | `create` | `findOrCreate` ProductCategory |
| | `update` | |
| | `remove` | |
| `deal.service.js` | `_validateDownstreamSupplier` | Ensures partner ≠ primary and exists |
| | `calculateDealTotals` | Subtotal, VAT, total from line items |
| | `getAll` | Rich filters + includes |
| | `getById` | Full graph |
| | `create` | Transaction: Deal, items (incl. `unit_of_measure` per line), WDS, inspection, images, DealTerm, update lead converted |
| | `update` | Transaction: sync WDS, inspection, terms, items (incl. UOM), images |
| | `updatePayment` | paid_amount + payment_status |
| | `remove` | destroy |
| | `saveInspectionReport` | Upsert DealInspectionReport |
| `quotation.service.js` | `getAll` | Join deal for search; **`deal.items`** (lightweight ids) nested for UI counts; `subQuery: false` + `distinct` |
| | `getById` | Scope prepared_by for sales; **`deal.items`** + `productService` for line items |
| | `create` | Validates deal + user |
| | `update` | |
| | `remove` | |
| `purchaseOrder.service.js` | `getAll` | Search on supplier/company names |
| | `getById` | |
| | `_validateParty` | Exactly one of company or supplier |
| | `create` | Transaction items + PO terms; default `status` = `approved` if `supplier_id`, else `draft` |
| | `update` | Replace items/terms if provided |
| | `remove` | |
| `inspectionRequest.service.js` | `getAll` | Deals with inspection request; role-based visibility |
| | `getById` | |
| | `updateStatus` | Validates ENUM; updates `deal_inspection_requests.status` |
| `workOrder.service.js` | `getAll` | Search, deal, status; tasks include **`expenses`** (nested `WorkOrderTaskExpense`) |
| | `getById` | Deal + tasks + `assignedUser` + `workType` + **`expenses`** on tasks |
| | `create` | Transaction WO + tasks; per task: `createTaskWithExpenses` ( **`expenses[]`** or legacy **`expense`** ); `resolveTaskPayload` |
| | `update` | Replace tasks + expense rows if provided |
| | `updateTaskStatus` | Single task |
| | `updateTaskNotes` | Single task notes |
| | `remove` | Deletes tasks (cascades expense rows) then WO |
| `workType.service.js` | `getAll`, `getById`, `create`, `update`, `remove` | Tenant-scoped `work_types`; multiple rows may have **`is_default`**; delete blocked if tasks reference `work_type_id` |
| `termsAndConditions.service.js` | `getAll` | Tenant filter |
| | `getById` | |
| | `create` | |
| | `update` | |
| | `remove` | |
| `tenant.service.js` | `getById` | Tenant by id |
| | `update` | Patch fields |
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
| `scopeHelper.js` | `getSalesScope` | `{ scopeUserId }` for sales role |
| | `getSalesRelatedCompanyIds` | SQL union leads/deals |
| | `getSalesAccessibleCompanyIds` | + companies created_by |
| | `getSalesRelatedContactIds` | Leads/deals + company-linked contacts |
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
| `qualifyLead(id, data)` | POST `/leads/:id/qualify` |
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
| `deleteDeal(id)` | DELETE `/deals/:id` |
| `updateDealPayment(id, paidAmount)` | POST `/deals/:id/payment` |
| `saveInspectionReport(dealId, data)` | PUT `/deals/:dealId/inspection-report` |
| `getInspectionRequests(params)` | GET `/inspection-requests` |
| `getInspectionRequest(id)` | GET `/inspection-requests/:id` |
| `getInspectors()` | GET `/users/inspectors` |
| `getQuotations(params)` | GET `/quotations` |
| `getQuotation(id)` | GET `/quotations/:id` |
| `createQuotation(data)` | POST `/quotations` |
| `updateQuotation(id, data)` | PUT `/quotations/:id` |
| `deleteQuotation(id)` | DELETE `/quotations/:id` |
| `downloadQuotationPdf(id)` | GET blob `/quotations/:id/pdf`; trigger download |
| `getPurchaseOrders(params)` | GET `/purchase-orders` |
| `getPurchaseOrder(id)` | GET `/purchase-orders/:id` |
| `createPurchaseOrder(data)` | POST `/purchase-orders` |
| `updatePurchaseOrder(id, data)` | PUT `/purchase-orders/:id` |
| `deletePurchaseOrder(id)` | DELETE `/purchase-orders/:id` |
| `downloadPurchaseOrderPdf(id)` | GET blob `/purchase-orders/:id/pdf` |
| `getTermsAndConditions(params)` | GET `/terms` |
| `getTermsAndConditionsById(id)` | GET `/terms/:id` |
| `createTermsAndConditions(data)` | POST `/terms` |
| `updateTermsAndConditions(id, data)` | PUT `/terms/:id` |
| `deleteTermsAndConditions(id)` | DELETE `/terms/:id` |
| `getMaterialTypes()` | GET `/material-types` |
| `uploadDealImage(file)` | POST FormData `/upload/deal-image` |
| `uploadWdsAttachment(file)` | POST FormData `/upload/wds-attachment` |
| `uploadInspectionDocument(file)` | POST FormData `/upload/inspection-document` |
| `getTenant()` | GET `/tenants/me` |
| `getPublicLogo()` | GET `/tenants/logo` (no auth) |
| `updateTenant(data)` | PUT `/tenants/me` |
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
| `updateInspectionRequestStatus(id, status)` | PATCH `/inspection-requests/:id/status` |
| `getWorkTypes(params)` | GET `/work-types` |
| `getWorkType(id)` | GET `/work-types/:id` |
| `createWorkType(data)` | POST `/work-types` |
| `updateWorkType(id, data)` | PUT `/work-types/:id` |
| `deleteWorkType(id)` | DELETE `/work-types/:id` |
| `_filenameFromContentDisposition(disposition, fallback)` | Parse `filename` from header |

**Default export:** `apiService` singleton.

### 9.1 Frontend router (`clearearth-frontend/src/routes/Router.js`)

| Path pattern | Screen component |
|--------------|------------------|
| `/` | Redirect → `/erp/contacts` |
| `/erp`, `/erp/dashboard` | Dashboard |
| `/erp/contacts`, `/erp/contacts/create`, `/erp/contacts/edit/:id` | Contact list / form |
| `/erp/companies`, `.../create`, `.../edit/:id`, `.../view/:id` | Companies |
| `/erp/suppliers`, `.../create`, `.../edit/:id`, `.../view/:id` | Suppliers |
| `/erp/leads`, `.../create`, `.../edit/:id` | Leads |
| `/erp/products`, `.../create`, `.../edit/:id` | Products |
| `/erp/deals`, `.../create`, `.../edit/:id`, `.../view/:id` | Deals |
| `/erp/terms`, `.../create`, `.../edit/:id` | Terms |
| `/erp/quotations`, `/erp/service-orders` | **QuotationList** (service orders = approved filter) |
| `/erp/quotations/create`, `.../view/:id`, `.../edit/:id` | QuotationForm / **QuotationView** |
| `/erp/purchase-orders`, `.../create`, `.../view/:id`, `.../edit/:id` | PurchaseOrderList / **PurchaseOrderView** / PurchaseOrderForm |
| `/erp/client-purchase-orders`, `/erp/supplier-purchase-orders` | Approved PO lists (client vs vendor) |
| `/erp/roles`, `.../create`, `.../edit/:id` | Roles |
| `/erp/users`, `.../create`, `.../edit/:id` | Users |
| `/erp/inspection-requests`, `/erp/inspection-requests/:id` | Inspection list / detail |
| `/erp/work-orders`, `.../create`, `.../view/:id`, `.../edit/:id` | Work orders (`WorkOrderList`, **WorkOrderView**, `WorkOrderForm`; `TaskStatusSegments`, `WorkTypesManageDialog`) |
| `/erp/settings/company` | Company settings |
| `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/404`, etc. | Auth / error / maintenance |

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
- **`run-migration.js`:** Raw SQL idempotent patches + role/user seeds (see file header comments). On existing DBs it may:
  - Create/alter **`work_types`**, **`work_order_tasks.work_type_id`**, **`work_types.is_default`**
  - Create **`work_order_task_expenses`** (FK to `work_order_tasks` ON DELETE CASCADE) and backfill from legacy task `expense`
  - Add **`deal_items.unit_of_measure`** and backfill from **`products_services.unit_of_measure`**
  - Remap **`deals.status`** to the new ENUM via temporary VARCHAR + **`deals.loss_reason`**
  - Add **`deal_inspection_requests.status`** ENUM + seed **`inspection_requests.update`** permission
  - Refresh lookup rows: **`deal_statuses`**, **`quotation_statuses`**, **`purchase_order_statuses`**
  - Other historical patches (companies/suppliers docs, reference codes, etc.)
- **`20260401000000-add-work-types.js`:** Creates `work_types` (FK to `tenants`, unique `(tenant_id, name)`), adds `work_order_tasks.work_type_id` FK to `work_types`.

---

## 11. Sequelize models (`src/models/*.js`)

Each file default-exports a **factory** `(sequelize, DataTypes) => Model` with `Model.associate(db)`. No standalone functions. Files: `Tenant`, `User`, `Role`, `Permission`, `RolePermission`, `AuditLog`, `Contact`, `CompanyContact`, `Company`, `SupplierContact`, `Supplier`, `Lead`, `ProductService`, `Deal`, **`DealItem`** (includes **`unit_of_measure`**), `DealWds`, `DealWdsAttachment`, `DealInspectionRequest`, `DealInspectionReport`, `DealImage`, `DealTerm`, `MaterialType`, `termsAndConditions.model`, `Designation`, `IndustryType`, `UaeCity`, `Country`, `LeadSource`, `ContactRole`, `ServiceInterest`, `ProductCategory`, `UnitOfMeasure`, `DealStatus`, `PaymentStatus`, `Status`, `QuotationStatus`, `PurchaseOrderStatus`, `Quotation`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseOrderTerm`, `WorkOrder`, **`WorkOrderTask`**, **`WorkOrderTaskExpense`** (line-level expenses; CASCADE delete with task), **`WorkType`** (includes **`is_default`**). `WorkOrderTask` belongs to `WorkType` (`work_type_id`); **`hasMany` `WorkOrderTaskExpense`**. Wired in `models/index.js`.

---

## 12. Frontend entry (`main.jsx`, `App.jsx`)

| File | Role |
|------|------|
| `main.jsx` | React `createRoot`; wraps app with providers (Customizer, Auth, etc.) |
| `App.jsx` | `ThemeProvider` + `RTL` + `RouterProvider(router)` |

---

## 13. Backend constants (`src/constants/index.js`)

Exports objects only (no functions): `USER_STATUS`, `RECORD_STATUS`, `LEAD_STATUS`, `MODULES`, `ACTIONS`.

---

## 14. Observations

- **Products & terms routes:** Authenticated but no `authorize('products.*')` — rely on “any logged-in user” for catalog/terms CRUD; tighten if needed.
- **`migrate.js`:** Re-running can fail; use on fresh DB or with care.
- **`helpers.verifyToken`:** Throws generic `Error` — JWT errors normalized in `errorHandler`.

---

## 15. Frontend features (non-API reference)

- **Deal & quotation lists:** Status can be changed **inline** on the list (popover + chips) without opening the form; deal **Lost** may prompt for **`loss_reason`**.
- **Quotations & purchase orders:** List row opens a **read-only view** (`/erp/quotations/view/:id`, `/erp/purchase-orders/view/:id`); **`?return=`** encodes the list URL for Back. Deal detail links to these views with return to the deal page.
- **Work orders:** **WorkOrderView** supports drag-reorder, sequential task unlock (previous completed or noted), inline **task notes** (PATCH notes endpoint), and **multiple expenses per task** on create/edit forms. **Manage types of work** (`WorkTypesManageDialog`) sends **`isDefault`** in **`/work-types`** create/update; **WorkOrderForm** seeds **one task per default** type (`is_default`) on new WOs (order follows list sort).
- **Quotations:** List **Items** column uses nested **`deal.items`**; read-only **view** shows deal line items.

---

## 16. Production VPS deployment (reference)

**Server:** `root@72.60.223.25` (hostname `srv1457820`). **Paths:** `/var/www/clearearth-backend`, `/var/www/clearearth-frontend`. **Process manager:** PM2 app name **`clearearth-api`** (Express on `127.0.0.1:3000`). **Web:** nginx default vhost serves **`/var/www/clearearth-frontend/dist`**; `location /api` and `/uploads` reverse-proxy to port 3000.

**Typical deploy after `git push` to `main`:**

1. **Backend:** `cd /var/www/clearearth-backend && git pull && npm ci` (or `npm install`) **`&& node run-migration.js`** (idempotent; see §10 for what it may alter) **`&& pm2 restart clearearth-api`**. Confirm: `pm2 logs clearearth-api --lines 30`. Use **`SKIP_MIGRATE=1`** in deploy script only when DB changes are not part of that release.
2. **Frontend:** `cd /var/www/clearearth-frontend && git pull && npm ci && npm run build` (outputs to `dist/`). No separate PM2 for static assets; nginx already points at `dist`.

See also repo **`DEPLOYMENT.md`**, **`DEPLOYMENT_GUIDE.md`**, and **`scripts/deploy-production.sh`** (optional `SKIP_MIGRATE` / `SKIP_NGINX_RELOAD`).

---

*End of documentation.*
