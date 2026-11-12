# RLTSMS – Product Requirements Document (PRD)

**System Name:** RLTSMS (Riseup Labs Tools & Services Management System)  
**Slogan:** *Your Tools. Your Services. Every Stage, Tracked*  
**Version:** 2.0.0-PROD  
**Target Organization:** Riseup Labs  
**Document Status:** Approved & Production-Ready  
**Classification:** Internal Enterprise Specification  

---

## 1. Executive Summary & Vision

### 1.1 Product Statement
**RLTSMS** is Riseup Labs' centralized internal enterprise platform for procurement, software subscription governance, digital asset inventory, and financial spend accountability. It provides end-to-end transparency across the entire lifecycle of software tools and digital cloud services:

$$\text{Requisition} \longrightarrow \text{Approval} \longrightarrow \text{Procurement} \longrightarrow \text{Account Provisioning} \longrightarrow \text{Subscription Lifecycle} \longrightarrow \text{Proactive Renewal} \longrightarrow \text{Audit \& Reporting}$$

### 1.2 Core Slogan & Brand Promise
> **"Your Tools. Your Services. Every Stage, Tracked"**

Every digital asset—from individual developer IDE plugins and specialized AI assistant seats to multi-thousand-dollar cloud infrastructure contracts and advertising spends—is catalogued, authorized through configurable approval chains, procured with audit-safe payment methods, and continuously tracked until deprovisioning or renewal.

### 1.3 Key Objectives
1. **Centralized Master Inventory:** Maintain a single source of truth for all software licenses, tools, APIs, and cloud services operated by Riseup Labs.
2. **Eliminate Ghost & Redundant Subscriptions:** Prevent duplicate seat purchases and abandoned recurring charges through visibility and access-sharing workflows.
3. **Flexible Multi-Stage Approvals:** Visual drag-and-drop workflow configuration accommodating required department heads, optional technical reviewers, and executive sign-offs.
4. **Zero-Trust Payment Card Vault:** Strict isolation of corporate credit cards. Card numbers, expiration, and CVVs are never exposed; only explicitly authorized viewers can view masked identifiers under full audit logging.
5. **Accurate Financial Runway & Variance Tracking:** Separate requested estimates, approved budgets, and actual transactional receipts, highlighting price differences and renewal costs.
6. **Proactive Operational Alerts:** Automated 7-day, 3-day, and 1-day renewal warnings, coupled with a mandatory 7-day pre-month-end purchase planning summary for executive budget forecasting.

### 1.4 Product Boundaries & Anti-Scope
RLTSMS is **strictly an asset, subscription, procurement, and expenditure governance tool**.
- **Not an HRMS/EMS:** It does not manage payroll, employee performance reviews, attendance, or recruitment. Employee profiles exist solely to identify requesters, approvers, seat owners, and purchasers.
- **Not a Task / Project Management System:** It does not track Jira issues, sprints, or deliverables.
- **Not a Payment Gateway:** It does not process credit cards or execute banking transactions directly; it records verified company purchases and transaction references.

---

## 2. Personas & Role-Based Access Control (RBAC)

RLTSMS enforces a strict, server-side verified Role-Based Access Control model. A user can hold one or more roles simultaneously.

| Role | Description & Responsibilities | Core Permissions |
| :--- | :--- | :--- |
| **Super Admin** | Platform owner and executive administrator. | Full system configuration, RBAC assignment, security governance, workflow modification, emergency audit reviews. |
| **System Admin** | Operational administrator. | Department/team structuring, employee onboarding/invitations, service catalogue curation, vendor directory maintenance. |
| **Employee** | Standard team member or technical staff. | Submit purchase requisitions, submit access-sharing requests, view own requests, activate accepted accounts. |
| **Team Lead** | First-line technical/operational reviewer. | Review and approve/return/reject requisitions originating from assigned team members. |
| **Department Lead** | Departmental head (e.g., Head of Engineering, Head of Design). | Approve departmental budgets, assess cross-team tool overlap, sign off on major expenditures. |
| **Operation Manager** | Company-wide operations executive. | Review strategic fit, approve operational software, verify vendor alignment. |
| **Purchaser** | Authorized corporate procurement officer. | Fulfill approved requisitions, execute purchases, record actual payment amounts, assign payment cards, register acquired account credentials. |
| **Finance** | Financial controller and accountant. | Audit actual expenditures, review invoices and payment references, reconcile budget variances, export tax-ready statements. |
| **Management** | Executives and Directors (C-level). | Executive dashboard view, high-level spend analytics, annual fiscal forecast reports. |
| **Card Information Viewer** | Specifically authorized security/finance personnel. | View masked payment card metadata (last 4 digits, issuing bank, cardholder). *Restricted privilege not inherited by Super Admin or Finance.* |

