# RLTSMS – System Architecture & Lifecycle Flows

**System Name:** RLTSMS (Riseup Labs Tools & Services Management System)  
**Slogan:** *Your Tools. Your Services. Every Stage, Tracked*  
**Document:** System Workflow & Technical Flow Specifications  
**Version:** 2.0.0-PROD  

---

## 1. End-to-End Procurement Lifecycle Flow

This flowchart illustrates the complete lifecycle of a software tool or digital service in RLTSMS—from initial employee requisition through approval, procurement, account provisioning, renewal tracking, and financial reconciliation.

```mermaid
flowchart TD
    Start([Employee Identified Need]) --> Draft[Create Requisition Form]
    Draft --> Submit[Submit Requisition]
    
    subgraph MultiStageApproval["Multi-Stage Approval Engine"]
        Submit --> Stage1{Stage 1: Team Lead\nRequired}
        Stage1 -- Reject --> Rejected[Requisition Rejected\nLogged to Audit]
        Stage1 -- Return --> Mod[Returned for Modification\nRequester Edits]
        Mod --> Submit
        Stage1 -- Approve --> Stage2{Stage 2: Dept Lead\nOptional / Required}
        
        Stage2 -- Approve --> Stage3{Stage 3: Ops Manager\nRequired}
        Stage2 -- Inaction/Bypass --> Stage3
        Stage2 -- Reject (Optional) --> Stage3
        
        Stage3 -- Reject --> Rejected
        Stage3 -- Approve --> Approved[Requisition Approved]
    end

    subgraph Procurement["Procurement & Purchasing"]
        Approved --> Queue[Pending Purchase Queue]
        Queue --> Purchaser[Assigned Purchaser Receives Alert]
        Purchaser --> Execute[Execute Purchase\nDirect or Vendor Reseller]
        Execute --> LogPurchase[Log Actual Cost, Currency,\nCard Ref & Receipt Attachment]
    end

    subgraph Provisioning["Asset & Account Provisioning"]
        LogPurchase --> ProvisionType{New Tool or\nExisting Master?}
        ProvisionType -- New Tool --> CreateMaster[Register Master Service\nin Catalogue]
        ProvisionType -- Existing --> AttachAccount[Register Child Account / Seat\nunder Master Service]
        CreateMaster --> AttachAccount
        AttachAccount --> CreateSub[Create Subscription Record\n& Billing Cycle]
    end

    subgraph Billing["Subscription Lifecycle & Governance"]
        CreateSub --> CalcRenewal[Calculate Next Renewal Date\nMonthly / Quarterly / Yearly]
        CalcRenewal --> Monitor[Active Subscription Monitoring]
        Monitor --> Warn7d{T - 7 Days to Renewal}
        Warn7d -- Yes --> AlertAdmin[Dispatch Proactive Alerts\nto Admin & Purchaser]
        AlertAdmin --> Decision{Renew or Cancel?}
        Decision -- Renew --> NewPayment[Record Renewal Payment\nAppend New Payment Record]
        NewPayment --> CalcRenewal
        Decision -- Cancel --> Deactivate[Deactivate Account / Archive]
    end

    subgraph AuditFinance["Audit & Financial Reconciliation"]
        LogPurchase --> AuditLog[Append Immutable Audit Trail]
        NewPayment --> AuditLog
        LogPurchase --> Report[Financial Reports & Spend Variance]
        NewPayment --> Report
    end
```

---

## 2. Approval Workflow Engine State Machine

The state machine below details the valid states, transitions, and guard conditions for requisitions in RLTSMS.

