# ClearEarth Frontend — Detailed Code File Reference

**Project:** `clearearth-frontend`  
**Scope:** Every **code** file under `src/` with extensions `.js`, `.jsx`, `.ts`, `.tsx`, `.css`, `.scss`, `.json` (**818 files**, up from 720 at last pass — growth is almost entirely the ERP accounting/GRN/driver/dashboard modules under `src/views/erp/`). Binary assets under `src/assets/` are omitted here (images, fonts); they are static media for the template and ERP UI.

**Companion inventory:** `frontend-code-files.txt` in this folder (same paths, one per line) — regenerate with `find src -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.scss" -o -name "*.json" \) | sort`.

**Last major update:** 2026-07 — reflects the accounting/GL module (chart of accounts, journal, fiscal years, 7 financial reports), GRN, driver pickup workflow, role-based dashboards, Socket.IO real-time notifications, client/vendor purchase quotation-vs-order split, and quotation/PO approve-with-pin workflow. See `CODEBASE_DOCUMENTATION.md` for the full API reference these screens call.

---

## 1. Project root (non-`src` code)

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite 6: React plugin, `src` alias, `esbuild` JSX for `.js`, dev server **proxy** `/uploads` and `/api` → `http://localhost:3000`, SVGR |
| `index.html` | HTML shell: `#root`, loads `/src/main.jsx`, favicon `logoIcon.svg`, Plus Jakarta font |
| `package.json` | Scripts `dev` / `build` / `preview` / `lint`; React 19, MUI 7, Router 7, Formik, i18next, MSW, etc. |
| `package-lock.json` | Locked dependency tree |
| `.env` / `.env.production` | `VITE_*` variables (e.g. `VITE_API_URL`) — not listed in repo search; local only |
| `public/logoIcon.svg` | Favicon source |
| `public/mockServiceWorker.js` | MSW worker script for API mocking in dev |

---

## 2. `src/` root (5 files)

| File | Purpose |
|------|---------|
| `main.jsx` | Bootstraps React: dynamic **MSW** `worker.start()`, `ReactDOM.createRoot`, wraps app in `CustomizerContextProvider` → `AuthProvider` → `Suspense` (`Spinner` fallback), imports `utils/i18n` |
| `App.jsx` | `ThemeProvider` from `theme/Theme.js`, `RTL` from customizer, `RouterProvider` with `routes/Router.js` |
| `App.css` | Global styles for App |
| `index.css` | Global base styles (imported from main or App chain) |
| `LoadingBar.jsx` | Top loading bar component (if used by template routes) |

---

## 3. `src/routes/` (1 file)

| File | Purpose |
|------|---------|
| `Router.js` | `createBrowserRouter`: **FullLayout** (wrapped in `ProtectedRoute`) with all `/erp/*` lazy routes — CRM (contacts, companies, suppliers, leads, products, deals, terms), sales docs (quotations, proforma/tax invoices, client/vendor purchase quotations & orders), operations (inspection-requests, work-orders, GRN, driver pickups), accounting/GL (accounts expenses, receivables, payables, purchase payment receipts, chart-of-accounts, journal, fiscal-years, 7 financial reports), admin (roles, users, settings/company, settings/fiscal-years), and role-aware `DashboardRouter`. **BlankLayout** for `/auth/*` (login, register, forgot, two-steps, 404, maintenance). A separate top-level `/location-pin/:token` route (no layout, no auth) renders `ClientLocationPicker`. Default `/`, `/erp` → `/erp/dashboard`. Full route table: `CODEBASE_DOCUMENTATION.md` §9.1. |

---

## 4. `src/services/` (1 file)

| File | Purpose |
|------|---------|
| `api.js` | `ApiService` class: `fetch` to `VITE_API_URL` or `http://localhost:3000/api/v1`, Bearer from `localStorage`, all REST methods for ERP (see backend `CODEBASE_DOCUMENTATION.md` §9). |

---

## 5. `src/api/` — mock data & MSW (15 files)

| File | Purpose |
|------|---------|
| `globalFetcher.js` | SWR-style fetcher for template demos |
| `blog/blogData.js` | Static blog posts for demo blog app |
| `chat/Chatdata.js` | Chat demo data |
| `contacts/ContactsData.js` | Contacts demo data |
| `eCommerce/ProductsData.js` | E-commerce demo products |
| `email/EmailData.js` | Email app demo |
| `invoice/invoceLists.js` | Invoice list typo in filename; invoice demo data |
| `kanban/KanbanData.js` | Kanban board demo |
| `language/LanguageData.js` | Language picker demo data |
| `notes/NotesData.js` | Notes app demo |
| `ticket/TicketData.js` | Ticket app demo |
| `userprofile/PostData.js` | User profile posts |
| `userprofile/UsersData.js` | User profile users |
| `mocks/browser.js` | MSW browser worker setup |
| `mocks/handlers/mockhandlers.js` | MSW request handlers |

---

## 6. `src/context/` (14 files)

| File | Purpose |
|------|---------|
| `AuthContext.jsx` | **ERP auth:** user, tenant, permissions, login/logout/register, `hasPermission`, `hasAnyPermission`, `hasRole`, `hasAdminDashboardAccess`, `loadUser` via `/auth/me` |
| `SocketContext.jsx` | **New.** Establishes a `socket.io-client` connection authenticated with the stored access token; exposes `on(event, handler)` for subscribing to server-pushed events (used by `RealtimeNotificationToast` and role dashboards for live refresh) |
| `config.js` | Template config constants (e.g. menu, theme keys) |
| `CustomizerContext.jsx` | Theme, RTL, layout direction, active theme mode |
| `BlogContext/index.jsx` | Blog demo state |
| `ChatContext/index.jsx` | Chat demo state |
| `ConatactContext/index.jsx` | Typo in folder name; contacts demo state |
| `EcommerceContext/index.jsx` | E-commerce demo state |
| `EmailContext/index.jsx` | Email demo state |
| `InvoiceContext/index.jsx` | Invoice demo state |
| `kanbancontext/index.jsx` | Kanban demo state |
| `NotesContext/index.jsx` | Notes demo state |
| `TicketContext/index.jsx` | Ticket demo state |
| `UserDataContext/index.jsx` | User profile demo state |

---

## 7. `src/theme/` (7 files)

| File | Purpose |
|------|---------|
| `Theme.js` | `ThemeSettings()` — builds MUI theme from light/dark, typography, components override |
| `Typography.js` | Font sizes/weights for theme |
| `Components.js` | MUI component default prop overrides |
| `LightThemeColors.js` / `DarkThemeColors.js` | Palette tokens |
| `DefaultColors.js` | Base color tokens |
| `Shadows.js` | Shadow definitions |

---

## 8. `src/utils/` (17 files, up from 5)

| File | Purpose |
|------|---------|
| `i18n.js` | i18next init; loads JSON from `languages/` |
| `languages/en.json` | English strings |
| `languages/ar.json` | Arabic (RTL) |
| `languages/ch.json` | Chinese |
| `languages/fr.json` | French |
| `authHelpers.js` | **New.** Helpers around role/permission checks used outside `AuthContext` (e.g. in route guards) |
| `chunkReload.js` | **New.** `lazyWithChunkReload` wrapper + `installGlobalChunkReloadHandlers()` — retries/reloads once on stale Vite chunk import failures after a deploy |
| `formatApiError.js` | **New.** `formatApiErrorMessage` — normalizes backend `ApiError`/validation error shapes into a display string |
| `googleMapsLoader.js` | **New.** Wraps `@googlemaps/js-api-loader` for the location picker / route planner components |
| `inspectionReportHelpers.js` | **New.** Formatting/derivation helpers for the deal inspection report dialog |
| `inspectionRequestHelpers.js` | **New.** Status/priority helpers for inspection request list & detail views |
| `notificationLinks.js` | **New.** Maps a notification's `type`/entity to its target in-app route (used by the header bell and `RealtimeNotificationToast`) |
| `purchaseBills.js` | **New.** Helpers for the purchase-bill (`document_type = 'bill'`) display/derivation logic on PO screens |
| `quotationVersion.js` | **New.** Quotation revision/version label helpers (`QuotationVersionBadge`) |
| `recordStatus.js` | **New.** Shared status-chip color/label mapping across CRM/sales/operations records |
| `reportApi.js` | **New.** Thin fetch helpers specific to the financial report views (trial balance, GL, P&L, etc.), alongside the generic `apiService` |
| `uploadFileTypes.js` | **New.** Allowed MIME types/extensions for uploads, incl. the Word/Excel-by-extension fallback used by inspection document uploads |

---

### 8.1 `src/constants/` (3 files, new)

| File | Purpose |
|------|---------|
| `expenseFormOptions.js` | Dropdown option lists for the manual expense create form |
| `paymentAccounts.js` | Bank/cash account options for payment recording dialogs |
| `paymentMethods.js` | Payment method options (bank transfer, cash, cheque, etc.) |

### 8.2 `src/hooks/` (1 file, new)

| File | Purpose |
|------|---------|
| `useAccountMenu.js` | Hook backing the header account/profile dropdown menu |

## 9. `src/layouts/` (34 files)