---

## 3. Organizational Structure & Employee Lifecycle

### 3.1 3-Tier Hierarchy
RLTSMS models the company structure in three relational levels:
$$\text{Riseup Labs} \longrightarrow \text{Departments} \longrightarrow \text{Teams} \longrightarrow \text{Employees}$$

- **Departments:** Created with an assigned Department Lead (e.g., Engineering, Creative & Design, Quality Assurance, Product & Operations, Finance & Admin).
- **Teams:** Created under a parent department with an assigned Team Lead (e.g., Frontend, Mobile Apps, AI Research, UI/UX, Automation QA).
- **Employees:** Assigned to a primary Department and Team, along with their business email, phone, designation, and RBAC roles.

### 3.2 Secure Employee Invitation & Activation Protocol
To prevent abandoned records or orphan logins:
1. **Admin Dispatch:** Administrator creates an employee profile and triggers a cryptographic activation email.
2. **48-Hour Expiry Window:** Activation links expire after exactly 48 hours. If unactivated, the profile switches to `Invitation Expired` status.
3. **Resend Capability:** Administrators can re-dispatch invitations without duplicating employee records.
4. **7-Day Garbage Collection:** Profiles remaining unactivated 7 days after the initial invitation are automatically deleted from the pending user registry.
5. **Self-Service Password Setup:** Activated employees set their own credentials upon first entry.

---

## 4. Master Services & Tools Catalogue

The catalogue is the central master repository for all licensed software, SaaS platforms, and digital infrastructure across Riseup Labs.

### 4.1 Taxonomy (17 Categories Across 2 Types)

#### Type 1: Tools
1. **AI Tools:** AI Assistants (ChatGPT, Claude, Gemini), Code Assistants (Cursor, GitHub Copilot, Windsurf), AI Builders (Lovable, v0), Generative Media (Midjourney, ElevenLabs), AI APIs (OpenAI API, Google AI Studio).
2. **Development Tools:** Repositories (GitHub, GitLab), IDEs (JetBrains, VS Code plugins), CI/CD (GitHub Actions, CircleCI), Containers & Registries (Docker Hub, Harbor), Code Quality (SonarQube, Sentry).
3. **Design & Creative Tools:** UI/UX (Figma, Sketch), Graphic Design (Adobe Creative Cloud, Canva), Prototyping (Miro, FigJam), Stock Assets (Envato Elements, Freepik).
4. **Project Management & Productivity:** Task Management (Jira, ClickUp, Asana), Knowledge Base (Notion, Confluence), Time Tracking (Clockify, Toggl), Office Suites (Microsoft 365, Google Workspace).
5. **Communication & Collaboration:** Team Chat (Slack, Microsoft Teams), Video Conferencing (Zoom, Google Meet), Screen Capture (Loom).
6. **Testing & Quality Assurance:** Cross-Browser Testing (BrowserStack, LambdaTest), Test Management (TestRail, Zephyr), Automation (Cypress Cloud, Playwright).
7. **Security Tools:** Password Management (1Password, Bitwarden), VPN/Zero-Trust (Tailscale, Cloudflare Access), Vulnerability Scanning (Burp Suite, Snyk).
8. **Marketing, Sales & SEO:** SEO (Semrush, Ahrefs), Email Delivery (Mailchimp, Brevo, SendGrid), CRM (HubSpot, Zoho CRM).
9. **Storage, Backup & Data:** Cloud Drives (Dropbox, Google Drive), Data Analytics (Metabase, Power BI, Looker Studio).
10. **HR & Finance Software:** Corporate accounting (QuickBooks, Xero), Recruiting (LinkedIn Recruiter, Bdjobs).