```mermaid
stateDiagram-v2
    [*] --> Draft : Save as Draft
    Draft --> Submitted : Submit Requisition
    Draft --> Cancelled : Discard Draft
    
    Submitted --> PendingApproval : Route to Active Stage Approver
    
    state PendingApproval {
        [*] --> InReview
        InReview --> StageApproved : Approver Approves
        InReview --> StageReturned : Request Modification
        InReview --> StageRejected : Approver Denies
    }
    
    PendingApproval --> ReturnedForModification : Any Stage Returns
    ReturnedForModification --> Submitted : Requester Resubmits
    
    PendingApproval --> Rejected : Required Stage Denies
    
    PendingApproval --> Approved : All Required Stages Passed
    
    Approved --> PendingPurchase : Auto-Routed to Procurement Queue
    
    PendingPurchase --> Purchased : Purchaser Completes Transaction & Logs Details
    
    Purchased --> [*] : Active Asset in Inventory
    Rejected --> [*] : Archived Denial
    Cancelled --> [*] : Withdrawn
```

---

## 3. Access Sharing & Seat Pooling Flow

When an employee needs access to an existing tool (e.g., ChatGPT Plus, Figma, Envato Elements), they request a shared seat instead of procuring a duplicate paid license.

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Requesting Employee
    participant UI as RLTSMS UI
    participant Server as Access Engine
    actor Approver as Team / Dept Lead
    participant Inventory as Service Accounts Inventory
    
    Employee->>UI: Select Existing Tool (e.g., ChatGPT Plus)
    Employee->>UI: Submit Access Sharing Request (Justification + Preferred Account)
    UI->>Server: Create AccessRequest (Status: Pending Approval)
    Server->>Approver: In-App & Email Notification
    Approver->>UI: Review Access Request
    Approver->>Inventory: Query Available Seats / Underutilized Accounts
    Inventory-->>Approver: Return Candidate Accounts (e.g., dev.ai1@riseuplabs.com)
    Approver->>UI: Select Account & Click "Approve & Assign"
    UI->>Server: Update AccessRequest (Status: Approved, AssignedAccount: ID)
    Server->>Inventory: Append Employee ID to sharedUserIds of Account
    Server->>UI: Create Audit Log Entry
    Server-->>Employee: Notify Access Granted with Account Instructions
```

---

## 4. Zero-Trust Payment Card Governance Flow

This sequence demonstrates how payment cards are secured, ensuring sensitive financial information is insulated from general system access.

```mermaid
sequenceDiagram
    autonumber
    actor User as Authenticated User
    participant App as RLTSMS Client
    participant Auth as RBAC Authorizer
    participant Vault as Payment Card Vault
    participant Audit as Audit Registry
    
    User->>App: Request Payment Cards View / Purchase Form
    App->>Auth: Check Permissions for User
    
    alt User has "Card Information Viewer" Permission
        Auth-->>App: Clearance Granted
        App->>Vault: Fetch Masked Card Record
        Vault-->>App: Return Masked Data (Bank, Network, •••• 4242, Expiry)
        App->>Audit: Log Card Access Event (Viewer ID, Card ID, Timestamp)
        App-->>User: Display Masked Card Details
    else User is Regular Purchaser (No Card Viewer Role)
        Auth-->>App: Restricted Clearance
        App->>Vault: Query Usable Cards for Dropdown
        Vault-->>App: Return Card IDs & Neutral Labels ("Corporate Card A - crd-01")
        App-->>User: Display Safe Identifier Only (No Numbers / No Bank)
    else Emergency Access Triggered by Lead
        User->>App: Click "Emergency Card Unlock" with Reason
        App->>Audit: High-Priority Security Log (Reason, User, Urgent Need)
        App->>Vault: Temporary Single-Session Unlock
        Vault-->>App: Return Masked Card Details
        App-->>User: Display Details with Active Emergency Banner
    end
