# TaskGo Agency -- CRM Platform

A full-stack Customer Relationship Management platform built for agencies and service-based businesses. TaskGo Agency provides end-to-end lifecycle management -- from lead acquisition through deal negotiation to client onboarding and project delivery -- with role-based access control for every organisational function.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Repository Structure](#repository-structure)
4. [Data Model](#data-model)
5. [Authentication and Authorisation](#authentication-and-authorisation)
6. [API Reference](#api-reference)
7. [Client Application](#client-application)
8. [Server Internals](#server-internals)
9. [Getting Started](#getting-started)
10. [Environment Variables](#environment-variables)
11. [Database Management](#database-management)
12. [Deployment](#deployment)
13. [Contributing](#contributing)

---

## Architecture Overview

TaskGo Agency follows a monorepo structure with two independent applications communicating over a RESTful API:

```
CRM-Software/
  client/   -- Next.js 16 front-end (React 19, Tailwind CSS 4)
  server/   -- Express.js back-end (Prisma ORM, PostgreSQL)
```

**Request lifecycle:**

```
Browser --> Next.js Middleware (route guard, role check)
        --> Server Action / API Client
        --> Express Router --> Validate Middleware (Zod)
        --> Auth Middleware (JWT) --> Role Middleware
        --> Controller --> Service --> Prisma --> PostgreSQL
```

The server exposes a JSON REST API under `/api/*`. The client consumes this API through a centralised HTTP client (`client/src/lib/api.js`) which handles token attachment, error normalisation, and response parsing. Server actions (`client/src/actions/*`) wrap these API calls and manage cookie-based token storage on the server side of Next.js.

---

## Technology Stack

### Front-End (`client/`)

| Component        | Technology                        |
| ---------------- | --------------------------------- |
| Framework        | Next.js 16 (App Router)          |
| UI Library       | React 19                          |
| Styling          | Tailwind CSS 4                    |
| Animations       | Framer Motion                     |
| Icons            | Lucide React                      |
| Utilities        | clsx, tailwind-merge              |
| Typography       | Geist, Geist Mono (Google Fonts)  |
| Package Manager  | Bun                               |

### Back-End (`server/`)

| Component        | Technology                        |
| ---------------- | --------------------------------- |
| Runtime          | Node.js (ES Modules)             |
| Framework        | Express.js 4                      |
| ORM              | Prisma 7 (with `@prisma/adapter-pg`) |
| Database         | PostgreSQL                        |
| Authentication   | JSON Web Tokens (jsonwebtoken)    |
| Password Hashing | bcryptjs (12 salt rounds)         |
| Validation       | Zod                               |
| Email            | Nodemailer (SMTP, connection pooling) |
| Security         | Helmet                            |
| Logging          | Morgan (development mode)         |
| Dev Server       | Nodemon                           |
| Package Manager  | Bun                               |

---

## Repository Structure

### Server (`server/`)

```
server/
  server.js                     -- Entry point: DB connection, owner seed, HTTP listener
  prisma.config.ts              -- Prisma datasource configuration
  prisma/
    schema.prisma               -- Complete data model (12 models, 10 enums)
    seed.js                     -- Database seed script
  src/
    app.js                      -- Express app: middleware stack, route mounting, deploy hook
    config/
      index.js                  -- Centralised configuration (env, JWT, CORS, bcrypt)
    middlewares/
      auth.middleware.js         -- JWT verification, user hydration, status check
      role.middleware.js         -- Role-based route restriction
      validate.middleware.js     -- Zod schema validation (body, query, params)
      error.middleware.js        -- Global error handler, 404 handler
    modules/
      auth/                     -- Login, OTP, refresh-token, logout, change-password
      user/                     -- CRUD, password reset, user reports (OWNER only)
      lead/                     -- Lead lifecycle: create, list, update, status transitions
      deal/                     -- Deal pipeline: stages, value tracking, win/loss
      client/                   -- Client management: onboarding, portal users
      project/                  -- Project tracking: status, budget, timelines
      dashboard/                -- Aggregated statistics with period comparisons
      site/                     -- Site branding and configuration (single-row)
      settings/                 -- SMTP, OTP, and system-wide settings
      email-template/           -- Transactional email template management
    utils/
      apiError.js               -- Structured error class (400, 401, 403, 404, 409, 500)
      apiResponse.js            -- Standardised success response helpers
      cache.js                  -- In-memory TTL cache with namespace support
      catchAsync.js             -- Express async error wrapper
      currency.js               -- Multi-currency conversion utilities
      mailer.js                 -- SMTP transporter with config caching
      prisma.js                 -- Prisma client singleton
```

Each module under `server/src/modules/` follows a consistent four-file pattern:

| File                  | Responsibility                                              |
| --------------------- | ----------------------------------------------------------- |
| `*.routes.js`         | Express router with middleware chain (auth, role, validate) |
| `*.controller.js`     | Request handling, response formatting                       |
| `*.service.js`        | Business logic, Prisma queries                              |
| `*.validation.js`     | Zod schemas for request validation                          |

The `auth` module additionally includes `otp.service.js` for OTP generation and verification.

### Client (`client/`)

```
client/
  next.config.mjs               -- Next.js configuration
  postcss.config.mjs             -- PostCSS (Tailwind CSS)
  src/
    middleware.js                -- Route protection, role-based redirects, token expiry
    app/
      layout.jsx                -- Root layout: fonts, site context provider
      page.jsx                  -- Public landing page
      globals.css               -- Global styles and design tokens
      login/                    -- Authentication page
      (auth)/                   -- Auth route group
      owner/                    -- Owner panel (full system access)
        dashboard/              -- Dashboard with statistics
        leads/                  -- Lead management (list, create, detail, edit)
        deals/                  -- Deal pipeline management
        clients/                -- Client management
        projects/               -- Project management
        users/                  -- User administration
        settings/               -- Site, SMTP, OTP, email template configuration
      admin/                    -- Admin panel
      sales/                    -- Sales Manager panel
      accounts/                 -- Account Manager panel
      finance/                  -- Finance Manager panel
      hr/                       -- HR panel
      employee/                 -- Employee panel
      client/                   -- Client portal
    actions/
      auth.action.js            -- Login, logout, OTP, token refresh, password change
      leads.action.js           -- Lead CRUD server actions
      deals.action.js           -- Deal CRUD server actions
      clients.action.js         -- Client CRUD server actions
      projects.action.js        -- Project CRUD server actions
      users.action.js           -- User management server actions
      dashboard.action.js       -- Dashboard statistics
      site.action.js            -- Site data fetching
      settings.action.js        -- Settings management
    components/
      auth/                     -- LoginForm, LoginBranding
      dashboard/                -- DashboardShell, Sidebar, Header
      landing/                  -- Navbar, Hero, Features, Steps, Testimonials, FAQ,
                                   Integrations, CTA, Footer, BrandLogos, WhyChoose
      settings/                 -- SettingsCard, SettingsButton, SettingsInput,
                                   SettingsSelect, SettingsToggle
      ui/                       -- Badge, ConfirmModal, DataTable, PageHeader,
                                   StatCard, Toast
    context/
      AuthContext.jsx            -- Authentication state provider
      SiteContext.jsx            -- Site configuration provider
    hooks/
      useScrollReveal.js         -- Intersection Observer scroll animation hook
    lib/
      api.js                    -- Centralised HTTP client (40+ endpoint functions)
      currency.js               -- Client-side currency formatting and conversion
      utils.js                  -- General utility functions
```

---

## Data Model

The database schema comprises 12 models and 10 enums, modelling the complete agency workflow.

### Entity Relationship Overview

```
Lead --> Deal --> Client --> Project
                    |
                    +--> Portal Users (CLIENT-role users)
```

**Core business entities:**

- **Lead** -- Initial contact or prospect. Tracks company, contact, source, status, priority, estimated value, and assignee. Supports lifecycle transitions: NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED, LOST.
- **Deal** -- Originated from a qualified lead. Tracks monetary value, pipeline stage (DISCOVERY, PROPOSAL, NEGOTIATION, WON, LOST), expected close date, and assignee.
- **Client** -- Created when a deal is won. Holds company information, account manager assignment, and links to portal users.
- **Project** -- Deliverable work under a client. Tracks status, timeline, budget, and account manager.

**Supporting entities:**

- **User** -- Internal team members and client portal users. Supports 8 roles (see below).
- **RefreshToken** -- Stores JWT refresh tokens with expiration. Cascading delete on user removal.
- **AuditLog** -- Immutable action log with user, entity, metadata, and IP address.
- **Otp** -- One-time password records for two-factor login verification.
- **Site** -- Single-row configuration: branding, contact info, currency settings, maintenance mode.
- **Settings** -- Single-row system settings: SMTP configuration, OTP parameters.
- **EmailTemplate** -- Managed email templates with slug-based lookup, variable placeholders.

### Enum Reference

| Enum           | Values                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------- |
| Role           | OWNER, ADMIN, SALES_MANAGER, ACCOUNT_MANAGER, FINANCE_MANAGER, HR, EMPLOYEE, CLIENT     |
| UserStatus     | ACTIVE, INACTIVE, SUSPENDED, INVITED                                                     |
| LeadStatus     | NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED, LOST                                  |
| LeadSource     | WEBSITE, REFERRAL, SOCIAL_MEDIA, COLD_CALL, EMAIL_CAMPAIGN, ADVERTISEMENT, EVENT, PARTNER, OTHER |
| LeadPriority   | LOW, MEDIUM, HIGH, URGENT                                                                |
| DealStage      | DISCOVERY, PROPOSAL, NEGOTIATION, WON, LOST                                             |
| ClientStatus   | ACTIVE, INACTIVE, CHURNED                                                                |
| ProjectStatus  | NOT_STARTED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED                                 |
| Currency       | INR, USD, EUR                                                                            |

### Indexing Strategy

Database indexes are defined on frequently queried columns:

- **Users:** `clientId`
- **Leads:** `status`, `assigneeId`, `source`, `createdAt`; unique composite on `(email, companyName)`
- **Deals:** `stage`, `assigneeId`, `createdAt`
- **Clients:** `status`, `accountManagerId`
- **Projects:** `clientId`, `status`, `accountManagerId`, `createdAt`
- **Refresh Tokens:** `userId`, `token`
- **Audit Logs:** `userId`, `(entity, entityId)`, `createdAt`
- **OTPs:** `userId`, `expiresAt`

---

## Authentication and Authorisation

### Authentication Flow

1. **Login** -- The client sends `email` and `password` to `POST /api/auth/login`.
2. **OTP (conditional)** -- If OTP login is enabled in system settings, the server generates an OTP, emails it to the user, and responds with `{ otpRequired: true, userId }`. The client then calls `POST /api/auth/verify-otp` with the code.
3. **Token issuance** -- On successful credential (or OTP) verification, the server returns an access token (default: 15-minute expiry) and a refresh token (default: 7-day expiry).
4. **Token storage** -- The client stores both tokens and a serialised user object as cookies via Next.js server actions.
5. **Token refresh** -- When the access token expires, the client calls `POST /api/auth/refresh-token` with the refresh token to obtain a new token pair.
6. **Logout** -- `POST /api/auth/logout` invalidates the refresh token on the server and clears client cookies.

Self-registration is disabled. User accounts are created exclusively by the Owner through the user management module.

### Authorisation Model

Authorisation is enforced at three layers:

**Layer 1 -- Next.js Middleware (client-side route protection):**
- Intercepts all requests to role-prefixed routes (`/owner/*`, `/admin/*`, `/sales/*`, etc.)
- Reads the `user` cookie and `accessToken` cookie
- Validates token expiration by decoding the JWT payload
- Redirects unauthenticated users to `/login` with a return URL
- Redirects users to their correct dashboard if they access a panel they lack permissions for

**Layer 2 -- Express Auth Middleware (server-side token validation):**
- Extracts the Bearer token from the `Authorization` header
- Verifies the JWT signature and expiration against the access secret
- Hydrates `req.user` with the user record from the database
- Rejects requests from users with non-ACTIVE status

**Layer 3 -- Express Role Middleware (server-side role enforcement):**
- Applied per-route to restrict access to specific roles
- Uses an `authorize(...allowedRoles)` higher-order middleware

### Role Access Matrix

| Route Prefix   | Allowed Roles                           |
| -------------- | --------------------------------------- |
| `/owner`       | OWNER                                   |
| `/admin`       | OWNER, ADMIN                            |
| `/sales`       | OWNER, ADMIN, SALES_MANAGER             |
| `/accounts`    | OWNER, ADMIN, ACCOUNT_MANAGER           |
| `/finance`     | OWNER, ADMIN, FINANCE_MANAGER           |
| `/hr`          | OWNER, ADMIN, HR                        |
| `/employee`    | OWNER, ADMIN, EMPLOYEE                  |
| `/client`      | CLIENT                                  |

The OWNER role has universal access to all panels and API endpoints. Only the OWNER can perform destructive operations (e.g., deleting leads, deals, or users).

---

## API Reference

Base URL: `http://localhost:5000` (development)

All responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Descriptive message",
  "data": { ... }
}
```

Error responses include:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "body.email", "message": "Invalid email" }]
}
```

### Endpoints

#### Authentication (`/api/auth`)

| Method | Path                | Auth | Description                          |
| ------ | ------------------- | ---- | ------------------------------------ |
| POST   | `/login`            | No   | Authenticate with email and password |
| POST   | `/verify-otp`       | No   | Verify OTP code for two-factor login |
| POST   | `/resend-otp`       | No   | Resend OTP to the user               |
| POST   | `/refresh-token`    | No   | Exchange refresh token for new pair  |
| POST   | `/logout`           | Yes  | Invalidate refresh token             |
| POST   | `/change-password`  | Yes  | Change authenticated user's password |
| GET    | `/me`               | Yes  | Retrieve current user profile (cached 5 min) |

#### Users (`/api/users`) -- OWNER only

| Method | Path                     | Description                   |
| ------ | ------------------------ | ----------------------------- |
| POST   | `/`                      | Create a new user             |
| GET    | `/`                      | List users with filtering     |
| GET    | `/:id`                   | Get user by ID                |
| GET    | `/:id/report`            | Get user performance report   |
| PATCH  | `/:id`                   | Update user details           |
| POST   | `/:id/reset-password`    | Reset a user's password       |
| DELETE | `/:id`                   | Delete a user                 |

#### Leads (`/api/leads`) -- OWNER, ADMIN, SALES_MANAGER

| Method | Path              | Description                          |
| ------ | ----------------- | ------------------------------------ |
| POST   | `/`               | Create a new lead                    |
| GET    | `/`               | List leads with filtering/pagination |
| GET    | `/:id`            | Get lead by ID                       |
| PATCH  | `/:id`            | Update lead details                  |
| PATCH  | `/:id/status`     | Update lead status                   |
| DELETE | `/:id`            | Delete lead (OWNER only)             |

#### Deals (`/api/deals`) -- OWNER, ADMIN, SALES_MANAGER

| Method | Path              | Description                      |
| ------ | ----------------- | -------------------------------- |
| POST   | `/`               | Create a new deal                |
| GET    | `/`               | List deals with filtering        |
| GET    | `/:id`            | Get deal by ID                   |
| PATCH  | `/:id`            | Update deal details              |
| PATCH  | `/:id/stage`      | Update deal pipeline stage       |
| DELETE | `/:id`            | Delete deal (OWNER only)         |

#### Clients (`/api/clients`)

| Method | Path               | Description                   |
| ------ | ------------------ | ----------------------------- |
| POST   | `/`                | Create a new client           |
| GET    | `/`                | List clients with filtering   |
| GET    | `/dropdown`        | Lightweight list for dropdowns|
| GET    | `/:id`             | Get client by ID              |
| PATCH  | `/:id`             | Update client details         |
| DELETE | `/:id`             | Delete a client               |

#### Projects (`/api/projects`)

| Method | Path        | Description                     |
| ------ | ----------- | ------------------------------- |
| POST   | `/`         | Create a new project            |
| GET    | `/`         | List projects with filtering    |
| GET    | `/:id`      | Get project by ID               |
| PATCH  | `/:id`      | Update project details          |
| DELETE | `/:id`      | Delete a project                |

#### Dashboard (`/api/dashboard`) -- OWNER, ADMIN

| Method | Path           | Description                                              |
| ------ | -------------- | -------------------------------------------------------- |
| GET    | `/stats`       | Aggregated statistics with period comparison (today/month/year/all) |

#### Site (`/api/site`)

| Method | Path  | Auth  | Description                    |
| ------ | ----- | ----- | ------------------------------ |
| GET    | `/`   | No    | Get site branding/config       |
| PATCH  | `/`   | Yes   | Update site configuration      |

#### Settings (`/api/settings`)

| Method | Path  | Description                          |
| ------ | ----- | ------------------------------------ |
| GET    | `/`   | Get system settings (SMTP, OTP)      |
| PATCH  | `/`   | Update system settings               |

#### Email Templates (`/api/email-templates`)

| Method | Path        | Description                      |
| ------ | ----------- | -------------------------------- |
| GET    | `/`         | List all email templates         |
| GET    | `/:id`      | Get template by ID               |
| PATCH  | `/:id`      | Update template content          |

### Health Check

```
GET /api/health
```

Returns server status, used for uptime monitoring.

---

## Client Application

### Landing Page

The public-facing landing page (`/`) is a marketing site composed of modular sections:

- **Navbar** -- Responsive navigation with CTA
- **Hero** -- Primary value proposition
- **BrandLogos** -- Social proof with client logos
- **Features** -- Core platform capabilities
- **WhyChoose** -- Differentiators
- **Steps** -- Onboarding workflow
- **Testimonials** -- Customer quotes
- **Integrations** -- Supported integrations
- **FAQ** -- Frequently asked questions
- **CTA** -- Final call-to-action
- **Footer** -- Links and legal

### Dashboard Shell

Authenticated users see a role-appropriate dashboard wrapped in `DashboardShell`, which provides:

- **Sidebar** -- Collapsible navigation with role-aware menu items and nested sub-items
- **Header** -- User info, notifications, and logout

### Owner Panel Features

The Owner panel (`/owner/*`) provides the most comprehensive feature set:

- **Dashboard** -- Real-time statistics with period filtering (today, this month, this year, all time). Displays leads, deals, clients, projects counts with period-over-period percentage changes. Shows recent leads and deals activity.
- **Leads Management** -- Full CRUD with list view, detail pages, inline editing. Filter by status, source, priority, assignee. Create leads with estimated value, contact information, and source tracking.
- **Deals Pipeline** -- Create deals from converted leads. Track through pipeline stages (Discovery, Proposal, Negotiation, Won, Lost). Monitor deal values and expected close dates.
- **Client Management** -- Client onboarding with company details, industry, website. Assign account managers. Track client lifecycle status (Active, Inactive, Churned).
- **Project Management** -- Create projects under clients. Track status, timeline, budget. Assign account managers.
- **User Administration** -- Create, edit, deactivate user accounts. Assign roles. Reset passwords. View user performance reports.
- **Settings** -- Site branding (name, logo, contact info, currency). SMTP configuration with connection verification. OTP authentication toggle and parameters. Email template editor with variable support.

### Context Providers

- **AuthContext** -- Provides authentication state (user, tokens, login/logout functions) across the component tree.
- **SiteContext** -- Provides site configuration (name, logo, currency, contact details) fetched at layout level. Available to all components without prop drilling.

### Centralised API Client

`client/src/lib/api.js` implements a `request()` core function that:

- Prepends the `NEXT_PUBLIC_SERVER_URL` base URL
- Attaches `Content-Type: application/json` and Bearer token headers
- Parses JSON responses
- Throws structured errors with `status` and `data` properties on non-2xx responses
- Exports 40+ typed endpoint functions covering every API resource

---

## Server Internals

### Middleware Pipeline

Requests flow through the following middleware stack in order:

1. **Helmet** -- Sets security-related HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
2. **CORS** -- Unrestricted in development; origin-locked in production
3. **Body Parsers** -- `express.json()` and `express.urlencoded()`
4. **Morgan** -- HTTP request logging (development only)
5. **Route-level middleware chain:**
   - `validate(zodSchema)` -- Validates `body`, `query`, and `params` against Zod schemas. Returns cleaned/parsed values.
   - `authenticate` -- Verifies JWT, hydrates `req.user`, enforces ACTIVE status.
   - `authorize(...roles)` -- Restricts access to specified roles.
6. **notFoundHandler** -- Catches unmatched routes and returns 404
7. **errorHandler** -- Global error handler that normalises all errors into the standard envelope. Includes stack traces in development mode.

### In-Memory Caching

The server implements a lightweight TTL-based in-memory cache (`MemoryCache` class) used for:

- User profile lookups (`user:{id}`, 5-minute TTL)
- Site configuration (`site`, 10-minute TTL)
- System settings (`settings:raw`, 10-minute TTL)
- Email templates (namespace-based with `emailTemplate:` prefix)

The cache supports:
- Lazy loading via `get(key, fetchFn, ttl)`
- Manual invalidation via `del(key)` and `delByPrefix(prefix)`
- Automatic expired entry cleanup every 60 seconds

### Email System

The mailer utility reads SMTP configuration directly from the database (via the cached Settings model) and creates a pooled Nodemailer transporter. Key features:

- Transporter caching with config-hash change detection
- Automatic reconnection when SMTP settings are updated
- Connection pooling (5 max connections, 100 messages per connection)
- Site name used as the sender display name
- Plain-text fallback auto-generated from HTML content

### Error Handling

All errors flow through a centralised pipeline:

1. **ApiError class** -- Provides factory methods for standard HTTP errors (400, 401, 403, 404, 409, 500) with optional field-level error arrays.
2. **catchAsync wrapper** -- Wraps async route handlers to forward rejected promises to Express error handling.
3. **Global error handler** -- Normalises all errors (operational and unexpected) into the standard response format. Includes validation error details and stack traces in development.

### Deployment Hook

The server exposes a `GET /pullAndDeploy` endpoint (production only, secret-protected) that:

1. Pulls the latest code from `main` branch
2. Installs dependencies and builds the client
3. Pushes Prisma schema changes and regenerates the client
4. Reloads both PM2 processes (`crm-client` and `crm-api`)

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **Bun** (package manager and runtime)
- **PostgreSQL** 14 or later

### Installation

1. Clone the repository:

```bash
git clone https://github.com/kunalbhatia2601/CRM-Software.git
cd CRM-Software
```

2. Install server dependencies:

```bash
cd server
bun install
```

3. Install client dependencies:

```bash
cd ../client
bun install
```

4. Configure environment variables (see [Environment Variables](#environment-variables)).

5. Initialise the database:

```bash
cd ../server
bun x prisma db push
bun x prisma generate
```

6. (Optional) Seed the database with sample data:

```bash
bun run db:seed
```

### Running in Development

Start the server (auto-runs `prisma db push` and `prisma generate`):

```bash
cd server
bun run dev
```

Start the client in a separate terminal:

```bash
cd client
bun run dev
```

The client runs on `http://localhost:3000` and the server on `http://localhost:5000`.

### Default Owner Account

On first startup, the server automatically creates an owner account:

| Field    | Value            |
| -------- | ---------------- |
| Email    | `owner@gmail.com`  |
| Password | `Owner@123`      |
| Role     | OWNER            |

Change these credentials immediately after first login.

---

## Environment Variables

### Server (`server/.env`)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/taskgo_agency

# JWT
JWT_ACCESS_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Deployment
PULL_AND_DEPLOY_SECRET=<strong-random-secret>
```

### Client (`client/.env`)

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:5000
```

---

## Database Management

The project uses Prisma ORM with PostgreSQL. Available scripts:

| Command                | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `bun run db:generate`  | Regenerate Prisma Client from schema                    |
| `bun run db:push`      | Push schema changes to database (no migration files)    |
| `bun run db:migrate`   | Create and apply migration files                        |
| `bun run db:studio`    | Open Prisma Studio (visual database browser)            |
| `bun run db:seed`      | Run the database seed script                            |
| `bun run db:dlt`       | Drop and recreate the public schema (destructive)       |

All commands should be run from the `server/` directory.

---

## Deployment

### Production Setup

The application is designed for deployment with PM2 process manager:

- **Client process:** `crm-client` -- Runs `next start` after `next build`
- **Server process:** `crm-api` -- Runs `node server.js`

### Automated Deployment

Trigger a deployment by hitting the deploy endpoint:

```
GET https://your-domain.com/pullAndDeploy?secret=<PULL_AND_DEPLOY_SECRET>
```

This performs a zero-downtime deployment: pulls latest code, installs dependencies, builds the client, applies schema changes, and reloads both PM2 processes.

### Production Considerations

- Set `NODE_ENV=production` to enable origin-locked CORS and disable Morgan logging
- Use strong, unique secrets for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `PULL_AND_DEPLOY_SECRET`
- Configure SMTP settings through the Owner Settings panel after first login
- The default owner credentials in `server.js` should be changed immediately
- The deploy endpoint is restricted to production environment and requires the deploy secret

---

## Contributing

1. Create a feature branch from `main`
2. Follow the existing module pattern for new features (routes, controller, service, validation)
3. Validate all inputs with Zod schemas
4. Use the `ApiError` class for error responses
5. Wrap async handlers with `catchAsync`
6. Add appropriate role restrictions to new routes
7. Test with Prisma Studio for data verification

---

**Author:** Kunal Bhatia

**Github:** https://github.com/kunalbhatia2601

**LinkedIn:** https://www.linkedin.com/in/kunalbhatia2601/