#### Type 2: Services
11. **Cloud & Hosting:** Infrastructure (AWS, Google Cloud, Azure, DigitalOcean), App Deployment (Vercel, Netlify, Render), Managed DB (Supabase, MongoDB Atlas).
12. **Domain, DNS & Email Services:** Registrars (Namecheap, Cloudflare Registrar), Transactional Email (SendGrid, Amazon SES), SMS Gateways (Twilio).
13. **Branding & Social Media Services:** Social platform verification, Premium brand pages (LinkedIn Premium, Meta Verified, YouTube).
14. **Advertising Services:** Search & Social Advertising accounts (Google Ads, Meta Ads, LinkedIn Ads).
15. **Developer Platform & Marketplace Fees:** Apple Developer Program, Google Play Console, Upwork Agency/Connects.
16. **Professional & Business Services:** Compliance certifications, Legal/Trademark services, Training (Coursera, Udemy Business).
17. **Other Digital Services:** Miscellaneous digital utilities and APIs.

### 4.2 Master vs. Child Relationship
- A **Catalogue Service** represents the vendor/tool umbrella (e.g., `ChatGPT`, `AWS`, `Figma`).
- Individual **Accounts / Seats / Licenses** and **Subscriptions** are registered as children beneath the catalogue master record. Adding a new developer seat to ChatGPT never creates a duplicate catalogue item.

---

## 5. Requisition & Approval Engine

### 5.1 Requisition Types
1. **New Service or Tool:** Requisitioning a tool not currently present in the catalogue.
2. **Additional Account / Seat:** Requesting a new user license under an already existing master tool.
3. **New Subscription Plan:** Adding a new subscription tier to an existing service.
4. **Subscription Renewal:** Extending an expiring recurring service.
5. **Plan Upgrade / Modification:** Increasing license tiers (e.g., Figma Professional to Enterprise).

### 5.2 Requisition State Lifecycle
Requisitions traverse an explicit status pipeline:
- `Draft`: Saved locally by employee; not yet entered into the approval queue.
- `Submitted`: Placed into the active approval pipeline at Stage 1.
- `Pending Approval`: Awaiting action by the active stage's designated approver.
- `Returned for Modification`: Sent back to requester with specific reviewer comments; requester can adjust and resubmit without re-creating.
- `Approved`: All required approval stages completed successfully.
- `Rejected`: Denied by an approver; terminates the workflow with logged rationale.
- `Pending Purchase`: System queue visible to procurement officers (Purchasers).
- `Purchased`: Transaction completed, receipt uploaded, account/subscription registered.
- `Cancelled`: Withdrawn by requester prior to approval.

### 5.3 Visual Drag-and-Drop Workflow Builder
Administrators configure approval workflows using a visual canvas:
- **Purpose Assignment:** Workflows can be bound to Purchase Requisitions or Access-Sharing Requests.
- **Stage Ordering:** Sequence approvers by user name or organizational position (`Team Lead`, `Department Lead`, `Operation Manager`).
- **Required vs. Optional Stages:**
  - *Required Stage:* Must be explicitly approved before the requisition can advance.
  - *Optional Stage:* May approve, comment, or leave without action. Optional stages **never block** advancement if all required approvals are satisfied. Rejection by an optional stage does not automatically cancel the requisition.
- **Workflow Immutability:** Updating an active workflow applies only to new requisitions. In-flight requisitions retain the exact workflow version snapshot they were submitted under.

---

## 6. Procurement & Purchase Management

Once approved, requisitions are routed to the procurement queue.

### 6.1 Purchase Fulfillment Fields
The Purchaser completes the purchase and records transactional data:
- **Requisition Reference:** Immutable link back to the originating requisition.
- **Actual Purchase Plan:** Final tier selected (may differ slightly from request).
- **Actual Amount Paid & Currency:** Exact cost charged to the company.
- **Purchase Source:** Direct from Provider (e.g., OpenAI website) vs. External Vendor / Reseller.
- **Payment Method:** Corporate credit card selected from the encrypted registry.
- **Payment Reference / Transaction ID:** Bank/invoice reference number.
- **Receipt / Invoice Attachment:** PDF/Image proof of purchase stored securely.
- **Next Renewal Date:** Computed automatically or verified manually.

### 6.2 Financial Variance Preservation
The system stores three distinct financial data points for every procurement:
1. `Estimated/Requested Amount`: Employee's original proposal.
2. `Approved Budget`: Maximum amount authorized by approvers.
3. `Actual Paid Amount`: Confirmed transaction charge.
4. `Variance`: $\Delta = \text{Actual} - \text{Requested}$, tracked on reports to measure forecasting accuracy.