```

---

## 5. Automated 7-Day Pre-Month-End Planning & Renewal Cadence

RLTSMS runs background schedules to ensure executive budget transparency before any calendar month closes.

```mermaid
flowchart TD
    Trigger([Scheduler: 7 Days Before Month-End]) --> FetchReqs[Query Requisitions: Status = 'Approved' & Unpurchased]
    Trigger --> FetchRenewals[Query Subscriptions: Renewal Date in Upcoming Month]
    
    FetchReqs --> AggregateReqs[Sum Upcoming Approved Requisitions Cost]
    FetchRenewals --> AggregateRenewals[Sum Scheduled Recurring Subscriptions Cost]
    
    AggregateReqs --> Combine[Calculate Total Forecasted Expenditure Runway]
    AggregateRenewals --> Combine
    
    Combine --> GroupByDept[Break Down by Department & Team]
    Combine --> GroupByCard[Break Down Outflows by Assigned Corporate Card]
    
    GroupByDept --> GenerateBrief[Generate Executive Purchasing Briefing]
    GroupByCard --> GenerateBrief
    
    GenerateBrief --> Dispatch[Dispatch Email & In-App Notification\nto Management & Finance Leads]
    Dispatch --> Audit[Record Sched-Month-End Execution in Audit Log]
    Audit --> Done([Planning Briefing Delivered])
```

---

## 6. Relational Data Architecture (Entity Relationship Diagram)

RLTSMS utilizes a clean relational architecture where master entities link seamlessly to transactional and operational children.

```mermaid
erDiagram
    DEPARTMENT ||--o{ TEAM : contains
    DEPARTMENT ||--o{ USER : assigns
    TEAM ||--o{ USER : employs
    USER ||--o{ REQUISITION : requests
    
    SERVICE_CATEGORY ||--o{ CATALOGUE_SERVICE : classifies
    CATALOGUE_SERVICE ||--o{ SERVICE_ACCOUNT : owns
    CATALOGUE_SERVICE ||--o{ SUBSCRIPTION : tracks
    CATALOGUE_SERVICE ||--o{ PURCHASE_RECORD : associates
    
    REQUISITION ||--o{ APPROVAL_STAGE : requires
    APPROVAL_STAGE ||--o{ APPROVAL_ACTION : logs
    REQUISITION ||--o| PURCHASE_RECORD : fulfills
    
    VENDOR ||--o{ PURCHASE_RECORD : supplies
    PAYMENT_CARD ||--o{ PURCHASE_RECORD : finances
    PAYMENT_CARD ||--o{ CARD_ACCESS_LOG : tracks
    
    SERVICE_ACCOUNT ||--o{ ACCESS_REQUEST : shares
    SUBSCRIPTION ||--o{ SUBSCRIPTION_RENEWAL : schedules
    
    USER ||--o{ AUDIT_LOG : generates

    DEPARTMENT {
        string id PK
        string name
        string leadUserId FK
        string status
    }

    TEAM {
        string id PK
        string departmentId FK
        string name
        string leadUserId FK
    }

    USER {
        string id PK
        string email
        string name
        string departmentId FK
        string teamId FK
        string[] roles
        string status
    }

    CATALOGUE_SERVICE {
        string id PK
        string name
        string categoryId FK
        string serviceType
        string provider
        string website
        number totalMonthlySpend
    }

    REQUISITION {
        string id PK
        string requisitionNumber
        string requesterId FK
        string serviceId FK
        string requestedPlan
        number estimatedAmount
        string billingCycle
        string status
    }

    PURCHASE_RECORD {
        string id PK
        string requisitionId FK
        string serviceId FK
        number actualAmount
        number differenceAmount
        string purchaseSource
        string vendorId FK
        string paymentCardId FK
        string paymentReference
        string invoiceUrl
    }

    SERVICE_ACCOUNT {
        string id PK
        string serviceId FK
        string accountEmail
        string planName
        string accountStatus
        string[] sharedUserIds
    }

    SUBSCRIPTION {
        string id PK
        string serviceId FK
        string accountId FK
        string billingCycle
        number amount
        string nextRenewalDate
        string status
    }

    PAYMENT_CARD {
        string id PK
        string cardName
        string issuingBank
        string network
        string lastFourDigits
        string expiryDate
        string[] authorizedViewerIds
    }
```

