export type UserRole =
  | 'Super Admin'
  | 'System Admin'
  | 'Employee'
  | 'Team Lead'
  | 'Department Lead'
  | 'Operation Manager'
  | 'Purchaser'
  | 'Finance'
  | 'Management'
  | 'Card Information Viewer';

export type CardPermissionLevel =
  | 'none'
  | 'name_only'
  | 'masked_details'
  | 'manage'
  | 'usage_only';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  departmentId: string;
  departmentName: string;
  teamId?: string;
  teamName?: string;
  reportingLeadId?: string;
  reportingLeadName?: string;
  roles: UserRole[];
  accountStatus: 'Active' | 'Pending Invitation' | 'Expired Invitation' | 'Inactive';
  invitationSentAt?: string;
  invitationExpiresAt?: string;
  cardPermissionLevel?: CardPermissionLevel;
  avatar?: string;
}

export interface RoleDefinition {
  id: string;
  name: UserRole;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export interface PermissionDefinition {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface PredefinedAccessReason {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isEnabled: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  leadId?: string;
  leadName?: string;
  isActive: boolean;
  teamsCount: number;
  employeesCount: number;
}

export interface Team {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  leadId?: string;
  leadName?: string;
  isActive: boolean;
  membersCount: number;
}

export type ServiceType = 'Tool' | 'Service';

export interface ServiceCategory {
  id: string;
  type: ServiceType;
  name: string;
  subcategories: string[];
}

export interface CatalogueService {
  id: string;
  name: string;
  type: ServiceType;
  category: string;
  subcategory: string;
  provider: string;
  website: string;
  description: string;
  status: 'Active' | 'Under Review' | 'Archived';
  createdBy: string;
  createdAt: string;
  accountsCount: number;
  totalMonthlySpend: number;
}

export type BillingCycle =
  | 'Monthly'
  | 'Quarterly'
  | 'Half-yearly'
  | 'Yearly'
  | 'One-time'
  | 'Custom recurring';

export type RequisitionStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Returned for Modification'
  | 'Approved'
  | 'Rejected'
  | 'Pending Purchase'
  | 'Purchased'
  | 'Cancelled';

export interface ApprovalStageAction {
  stageId: string;
  stageName: string;
  roleOrPosition: string;
  assignedApproverId?: string;
  assignedApproverName?: string;
  isRequired: boolean;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Bypassed' | 'Returned';
  actionDate?: string;
  comment?: string;
  actorName?: string;
}

export interface Requisition {
  id: string;
  requisitionNumber: string; // e.g. REQ-2026-081
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  departmentId: string;
  departmentName: string;
  teamId?: string;
  teamName?: string;
  serviceId?: string;
  serviceName: string;
  isNewServiceProposal: boolean;
  type: ServiceType;
  category: string;
  subcategory: string;
  purpose: string;
  requestedPlan: string;
  accountEmail?: string;
  billingCycle: BillingCycle;
  estimatedAmount: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  expectedPurchaseDate: string;
  notes?: string;
  attachments?: { name: string; url: string; size: string }[];
  status: RequisitionStatus;
  workflowId: string;
  currentStageIndex: number;
  stages: ApprovalStageAction[];
  approvedAmount?: number;
  actualPurchaseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStageDefinition {
  id: string;
  name: string;
  type: 'organizational_role' | 'specific_employee';
  roleName?: string; // 'Team Lead', 'Department Lead', 'Operation Manager'
  employeeId?: string;
  employeeName?: string;
  isRequired: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  purpose: 'Purchase Requisitions' | 'Access-sharing requests';
  stages: WorkflowStageDefinition[];
  purchaserRoleId: string;
  purchaserRoleName: string;
  version: string;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseRecord {
  id: string;
  requisitionId: string;
  requisitionNumber: string;
  serviceId: string;
  serviceName: string;
  accountEmail: string;
  actualPlan: string;
  actualAmount: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  billingCycle: BillingCycle;
  purchaseDate: string;
  purchaseSource: 'Direct' | 'Vendor';
  providerName: string;
  providerWebsite?: string;
  vendorId?: string;
  vendorName?: string;
  paymentCardId?: string;
  paymentCardMaskedLabel?: string;
  paymentReference: string;
  invoiceFileName?: string;
  invoiceFileUrl?: string;
  nextRenewalDate?: string;
  renewalAmount?: number;
  requestedAmount: number;
  differenceAmount: number;
  purchaserId: string;
  purchaserName: string;
  createdAt: string;
}

export type AccessRequestStatus =
  | 'Pending'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Fulfilled'
  | 'Cancelled'
  | 'Pending Approval'
  | 'Returned for Modification'
  | 'Revoked';

export interface AccessRequest {
  id: string;
  requestNumber: string; // e.g. ACC-2026-014
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  departmentId: string;
  departmentName: string;
  teamId?: string;
  teamName?: string;
  serviceId: string;
  serviceName: string;
  serviceCategory?: string;
  category?: string;
  requestedAccessType?: string; // e.g. 'Standard Seat', 'Admin Seat', 'API Key'
  reason: string;
  reasonId?: string;
  additionalExplanation?: string;
  duration: 'Permanent' | 'Project-based (3 Months)' | 'Project-based (6 Months)' | 'Temporary (1 Month)' | string;
  preferredAccountId?: string;
  preferredAccountEmail?: string;
  status: AccessRequestStatus;
  workflowId: string;
  currentStageIndex: number;
  stages: ApprovalStageAction[];

  // Approver selection of which account is given (User Request Requirement)
  assignedAccountId?: string;
  assignedAccountEmail?: string;
  assignedPlanName?: string;
  accessGrantedDate?: string;
  accessGrantedById?: string;
  accessGrantedByName?: string;
  accessNotes?: string;

  reviewedById?: string;
  reviewedByName?: string;
  approvalDate?: string;

  createdAt: string;
  updatedAt: string;
}

export type AccountAllocationModel =
  | 'single_user'
  | 'multiple_user'
  | 'seat_based'
  | 'team_based'
  | 'department_based'
  | 'shared_internal';

export interface ServiceAccount {
  id: string;
  serviceId: string;
  serviceName: string;
  accountEmail: string;
  planName: string;
  planTier?: string;
  assignmentType?: string;
  allocationModel?: AccountAllocationModel;
  seatLimit?: number; // total defined capacity
  allocatedSeats?: number; // active allocated seats
  purchaseDate: string;
  purchaseAmount: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  billingCycle: BillingCycle;
  nextRenewalDate?: string;
  renewalAmount?: number;
  purchaseSource: 'Direct' | 'Vendor';
  vendorId?: string;
  vendorName?: string;
  paymentCardId?: string;
  accountStatus: 'Available' | 'Assigned' | 'Partially Assigned' | 'Active' | 'Inactive' | 'Suspended' | 'Expired' | 'Cancelled';
  paymentStatus: 'Paid' | 'Upcoming' | 'Overdue' | 'One-Time Settled';
  linkedPurchaseId?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  sharedUserIds?: string[];
  sharedUserNames?: string[];
}

export interface AccountAccessHistory {
  id: string;
  assignmentId: string;
  serviceId: string;
  serviceName: string;
  accountId: string;
  accountEmail: string;
  recipientId: string;
  recipientName: string;
  recipientType: RecipientType;
  action: 'grant' | 'edit' | 'extend' | 'revoke';
  previousExpiryDate?: string;
  newExpiryDate?: string;
  actorId: string;
  actorName: string;
  reasonOrNotes?: string;
  timestamp: string;
}

export interface Subscription {
  id: string;
  serviceId: string;
  serviceName: string;
  accountId?: string;
  accountEmail?: string;
  planName: string;
  billingCycle: BillingCycle;
  purchaseDate: string;
  startDate: string;
  currentAmount: number;
  currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
  nextRenewalDate?: string;
  expectedRenewalAmount?: number;
  autoRenewal: boolean;
  status: 'Active' | 'Paused' | 'Cancelled';
  lastPaymentDate: string;
  paymentCardId?: string;
}

export interface PaymentCard {
  id: string;
  cardName: string;
  network: 'Visa' | 'Mastercard' | 'American Express';
  bankName: string;
  holderName: string;
  lastFour: string;
  currency: 'USD' | 'BDT' | 'EUR';
  expiryMonth: string;
  expiryYear: string;
  status: 'Active' | 'Inactive' | 'Frozen';
  authorizedUserIds: string[];
  ownerId?: string;
  ownerName?: string;
}

export interface CardVisibilityPermission {
  id: string;
  cardId: string;
  cardName: string;
  ownerId: string;
  authorizedUserId: string;
  authorizedUserName: string;
  authorizedUserEmail: string;
  grantedAt: string;
  status: 'Active' | 'Revoked';
  revokedAt?: string;
}

export interface CardRevealAuditLog {
  id: string;
  cardId: string;
  cardName: string;
  viewerId: string;
  viewerName: string;
  viewerEmail: string;
  action: 'reveal_masked' | 'visibility_granted' | 'visibility_revoked' | 'failed_password' | 'unauthorized_attempt';
  result: 'Success' | 'Denied';
  timestamp: string;
  notes?: string;
}

export type RecipientType = 'employee' | 'team' | 'department';
export type AccessPermissionLevel = 'read' | 'user' | 'admin' | 'full';
export type AssignmentStatus = 'Active' | 'Revoked' | 'Expired';
export type ProvisioningStatus = 'Provisioned' | 'Pending External Setup';

export interface AccountAccessAssignment {
  id: string;
  serviceId: string;
  serviceName: string;
  accountId: string;
  accountEmail: string;
  recipientType: RecipientType;
  recipientId: string;
  recipientName: string;
  recipientEmail?: string;
  departmentId?: string;
  departmentName?: string;
  teamId?: string;
  teamName?: string;
  grantedById: string;
  grantedByName: string;
  startDate: string;
  expirationDate: string;
  permissionLevel: AccessPermissionLevel;
  status: AssignmentStatus;
  provisioningStatus: ProvisioningStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EmailTemplateKey =
  | 'otp_verification'
  | 'employee_invitation'
  | 'magic_link_activation'
  | 'password_reset'
  | 'access_notification'
  | 'requisition_notification'
  | 'subscription_notification'
  | 'security_notification';

export interface EmailTemplate {
  id: string;
  key: EmailTemplateKey;
  name: string;
  category: 'Security' | 'Access' | 'Procurement' | 'Billing' | 'Onboarding';
  subject: string;
  bodyHtml: string;
  availableVariables: string[];
  isEnabled: boolean;
  updatedAt: string;
}

export interface EmailDeliveryLog {
  id: string;
  templateKey: EmailTemplateKey;
  templateName: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  status: 'Sent' | 'Failed' | 'Queued';
  attemptCount: number;
  providerMessageId?: string;
  error?: string;
  dispatchedAt: string;
}

export interface CardAccessLog {
  id: string;
  timestamp: string;
  cardId: string;
  cardName: string;
  userId: string;
  userName: string;
  action: 'view_masked' | 'emergency_access' | 'permission_change' | 'purchase_use';
  justification?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  notes?: string;
  status: 'Active' | 'Preferred' | 'Inactive';
  totalPurchaseAmount: number;
  activeServicesCount: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'requisition' | 'approval' | 'purchase' | 'renewal' | 'planning' | 'card_security' | 'access';
  recipientId: string;
  isRead: boolean;
  createdAt: string;
  linkAction?: { view: string; id?: string };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  beforeValue?: string;
  afterValue?: string;
}