---

## 7. Account, License & Seat Sharing Management

### 7.1 Individual Account Registry
Every purchased seat is catalogued with:
- Assigned user email / login credential identifier.
- Service master mapping.
- License type & seat limit.
- Linked purchase record and payment card reference.
- Status: `Active`, `Inactive`, `Suspended`, `Expired`, `Cancelled`.

### 7.2 Access Sharing Engine (Seat Pooling)
For multi-seat or shared tools (e.g., 5-seat Figma team, shared ChatGPT Plus accounts, Envato Elements):
- Employees can submit an **Access-Sharing Request** instead of purchasing an entirely new subscription.
- Requests pass through an approval workflow (Team Lead / Department Lead).
- Upon approval, the approver assigns an existing under-utilized account from the registry, linking the employee to the seat pool without incurring new financial spend.

---

## 8. Subscription & Billing Management

### 8.1 Supported Billing Cycles & Calculation Engine
RLTSMS supports 5 distinct billing frequencies:
- **Monthly:** Next renewal = $\text{Start Date} + 1 \text{ month}$
- **Quarterly:** Next renewal = $\text{Start Date} + 3 \text{ months}$
- **Half-Yearly:** Next renewal = $\text{Start Date} + 6 \text{ months}$
- **Yearly:** Next renewal = $\text{Start Date} + 1 \text{ year}$
- **One-Time:** Fixed perpetual purchase; produces no recurring renewal date.

### 8.2 Historical Payment Immutability
When a recurring subscription renews:
- A new payment and renewal log entry is appended.
- Historic payments are **never overwritten**, preserving full auditability for annual financial reconciliations.

---

## 9. Zero-Trust Payment Card Governance

Corporate payment cards represent critical attack surfaces. RLTSMS treats payment card details as an isolated security zone.

### 9.1 Data Protection Boundary
- **Never Stored:** Full 16-digit Primary Account Number (PAN), Card Verification Value (CVV/CVC), PIN, or online banking passwords.
- **Permitted Metadata:** Card Nickname (e.g., *AWS Primary Visa*), Cardholder Name, Issuing Bank, Network (Visa/Mastercard/Amex), Last 4 Digits (`•••• 4242`), Expiration Month/Year, Currency, Monthly Limit.

### 9.2 Independent RBAC Isolation
Being a `Super Admin`, `Purchaser`, or `Finance` officer **does not automatically grant access to card details**. Card visibility requires the dedicated `Card Information Viewer` permission granted individually by the Security Administrator.

| Role | Card Visibility in UI / Reports |
| :--- | :--- |
| Standard Employee | Hidden entirely. |
| Approver / Lead | Hidden entirely. |
| Purchaser (without card permission) | Sees masked label `Restricted Card (ID: crd-***)`. Can assign to purchase without viewing digits. |
| Card Information Viewer | Views masked card details (`•••• 4242`, Bank, Expiry). Access is logged in real time. |

### 9.3 Emergency Access & Audit Logging
In critical operational emergencies (e.g., server shutdown due to billing failure):
- Authorized personnel can trigger an **Emergency Card Unlock** with mandatory recorded justification.
- The system generates an immediate high-priority audit log entry and alerts security administrators.

---

## 10. Intelligent Notifications & Month-End Planning

### 10.1 Real-Time System Events
- Requisition submitted, approved, returned, or rejected.
- Purchase completed and account provisioned.
- Access sharing seat granted.
- Emergency card access logged.

### 10.2 Subscription Renewal Warning Cadence
For all active recurring subscriptions, alerts are dispatched at 4 key milestones:
1. **T - 7 Days:** Initial operational alert for purchaser and department lead.
2. **T - 3 Days:** Urgency escalation to confirm continuation or cancellation.
3. **T - 1 Day:** Final renewal warning.
4. **Day-Of:** Payment confirmation reminder.

### 10.3 7-Day Pre-Month-End Executive Briefing
Seven days before the conclusion of every calendar month, RLTSMS automatically aggregates:
- All approved but unpurchased requisitions.
- All scheduled subscription renewals falling within the upcoming month.
- Estimated total cash outflow requirements categorized by department and payment card.
- Dispatches a consolidated executive briefing to designated administrators and finance leads for budget clearance.

---

## 11. Spend Analytics & Financial Reporting