| File | Purpose |
|------|---------|
| `full/FullLayout.js` | Main ERP shell: horizontal/vertical toggle, outlet for child routes, customizer |
| `blank/BlankLayout.js` | Minimal layout for auth pages |
| `full/vertical/sidebar/Sidebar.js` | Vertical sidebar container |
| `full/vertical/sidebar/SidebarItems.js` | **Template** menu config (non-ERP) |
| `full/vertical/sidebar/ErpMenuItems.js` | **ERP** menu items + permission checks + icons |
| `full/vertical/sidebar/MenuItems.js` | Combined / legacy menu wiring |
| `full/vertical/sidebar/NavItem/index.js` | Single nav link |
| `full/vertical/sidebar/NavCollapse/index.js` | Collapsible group |
| `full/vertical/sidebar/NavGroup/NavGroup.js` | Nav group wrapper |
| `full/vertical/sidebar/SidebarProfile/Profile.js` | Sidebar profile snippet |
| `full/vertical/header/Header.js` | Top header |
| `full/vertical/header/Profile.js` | User menu; logout → `AuthContext` |
| `full/vertical/header/Navigation.js` | Breadcrumb / mini nav |
| `full/vertical/header/Notifications.js` | Notification dropdown (template) |
| `full/vertical/header/Search.js` | Search UI |
| `full/vertical/header/Language.js` | i18n language switch |
| `full/vertical/header/AppLinks.js` | Quick app links |
| `full/vertical/header/Cart.js` / `CartItems.js` | Cart (e-commerce template) |
| `full/vertical/header/data.js` | Header dropdown data |
| `full/vertical/header/MobileRightSidebar.js` | Mobile drawer |
| `full/vertical/header/QuickLinks.js` | Quick links |
| `full/horizontal/header/Header.js` | Horizontal layout header |
| `full/horizontal/navbar/Navbar.js` | Horizontal nav bar |
| `full/horizontal/navbar/Menudata.js` | Menu definitions |
| `full/horizontal/navbar/NavItem/NavItem.js` | Horizontal nav item |
| `full/horizontal/navbar/NavCollapse/NavCollapse.js` | Horizontal collapse |
| `full/horizontal/navbar/NavListing/NavListing.js` | Nav listing |
| `full/shared/loadable/Loadable.js` | HOC for `React.lazy` + loading |
| `full/shared/customizer/Customizer.js` | Theme/layout settings drawer |
| `full/shared/customizer/RTL.js` | RTL direction wrapper (stylis) |
| `full/shared/breadcrumb/Breadcrumb.js` | Breadcrumb |
| `full/shared/logo/Logo.js` | App logo; uses tenant logo from session/API when set |
| `full/shared/welcome/Welcome.js` | Welcome splash (template) |

---

## 10. `src/views/` — pages (109 files, up from 48)

### 10.1 ERP (`src/views/erp/`) — 91 files, up from 31

