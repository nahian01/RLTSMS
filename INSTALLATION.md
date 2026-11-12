# RLTSMS – Installation & Setup Guide
**Riseup Labs Tools & Services Management System**  
*Track Every Tool. Control Every Lifecycle.*

---

## 1. Prerequisites

Before installing RLTSMS, ensure your environment meets the following specifications:

| Component | Minimum Version | Recommended Version |
|---|---|---|
| **Node.js** | 20.0.0 LTS | 20.18.x or 22.x LTS |
| **npm** | 10.0.0 | 10.8.x+ |
| **MySQL** | 8.0.x | 8.4.x LTS |
| **Docker** *(Optional)* | 24.0.x | Latest with Compose v2 |

---

## 2. Quick Start with Docker Compose (Recommended for Production)

Docker Compose provisions MySQL 8.4 LTS, the Node.js Express REST API, and Nginx in an isolated network with persistent storage.

```bash
# 1. Clone repository
git clone <repository_url>
cd estms---software-&-digital-services-management

# 2. Configure environment
cp .env.example .env

# 3. Start all services
docker compose up --build -d

# 4. Confirm running containers
docker compose ps
```

- **Frontend Application & Reverse Proxy:** `http://localhost` (Port 80)
- **Backend API:** `http://localhost:5000/api`
- **Database:** `localhost:3306` (Initialized with `server/db/schema.sql`)

To view live service logs:
```bash
docker compose logs -f api
```

---

## 3. Manual Local Development Setup

### Step 3.1: Install Dependencies
Because RLTSMS uses React 19 and Tailwind CSS v4, install with legacy peer dependency resolution:
```bash
npm install --legacy-peer-deps
```

### Step 3.2: Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example .env
```
Key configuration parameters in `.env`:
- `MYSQL_HOST`: `127.0.0.1`
- `MYSQL_PORT`: `3306`
- `MYSQL_DATABASE`: `rltsms_db`
- `MYSQL_USER`: `rltsms_user`
- `MYSQL_PASSWORD`: `your_password`
- `PORT`: `5000`
- `JWT_SECRET`: Secure cryptographic token string

### Step 3.3: MySQL 8.4 Database Initialization
If you are running a local MySQL server:
```bash
# Log in to MySQL as root
mysql -u root -p

# Execute initialization script
mysql -u root -p < server/db/schema.sql
```
*(Note: If MySQL is not running locally, RLTSMS automatically falls back to its persistent JSON store at `server/data/store.json`, ensuring zero downtime during development).*

### Step 3.4: Launch Backend API Server
```bash
npm run server
```
Server starts on `http://localhost:5000`. Health check endpoint: `http://localhost:5000/api/health`.

### Step 3.5: Launch Frontend Development Server
In a separate terminal:
```bash
npm run dev
```
Vite dev server starts on `http://localhost:3000`.

---

## 4. Verification & Testing

RLTSMS ships with automated test suites, strict TypeScript type checking, and production asset verification:

```bash
# 1. Execute automated integration & unit tests
npm test

# 2. Strict TypeScript type check
npm run lint

# 3. Compile production bundle
npm run build
```

Expected test results:
- **17/17 Tests Passing**
- **0 TypeScript compilation errors**
- **Production bundle emitted to `dist/`**

---

## 5. Default Demo Credentials

For testing and demonstration, use the following pre-seeded Riseup Labs accounts (Password: `Password123!`):

| Role | Name | Email | Permissions |
|---|---|---|---|
| **Super Admin** | Abdullah Nahian | `nahian@riseuplabs.com` | Complete system governance, card security |
| **Operation Manager** | Wasiur Rahman | `wasiur@riseuplabs.com` | Multi-stage requisition approvals |
| **Purchaser** | Kazi Fahim | `kazi.fahim@riseuplabs.com` | Procurement execution & card usage |
| **Finance** | Enamul Kabir | `enamul.kabir@riseuplabs.com` | Financial records & spend analytics |
| **Employee** | Sadia Afrin | `sadia.afrin@riseuplabs.com` | Submit requisitions & view assigned tools |