### 11.1 Multi-Dimensional Filtering & Rollups
Reports provide aggregated and drill-down views across:
- Department & Team attribution.
- Catalogue Category (AI Tools vs. Cloud Hosting vs. Design).
- Vendor distribution (Direct vs. Reseller).
- Time horizons (Monthly vs. Annual).

### 11.2 Configurable Fiscal Calendar
RLTSMS allows administrators to set the company's financial year start month (e.g., July for Riseup Labs standard fiscal year, January for calendar year, or April for UK tax periods). Annual reports dynamically adjust to the configured fiscal cadence.

### 11.3 Sanitized Multi-Format Exports
- Exports available in CSV, PDF, and print-ready formats.
- All exports apply server-side data sanitization: card details are masked or suppressed unless the exporting user holds explicit card viewing clearance.

---

## 12. Immutable Audit Logging

Every state transition, authentication event, and privileged access is recorded in a tamper-resistant audit registry:
- **Timestamp (UTC/Local)**
- **Actor:** User ID, Name, Role.
- **Action Category:** `CREATE`, `UPDATE`, `APPROVE`, `REJECT`, `PURCHASE`, `SECURITY_ACCESS`, `EMERGENCY_UNLOCK`.
- **Target Entity:** Requisition ID, Service ID, Card ID, Workflow ID.
- **Detailed Payload:** Recorded changes and justifications.
- Audit logs cannot be edited or cleared through normal application interfaces.

---

## 13. Non-Functional & Production Engineering Standards

### 13.1 Security & Compliance
- Strict HTTPS enforcement with modern TLS ciphers.
- Content Security Policy (CSP), anti-CSRF tokens on state-mutating requests.
- Strict input validation and sanitization preventing SQL injection and XSS.
- Client-side bundles contain zero corporate card secrets, API keys, or private environment variables.

### 13.2 Performance & Reliability
- Initial dashboard and list view render times under 500ms.
- Local browser state caching with seamless prefix migration (`rltsms_`).
- Zero layout shift (CLS < 0.05), fully responsive UI from 320px mobile to 4K displays.
- WCAG 2.1 AA accessibility compliance (color contrast ratios, keyboard navigation, focus states).

---

## 14. Acceptance Criteria (AC Matrix)

| ID | Requirement Statement | Verification Method |
| :--- | :--- | :--- |
| **AC-01** | Admin can create, modify, and structure departments, teams, and employees. | Automated / Manual |
| **AC-02** | Employee invitations expire in 48 hours; unactivated accounts purge after 7 days. | Automated / Time-Mocked |
| **AC-03** | Services can be categorized across all 17 defined categories. | Automated / Manual |
| **AC-04** | Employees can submit requisitions with attachments, purpose, and budget estimates. | End-to-End Test |
| **AC-05** | Visual drag-and-drop workflow builder allows custom stage reordering. | Manual UI Verification |
| **AC-06** | Workflows correctly differentiate required approvers from optional approvers. | Unit & Integration Test |
| **AC-07** | Optional approver inaction does not block advancement once required stages approve. | Business Logic Test |
| **AC-08** | Approved requisitions transition automatically to Pending Purchase queue. | End-to-End Test |
| **AC-09** | Purchaser can log actual purchase price, transaction reference, and receipt. | Integration Test |
| **AC-10** | System distinguishes direct purchases from vendor/reseller purchases. | Data Model Verification |
| **AC-11** | Completed purchases can auto-provision accounts under existing master services. | Integration Test |
| **AC-12** | Subscription renewal dates calculate accurately according to the billing cycle. | Unit Test |
| **AC-13** | One-time purchases never create recurring renewal schedules. | Unit Test |
| **AC-14** | Reports display Requested, Approved, and Actual amounts with variance $\Delta$. | Report Verification |
| **AC-15** | Payment card details are strictly hidden from users without Card Viewer role. | Security Penetration Test |
| **AC-16** | Report and CSV exports sanitize card information for unauthorized users. | Export Verification |
| **AC-17** | 7-day pre-month-end purchase planning briefing generates forecasted totals. | Scheduler Test |
| **AC-18** | Monthly and annual expenditure reports calculate accurate department rollups. | Math & Report Test |
| **AC-19** | Financial year start month configuration dynamically recalculates annual summaries. | Configuration Test |
| **AC-20** | All sensitive actions (approvals, card view, resets) create immutable audit logs. | Audit Trail Verification |

