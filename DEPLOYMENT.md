# RLTSMS – Production Deployment & Operations Runbook
**Riseup Labs Tools & Services Management System**  
*Track Every Tool. Control Every Lifecycle.*

---

## 1. Production Architecture Overview

```
[ Client Browsers / Apps ]
           │
           ▼
[ Nginx Edge Reverse Proxy (Port 80/443 SSL) ]
   ├── Static Assets (/assets/*, index.html) -> Cached Local Filesystem
   └── API Traffic (/api/*) ───────────────────┐
                                              ▼
                        [ Node.js Express Cluster (Port 5000) ]
                           ├── scrypt Password Hasher
                           ├── Rate Limiter (Brute-force protection)
                           ├── Zero-PAN Card Reveal Controller (30s window)
                           └── MySQL Connection Pool (mysql2)
                                              │
                                              ▼
                        [ MySQL 8.4 LTS Database (Port 3306) ]
                           ├── InnoDB Storage Engine
                           ├── utf8mb4 / utf8mb4_unicode_ci
                           └── ACID-compliant Transactions & Foreign Keys
```

---

## 2. Pre-Deployment Readiness Checklist (Definition of Ready)

Before shipping to staging or production, confirm all gates pass:

- [x] Full test suite passing (`npm test` passes 17/17 tests).
- [x] Zero TypeScript warnings or compilation errors (`npm run lint` / `tsc --noEmit`).
- [x] Production bundle successfully builds (`npm run build`).
- [x] Database migrations verified against MySQL 8.4 LTS (`server/db/schema.sql`).
- [x] Zero plain credentials transmission in all email notification templates.
- [x] Restricted card visibility strictly enforced: only registered card owner can grant visibility; reveal requires viewer's password.
- [x] Environment secrets configured in `.env` (no hardcoded keys in repository).

---

## 3. Server Provisioning & Docker Deployment

### Step 3.1: Host Configuration
Recommended production VM specs:
- **OS:** Ubuntu 22.04 LTS or 24.04 LTS
- **CPU:** 2+ vCPU
- **RAM:** 4GB+
- **Disk:** 50GB SSD

### Step 3.2: Automated Container Deployment
```bash
# Clone to production directory
cd /opt/rltsms

# Set production permissions
chmod 600 .env

# Pull images and build
docker compose -f docker-compose.yml up --build -d

# Verify container health
docker compose ps
```

---

## 4. SSL/TLS Configuration with Certbot

To secure traffic with Let's Encrypt SSL certificates:

```bash
# Install certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d rltsms.riseuplabs.com
```

Ensure Nginx redirects all HTTP traffic on port 80 to HTTPS on port 443 with HSTS enabled:
```nginx
server {
    listen 80;
    server_name rltsms.riseuplabs.com;
    return 301 https://$host$request_uri;
}
```

---

## 5. Security & Governance Policies in Production

### 5.1 Payment Card Security (Part 9)
1. **Zero-PAN Storage:** RLTSMS stores only masked `lastFour`, network, and expiration date. Full 16-digit PANs and CVV/PIN are never collected or stored in database tables.
2. **Owner Visibility Authority:** Only the registered card owner (`ownerId`) may view or grant visibility to other team members.
3. **No Administrative Bypass:** Neither Super Admin nor Finance roles may bypass card owner permission checks.
4. **Password-Protected Reveal Modal:** Authorized viewers must enter their personal RLTSMS account password to initiate a 30-second unmasking window.
5. **Auto-Masking & Audit Logging:** The card detail automatically masks after 30 seconds, and every reveal event is written to `card_reveal_audit_logs`.

### 5.2 Zero-Credential Access Provisioning (Part 8)
- External service passwords, recovery codes, or API keys must never be transmitted via RLTSMS email notifications.
- Employees receive notification of provisioned seats; access is redeemed via corporate SSO or enterprise workspace invitations.

---

## 6. Backup & Disaster Recovery

### Automated Daily MySQL Backup
Set up a daily cron job to dump the MySQL database:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/rltsms"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Dump database inside Docker container
docker exec rltsms_mysql mysqldump -u rltsms_user -prltsms_production_secret rltsms_db | gzip > "$BACKUP_DIR/rltsms_db_$TIMESTAMP.sql.gz"

# Retain last 30 days of backups
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
```

### Database Restore Procedure
In the event of recovery:
```bash
gunzip < /var/backups/rltsms/rltsms_db_YYYYMMDD_HHMMSS.sql.gz | docker exec -i rltsms_mysql mysql -u rltsms_user -prltsms_production_secret rltsms_db
```

---

## 7. Rollback Runbook

If an issue occurs post-release:
1. Revert Git tag / commit to the previous stable release.
2. Re-run `docker compose up --build -d`.
3. If database schema was altered, apply backward-compatible down migrations.
4. Confirm health check responds with 200:
   ```bash
   curl -i http://localhost:5000/api/health
   ```