| File | Purpose |
|------|---------|
| `Dashboard.jsx` | Legacy/generic ERP dashboard (widgets/metrics) — superseded for logged-in routing by `dashboard/DashboardRouter.jsx` |
| **`account/ChangePassword.jsx`** | **New.** Self-service password change page (`/erp/account/password`), all roles |
| **`accounts/AccountsWorkOrderList.jsx`**, **`AccountsWorkOrderView.jsx`** | **New.** Accounts view of work orders; approve/reject task expense lines |
| **`accounts/ExpensesList.jsx`**, **`ExpenseCreate.jsx`** | **New.** Manual expense ledger list + create (category `SelectWithAddNew`, payment status derived) |
| `companies/CompanyList.jsx`, `CompanyForm.jsx`, `CompanyView.jsx` | Client companies CRUD + tabbed finance snapshot (deals, quotations, invoices, work orders) |
| `contacts/ContactList.jsx`, `ContactForm.jsx` | Contacts CRUD; Formik; `clients` / `vendors` / **`both`**; company/supplier linkage |
| **`dashboard/DashboardRouter.jsx`** | **New.** Maps the current user's role to one of the role-specific dashboards below |
| **`dashboard/AdminDashboard.jsx`**, **`SuperAdminDashboard.jsx`**, **`SalesDashboard.jsx`**, **`SalesManagerDashboard.jsx`**, **`InspectionDashboard.jsx`**, **`OperationsDashboard.jsx`**, **`AccountsDashboard.jsx`**, **`DriverDashboard.jsx`** | **New.** Role-specific KPI dashboards; several poll `GET /dashboard/overview` every 7s and refresh on Socket.IO `notification` events |
| **`dashboard/shared/ActionableList.jsx`**, **`DashboardChart.jsx`**, **`KpiCard.jsx`** | **New.** Shared dashboard building blocks (pending-approvals list, chart wrapper, KPI tile) |
| `deals/DealList.jsx`, `DealForm.jsx`, `DealView.jsx` | Deals CRUD: multi-step form (line items w/ UOM, WDS, inspection, images, terms, collection fields); view has work-order pipeline, location-share link, PDF |
| **`driver/DriverPickupList.jsx`**, **`DriverPickupTaskView.jsx`** | **New.** Driver-role pickup task list + detail (start/complete with quantity, condition, multi-photo upload) |
| **`grn/GrnList.jsx`**, **`GrnForm.jsx`**, **`GrnView.jsx`**, **`GrnEvidenceThumbs.jsx`**, **`grnDisplayHelpers.js`** | **New.** Goods Receipt Note module: CRUD, approve (→ inventory), per-item images, PDF report |
| `inspection-requests/InspectionRequestList.jsx`, `InspectionRequestView.jsx` | Inspection requests from deals; status/priority updates, accept/reject, multi-file supporting docs |
| `leads/LeadList.jsx`, `LeadForm.jsx` | Leads table + form; qualify/disqualify/convert (PIN-approval UI removed from frontend — see doc note below) |
| `payables/PayablesList.jsx`, `PayablesAgingSummaryView.jsx` | Outstanding approved POs + aging buckets by supplier |
| **`payables/PurchasePaymentReceiptsList.jsx`**, **`PurchasePaymentReceiptView.jsx`** | **New.** AP payment receipts list + single receipt view |
| `products/ProductList.jsx`, `ProductForm.jsx` | Products/services catalog CRUD |
| `proforma-invoices/ProformaInvoiceList.jsx`, `ProformaInvoiceCreate.jsx`, `ProformaInvoiceView.jsx` | Proforma invoice list/create-from-quotation/view; **view now offers PDF download** |
| `purchase-orders/PurchaseOrderList.jsx`, `PurchaseOrderForm.jsx`, `PurchaseOrderView.jsx` | Legacy generic PO screens — `/erp/purchase-orders` now redirects to the client/vendor split below; form/view still used for create/edit/view by id |
| **`purchase-orders/ClientPurchaseQuotationList.jsx`**, **`VendorPurchaseQuotationList.jsx`** | **New.** PO split: unapproved "quotation" documents, by party type |
| **`purchase-orders/ClientPurchaseOrderList.jsx`**, **`SupplierPurchaseOrderList.jsx`** | **New.** PO split: approved orders (incl. purchase bills), by party type |
| `quotations/QuotationList.jsx`, `QuotationForm.jsx`, `QuotationView.jsx` | Service quotations CRUD; **approve / request-approval / approve-with-pin** actions on list & view; dual quotation+order PDF download |
| `receivables/ReceivablesList.jsx`, `AgingSummaryView.jsx` | Outstanding tax invoices + aging buckets; **receipt PDF and statement-of-account PDF** downloads |
| **`reports/ChartOfAccountsList.jsx`** | **New.** Chart of accounts CRUD + seed defaults |
| **`reports/JournalList.jsx`**, **`JournalEntryCreate.jsx`**, **`JournalEntryView.jsx`**, **`OpeningBalancesForm.jsx`** | **New.** Manual journal entries, opening balances, void |
| **`reports/FiscalYearManager.jsx`** | **New.** Fiscal year + accounting period create/close/reopen |
| **`reports/TrialBalanceView.jsx`**, **`GeneralLedgerView.jsx`**, **`IncomeStatementView.jsx`**, **`BalanceSheetView.jsx`**, **`CashFlowView.jsx`**, **`ChangesInEquityView.jsx`**, **`VatReportView.jsx`** | **New.** The 7 financial report screens, one per `/reports/*` backend endpoint |
| `roles/RoleList.jsx`, `RoleForm.jsx` | Roles CRUD + permission checkboxes |
| `settings/CompanySettings.jsx` | Tenant settings; logo upload; lead-approval PIN config (admin) |
| `suppliers/SupplierList.jsx`, `SupplierForm.jsx`, `SupplierView.jsx` | Suppliers/vendors CRUD + tabbed finance snapshot (POs, expenses, payables) |
| `tax-invoices/TaxInvoiceList.jsx`, `TaxInvoiceCreate.jsx`, `TaxInvoiceView.jsx`, **`TaxInvoiceEdit.jsx`** | Tax invoice list/create-from-proforma/view/**edit (new)** |
| `terms/TermsList.jsx`, `TermsForm.jsx` | Terms & conditions CRUD |
| `users/UserList.jsx`, `UserForm.jsx` | Users CRUD (admin) |
| `work-orders/WorkOrderList.jsx`, `WorkOrderForm.jsx`, `WorkOrderView.jsx` | Work orders (created only from approved quotation/PO); drag-reorder tasks, expense approval, driver assignment, purchase-bill/GRN links |
| **`work-orders/TaskStatusSegments.jsx`**, **`WorkOrderExpandableRows.jsx`**, **`WorkTypesManageDialog.jsx`** | **New.** WO list/detail helper components: task status progress bar, expandable task rows, inline "manage work types" dialog |

### 10.2 Authentication (`src/views/authentication/`) — 15 files

| File | Purpose |
|------|---------|
| `auth1/Login.js` | Login page (layout 1); uses `AuthLogin` |
| `auth1/Register.js` | Register |
| `auth1/ForgotPassword.js` | Forgot password |
| `auth1/TwoSteps.js` | 2FA step UI |
| `auth2/Login2.js` | Alternate login layout |
| `auth2/Register2.js` | Alternate register |
| `auth2/ForgotPassword2.js` | Alternate forgot |
| `auth2/TwoSteps2.js` | Alternate 2FA |
| `authForms/AuthLogin.js` | Form: email/password → `useAuth().login` + `api` |
| `authForms/AuthRegister.js` | Registration form |
| `authForms/AuthForgotPassword.js` | Forgot form |
| `authForms/AuthTwoSteps.js` | Two-step code entry |
| `authForms/AuthSocialButtons.js` | Social login buttons (placeholder) |
| `Error.js` | 404 page |
| `Maintenance.js` | Maintenance page |

### 10.3 Spinner (`src/views/spinner/`) — 2 files

| File | Purpose |
|------|---------|
| `Spinner.js` | Loading spinner component |
| `spinner.css` | Spinner styles |

---

## 11. `src/components/erp/` — ClearEarth-specific (12 files, up from 3)

| File | Purpose |
|------|---------|
| **`ApprovalWorkflowDialogs.jsx`** | **New.** Shared "request approval" / "approve with PIN" dialog pair, reused across leads, deals, quotations, and purchase orders |
| **`ApproveQuotationConfirmDialog.jsx`** | **New.** Quotation-specific approve confirmation dialog |
| **`InspectionRequestDetail.jsx`** | **New.** Shared inspection-request detail panel (used by list drawer and detail view) — supersedes the old standalone `InspectionReportDialog.jsx` |
| `ListDateRangeFilter.jsx` | Reusable created-from/to date filter for ERP lists |
| **`OrganizationDocumentationSection.jsx`** | **New.** Company/supplier documentation upload section (used in company & supplier forms) |
| **`PaymentHistoryDialog.jsx`** | **New.** Payment transaction history dialog, shared by receivables/payables/expenses |
| **`PaymentReceiptDocument.jsx`** | **New.** Printable payment receipt layout, used by AR/AP receipt views/PDF |
| **`PaymentRecordingFields.jsx`** | **New.** Shared "record a payment" form fields (amount, date, mode, reference) |
| **`QuotationVersionBadge.jsx`** | **New.** Small badge showing quotation revision number |
| `RecordDetailDrawer.jsx` | Side drawer for quick record preview |
| **`SelectWithAddNew.jsx`** | **New.** Generic MUI select with an inline "+ Add new" option — powers expense categories, dropdowns, etc. |
| **`UomSelectField.jsx`** | **New.** Unit-of-measure select field used on deal/quotation/PO line items |

### 11.1 `src/components/auth/` — route guards (7 files, new section)

| File | Purpose |
|------|---------|
| `ProtectedRoute.jsx` | Wraps the whole `/` route tree; redirects to `/auth/login` if not authenticated |
| `RequireAdmin.jsx` | Gates admin-only routes (roles, users, company settings) |
| `RequireDealViewAccess.jsx` | Gates the deal detail view by role/permission |
| `RequireInvoiceGenerator.jsx` | Gates proforma/tax invoice creation routes |
| `RequireNotDriver.jsx` | Blocks the `driver` role from deal list/form routes |
| `RequireQuotationPoEditor.jsx` | Gates quotation/PO create-edit routes |
| `RequireWorkOrderCreator.jsx` | Gates the work-order create route (list/view remain open to more roles) |

### 11.2 `src/components/notifications/` (1 file, new section)

| File | Purpose |
|------|---------|
| `RealtimeNotificationToast.jsx` | Subscribes to `SocketContext` `notification` events and shows a toast; used alongside the polled `/notifications` header bell |

### 11.3 `src/components/` — top-level loose files (3 files, new section)

| File | Purpose |
|------|---------|
| `ChunkLoadErrorElement.jsx` | Router `errorElement` paired with `chunkReload.js`; shown if a lazy chunk fails to load twice after a deploy |
| `LocationPickerDialog.jsx` | Google Maps pin-picker dialog (deal collection location) |
| `RoutePlannerDialog.jsx` | Google Maps route-planning dialog for driver pickups |

---

## 12. `src/components/` — template / UI library (611 files total in `src/components/`; ~586 are template/UI-library, the rest are ERP-specific — see §11–§11.3)

These come from the **Modernize** admin template. They are **not** all used by the ERP routes; many back demo pages (blog, chat, e-commerce, charts) if those routes were enabled.

### 12.1 By subdirectory (count + role)

| Subfolder | Files | Role |
|-----------|-------|------|
| `forms/` | 157 | Form element demos: MUI autocomplete, buttons, checkbox, radio, slider, switch, horizontal/vertical layouts, validation (Formik), wizard, theme-elements |
| `apps/` | 88 | Full demo apps: **blog**, **chats**, **contacts**, **ecommerce** (product grid, cart, checkout, detail, edit), **email**, **invoice**, **kanban**, **notes**, **tickets**, **userprofile** |
| `material-ui/` | 84 | MUI primitives demos: accordion, alert, avatar, chip, dialog, lists, popover, tabs, tooltip, transfer-list, typography — each often paired with `code/*Code.js` snippet viewers |
| `muicharts/` | 74 | **MUI X Charts** demos: bar, line, area, pie, scatter, gauge, sparkline; `code/` holds copy-paste examples |
| `frontend-pages/` | 41 | Marketing-style sections: about, blog, contact, homepage, portfolio, pricing, shared header/footer/reviews |
| `widgets/` | 34 | Dashboard widgets: banners, cards, charts |
| `dashboards/` | 25 | **modern** / **ecommerce** dashboard widget sets |
| `landingpage/` | 21 | Landing page: banner, CTA, demo slider, features, footer, frameworks, header, testimonial |
| `muitrees/` | 20 | **MUI TreeView** demos + `code/` |
| `react-tables/` | 15 | **TanStack Table** demos: pagination, sort, filter, drag-drop, editable, etc. |
| `shared/` | 13 | Reusable cards: `ParentCard`, `ChildCard`, `CodeDialog`, `DashboardCard`, `ScrollToTop`, etc. |
| `tables/` | 7 | Simple table examples; includes `BasicTableCode.tsx`, `tableData.js` |
| `pages/` | 6 | FAQ and **account-setting** tabs |
| `erp/` | 12 | ClearEarth (see §11) |
| `auth/` | 7 | Route guards (see §11.1) |
| `notifications/` | 1 | Real-time toast (see §11.2) |
| `container/` | 1 | `PageContainer.js` — page max-width wrapper |
| `custom-scroll/` | 1 | `Scrollbar.js` — SimpleBar wrapper |
| *(loose, no subfolder)* | 3 | `ChunkLoadErrorElement.jsx`, `LocationPickerDialog.jsx`, `RoutePlannerDialog.jsx` (see §11.3) |

### 12.2 Naming patterns (template)

- `**/code/*Code.js` (or `.jsx`): Source code string for “view code” dialogs in UI demos.
- `**/page.jsx`: Full page composition for that demo route (e.g. react-tables).
- `**/*Card.js`, `**/Banner*.js`: Dashboard/widget building blocks.

---

*Below: Appendix A lists all 818 paths. Same list: `frontend-code-files.txt` in this folder.*

---

*Generated for ClearEarth ERP frontend audit.*

## Appendix A — All 818 code file paths

- `src/App.css`
- `src/App.jsx`
- `src/LoadingBar.jsx`
- `src/api/blog/blogData.js`
- `src/api/chat/Chatdata.js`
- `src/api/contacts/ContactsData.js`
- `src/api/eCommerce/ProductsData.js`
- `src/api/email/EmailData.js`
- `src/api/globalFetcher.js`
- `src/api/invoice/invoceLists.js`
- `src/api/kanban/KanbanData.js`
- `src/api/language/LanguageData.js`
- `src/api/mocks/browser.js`
- `src/api/mocks/handlers/mockhandlers.js`
- `src/api/notes/NotesData.js`
- `src/api/ticket/TicketData.js`
- `src/api/userprofile/PostData.js`
- `src/api/userprofile/UsersData.js`
- `src/components/ChunkLoadErrorElement.jsx`
- `src/components/LocationPickerDialog.jsx`
- `src/components/RoutePlannerDialog.jsx`
- `src/components/account/AccountProfileMenu.js`
- `src/components/apps/blog/BlogCard.jsx`
- `src/components/apps/blog/BlogFeaturedCard.jsx`
- `src/components/apps/blog/BlogListing.jsx`
- `src/components/apps/blog/detail/BlogComment.jsx`
- `src/components/apps/blog/detail/BlogDetail.jsx`
- `src/components/apps/chats/ChatContent.jsx`
- `src/components/apps/chats/ChatInsideSidebar.jsx`
- `src/components/apps/chats/ChatListing.jsx`
- `src/components/apps/chats/ChatMsgSent.jsx`
- `src/components/apps/chats/ChatSidebar.jsx`
- `src/components/apps/contacts/ContactAdd.jsx`
- `src/components/apps/contacts/ContactDetails.jsx`
- `src/components/apps/contacts/ContactFilter.jsx`
- `src/components/apps/contacts/ContactList.jsx`
- `src/components/apps/contacts/ContactListItem.jsx`
- `src/components/apps/contacts/ContactSearch.jsx`
- `src/components/apps/ecommerce/ProductTableList/ProductTableList.jsx`
- `src/components/apps/ecommerce/productAdd/GeneralCard.jsx`
- `src/components/apps/ecommerce/productAdd/Media.jsx`
- `src/components/apps/ecommerce/productAdd/Pricing.jsx`
- `src/components/apps/ecommerce/productAdd/ProductDetails.jsx`
- `src/components/apps/ecommerce/productAdd/ProductTemplate.jsx`
- `src/components/apps/ecommerce/productAdd/Status.jsx`
- `src/components/apps/ecommerce/productAdd/Thumbnail.jsx`
- `src/components/apps/ecommerce/productAdd/VariationCard.jsx`
- `src/components/apps/ecommerce/productCart/AddToCart.jsx`
- `src/components/apps/ecommerce/productCart/AlertCart.jsx`
- `src/components/apps/ecommerce/productCheckout/FinalStep.jsx`
- `src/components/apps/ecommerce/productCheckout/FirstStep.jsx`
- `src/components/apps/ecommerce/productCheckout/HorizontalStepper.jsx`
- `src/components/apps/ecommerce/productCheckout/ProductCheckout.jsx`
- `src/components/apps/ecommerce/productCheckout/SecondStep.jsx`
- `src/components/apps/ecommerce/productCheckout/ThirdStep.jsx`
- `src/components/apps/ecommerce/productDetail/Carousel.css`
- `src/components/apps/ecommerce/productDetail/ProductCarousel.jsx`
- `src/components/apps/ecommerce/productDetail/ProductDesc.jsx`
- `src/components/apps/ecommerce/productDetail/ProductDetail.jsx`
- `src/components/apps/ecommerce/productDetail/ProductRelated.jsx`
- `src/components/apps/ecommerce/productDetail/SliderData.js`
- `src/components/apps/ecommerce/productEdit/CustomersReviews.jsx`
- `src/components/apps/ecommerce/productEdit/GeneralCard.jsx`
- `src/components/apps/ecommerce/productEdit/Media.jsx`
- `src/components/apps/ecommerce/productEdit/Pricing.jsx`
- `src/components/apps/ecommerce/productEdit/ProductAvgSales.jsx`
- `src/components/apps/ecommerce/productEdit/ProductDetails.jsx`
- `src/components/apps/ecommerce/productEdit/ProductTemplate.jsx`
- `src/components/apps/ecommerce/productEdit/Status.jsx`
- `src/components/apps/ecommerce/productEdit/Thumbnail.jsx`
- `src/components/apps/ecommerce/productEdit/VariationCard.jsx`
- `src/components/apps/ecommerce/productGrid/ProductFilter.jsx`
- `src/components/apps/ecommerce/productGrid/ProductList.jsx`
- `src/components/apps/ecommerce/productGrid/ProductSearch.jsx`
- `src/components/apps/ecommerce/productGrid/ProductSidebar.jsx`
- `src/components/apps/email/EmailActions.jsx`
- `src/components/apps/email/EmailCompose.jsx`
- `src/components/apps/email/EmailContent.jsx`
- `src/components/apps/email/EmailFilter.jsx`
- `src/components/apps/email/EmailList.jsx`
- `src/components/apps/email/EmailListItem.jsx`
- `src/components/apps/email/EmailSearch.jsx`
- `src/components/apps/invoice/Add-invoice/index.jsx`
- `src/components/apps/invoice/Edit-invoice/index.jsx`
- `src/components/apps/invoice/Invoice-detail/index.jsx`
- `src/components/apps/invoice/Invoice-list/index.jsx`
- `src/components/apps/kanban/CategoryTaskList.jsx`
- `src/components/apps/kanban/KanbanHeader.jsx`
- `src/components/apps/kanban/TaskData.jsx`
- `src/components/apps/kanban/TaskManager.jsx`
- `src/components/apps/kanban/TaskModal/AddNewTaskModal.jsx`
- `src/components/apps/kanban/TaskModal/EditCategoryModal.jsx`
- `src/components/apps/kanban/TaskModal/EditTaskModal.jsx`
- `src/components/apps/notes/AddNotes.jsx`
- `src/components/apps/notes/NoteContent.jsx`
- `src/components/apps/notes/NoteList.jsx`
- `src/components/apps/notes/NoteSidebar.jsx`
- `src/components/apps/tickets/TicketFilter.jsx`
- `src/components/apps/tickets/TicketListing.jsx`
- `src/components/apps/userprofile/followers/FollowerCard.jsx`
- `src/components/apps/userprofile/friends/FriendsCard.jsx`
- `src/components/apps/userprofile/gallery/GalleryCard.jsx`
- `src/components/apps/userprofile/profile/IntroCard.jsx`
- `src/components/apps/userprofile/profile/PhotosCard.jsx`
- `src/components/apps/userprofile/profile/Post.jsx`
- `src/components/apps/userprofile/profile/PostComments.jsx`
- `src/components/apps/userprofile/profile/PostItem.jsx`
- `src/components/apps/userprofile/profile/PostTextBox.jsx`
- `src/components/apps/userprofile/profile/ProfileBanner.jsx`
- `src/components/apps/userprofile/profile/ProfileTab.jsx`
- `src/components/auth/ProtectedRoute.jsx`
- `src/components/auth/RequireAdmin.jsx`
- `src/components/auth/RequireDealViewAccess.jsx`
- `src/components/auth/RequireInvoiceGenerator.jsx`
- `src/components/auth/RequireNotDriver.jsx`
- `src/components/auth/RequireQuotationPoEditor.jsx`
- `src/components/auth/RequireWorkOrderCreator.jsx`
- `src/components/container/PageContainer.js`
- `src/components/custom-scroll/Scrollbar.js`
- `src/components/dashboards/ecommerce/Expence.js`
- `src/components/dashboards/ecommerce/Growth.js`
- `src/components/dashboards/ecommerce/MonthlyEarnings.js`
- `src/components/dashboards/ecommerce/PaymentGateways.js`
- `src/components/dashboards/ecommerce/ProductPerformances.js`
- `src/components/dashboards/ecommerce/RecentTransactions.js`
- `src/components/dashboards/ecommerce/RevenueUpdates.js`
- `src/components/dashboards/ecommerce/Sales.js`
- `src/components/dashboards/ecommerce/SalesOverview.js`
- `src/components/dashboards/ecommerce/SalesTwo.js`
- `src/components/dashboards/ecommerce/TotalEarning.js`
- `src/components/dashboards/ecommerce/WelcomeCard.js`
- `src/components/dashboards/ecommerce/YearlySales.js`
- `src/components/dashboards/modern/Customers.js`
- `src/components/dashboards/modern/EmployeeSalary.js`
- `src/components/dashboards/modern/MonthlyEarnings.js`
- `src/components/dashboards/modern/Projects.js`
- `src/components/dashboards/modern/RevenueUpdates.js`
- `src/components/dashboards/modern/SellingProducts.js`
- `src/components/dashboards/modern/Social.js`
- `src/components/dashboards/modern/TopCards.js`
- `src/components/dashboards/modern/TopPerformerData.js`
- `src/components/dashboards/modern/TopPerformers.js`
- `src/components/dashboards/modern/WeeklyStats.js`
- `src/components/dashboards/modern/YearlyBreakup.js`
- `src/components/erp/ApprovalWorkflowDialogs.jsx`
- `src/components/erp/ApproveQuotationConfirmDialog.jsx`
- `src/components/erp/InspectionRequestDetail.jsx`
- `src/components/erp/ListDateRangeFilter.jsx`
- `src/components/erp/OrganizationDocumentationSection.jsx`
- `src/components/erp/PaymentHistoryDialog.jsx`
- `src/components/erp/PaymentReceiptDocument.jsx`
- `src/components/erp/PaymentRecordingFields.jsx`
- `src/components/erp/QuotationVersionBadge.jsx`
- `src/components/erp/RecordDetailDrawer.jsx`
- `src/components/erp/SelectWithAddNew.jsx`
- `src/components/erp/UomSelectField.jsx`
- `src/components/forms/form-elements/autoComplete/CheckboxesAutocomplete.js`
- `src/components/forms/form-elements/autoComplete/ComboBoxAutocomplete.js`
- `src/components/forms/form-elements/autoComplete/ControlledStateAutocomplete.js`
- `src/components/forms/form-elements/autoComplete/CountrySelectAutocomplete.js`
- `src/components/forms/form-elements/autoComplete/FreeSoloAutocomplete.js`
- `src/components/forms/form-elements/autoComplete/MultipleValuesAutocomplete.js`
- `src/components/forms/form-elements/autoComplete/SizesAutocomplete.js`
- `src/components/forms/form-elements/autoComplete/code/CheckboxesCode.js`
- `src/components/forms/form-elements/autoComplete/code/ComboBoxCode.js`
- `src/components/forms/form-elements/autoComplete/code/ControlledStateCode.js`
- `src/components/forms/form-elements/autoComplete/code/CountrySelectCode.js`
- `src/components/forms/form-elements/autoComplete/code/FreeSoloCode.js`
- `src/components/forms/form-elements/autoComplete/code/MultipleValuesCode.js`
- `src/components/forms/form-elements/autoComplete/code/SizesCode.js`
- `src/components/forms/form-elements/autoComplete/countrydata.js`
- `src/components/forms/form-elements/autoComplete/data.js`
- `src/components/forms/form-elements/button/ColorButtonGroup.js`
- `src/components/forms/form-elements/button/ColorButtons.js`
- `src/components/forms/form-elements/button/DefaultButtonGroup.js`
- `src/components/forms/form-elements/button/DefaultButtons.js`
- `src/components/forms/form-elements/button/FabColorButtons.js`
- `src/components/forms/form-elements/button/FabDefaultButton.js`
- `src/components/forms/form-elements/button/FabSizeButtons.js`
- `src/components/forms/form-elements/button/IconColorButtons.js`
- `src/components/forms/form-elements/button/IconLoadingButtons.js`
- `src/components/forms/form-elements/button/IconSizeButtons.js`
- `src/components/forms/form-elements/button/OutlinedColorButtons.js`
- `src/components/forms/form-elements/button/OutlinedDefaultButtons.js`
- `src/components/forms/form-elements/button/OutlinedIconButtons.js`
- `src/components/forms/form-elements/button/OutlinedSizeButton.js`
- `src/components/forms/form-elements/button/SizeButton.js`
- `src/components/forms/form-elements/button/SizeButtonGroup.js`
- `src/components/forms/form-elements/button/TextButtonGroup.js`
- `src/components/forms/form-elements/button/TextColorButtons.js`
- `src/components/forms/form-elements/button/TextDefaultButtons.js`
- `src/components/forms/form-elements/button/TextIconButtons.js`
- `src/components/forms/form-elements/button/TextSizeButton.js`
- `src/components/forms/form-elements/button/VerticalButtonGroup.js`
- `src/components/forms/form-elements/button/code/ColorButtonGroupCode.js`
- `src/components/forms/form-elements/button/code/ColorsCode.js`
- `src/components/forms/form-elements/button/code/DefaultButtonGroupCode.js`
- `src/components/forms/form-elements/button/code/DefaultCode.js`
- `src/components/forms/form-elements/button/code/FABCode.js`
- `src/components/forms/form-elements/button/code/FABColorCode.js`
- `src/components/forms/form-elements/button/code/FABSizeCode.js`
- `src/components/forms/form-elements/button/code/IconColorCode.js`
- `src/components/forms/form-elements/button/code/IconSizesCode.js`
- `src/components/forms/form-elements/button/code/LoadingButtonsCode.js`
- `src/components/forms/form-elements/button/code/OutlineSizeCode.js`
- `src/components/forms/form-elements/button/code/OutlinedCode.js`
- `src/components/forms/form-elements/button/code/OutlinedIconCode.js`
- `src/components/forms/form-elements/button/code/SizeButtonGroupCode.js`
- `src/components/forms/form-elements/button/code/SizesCode.js`
- `src/components/forms/form-elements/button/code/TextButtonGroupCode.js`
- `src/components/forms/form-elements/button/code/TextCode.js`
- `src/components/forms/form-elements/button/code/TextColorCode.js`
- `src/components/forms/form-elements/button/code/TextIconColor.js`
- `src/components/forms/form-elements/button/code/TextSizesCode.js`
- `src/components/forms/form-elements/button/code/VerticalButtonGroupCode.js`
- `src/components/forms/form-elements/checkbox/Colors.js`
- `src/components/forms/form-elements/checkbox/Custom.js`
- `src/components/forms/form-elements/checkbox/Default.js`
- `src/components/forms/form-elements/checkbox/DefaultColors.js`
- `src/components/forms/form-elements/checkbox/Position.js`
- `src/components/forms/form-elements/checkbox/Sizes.js`
- `src/components/forms/form-elements/checkbox/code/ColorsCheckboxCode.js`
- `src/components/forms/form-elements/checkbox/code/CustomEleCheckboxCode.js`
- `src/components/forms/form-elements/checkbox/code/DefaultCheckboxCode.js`
- `src/components/forms/form-elements/checkbox/code/DefaultcolorsCheckboxCode.js`
- `src/components/forms/form-elements/checkbox/code/PositionCheckboxCode.js`
- `src/components/forms/form-elements/checkbox/code/SizesCheckboxCode.js`
- `src/components/forms/form-elements/date-time/code/BasicDateTimeCode.js`
- `src/components/forms/form-elements/date-time/code/DifferentDesignCode.js`
- `src/components/forms/form-elements/date-time/code/TimepickerCode.js`
- `src/components/forms/form-elements/radio/ColorLabel.js`
- `src/components/forms/form-elements/radio/Colors.js`
- `src/components/forms/form-elements/radio/Custom.js`
- `src/components/forms/form-elements/radio/Default.js`
- `src/components/forms/form-elements/radio/Position.js`
- `src/components/forms/form-elements/radio/Sizes.js`
- `src/components/forms/form-elements/radio/code/ColorLabelRadioCode.js`
- `src/components/forms/form-elements/radio/code/ColorsRadioCode.js`
- `src/components/forms/form-elements/radio/code/CustomExRadioCode.js`
- `src/components/forms/form-elements/radio/code/DefaultRadioCode.js`
- `src/components/forms/form-elements/radio/code/PositionRadioCode.js`
- `src/components/forms/form-elements/radio/code/SizesRadioCode.js`
- `src/components/forms/form-elements/slider/code/CustomSliderCode.js`
- `src/components/forms/form-elements/slider/code/DefaultsliderCode.js`
- `src/components/forms/form-elements/slider/code/DisabledSliderCode.js`
- `src/components/forms/form-elements/slider/code/DiscreteSliderCode.js`
- `src/components/forms/form-elements/slider/code/RangesliderCode.js`
- `src/components/forms/form-elements/slider/code/TemperatureRangeCode.js`
- `src/components/forms/form-elements/slider/code/VolumesliderCode.js`
- `src/components/forms/form-elements/switch/Colors.js`
- `src/components/forms/form-elements/switch/Custom.js`
- `src/components/forms/form-elements/switch/Default.js`
- `src/components/forms/form-elements/switch/DefaultLabel.js`
- `src/components/forms/form-elements/switch/Position.js`
- `src/components/forms/form-elements/switch/Sizes.js`
- `src/components/forms/form-elements/switch/code/ColorsSwitchCode.js`
- `src/components/forms/form-elements/switch/code/CustomSwitchCode.js`
- `src/components/forms/form-elements/switch/code/DefaultLabelSwitchCode.js`
- `src/components/forms/form-elements/switch/code/DefaultSwitchCode.js`
- `src/components/forms/form-elements/switch/code/PositionSwitchCode.js`
- `src/components/forms/form-elements/switch/code/SizesSwitchCode.js`
- `src/components/forms/form-horizontal/BasicIcons.js`
- `src/components/forms/form-horizontal/BasicLayout.js`
- `src/components/forms/form-horizontal/CollapsibleForm.js`
- `src/components/forms/form-horizontal/FormLabelAlignment.js`
- `src/components/forms/form-horizontal/FormSeparator.js`
- `src/components/forms/form-horizontal/FormTabs.js`
- `src/components/forms/form-horizontal/code/BasicIconsCode.js`
- `src/components/forms/form-horizontal/code/BasicLayoutCode.js`
- `src/components/forms/form-horizontal/code/FormSeparatorCode.js`
- `src/components/forms/form-layouts/FbBasicHeaderForm.js`
- `src/components/forms/form-layouts/FbDefaultForm.js`
- `src/components/forms/form-layouts/FbDisabledForm.js`
- `src/components/forms/form-layouts/FbInputVariants.js`
- `src/components/forms/form-layouts/FbLeftIconForm.js`
- `src/components/forms/form-layouts/FbOrdinaryForm.js`
- `src/components/forms/form-layouts/FbReadonlyForm.js`
- `src/components/forms/form-layouts/FbRightIconForm.js`
- `src/components/forms/form-layouts/code/BasicHeaderFormCode.js`
- `src/components/forms/form-layouts/code/DefaultFormCode.js`
- `src/components/forms/form-layouts/code/InputVariantsCode.js`
- `src/components/forms/form-layouts/code/LeftIconFormCode.js`
- `src/components/forms/form-layouts/index.js`
- `src/components/forms/form-validation/FVCheckbox.js`
- `src/components/forms/form-validation/FVLogin.js`
- `src/components/forms/form-validation/FVOnLeave.js`
- `src/components/forms/form-validation/FVRadio.js`
- `src/components/forms/form-validation/FVRegister.js`
- `src/components/forms/form-validation/FVSelect.js`
- `src/components/forms/form-validation/code/CheckboxCode.js`
- `src/components/forms/form-validation/code/OnLeaveCode.js`
- `src/components/forms/form-validation/code/RadioCode.js`
- `src/components/forms/form-validation/code/SelectCode.js`
- `src/components/forms/form-vertical/BasicIcons.js`
- `src/components/forms/form-vertical/BasicLayout.js`
- `src/components/forms/form-vertical/CollapsibleForm.js`
- `src/components/forms/form-vertical/FormSeparator.js`
- `src/components/forms/form-vertical/FormTabs.js`
- `src/components/forms/form-vertical/code/BasicIconsCode.js`
- `src/components/forms/form-vertical/code/BasicLayoutCode.js`
- `src/components/forms/form-wizard/code/FormWizardCode.js`
- `src/components/forms/theme-elements/CustomCheckbox.js`
- `src/components/forms/theme-elements/CustomDisabledButton.js`
- `src/components/forms/theme-elements/CustomFormLabel.js`
- `src/components/forms/theme-elements/CustomOutlinedButton.js`
- `src/components/forms/theme-elements/CustomOutlinedInput.js`
- `src/components/forms/theme-elements/CustomRadio.js`
- `src/components/forms/theme-elements/CustomRangeSlider.js`
- `src/components/forms/theme-elements/CustomSelect.js`
- `src/components/forms/theme-elements/CustomSlider.js`
- `src/components/forms/theme-elements/CustomSocialButton.js`
- `src/components/forms/theme-elements/CustomSwitch.js`
- `src/components/forms/theme-elements/CustomTextField.js`
- `src/components/frontend-pages/about/banner/index.js`
- `src/components/frontend-pages/about/key-metric/ContentArea.js`
- `src/components/frontend-pages/about/key-metric/Key.js`
- `src/components/frontend-pages/about/key-metric/index.js`
- `src/components/frontend-pages/about/process/index.js`
- `src/components/frontend-pages/blog/banner/index.js`
- `src/components/frontend-pages/contact/banner/index.js`
- `src/components/frontend-pages/contact/form/Address.js`
- `src/components/frontend-pages/contact/form/index.js`
- `src/components/frontend-pages/homepage/banner/Banner.js`
- `src/components/frontend-pages/homepage/defend-focus/TabEmbedding.js`
- `src/components/frontend-pages/homepage/defend-focus/TabPayments.js`
- `src/components/frontend-pages/homepage/defend-focus/TabTeamScheduling.js`
- `src/components/frontend-pages/homepage/defend-focus/TabWorkflows.js`
- `src/components/frontend-pages/homepage/defend-focus/index.js`
- `src/components/frontend-pages/homepage/exceptional-feature/index.js`
- `src/components/frontend-pages/homepage/faq/index.js`
- `src/components/frontend-pages/homepage/features/FeatureTitle.js`
- `src/components/frontend-pages/homepage/features/Features.js`
- `src/components/frontend-pages/homepage/powerful-dozens/DozensCarousel.js`
- `src/components/frontend-pages/homepage/powerful-dozens/carousel.css`
- `src/components/frontend-pages/homepage/powerful-dozens/index.js`
- `src/components/frontend-pages/portfolio/Banner.js`
- `src/components/frontend-pages/pricing/Banner.js`
- `src/components/frontend-pages/shared/c2a/index.js`
- `src/components/frontend-pages/shared/footer/index.js`
- `src/components/frontend-pages/shared/header/HeaderAlert.js`
- `src/components/frontend-pages/shared/header/HpHeader.js`
- `src/components/frontend-pages/shared/header/MobileSidebar.js`
- `src/components/frontend-pages/shared/header/Navigations.js`
- `src/components/frontend-pages/shared/leadership/Contact.js`
- `src/components/frontend-pages/shared/leadership/LeaderShipCarousel.js`
- `src/components/frontend-pages/shared/leadership/carousel.css`
- `src/components/frontend-pages/shared/leadership/index.js`
- `src/components/frontend-pages/shared/pricing/PaymentMethods.js`
- `src/components/frontend-pages/shared/pricing/PricingCard.js`
- `src/components/frontend-pages/shared/pricing/index.js`
- `src/components/frontend-pages/shared/reviews/ContentArea.js`
- `src/components/frontend-pages/shared/reviews/ReviewCarousel.js`
- `src/components/frontend-pages/shared/reviews/index.js`
- `src/components/frontend-pages/shared/scroll-to-top/index.js`
- `src/components/landingpage/animation/Animation.js`
- `src/components/landingpage/banner/Banner.js`
- `src/components/landingpage/banner/BannerContent.js`
- `src/components/landingpage/c2a/C2a.js`
- `src/components/landingpage/c2a/C2a2.js`
- `src/components/landingpage/c2a/GuaranteeCard.js`
- `src/components/landingpage/demo-slider/DemoSlider.js`
- `src/components/landingpage/demo-slider/DemoTitle.js`
- `src/components/landingpage/demo-slider/demo-slider.css`
- `src/components/landingpage/features/Features.js`
- `src/components/landingpage/features/FeaturesTitle.js`
- `src/components/landingpage/footer/Footer.js`
- `src/components/landingpage/frameworks/Frameworks.js`
- `src/components/landingpage/frameworks/FrameworksTitle.js`
- `src/components/landingpage/header/DemosDD.js`
- `src/components/landingpage/header/Header.js`
- `src/components/landingpage/header/MobileSidebar.js`
- `src/components/landingpage/header/Navigations.js`
- `src/components/landingpage/testimonial/Testimonial.js`
- `src/components/landingpage/testimonial/TestimonialTitle.js`
- `src/components/landingpage/testimonial/testimonial.css`
- `src/components/material-ui/accordion/code/BasicCode.js`
- `src/components/material-ui/accordion/code/ControlledCode.js`
- `src/components/material-ui/alert/code/ActionCode.js`
- `src/components/material-ui/alert/code/DescriptionCode.js`
- `src/components/material-ui/alert/code/FilledCode.js`
- `src/components/material-ui/alert/code/OutlinedCode.js`
- `src/components/material-ui/alert/code/TransitionCode.js`
- `src/components/material-ui/avatar/code/GroupedCode.js`
- `src/components/material-ui/avatar/code/GroupedSizeCode.js`
- `src/components/material-ui/avatar/code/IconAvatarsCode.js`
- `src/components/material-ui/avatar/code/ImageAvatarsCode.js`
- `src/components/material-ui/avatar/code/LetterAvatarsCode.js`
- `src/components/material-ui/avatar/code/SizesCode.js`
- `src/components/material-ui/avatar/code/VariantCode.js`
- `src/components/material-ui/avatar/code/WithBadgeCode.js`
- `src/components/material-ui/chip/code/CustomIconCode.js`
- `src/components/material-ui/chip/code/CustomOutlinedIcon.js`
- `src/components/material-ui/chip/code/DisabledCode.js`
- `src/components/material-ui/chip/code/FilledCode.js`
- `src/components/material-ui/chip/code/OutlinedCode.js`
- `src/components/material-ui/chip/code/SizesCode.js`
- `src/components/material-ui/dialog/AlertDialog.js`
- `src/components/material-ui/dialog/FormDialog.js`
- `src/components/material-ui/dialog/FullscreenDialog.js`
- `src/components/material-ui/dialog/MaxWidthDialog.js`
- `src/components/material-ui/dialog/ResponsiveDialog.js`
- `src/components/material-ui/dialog/ScrollContentDialog.js`
- `src/components/material-ui/dialog/SimpleDialog.js`
- `src/components/material-ui/dialog/TransitionDialog.js`
- `src/components/material-ui/dialog/code/AlertCode.js`
- `src/components/material-ui/dialog/code/FormCode.js`
- `src/components/material-ui/dialog/code/FullScreenCode.js`
- `src/components/material-ui/dialog/code/MaxWidthCode.js`
- `src/components/material-ui/dialog/code/ResponsiveFullscreenCode.js`
- `src/components/material-ui/dialog/code/ScrollingContentCode.js`
- `src/components/material-ui/dialog/code/SimpleCode.js`
- `src/components/material-ui/dialog/code/TransitionCode.js`
- `src/components/material-ui/lists/ControlsList.js`
- `src/components/material-ui/lists/FolderList.js`
- `src/components/material-ui/lists/NestedList.js`
- `src/components/material-ui/lists/SelectedList.js`
- `src/components/material-ui/lists/SimpleList.js`
- `src/components/material-ui/lists/SwitchList.js`
- `src/components/material-ui/lists/code/ControlsListCode.js`
- `src/components/material-ui/lists/code/FolderListCode.js`
- `src/components/material-ui/lists/code/NestedListCode.js`
- `src/components/material-ui/lists/code/SelectedListCode.js`
- `src/components/material-ui/lists/code/SimpleListCode.js`
- `src/components/material-ui/lists/code/SwitchListCode.js`
- `src/components/material-ui/popover/ClickPopover.js`
- `src/components/material-ui/popover/HoverPopover.js`
- `src/components/material-ui/popover/code/ClickPopoverCode.js`
- `src/components/material-ui/popover/code/HoverPopoverCode.js`
- `src/components/material-ui/tabs/code/IconBottomCode.js`
- `src/components/material-ui/tabs/code/IconCode.js`
- `src/components/material-ui/tabs/code/IconLeftCode.js`
- `src/components/material-ui/tabs/code/IconRightCode.js`
- `src/components/material-ui/tabs/code/IconWithLabelCode.js`
- `src/components/material-ui/tabs/code/ScrollableCode.js`
- `src/components/material-ui/tabs/code/TextCode.js`
- `src/components/material-ui/tabs/code/VerticalCode.js`
- `src/components/material-ui/tooltip/code/ArrowTooltipCode.js`
- `src/components/material-ui/tooltip/code/PositionsTooltipCode.js`
- `src/components/material-ui/tooltip/code/SimpleTooltipCode.js`
- `src/components/material-ui/tooltip/code/TransitionsCode.js`
- `src/components/material-ui/tooltip/code/VariableWidthCode.js`
- `src/components/material-ui/transfer-list/BasicTransferList.js`
- `src/components/material-ui/transfer-list/EnhancedTransferList.js`
- `src/components/material-ui/transfer-list/code/BasicTransferListCode.js`
- `src/components/material-ui/transfer-list/code/EnhancedTransferListCode.js`
- `src/components/material-ui/typography/code/Heading1Code.js`
- `src/components/material-ui/typography/code/Heading2Code.js`
- `src/components/material-ui/typography/code/Heading3Code.js`
- `src/components/material-ui/typography/code/Heading4Code.js`
- `src/components/material-ui/typography/code/Heading5Code.js`
- `src/components/material-ui/typography/code/Heading6Code.js`
- `src/components/material-ui/typography/code/Subtitle1Code.js`
- `src/components/material-ui/typography/code/Subtitle2Code.js`
- `src/components/material-ui/typography/code/TextErrorCode.js`
- `src/components/material-ui/typography/code/TextInfoCode.js`
- `src/components/material-ui/typography/code/TextPrimaryCode.js`
- `src/components/material-ui/typography/code/TextSecondaryCode.js`
- `src/components/material-ui/typography/code/TextSuccessCode.js`
- `src/components/material-ui/typography/code/TextWarningCode.js`
- `src/components/muicharts/barcharts/BarChartStackedBySignChart.jsx`
- `src/components/muicharts/barcharts/BiaxialBarChart.jsx`
- `src/components/muicharts/barcharts/MixedBarChart.jsx`
- `src/components/muicharts/barcharts/PositiveAndNegativeBarChart.jsx`
- `src/components/muicharts/barcharts/SimpleBarChart.jsx`
- `src/components/muicharts/barcharts/StackedBarChart.jsx`
- `src/components/muicharts/barcharts/TinyBarChart.jsx`
- `src/components/muicharts/code/areachartscode/AreaChartConnectNullsCode.jsx`
- `src/components/muicharts/code/areachartscode/AreaChartFillByValueCode.jsx`
- `src/components/muicharts/code/areachartscode/PercentAreaCode.jsx`
- `src/components/muicharts/code/areachartscode/SimpleAreaCode.jsx`
- `src/components/muicharts/code/areachartscode/StackedAreaCode.jsx`
- `src/components/muicharts/code/areachartscode/TinyAreaCode.jsx`
- `src/components/muicharts/code/barchartcode/BarChartStackedBySignCode.jsx`
- `src/components/muicharts/code/barchartcode/BiaxialBarCode.jsx`
- `src/components/muicharts/code/barchartcode/MixedBarCode.jsx`
- `src/components/muicharts/code/barchartcode/PositiveAndNegativeBarCode.jsx`
- `src/components/muicharts/code/barchartcode/SimpleBarCode.jsx`
- `src/components/muicharts/code/barchartcode/StackedBarCode.jsx`
- `src/components/muicharts/code/barchartcode/TinyBarCode.jsx`
- `src/components/muicharts/code/gaugechartscode/ArcDesignCode.jsx`
- `src/components/muicharts/code/gaugechartscode/BasicGaugesCode.jsx`
- `src/components/muicharts/code/gaugechartscode/GaugePointerCode.jsx`
- `src/components/muicharts/code/linechartscode/BiaxialLineCode.jsx`
- `src/components/muicharts/code/linechartscode/DashedLineCode.jsx`
- `src/components/muicharts/code/linechartscode/LineChartWithReferenceLinesCode.jsx`
- `src/components/muicharts/code/linechartscode/LinewithforecastCode.jsx`
- `src/components/muicharts/code/linechartscode/SimpleLineCode.jsx`
- `src/components/muicharts/code/linechartscode/TinyLineCode.jsx`
- `src/components/muicharts/code/piechartcode/BasicPieCode.jsx`
- `src/components/muicharts/code/piechartcode/OnSeriesItemClickCode.jsx`
- `src/components/muicharts/code/piechartcode/PieChartWithCenterLabelCode.jsx`
- `src/components/muicharts/code/piechartcode/PieChartWithCustomizedLabelCode.jsx`
- `src/components/muicharts/code/piechartcode/PieChartWithPaddingAngleCode.jsx`
- `src/components/muicharts/code/piechartcode/StraightAnglePieCode.jsx`
- `src/components/muicharts/code/piechartcode/TwoLevelPieCode.jsx`
- `src/components/muicharts/code/piechartcode/TwoSimplePieCode.jsx`
- `src/components/muicharts/code/scatterchartscode/BasicScatterCode.jsx`
- `src/components/muicharts/code/scatterchartscode/ScatterClickNoSnapCode.jsx`
- `src/components/muicharts/code/scatterchartscode/ScatterDatasetCode.jsx`
- `src/components/muicharts/code/scatterchartscode/VoronoiInteractionCode.jsx`
- `src/components/muicharts/code/sparklinecode/AreaSparkLineCode.jsx`
- `src/components/muicharts/code/sparklinecode/BasicSparkLineCode.jsx`
- `src/components/muicharts/code/sparklinecode/BasicSparkLineCustomizationCode.jsx`
- `src/components/muicharts/gaugecharts/ArcDesignChart.jsx`
- `src/components/muicharts/gaugecharts/BasicGaugesChart.jsx`
- `src/components/muicharts/gaugecharts/GaugePointerChart.jsx`
- `src/components/muicharts/linescharts/areacharts/AreaChartConnectNullsChart.jsx`
- `src/components/muicharts/linescharts/areacharts/AreaChartFillByValueChart.jsx`
- `src/components/muicharts/linescharts/areacharts/PercentAreaChart.jsx`
- `src/components/muicharts/linescharts/areacharts/SimpleAreaChart.jsx`
- `src/components/muicharts/linescharts/areacharts/StackedAreaChart.jsx`
- `src/components/muicharts/linescharts/areacharts/TinyAreaChart.jsx`
- `src/components/muicharts/linescharts/linechart/BiaxialLineChart.jsx`
- `src/components/muicharts/linescharts/linechart/DashedLineChart.jsx`
- `src/components/muicharts/linescharts/linechart/LineChartWithReferenceLinesChart.jsx`
- `src/components/muicharts/linescharts/linechart/LinewithforecastChart.jsx`
- `src/components/muicharts/linescharts/linechart/SimpleLineChart.jsx`
- `src/components/muicharts/linescharts/linechart/TinyLineChart.jsx`
- `src/components/muicharts/piecharts/BasicPieChart.jsx`
- `src/components/muicharts/piecharts/OnSeriesItemClickChart.jsx`
- `src/components/muicharts/piecharts/PieChartWithCenterLabelChart.jsx`
- `src/components/muicharts/piecharts/PieChartWithCustomizedLabel.jsx`
- `src/components/muicharts/piecharts/PieChartWithPaddingAngleChart.jsx`
- `src/components/muicharts/piecharts/StraightAnglePieChart.jsx`
- `src/components/muicharts/piecharts/TwoLevelPieChart.jsx`
- `src/components/muicharts/piecharts/TwoSimplePieChart.jsx`
- `src/components/muicharts/scattercharts/BasicScatterChart.jsx`
- `src/components/muicharts/scattercharts/ScatterClickNoSnapChart.jsx`
- `src/components/muicharts/scattercharts/ScatterDatasetChart.jsx`
- `src/components/muicharts/scattercharts/VoronoiInteractionChart.jsx`
- `src/components/muicharts/sparklinecharts/AreaSparkLineChart.jsx`
- `src/components/muicharts/sparklinecharts/BasicSparkLine.jsx`
- `src/components/muicharts/sparklinecharts/BasicSparkLineCustomizationChart.jsx`
- `src/components/muitrees/code/simpletreecode/ApiMethodFocusItemCode.jsx`
- `src/components/muitrees/code/simpletreecode/ApiMethodSetItemExpansionCode.jsx`
- `src/components/muitrees/code/simpletreecode/BasicCustomIconsCode.jsx`
- `src/components/muitrees/code/simpletreecode/BasicSimpleTreeViewCode.jsx`
- `src/components/muitrees/code/simpletreecode/CheckboxSelectionCode.jsx`
- `src/components/muitrees/code/simpletreecode/ControlledExpansionTreeCode.jsx`
- `src/components/muitrees/code/simpletreecode/ControlledSelectionCode.jsx`
- `src/components/muitrees/code/simpletreecode/CustomTreeItemCode.jsx`
- `src/components/muitrees/code/simpletreecode/MultiSelectTreeViewCode.jsx`
- `src/components/muitrees/code/simpletreecode/TrackitemclicksTreeCode.jsx`
- `src/components/muitrees/simpletree/ApiMethodFocusItem.jsx`
- `src/components/muitrees/simpletree/ApiMethodSetItemExpansion.jsx`
- `src/components/muitrees/simpletree/BasicCustomIcons.jsx`
- `src/components/muitrees/simpletree/BasicSimpleTreeView.jsx`
- `src/components/muitrees/simpletree/CheckboxSelection.jsx`
- `src/components/muitrees/simpletree/ControlledExpansionTree.jsx`
- `src/components/muitrees/simpletree/ControlledSelectiontree.jsx`
- `src/components/muitrees/simpletree/CustomTreeItemView.jsx`
- `src/components/muitrees/simpletree/MultiSelectTreeView.jsx`
- `src/components/muitrees/simpletree/TrackitemclicksTree.jsx`
- `src/components/notifications/RealtimeNotificationToast.jsx`
- `src/components/pages/account-setting/AccountTab.js`
- `src/components/pages/account-setting/BillsTab.js`
- `src/components/pages/account-setting/NotificationTab.js`
- `src/components/pages/account-setting/SecurityTab.js`
- `src/components/pages/faq/Questions.js`
- `src/components/pages/faq/StillQuestions.js`
- `src/components/react-tables/basic/page.jsx`
- `src/components/react-tables/column-visiblity/page.jsx`
- `src/components/react-tables/dense/page.jsx`
- `src/components/react-tables/drag-drop/Columndragdrop.jsx`
- `src/components/react-tables/drag-drop/Rowdragdrop.jsx`
- `src/components/react-tables/editable/page.jsx`
- `src/components/react-tables/empty/page.jsx`
- `src/components/react-tables/expanding/page.jsx`
- `src/components/react-tables/filter/FilterTableData.js`
- `src/components/react-tables/filter/page.jsx`
- `src/components/react-tables/pagination/PaginationData.js`
- `src/components/react-tables/pagination/page.jsx`
- `src/components/react-tables/row-selection/page.jsx`
- `src/components/react-tables/sorting/page.jsx`
- `src/components/react-tables/sticky/page.jsx`
- `src/components/shared/AppCard.js`
- `src/components/shared/BaseCard.js`
- `src/components/shared/BlankCard.js`
- `src/components/shared/ChildCard.js`
- `src/components/shared/CodeDialog.js`
- `src/components/shared/DashboardCard.js`
- `src/components/shared/DashboardWidgetCard.js`
- `src/components/shared/DownloadCard.js`
- `src/components/shared/InlineItemCard.js`
- `src/components/shared/ParentCard.js`
- `src/components/shared/ScrollToTop.js`
- `src/components/shared/ThreeColumn.js`
- `src/components/shared/WidgetCard.js`
- `src/components/tables/Table1.jsx`
- `src/components/tables/Table2.jsx`
- `src/components/tables/Table3.jsx`
- `src/components/tables/Table4.jsx`
- `src/components/tables/Table5.jsx`
- `src/components/tables/code/BasicTableCode.tsx`
- `src/components/tables/tableData.js`
- `src/components/widgets/banners/Banner1.js`
- `src/components/widgets/banners/Banner2.js`
- `src/components/widgets/banners/Banner3.js`
- `src/components/widgets/banners/Banner4.js`
- `src/components/widgets/banners/Banner5.js`
- `src/components/widgets/banners/code/EmptyCartCode.jsx`
- `src/components/widgets/banners/code/ErrorBannerCode.jsx`
- `src/components/widgets/banners/code/FriendCardCode.jsx`
- `src/components/widgets/banners/code/NotificationCode.jsx`
- `src/components/widgets/banners/code/TransectionCode.jsx`
- `src/components/widgets/cards/ComplexCard.js`
- `src/components/widgets/cards/EcommerceCard.js`
- `src/components/widgets/cards/FollowerCard.js`
- `src/components/widgets/cards/FriendCard.js`
- `src/components/widgets/cards/GiftCard.js`
- `src/components/widgets/cards/MusicCard.js`
- `src/components/widgets/cards/ProfileCard.js`
- `src/components/widgets/cards/Settings.js`
- `src/components/widgets/cards/UpcomingActivity.js`
- `src/components/widgets/cards/code/ComplexCardCode.jsx`
- `src/components/widgets/cards/code/EcommerceCardCode.jsx`
- `src/components/widgets/cards/code/FollowerCardCode.jsx`
- `src/components/widgets/cards/code/FriendCardCode.jsx`
- `src/components/widgets/cards/code/GiftCardCode.jsx`
- `src/components/widgets/cards/code/MusicCardCode.jsx`
- `src/components/widgets/cards/code/ProfileCardCode.jsx`
- `src/components/widgets/cards/code/SettingsCode.jsx`
- `src/components/widgets/cards/code/UpcomingActivityCode.jsx`
- `src/components/widgets/charts/CurrentValue.js`
- `src/components/widgets/charts/Earned.js`
- `src/components/widgets/charts/Followers.js`
- `src/components/widgets/charts/MostVisited.js`
- `src/components/widgets/charts/PageImpressions.js`
- `src/components/widgets/charts/Views.js`
- `src/constants/expenseFormOptions.js`
- `src/constants/paymentAccounts.js`
- `src/constants/paymentMethods.js`
- `src/context/AuthContext.jsx`
- `src/context/BlogContext/index.jsx`
- `src/context/ChatContext/index.jsx`
- `src/context/ConatactContext/index.jsx`
- `src/context/CustomizerContext.jsx`
- `src/context/EcommerceContext/index.jsx`
- `src/context/EmailContext/index.jsx`
- `src/context/InvoiceContext/index.jsx`
- `src/context/NotesContext/index.jsx`
- `src/context/SocketContext.jsx`
- `src/context/TicketContext/index.jsx`
- `src/context/UserDataContext/index.jsx`
- `src/context/config.js`
- `src/context/kanbancontext/index.jsx`
- `src/hooks/useAccountMenu.js`
- `src/index.css`
- `src/layouts/blank/BlankLayout.js`
- `src/layouts/full/FullLayout.js`
- `src/layouts/full/horizontal/header/Header.js`
- `src/layouts/full/horizontal/navbar/Menudata.js`
- `src/layouts/full/horizontal/navbar/NavCollapse/NavCollapse.js`
- `src/layouts/full/horizontal/navbar/NavItem/NavItem.js`
- `src/layouts/full/horizontal/navbar/NavListing/NavListing.js`
- `src/layouts/full/horizontal/navbar/Navbar.js`
- `src/layouts/full/shared/breadcrumb/Breadcrumb.js`
- `src/layouts/full/shared/customizer/Customizer.js`
- `src/layouts/full/shared/customizer/RTL.js`
- `src/layouts/full/shared/loadable/Loadable.js`
- `src/layouts/full/shared/logo/Logo.js`
- `src/layouts/full/shared/welcome/Welcome.js`
- `src/layouts/full/vertical/header/AppLinks.js`
- `src/layouts/full/vertical/header/Cart.js`
- `src/layouts/full/vertical/header/CartItems.js`
- `src/layouts/full/vertical/header/Header.js`
- `src/layouts/full/vertical/header/Language.js`
- `src/layouts/full/vertical/header/MobileRightSidebar.js`
- `src/layouts/full/vertical/header/Navigation.js`
- `src/layouts/full/vertical/header/Notifications.js`
- `src/layouts/full/vertical/header/Profile.js`
- `src/layouts/full/vertical/header/QuickLinks.js`
- `src/layouts/full/vertical/header/Search.js`
- `src/layouts/full/vertical/header/data.js`
- `src/layouts/full/vertical/sidebar/ErpMenuItems.js`
- `src/layouts/full/vertical/sidebar/MenuItems.js`
- `src/layouts/full/vertical/sidebar/NavCollapse/index.js`
- `src/layouts/full/vertical/sidebar/NavGroup/NavGroup.js`
- `src/layouts/full/vertical/sidebar/NavItem/index.js`
- `src/layouts/full/vertical/sidebar/Sidebar.js`
- `src/layouts/full/vertical/sidebar/SidebarItems.js`
- `src/layouts/full/vertical/sidebar/SidebarProfile/Profile.js`
- `src/main.jsx`
- `src/routes/Router.js`
- `src/services/api.js`
- `src/theme/Components.js`
- `src/theme/DarkThemeColors.js`
- `src/theme/DefaultColors.js`
- `src/theme/LightThemeColors.js`
- `src/theme/Shadows.js`
- `src/theme/Theme.js`
- `src/theme/Typography.js`
- `src/utils/authHelpers.js`
- `src/utils/chunkReload.js`
- `src/utils/formatApiError.js`
- `src/utils/googleMapsLoader.js`
- `src/utils/i18n.js`
- `src/utils/inspectionReportHelpers.js`
- `src/utils/inspectionRequestHelpers.js`
- `src/utils/languages/ar.json`
- `src/utils/languages/ch.json`
- `src/utils/languages/en.json`
- `src/utils/languages/fr.json`
- `src/utils/notificationLinks.js`
- `src/utils/purchaseBills.js`
- `src/utils/quotationVersion.js`
- `src/utils/recordStatus.js`
- `src/utils/reportApi.js`
- `src/utils/uploadFileTypes.js`
- `src/views/authentication/Error.js`
- `src/views/authentication/Maintenance.js`
- `src/views/authentication/auth1/ForgotPassword.js`
- `src/views/authentication/auth1/Login.js`
- `src/views/authentication/auth1/Register.js`
- `src/views/authentication/auth1/TwoSteps.js`
- `src/views/authentication/auth2/ForgotPassword2.js`
- `src/views/authentication/auth2/Login2.js`
- `src/views/authentication/auth2/Register2.js`
- `src/views/authentication/auth2/TwoSteps2.js`
- `src/views/authentication/authForms/AuthForgotPassword.js`
- `src/views/authentication/authForms/AuthLogin.js`
- `src/views/authentication/authForms/AuthRegister.js`
- `src/views/authentication/authForms/AuthSocialButtons.js`
- `src/views/authentication/authForms/AuthTwoSteps.js`
- `src/views/erp/Dashboard.jsx`
- `src/views/erp/account/ChangePassword.jsx`
- `src/views/erp/accounts/AccountsWorkOrderList.jsx`
- `src/views/erp/accounts/AccountsWorkOrderView.jsx`
- `src/views/erp/accounts/ExpenseCreate.jsx`
- `src/views/erp/accounts/ExpensesList.jsx`
- `src/views/erp/companies/CompanyForm.jsx`
- `src/views/erp/companies/CompanyList.jsx`
- `src/views/erp/companies/CompanyView.jsx`
- `src/views/erp/contacts/ContactForm.jsx`
- `src/views/erp/contacts/ContactList.jsx`
- `src/views/erp/dashboard/AccountsDashboard.jsx`
- `src/views/erp/dashboard/AdminDashboard.jsx`
- `src/views/erp/dashboard/DashboardRouter.jsx`
- `src/views/erp/dashboard/DriverDashboard.jsx`
- `src/views/erp/dashboard/InspectionDashboard.jsx`
- `src/views/erp/dashboard/OperationsDashboard.jsx`
- `src/views/erp/dashboard/SalesDashboard.jsx`
- `src/views/erp/dashboard/SalesManagerDashboard.jsx`
- `src/views/erp/dashboard/SuperAdminDashboard.jsx`
- `src/views/erp/dashboard/shared/ActionableList.jsx`
- `src/views/erp/dashboard/shared/DashboardChart.jsx`
- `src/views/erp/dashboard/shared/KpiCard.jsx`
- `src/views/erp/deals/DealForm.jsx`
- `src/views/erp/deals/DealList.jsx`
- `src/views/erp/deals/DealView.jsx`
- `src/views/erp/driver/DriverPickupList.jsx`
- `src/views/erp/driver/DriverPickupTaskView.jsx`
- `src/views/erp/grn/GrnEvidenceThumbs.jsx`
- `src/views/erp/grn/GrnForm.jsx`
- `src/views/erp/grn/GrnList.jsx`
- `src/views/erp/grn/GrnView.jsx`
- `src/views/erp/grn/grnDisplayHelpers.js`
- `src/views/erp/inspection-requests/InspectionRequestList.jsx`
- `src/views/erp/inspection-requests/InspectionRequestView.jsx`
- `src/views/erp/leads/LeadForm.jsx`
- `src/views/erp/leads/LeadList.jsx`
- `src/views/erp/payables/PayablesAgingSummaryView.jsx`
- `src/views/erp/payables/PayablesList.jsx`
- `src/views/erp/payables/PurchasePaymentReceiptView.jsx`
- `src/views/erp/payables/PurchasePaymentReceiptsList.jsx`
- `src/views/erp/products/ProductForm.jsx`
- `src/views/erp/products/ProductList.jsx`
- `src/views/erp/proforma-invoices/ProformaInvoiceCreate.jsx`
- `src/views/erp/proforma-invoices/ProformaInvoiceList.jsx`
- `src/views/erp/proforma-invoices/ProformaInvoiceView.jsx`
- `src/views/erp/purchase-orders/ClientPurchaseOrderList.jsx`
- `src/views/erp/purchase-orders/ClientPurchaseQuotationList.jsx`
- `src/views/erp/purchase-orders/PurchaseOrderForm.jsx`
- `src/views/erp/purchase-orders/PurchaseOrderList.jsx`
- `src/views/erp/purchase-orders/PurchaseOrderView.jsx`
- `src/views/erp/purchase-orders/SupplierPurchaseOrderList.jsx`
- `src/views/erp/purchase-orders/VendorPurchaseQuotationList.jsx`
- `src/views/erp/quotations/QuotationForm.jsx`
- `src/views/erp/quotations/QuotationList.jsx`
- `src/views/erp/quotations/QuotationView.jsx`
- `src/views/erp/receivables/AgingSummaryView.jsx`
- `src/views/erp/receivables/ReceivablesList.jsx`
- `src/views/erp/reports/BalanceSheetView.jsx`
- `src/views/erp/reports/CashFlowView.jsx`
- `src/views/erp/reports/ChangesInEquityView.jsx`
- `src/views/erp/reports/ChartOfAccountsList.jsx`
- `src/views/erp/reports/FiscalYearManager.jsx`
- `src/views/erp/reports/GeneralLedgerView.jsx`
- `src/views/erp/reports/IncomeStatementView.jsx`
- `src/views/erp/reports/JournalEntryCreate.jsx`
- `src/views/erp/reports/JournalEntryView.jsx`
- `src/views/erp/reports/JournalList.jsx`
- `src/views/erp/reports/OpeningBalancesForm.jsx`
- `src/views/erp/reports/TrialBalanceView.jsx`
- `src/views/erp/reports/VatReportView.jsx`
- `src/views/erp/roles/RoleForm.jsx`
- `src/views/erp/roles/RoleList.jsx`
- `src/views/erp/settings/CompanySettings.jsx`
- `src/views/erp/suppliers/SupplierForm.jsx`
- `src/views/erp/suppliers/SupplierList.jsx`
- `src/views/erp/suppliers/SupplierView.jsx`
- `src/views/erp/tax-invoices/TaxInvoiceCreate.jsx`
- `src/views/erp/tax-invoices/TaxInvoiceEdit.jsx`
- `src/views/erp/tax-invoices/TaxInvoiceList.jsx`
- `src/views/erp/tax-invoices/TaxInvoiceView.jsx`
- `src/views/erp/terms/TermsForm.jsx`
- `src/views/erp/terms/TermsList.jsx`
- `src/views/erp/users/UserForm.jsx`
- `src/views/erp/users/UserList.jsx`
- `src/views/erp/work-orders/TaskStatusSegments.jsx`
- `src/views/erp/work-orders/WorkOrderExpandableRows.jsx`
- `src/views/erp/work-orders/WorkOrderForm.jsx`
- `src/views/erp/work-orders/WorkOrderList.jsx`
- `src/views/erp/work-orders/WorkOrderView.jsx`
- `src/views/erp/work-orders/WorkTypesManageDialog.jsx`
- `src/views/public/ClientLocationPicker.jsx`
- `src/views/spinner/Spinner.js`
- `src/views/spinner/spinner.css`
