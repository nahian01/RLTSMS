# RLTSMS – Riseup Labs Tools & Services Management System

> **"Your Tools. Your Services. Every Stage, Tracked"**

RLTSMS is a centralized internal enterprise procurement, subscription tracking, digital asset inventory, and expenditure governance platform engineered for Riseup Labs. It manages the complete end-to-end lifecycle of company software, AI subscriptions, cloud platforms, and digital services — from employee requisitions and configurable drag-and-drop approval workflows through purchasing, payment logging, seat allocation, proactive renewal alerts, and financial reporting.

---

## Key Pillars

1. **Enterprise Requisition & Multi-Stage Approvals**  
   Configurable visual drag-and-drop approval workflows with required vs. optional stages, multi-level approvals (Team Lead, Department Head, Operations Manager), audit-trailed rejections, and modification requests.

2. **Master Services & Tools Catalogue**  
   17 distinct categories across AI Tools, Development & IDEs, Cloud Infrastructure, UI/UX Design, Security, SaaS, and Digital Services. Master services manage multiple individual seats and subscriptions beneath them.

3. **Restricted Zero-Trust Payment Card Governance**  
   Separation of duties for company corporate credit cards. Only specifically authorized personnel can view masked card metadata (last 4 digits, bank, network). Full card numbers, CVVs, and PINs are never stored. View events and emergency unlocks are logged immutably.

4. **Subscriptions, Renewals & Billing Lifecycle**  
   Automated renewal calculation across Monthly, Quarterly, Half-Yearly, and Yearly cycles. Proactive reminder cadences (7d, 3d, 1d, day-of) and automated 7-day pre-month-end financial planning briefings.

5. **Financial & Spend Analytics**  
   Real-time variance analysis comparing Requested vs. Actual expenditure, department/team cost attribution, vendor breakdown, configurable fiscal year calculations, and sanitized CSV/PDF export generation.

---

## Quick Start & Local Run

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start local development server (port 3000)
npm run dev

# Run TypeScript typecheck
npm run lint

# Run automated tests
npm test

# Build production bundle
npm run build
```

---

## Documentation

- [Product Requirements Document (PRD)](./PRD.md)
- [System Architecture & Lifecycle Flows](./FLOWS.md)
