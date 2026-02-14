# ClearEarth ERP API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

All API endpoints (except registration and login) require authentication using JWT Bearer tokens.

### Headers
```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

For tenant-specific operations, the tenant ID is automatically extracted from the JWT token.

---

## Authentication Endpoints

### 1. Register Tenant & Admin User
**POST** `/auth/register`

Register a new tenant organization with an admin user.

**Request Body:**
```json
{
  "tenantName": "ClearEarth Recycling",
  "companyName": "ClearEarth LLC",
  "email": "admin@clearearth.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+971501234567"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@clearearth.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant_admin"
    },
    "tenant": {
      "id": 1,
      "name": "ClearEarth Recycling",
      "companyName": "ClearEarth LLC"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "admin@clearearth.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "admin@clearearth.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "tenant_admin",
      "permissions": ["clients.create", "deals.read", ...]
    },
    "tenant": {
      "id": 1,
      "name": "ClearEarth Recycling",
      "companyName": "ClearEarth LLC"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Refresh Token
**POST** `/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### 4. Get Current User
**GET** `/auth/me`

Headers: `Authorization: Bearer <token>`

### 5. Logout
**POST** `/auth/logout`

Headers: `Authorization: Bearer <token>`

### 6. Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "admin@clearearth.com"
}
```

### 7. Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123"
}
```

### 8. Change Password
**PUT** `/auth/change-password`

Headers: `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass123"
}
```

---

## User Management

### List Users
**GET** `/users?page=1&pageSize=20&search=john&status=active&roleId=2`

### Get User by ID
**GET** `/users/:id`

### Create User
**POST** `/users`

**Request Body:**
```json
{
  "email": "user@clearearth.com",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+971501234567",
  "roleId": 2
}
```

### Update User
**PUT** `/users/:id`

### Delete User
**DELETE** `/users/:id`

---

## Clients & Vendors

### Clients
- **GET** `/clients` - List all clients
- **GET** `/clients/:id` - Get client by ID
- **POST** `/clients` - Create client
- **PUT** `/clients/:id` - Update client
- **DELETE** `/clients/:id` - Delete client

### Vendors
- **GET** `/vendors` - List all vendors
- **GET** `/vendors/:id` - Get vendor by ID
- **POST** `/vendors` - Create vendor
- **PUT** `/vendors/:id` - Update vendor
- **DELETE** `/vendors/:id` - Delete vendor

---

## CRM (Leads & Deals)

### Leads
- **GET** `/leads` - List all leads
- **GET** `/leads/:id` - Get lead by ID
- **POST** `/leads` - Create lead
- **PUT** `/leads/:id` - Update lead
- **DELETE** `/leads/:id` - Delete lead
- **POST** `/leads/:id/convert` - Convert lead to deal

### Deals
- **GET** `/deals` - List all deals
- **GET** `/deals/:id` - Get deal by ID
- **POST** `/deals` - Create deal
- **PUT** `/deals/:id` - Update deal
- **DELETE** `/deals/:id` - Delete deal
- **POST** `/deals/:id/finalize` - Finalize deal

---

## Products & Services

### Products
- **GET** `/products` - List all products
- **GET** `/products/:id` - Get product by ID
- **POST** `/products` - Create product
- **PUT** `/products/:id` - Update product
- **DELETE** `/products/:id` - Delete product

### Services
- **GET** `/services` - List all services
- **GET** `/services/:id` - Get service by ID
- **POST** `/services` - Create service
- **PUT** `/services/:id` - Update service
- **DELETE** `/services/:id` - Delete service

---

## Inventory & Warehouse

### Warehouses
- **GET** `/warehouses` - List all warehouses
- **GET** `/warehouses/:id` - Get warehouse by ID
- **POST** `/warehouses` - Create warehouse
- **PUT** `/warehouses/:id` - Update warehouse
- **DELETE** `/warehouses/:id` - Delete warehouse

### Inventory
- **GET** `/inventory` - List inventory
- **GET** `/inventory/lots` - List lots
- **GET** `/inventory/movements` - Stock movements
- **POST** `/inventory/adjustment` - Stock adjustment

---

## Operations

### Jobs
- **GET** `/jobs` - List all jobs
- **GET** `/jobs/:id` - Get job by ID
- **POST** `/jobs` - Create job
- **PUT** `/jobs/:id` - Update job
- **DELETE** `/jobs/:id` - Delete job

---

## Accounting & Finance

### Invoices
- **GET** `/invoices` - List all invoices
- **GET** `/invoices/:id` - Get invoice by ID
- **POST** `/invoices` - Create invoice
- **PUT** `/invoices/:id` - Update invoice
- **DELETE** `/invoices/:id` - Delete invoice
- **GET** `/invoices/:id/pdf` - Generate invoice PDF

### Payments
- **GET** `/payments` - List all payments
- **GET** `/payments/:id` - Get payment by ID
- **POST** `/payments` - Create payment
- **PUT** `/payments/:id` - Update payment
- **DELETE** `/payments/:id` - Delete payment

---

## HR & Payroll

### Employees
- **GET** `/employees` - List all employees
- **GET** `/employees/:id` - Get employee by ID
- **POST** `/employees` - Create employee
- **PUT** `/employees/:id` - Update employee
- **DELETE** `/employees/:id` - Delete employee

---

## Fleet & Logistics

### Vehicles
- **GET** `/vehicles` - List all vehicles
- **GET** `/vehicles/:id` - Get vehicle by ID
- **POST** `/vehicles` - Create vehicle
- **PUT** `/vehicles/:id` - Update vehicle
- **DELETE** `/vehicles/:id` - Delete vehicle

---

## Documents & Certificates

### Documents
- **GET** `/documents` - List all documents
- **GET** `/documents/:id` - Get document by ID
- **POST** `/documents` - Upload document
- **PUT** `/documents/:id` - Update document
- **DELETE** `/documents/:id` - Delete document

### Certificates
- **GET** `/certificates` - List all certificates
- **GET** `/certificates/:id` - Get certificate by ID
- **POST** `/certificates` - Create certificate
- **GET** `/certificates/:id/pdf` - Generate certificate PDF

---

## Dashboard & Analytics

### Dashboard
**GET** `/dashboard`

Returns key performance indicators and metrics.

**Response:**
```json
{
  "totalWasteCollected": 5000,
  "recyclingRate": 75,
  "totalDeals": 150,
  "totalInvoices": 200,
  "revenue": 500000,
  "pendingJobs": 25
}
```

### Analytics
**GET** `/dashboard/analytics`

---

## Reports

### Available Reports
**GET** `/reports`

Returns list of available report types.

### Generate Reports
- **GET** `/reports/sales` - Sales report
- **GET** `/reports/purchases` - Purchases report
- **GET** `/reports/inventory` - Inventory report
- **GET** `/reports/vat` - VAT report
- **GET** `/reports/financial` - Financial report

---

## Settings

### Get Settings
**GET** `/settings`

### Update Settings
**PUT** `/settings`

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": null,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

---

## Pagination

List endpoints support pagination with these query parameters:

- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Testing with Postman/cURL

### Example cURL Request

**Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "Test Company",
    "companyName": "Test LLC",
    "email": "admin@test.com",
    "password": "Test123456",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Test123456"
  }'
```

**Authenticated Request:**
```bash
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Window:** 15 minutes
- **Max Requests:** 100 per window per IP

Exceeded limits return `429 Too Many Requests`.

---

## Multi-Tenancy

The system automatically handles multi-tenancy:
- Tenant context is extracted from JWT token
- All data is automatically scoped to the authenticated user's tenant
- No need to pass tenant ID in requests

---

## Support

For issues or questions:
- GitHub: [Repository URL]
- Email: support@clearearth.com

---

**Version:** 1.0.0  
**Last Updated:** February 2026
