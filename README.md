# RLTSMS – Riseup Labs Tools & Services Management System

> **Official Slogan:** *"Track Every Tool. Control Every Lifecycle."*  
> **Brand Promise:** *"Your Tools. Your Services. Every Stage, Tracked."*

RLTSMS is a centralized, production-grade enterprise software, digital tools, cloud infrastructure, and expenditure management platform engineered for **Riseup Labs**.

The platform provides a single source of truth across the complete digital asset lifecycle:  
**Requisition → Multi-Stage Approval → Procurement → Account Registration → Zero-Credential Access Assignment → Subscription Management → Payment Logging → Renewal Forecasting → Expiration → Financial Reporting.**

---

## 1. Enterprise Architecture & Tech Stack

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript + Vite | Enterprise SPA, responsive shell, dark/light modes, role-aware telemetry |
| **Styling & Design** | Tailwind CSS v4 | Official Riseup Labs brand identity (White `#FFFFFF`, Dark `#211E1F`, Orange `#EA5400`) |
| **Backend REST API** | Node.js + Express + TypeScript | Strict schema validation, JWT auth, scrypt password hashing, rate limiting |
| **Relational Database** | MySQL 8.4 LTS | InnoDB engine, foreign keys, transaction boundaries, audit tables (`server/db/schema.sql`) |
| **Resilience Layer** | Dual-mode Store Manager | Automatic fallback to local persistent store (`server/data/store.json`) if MySQL is offline |
| **Deployment** | Docker & Docker Compose + Nginx | Multi-stage Dockerfile, production Nginx reverse proxy, automated MySQL initialization |

---

## 2. 14 Core Enterprise Modules

1. **Dashboard Overview:** Role-aware operational & financial metrics, renewal timelines, department spend distribution, and actionable approver queues.
2. **Services & Tools Catalogue:** 17 standardized categories across AI Tools, Development, Cloud Infrastructure, Security, Design, and SaaS.
3. **Accounts & Licenses:** Inventory of individual service accounts, workspace seats, license keys, and linked subscriptions.
4. **Access Management (Zero-Credential):** Independent start/expiration dates, grant/extend/revoke lifecycle, and seat provisioning status without sharing service passwords.
5. **Requisitions:** Employee-initiated purchase requests with justification, estimated amount, and live stage tracking.
6. **Approvals:** Visual multi-stage review console with approve, reject, and return-for-modification workflows.
7. **Procurement & Purchasing:** Procurement queue for authorized buyers to enter invoice numbers, payment references, and attach files.
8. **Subscriptions & Renewals:** Automated cycle tracking (Monthly, Quarterly, Half-Yearly, Yearly) with proactive renewal alerts.
9. **Expenses & Spend Variance:** Real-time variance analysis between requested budget and actual invoice charges.
10. **Payment Cards (Zero-PAN & Owner-Controlled):** Strict card owner visibility control, zero full-PAN/CVV storage, and password-protected 30-second reveal modal with automatic re-masking.
11. **Reports & Exports:** Summary financial reports, variance metrics, category allocations, and sanitized CSV exports.
12. **Notifications:** Real-time system notifications for requisitions, approvals, renewals, and card reveal alerts.
13. **Audit Logs:** Immutable audit ledger tracking all authentication, authorization, approval, and card reveal events.
14. **Settings & Email Governance:** RBAC role permissions matrix, fiscal calendar parameters, and centralized 8-template email manager with live preview and test dispatch.

---

## 3. Strict Security Policies

- **Zero-Credential Sharing (Part 8.2):** No external service passwords, recovery codes, or API credentials are ever transmitted via email notifications or stored in user-facing access records.
- **Card Security & Owner Authority (Part 9):**
  - Only the registered card owner (`ownerId`) may view or grant visibility to other team members.
  - No role (including Super Admin and Finance) can bypass the registered owner's permission check.
  - Authorized viewers must verify their personal account password to initiate a 30-second unmasked view.
- **Brute-Force & Rate Limiting:** Enforced on login (5 attempts / 60s) and card reveal endpoints (3 attempts / 60s).

---

## 4. Quick Start & Local Run

### Prerequisites
- Node.js (20+ LTS)
- npm (10+)
- MySQL 8.4 LTS (or use automated Docker Compose)

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env

# 3. Start API backend server (port 5000)
npm run server

# 4. Start Vite frontend server (port 3000)
npm run dev
```

---

## 5. Verification Commands

All production gates are verified and passing:

```bash
# Execute integration test suite (17/17 tests passing)
npm test

# Run strict TypeScript compiler verification (0 errors)
npm run lint

# Build production bundle
npm run build
```

---

## 6. Project Documentation

- [Installation & Setup Guide](./INSTALLATION.md)
- [Production Deployment & Operations Runbook](./DEPLOYMENT.md)
- [Product Requirements Document (PRD)](./PRD.md)
- [System Architecture & Lifecycle Flows](./FLOWS.md)
