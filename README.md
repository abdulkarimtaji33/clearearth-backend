# ClearEarth ERP Backend

Enterprise Resource Planning system for Recycling and Waste Management industry with multi-tenancy support.

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation with shared database
- **Role-Based Access Control**: Fine-grained permissions and role management
- **Comprehensive Modules**: 18+ integrated business modules
- **Audit Trail**: Complete activity logging for compliance
- **UAE FTA Compliant**: VAT handling, tax invoicing, and audit file generation
- **Lot-Based Inventory**: Specific identification costing method
- **Mobile APIs**: Support for fleet, warehouse, and employee mobile apps
- **Document Management**: Centralized document repository with version control
- **Advanced Reporting**: 50+ operational and financial reports

## Modules

1. Dashboard & Analytics
2. Clients & Vendors Management
3. Leads & Deals (CRM)
4. Products & Services
5. Accounting & Finance
6. Commission Manager
7. Documents Management
8. Operations & Job Costing
9. Reports
10. Settings
11. User & Access Management
12. Masters/Configuration
13. Certificate Management
14. Fleets & Logistics
15. HR Admin & Payroll
16. Inbound Management
17. Inventory Management
18. Outbound Management

## Technology Stack

- **Runtime**: Node.js >= 18.x
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **ORM**: Sequelize
- **Authentication**: JWT
- **Validation**: Joi & Express-Validator
- **Logging**: Winston
- **Documentation**: OpenAPI/Swagger

## Prerequisites

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm >= 9.0.0

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd clearearth-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create database:
```bash
mysql -u root -p
CREATE DATABASE clearearth_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. Run migrations:
```bash
npm run migrate
```

6. Seed initial data (optional):
```bash
npm run seed
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in .env)

## API Documentation

API documentation is available at `/api/v1/docs` when the server is running.

## Project Structure

```
clearearth-backend/
├── src/
│   ├── config/              # Configuration files
│   ├── constants/           # Constants and enums
│   ├── controllers/         # Request handlers
│   ├── database/            # Database setup and migrations
│   ├── middlewares/         # Custom middleware
│   ├── models/              # Sequelize models
│   ├── routes/              # API routes
│   ├── services/            # Business logic layer
│   ├── utils/               # Utility functions
│   ├── validators/          # Input validation schemas
│   ├── app.js               # Express app configuration
│   └── server.js            # Application entry point
├── uploads/                 # File uploads directory
├── logs/                    # Application logs
├── tests/                   # Test files
├── .env                     # Environment variables
├── .env.example             # Example environment file
├── package.json             # Project dependencies
└── README.md                # This file
```

## Database Schema

The system uses a multi-tenant architecture with tenant_id in all tables for data isolation.

### Core Tables:
- tenants
- users, roles, permissions
- clients, vendors
- leads, deals
- products, services
- invoices, payments, transactions
- inventory, lots, stock_movements
- jobs, operations
- employees, payroll
- vehicles, logistics
- documents, certificates
- audit_logs

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet security headers
- CORS configuration
- SQL injection prevention
- XSS protection
- Input validation and sanitization
- Role-based access control
- Audit logging

## Multi-Tenancy

The system uses a shared database with tenant_id discrimination:
- Tenant context is resolved from JWT token or x-tenant-id header
- All queries are automatically scoped to the current tenant
- Complete data isolation between tenants
- Tenant-specific configurations

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Linting & Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password

### Users & Access
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/:id` - Get user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Clients & Vendors
- `GET /api/v1/clients` - List clients
- `POST /api/v1/clients` - Create client
- ... (similar CRUD operations)

*(Full API documentation available in Swagger UI)*

## Environment Variables

See `.env.example` for all available configuration options.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, contact the development team.

## Version History

- **v1.0.0** - Initial release with all core modules
