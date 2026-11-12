import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Department,
  Team,
  ServiceCategory,
  CatalogueService,
  ApprovalWorkflow,
  Requisition,
  PurchaseRecord,
  ServiceAccount,
  Subscription,
  PaymentCard,
  CardAccessLog,
  CardVisibilityPermission,
  CardRevealAuditLog,
  Vendor,
  AppNotification,
  AuditLog,
  BillingCycle,
  UserRole,
  AccessRequest,
  AccountAccessAssignment,
  EmailTemplate,
  EmailDeliveryLog,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_TEAMS,
  INITIAL_CATEGORIES,
  INITIAL_SERVICES,
  INITIAL_ACCOUNTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_CARDS,
  INITIAL_CARD_LOGS,
  INITIAL_CARD_PERMISSIONS,
  INITIAL_VENDORS,
  INITIAL_WORKFLOWS,
  INITIAL_REQUISITIONS,
  INITIAL_PURCHASES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ACCESS_REQUESTS,
  INITIAL_ACCESS_ASSIGNMENTS,
  INITIAL_EMAIL_TEMPLATES,
  INITIAL_EMAIL_LOGS,
} from '../data/mockData';

interface AppContextType {
  // Active User / Session
  currentUser: User;
  switchUser: (userId: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Active view routing
  currentView: string;
  setCurrentView: (view: string, itemId?: string) => void;
  selectedItemId?: string;

  // State collections
  users: User[];
  departments: Department[];
  teams: Team[];
  categories: ServiceCategory[];
  services: CatalogueService[];
  accounts: ServiceAccount[];
  subscriptions: Subscription[];
  cards: PaymentCard[];
  cardLogs: CardAccessLog[];
  cardPermissions: CardVisibilityPermission[];
  cardRevealLogs: CardRevealAuditLog[];
  vendors: Vendor[];
  workflows: ApprovalWorkflow[];
  requisitions: Requisition[];
  accessRequests: AccessRequest[];
  accessAssignments: AccountAccessAssignment[];
  purchases: PurchaseRecord[];
  emailTemplates: EmailTemplate[];
  emailLogs: EmailDeliveryLog[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];

  // Security / Card restricted access (Part 9)
  canViewCardDetails: (cardId: string) => boolean;
  canViewCardNameOnly: (cardId: string) => boolean;
  getCardMaskedInfo: (cardId?: string) => {
    isAuthorized: boolean;
    cardName?: string;
    bankName?: string;
    network?: string;
    lastFour?: string;
    holderName?: string;
    currency?: string;
    isRevealed?: boolean;
    secondsRemaining?: number;
  };
  emergencyAccessCard: (cardId: string, justification: string) => void;
  updateCardAuthorizedUsers: (cardId: string, userIds: string[]) => void;
  createCard: (card: Omit<PaymentCard, 'id'>) => void;
  revealedCards: Record<string, { lastFour: string; expiresAt: number }>;
  revealCardWithPassword: (cardId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  grantCardVisibility: (cardId: string, targetUserId: string) => Promise<{ success: boolean; error?: string }>;
  revokeCardVisibility: (cardId: string, targetUserId: string) => Promise<{ success: boolean; error?: string }>;

  // Access Management (Part 8)
  createAccessAssignment: (data: {
    serviceId: string;
    accountId: string;
    recipientType: 'employee' | 'team' | 'department';
    recipientId: string;
    startDate: string;
    expirationDate: string;
    permissionLevel: 'read' | 'user' | 'admin' | 'full';
    provisioningStatus?: 'Provisioned' | 'Pending External Setup';
    notes?: string;
  }) => void;
  extendAccessAssignment: (asgnId: string, newExpirationDate: string) => void;
  revokeAccessAssignment: (asgnId: string, reason: string) => void;

  // Email Template Management (Part 10)
  updateEmailTemplate: (id: string, updates: Partial<EmailTemplate>) => void;
  sendTestEmail: (templateId: string, recipientEmail: string) => Promise<{ success: boolean; message: string }>;

  // Requisitions & Approvals
  createRequisition: (data: Partial<Requisition>) => Requisition;
  approveStage: (reqId: string, comment?: string) => void;
  rejectStage: (reqId: string, comment: string) => void;
  returnForModification: (reqId: string, comment: string) => void;
  resubmitRequisition: (reqId: string, updatedData: Partial<Requisition>) => void;

  // Tool & Service Access Sharing Requests (PRD Section 6)
  createAccessRequest: (data: {
    serviceId: string;
    reason: string;
    duration: 'Permanent' | 'Project-based (3 Months)' | 'Project-based (6 Months)' | 'Temporary (1 Month)';
    preferredAccountId?: string;
  }) => AccessRequest;
  approveAccessRequest: (
    requestId: string,
    assignedAccountId: string,
    accessNotes?: string,
    comment?: string
  ) => void;
  rejectAccessRequest: (requestId: string, comment: string) => void;
  returnAccessRequest: (requestId: string, comment: string) => void;
  revokeAccessRequest: (requestId: string, reason: string) => void;

  // Purchases
  completePurchase: (data: {
    requisitionId: string;
    actualPlan: string;
    actualAmount: number;
    currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
    billingCycle: BillingCycle;
    purchaseDate: string;
    purchaseSource: 'Direct' | 'Vendor';
    providerName: string;
    providerWebsite?: string;
    vendorId?: string;
    paymentCardId?: string;
    paymentReference: string;
    invoiceFileName?: string;
    nextRenewalDate?: string;
    accountEmail: string;
  }) => void;

  // Subscriptions & Accounts
  addAccount: (account: Omit<ServiceAccount, 'id'>) => void;
  updateAccountStatus: (id: string, status: ServiceAccount['accountStatus']) => void;
  recordRenewalPayment: (
    subId: string,
    data: {
      amount: number;
      paymentReference: string;
      newRenewalDate: string;
      cardId?: string;
    }
  ) => void;
  calculateRenewalDate: (startDate: string, cycle: BillingCycle) => string | undefined;

  // Services & Categories
  createService: (service: Omit<CatalogueService, 'id' | 'accountsCount' | 'totalMonthlySpend' | 'createdAt'>) => CatalogueService;
  addCategory: (type: 'Tool' | 'Service', name: string, subcategories: string[]) => void;

  // Vendors
  createVendor: (vendor: Omit<Vendor, 'id' | 'totalPurchaseAmount' | 'activeServicesCount' | 'createdAt'>) => void;

  // Workflows
  saveWorkflow: (workflow: ApprovalWorkflow) => void;

  // Organization & Invitations
  inviteEmployee: (data: {
    name: string;
    email: string;
    phone: string;
    designation: string;
    departmentId: string;
    teamId?: string;
    roles: UserRole[];
  }) => void;
  resendInvitation: (userId: string) => void;
  simulateActivateAccount: (userId: string) => void;
  createDepartment: (dept: Omit<Department, 'id' | 'teamsCount' | 'employeesCount'>) => void;
  createTeam: (team: Omit<Team, 'id' | 'membersCount'>) => void;

  // Notifications & Reminders
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  triggerMonthlyPlanningDispatch: () => void;

  // Utility
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper for localStorage with seamless migration from estms_ to rltsms_
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(`rltsms_${key}`) || localStorage.getItem(`estms_${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const [darkMode, setDarkMode] = useState<boolean>(() => loadStored('dark_mode', false));
  const [currentView, setCurrentViewInternal] = useState<string>('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);

  const setCurrentView = (view: string, itemId?: string) => {
    setCurrentViewInternal(view);
    setSelectedItemId(itemId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Collections
  const [users, setUsers] = useState<User[]>(() => loadStored('users', INITIAL_USERS));
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadStored('current_user_id', 'usr-admin'));
  const [departments, setDepartments] = useState<Department[]>(() => loadStored('departments', INITIAL_DEPARTMENTS));
  const [teams, setTeams] = useState<Team[]>(() => loadStored('teams', INITIAL_TEAMS));
  const [categories, setCategories] = useState<ServiceCategory[]>(() => loadStored('categories', INITIAL_CATEGORIES));
  const [services, setServices] = useState<CatalogueService[]>(() => loadStored('services', INITIAL_SERVICES));
  const [accounts, setAccounts] = useState<ServiceAccount[]>(() => loadStored('accounts', INITIAL_ACCOUNTS));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadStored('subscriptions', INITIAL_SUBSCRIPTIONS));
  const [cards, setCards] = useState<PaymentCard[]>(() => loadStored('cards', INITIAL_CARDS));
  const [cardLogs, setCardLogs] = useState<CardAccessLog[]>(() => loadStored('card_logs', INITIAL_CARD_LOGS));
  const [vendors, setVendors] = useState<Vendor[]>(() => loadStored('vendors', INITIAL_VENDORS));
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(() => loadStored('workflows', INITIAL_WORKFLOWS));
  const [requisitions, setRequisitions] = useState<Requisition[]>(() => loadStored('requisitions', INITIAL_REQUISITIONS));
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => loadStored('access_requests', INITIAL_ACCESS_REQUESTS));
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => loadStored('purchases', INITIAL_PURCHASES));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadStored('notifications', INITIAL_NOTIFICATIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStored('audit_logs', INITIAL_AUDIT_LOGS));

  // Ephemeral emergency accesses in memory for this session
  const [emergencyAccessCardIds, setEmergencyAccessCardIds] = useState<string[]>([]);

  // Sync to localStorage under rltsms_
  useEffect(() => {
    localStorage.setItem('rltsms_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('rltsms_current_user_id', JSON.stringify(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('rltsms_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('rltsms_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('rltsms_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('rltsms_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('rltsms_cards', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('rltsms_card_logs', JSON.stringify(cardLogs));
  }, [cardLogs]);

  useEffect(() => {
    localStorage.setItem('rltsms_requisitions', JSON.stringify(requisitions));
  }, [requisitions]);

  useEffect(() => {
    localStorage.setItem('rltsms_access_requests', JSON.stringify(accessRequests));
  }, [accessRequests]);

  useEffect(() => {
    localStorage.setItem('rltsms_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('rltsms_workflows', JSON.stringify(workflows));
  }, [workflows]);

  useEffect(() => {
    localStorage.setItem('rltsms_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('rltsms_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      addAuditLog({
        action: 'USER_SWITCH',
        entity: 'Session',
        entityId: userId,
        details: `Active session switched to ${targetUser.name} (${targetUser.roles.join(', ')})`,
      });
    }
  };

  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName'>) => {
    const newEntry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      ...log,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // CARD VISIBILITY AUTHORIZATION (Strict server-side security logic)
  const canViewCardDetails = (cardId: string): boolean => {
    if (emergencyAccessCardIds.includes(cardId)) return true;
    const card = cards.find((c) => c.id === cardId);
    if (!card) return false;
    // Explicit authorization check: user ID must be in authorizedUserIds list, OR user has specific card permission level
    if (card.authorizedUserIds.includes(currentUser.id)) return true;
    if (currentUser.cardPermissionLevel === 'masked_details' || currentUser.cardPermissionLevel === 'manage') {
      return true;
    }
    return false;
  };

  const canViewCardNameOnly = (cardId: string): boolean => {
    if (canViewCardDetails(cardId)) return true;
    if (currentUser.cardPermissionLevel === 'name_only') return true;
    return false;
  };

  const getCardMaskedInfo = (cardId?: string) => {
    if (!cardId) {
      return { isAuthorized: false };
    }
    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      return { isAuthorized: false };
    }
    const isAuthorized = canViewCardDetails(cardId);
    if (!isAuthorized) {
      if (canViewCardNameOnly(cardId)) {
        return {
          isAuthorized: false,
          cardName: card.cardName,
        };
      }
      return { isAuthorized: false };
    }
    return {
      isAuthorized: true,
      cardName: card.cardName,
      bankName: card.bankName,
      network: card.network,
      lastFour: card.lastFour,
      holderName: card.holderName,
      currency: card.currency,
    };
  };

  const emergencyAccessCard = (cardId: string, justification: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    setEmergencyAccessCardIds((prev) => [...prev, cardId]);
    const logEntry: CardAccessLog = {
      id: `log-c-${Date.now()}`,
      timestamp: new Date().toISOString(),
      cardId,
      cardName: card.cardName,
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'emergency_access',
      justification,
    };
    setCardLogs((prev) => [logEntry, ...prev]);
    addAuditLog({
      action: 'CARD_EMERGENCY_ACCESS',
      entity: 'PaymentCard',
      entityId: cardId,
      details: `Emergency card viewing granted to ${currentUser.name}. Justification: "${justification}"`,
    });
  };

  const updateCardAuthorizedUsers = (cardId: string, userIds: string[]) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, authorizedUserIds: userIds } : c))
    );
    addAuditLog({
      action: 'CARD_PERMISSIONS_UPDATED',
      entity: 'PaymentCard',
      entityId: cardId,
      details: `Updated authorized viewers list for card ${cardId}. Authorized count: ${userIds.length}`,
    });
  };

  const createCard = (cardData: Omit<PaymentCard, 'id'>) => {
    const newCard: PaymentCard = {
      id: `card-${Date.now()}`,
      ...cardData,
    };
    setCards((prev) => [...prev, newCard]);
    addAuditLog({
      action: 'CARD_REGISTERED',
      entity: 'PaymentCard',
      entityId: newCard.id,
      details: `Registered company card ${newCard.cardName} (${newCard.network} ending in ${newCard.lastFour})`,
    });
  };

  // Calculate next renewal date
  const calculateRenewalDate = (startDateStr: string, cycle: BillingCycle): string | undefined => {
    if (cycle === 'One-time') return undefined;
    const date = new Date(startDateStr);
    if (isNaN(date.getTime())) return undefined;

    switch (cycle) {
      case 'Monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'Quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'Half-yearly':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'Yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      case 'Custom recurring':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  // REQUISITIONS
  const createRequisition = (data: Partial<Requisition>): Requisition => {
    const activeWf = workflows.find((w) => w.isActive && w.purpose === 'Purchase Requisitions') || workflows[0];
    const reqNum = `REQ-2026-${String(requisitions.length + 82).padStart(3, '0')}`;

    // Resolve approvers for stages
    const stages: Requisition['stages'] = activeWf.stages.map((stg) => {
      let approverId: string | undefined;
      let approverName: string | undefined;

      if (stg.type === 'specific_employee') {
        approverId = stg.employeeId;
        approverName = stg.employeeName;
      } else if (stg.roleName === 'Team Lead') {
        const team = teams.find((t) => t.id === currentUser.teamId);
        approverId = team?.leadId;
        approverName = team?.leadName;
      } else if (stg.roleName === 'Department Lead') {
        const dept = departments.find((d) => d.id === currentUser.departmentId);
        approverId = dept?.leadId;
        approverName = dept?.leadName;
      } else if (stg.roleName === 'Operation Manager') {
        const ops = users.find((u) => u.roles.includes('Operation Manager'));
        approverId = ops?.id;
        approverName = ops?.name;
      }

      return {
        stageId: stg.id,
        stageName: stg.name,
        roleOrPosition: stg.roleName || 'Approver',
        assignedApproverId: approverId,
        assignedApproverName: approverName,
        isRequired: stg.isRequired,
        status: 'Pending',
      };
    });

    const newReq: Requisition = {
      id: `req-${Date.now()}`,
      requisitionNumber: reqNum,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email,
      departmentId: currentUser.departmentId,
      departmentName: currentUser.departmentName,
      teamId: currentUser.teamId,
      teamName: currentUser.teamName,
      serviceId: data.serviceId,
      serviceName: data.serviceName || 'Proposed Service',
      isNewServiceProposal: !!data.isNewServiceProposal,
      type: data.type || 'Tool',
      category: data.category || 'AI Tools',
      subcategory: data.subcategory || 'AI Assistants / Chatbots',
      purpose: data.purpose || '',
      requestedPlan: data.requestedPlan || '',
      accountEmail: data.accountEmail,
      billingCycle: data.billingCycle || 'Monthly',
      estimatedAmount: data.estimatedAmount || 0,
      currency: data.currency || 'USD',
      expectedPurchaseDate: data.expectedPurchaseDate || new Date().toISOString().split('T')[0],
      notes: data.notes,
      attachments: data.attachments || [],
      status: 'Pending Approval',
      workflowId: activeWf.id,
      currentStageIndex: 0,
      stages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRequisitions((prev) => [newReq, ...prev]);

    // Send notification to first stage approver
    const firstApproverId = stages[0]?.assignedApproverId;
    if (firstApproverId) {
      addNotification({
        title: `Approval Required: ${newReq.requisitionNumber}`,
        message: `${currentUser.name} submitted a purchase requisition for ${newReq.serviceName} (${newReq.currency} ${newReq.estimatedAmount}). Your review is required.`,
        type: 'approval',
        recipientId: firstApproverId,
        linkAction: { view: 'requisitions', id: newReq.id },
      });
    }

    addAuditLog({
      action: 'REQUISITION_CREATED',
      entity: 'Requisition',
      entityId: newReq.id,
      details: `Created requisition ${newReq.requisitionNumber} for ${newReq.serviceName} (${newReq.currency} ${newReq.estimatedAmount})`,
    });

    return newReq;
  };

  const approveStage = (reqId: string, comment?: string) => {
    setRequisitions((prev) =>
      prev.map((req) => {
        if (req.id !== reqId) return req;

        const updatedStages = [...req.stages];
        const currentStage = updatedStages[req.currentStageIndex];

        if (currentStage) {
          currentStage.status = 'Approved';
          currentStage.actionDate = new Date().toISOString();
          currentStage.comment = comment || 'Approved.';
          currentStage.actorName = currentUser.name;
        }

        // Determine if all REQUIRED stages are now approved
        const nextIndex = req.currentStageIndex + 1;
        const allRequiredApproved = updatedStages
          .filter((s) => s.isRequired)
          .every((s) => s.status === 'Approved');

        const hasMoreStages = nextIndex < updatedStages.length;

        let newStatus = req.status;
        if (!hasMoreStages || allRequiredApproved) {
          // If all required stages are approved, mark as Approved (Pending Purchase)
          newStatus = 'Approved';

          // Notify assigned Purchaser (Michael Chang)
          const purchaser = users.find((u) => u.roles.includes('Purchaser'));
          if (purchaser) {
            addNotification({
              title: `Requisition Approved: ${req.requisitionNumber}`,
              message: `Requisition ${req.requisitionNumber} for ${req.serviceName} was approved. Ready for purchase completion.`,
              type: 'purchase',
              recipientId: purchaser.id,
              linkAction: { view: 'purchases', id: req.id },
            });
          }

          // Notify requester
          addNotification({
            title: `Your Requisition was Approved! (${req.requisitionNumber})`,
            message: `Requisition for ${req.serviceName} was approved by ${currentUser.name} and forwarded to procurement.`,
            type: 'requisition',
            recipientId: req.requesterId,
            linkAction: { view: 'requisitions', id: req.id },
          });
        } else {
          // Advance to next stage approver
          const nextStage = updatedStages[nextIndex];
          if (nextStage?.assignedApproverId) {
            addNotification({
              title: `Approval Required: ${req.requisitionNumber}`,
              message: `Requisition ${req.requisitionNumber} (${req.serviceName}) has passed stage ${req.currentStageIndex + 1} and awaits your approval.`,
              type: 'approval',
              recipientId: nextStage.assignedApproverId,
              linkAction: { view: 'requisitions', id: req.id },
            });
          }
        }

        addAuditLog({
          action: 'REQUISITION_STAGE_APPROVED',
          entity: 'Requisition',
          entityId: req.id,
          details: `Stage "${currentStage?.stageName}" approved by ${currentUser.name}. Comment: "${comment || 'None'}". New status: ${newStatus}`,
        });

        return {
          ...req,
          currentStageIndex: nextIndex,
          stages: updatedStages,
          status: newStatus,
          approvedAmount: newStatus === 'Approved' ? req.estimatedAmount : req.approvedAmount,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const rejectStage = (reqId: string, comment: string) => {
    setRequisitions((prev) =>
      prev.map((req) => {
        if (req.id !== reqId) return req;

        const updatedStages = [...req.stages];
        const currentStage = updatedStages[req.currentStageIndex];

        if (currentStage) {
          currentStage.status = 'Rejected';
          currentStage.actionDate = new Date().toISOString();
          currentStage.comment = comment;
          currentStage.actorName = currentUser.name;
        }

        // If stage is required, whole requisition is rejected!
        let newStatus = req.status;
        if (currentStage?.isRequired) {
          newStatus = 'Rejected';
          addNotification({
            title: `Requisition Rejected: ${req.requisitionNumber}`,
            message: `Your requisition for ${req.serviceName} was rejected at stage "${currentStage.stageName}" by ${currentUser.name}. Reason: ${comment}`,
            type: 'requisition',
            recipientId: req.requesterId,
            linkAction: { view: 'requisitions', id: req.id },
          });
        } else {
          // Optional stage rejection does not block the workflow!
          const nextIndex = req.currentStageIndex + 1;
          return {
            ...req,
            currentStageIndex: nextIndex,
            stages: updatedStages,
            updatedAt: new Date().toISOString(),
          };
        }

        addAuditLog({
          action: 'REQUISITION_REJECTED',
          entity: 'Requisition',
          entityId: req.id,
          details: `Requisition ${req.requisitionNumber} rejected at stage "${currentStage?.stageName}" by ${currentUser.name}. Reason: "${comment}"`,
        });

        return {
          ...req,
          stages: updatedStages,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const returnForModification = (reqId: string, comment: string) => {
    setRequisitions((prev) =>
      prev.map((req) => {
        if (req.id !== reqId) return req;

        const updatedStages = [...req.stages];
        const currentStage = updatedStages[req.currentStageIndex];
        if (currentStage) {
          currentStage.status = 'Returned';
          currentStage.actionDate = new Date().toISOString();
          currentStage.comment = comment;
          currentStage.actorName = currentUser.name;
        }

        addNotification({
          title: `Requisition Returned for Modification (${req.requisitionNumber})`,
          message: `${currentUser.name} requested changes to ${req.requisitionNumber}: "${comment}"`,
          type: 'requisition',
          recipientId: req.requesterId,
          linkAction: { view: 'requisitions', id: req.id },
        });

        addAuditLog({
          action: 'REQUISITION_RETURNED',
          entity: 'Requisition',
          entityId: req.id,
          details: `Requisition ${req.requisitionNumber} returned to requester by ${currentUser.name}. Notes: "${comment}"`,
        });

        return {
          ...req,
          status: 'Returned for Modification',
          stages: updatedStages,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const resubmitRequisition = (reqId: string, updatedData: Partial<Requisition>) => {
    setRequisitions((prev) =>
      prev.map((req) => {
        if (req.id !== reqId) return req;

        const resetStages = req.stages.map((s, idx) => ({
          ...s,
          status: 'Pending' as const,
          actionDate: undefined,
          comment: undefined,
          actorName: undefined,
        }));

        const firstApproverId = resetStages[0]?.assignedApproverId;
        if (firstApproverId) {
          addNotification({
            title: `Resubmitted Requisition: ${req.requisitionNumber}`,
            message: `${currentUser.name} updated and resubmitted requisition ${req.requisitionNumber}. Review required.`,
            type: 'approval',
            recipientId: firstApproverId,
            linkAction: { view: 'requisitions', id: req.id },
          });
        }

        addAuditLog({
          action: 'REQUISITION_RESUBMITTED',
          entity: 'Requisition',
          entityId: req.id,
          details: `Requester ${currentUser.name} resubmitted ${req.requisitionNumber} after modifications.`,
        });

        return {
          ...req,
          ...updatedData,
          status: 'Pending Approval',
          currentStageIndex: 0,
          stages: resetStages,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // TOOL ACCESS SHARING REQUESTS (PRD SECTION 6)
  const createAccessRequest = (data: {
    serviceId: string;
    reason: string;
    duration: 'Permanent' | 'Project-based (3 Months)' | 'Project-based (6 Months)' | 'Temporary (1 Month)';
    preferredAccountId?: string;
  }): AccessRequest => {
    const service = services.find((s) => s.id === data.serviceId);
    if (!service) throw new Error('Selected service not found in catalogue');

    const activeWf =
      workflows.find((w) => w.isActive && w.purpose === 'Access-sharing requests') ||
      workflows.find((w) => w.purpose === 'Access-sharing requests') ||
      workflows[0];

    const reqNum = `ACC-2026-${String(accessRequests.length + 15).padStart(3, '0')}`;

    // Resolve approvers for stages
    const stages: AccessRequest['stages'] = activeWf.stages.map((stg) => {
      let approverId: string | undefined;
      let approverName: string | undefined;

      if (stg.type === 'specific_employee') {
        approverId = stg.employeeId;
        approverName = stg.employeeName;
      } else if (stg.roleName === 'Team Lead') {
        const team = teams.find((t) => t.id === currentUser.teamId);
        approverId = team?.leadId;
        approverName = team?.leadName;
      } else if (stg.roleName === 'Department Lead') {
        const dept = departments.find((d) => d.id === currentUser.departmentId);
        approverId = dept?.leadId;
        approverName = dept?.leadName;
      } else if (stg.roleName === 'Operation Manager') {
        const ops = users.find((u) => u.roles.includes('Operation Manager'));
        approverId = ops?.id;
        approverName = ops?.name;
      }

      return {
        stageId: stg.id,
        stageName: stg.name,
        roleOrPosition: stg.roleName || 'Approver',
        assignedApproverId: approverId,
        assignedApproverName: approverName,
        isRequired: stg.isRequired,
        status: 'Pending',
      };
    });

    const preferredAccount = data.preferredAccountId ? accounts.find((a) => a.id === data.preferredAccountId) : undefined;

    const newReq: AccessRequest = {
      id: `acc-${Date.now()}`,
      requestNumber: reqNum,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email,
      departmentId: currentUser.departmentId,
      departmentName: currentUser.departmentName,
      teamId: currentUser.teamId,
      teamName: currentUser.teamName,
      serviceId: service.id,
      serviceName: service.name,
      category: service.category,
      reason: data.reason,
      duration: data.duration,
      preferredAccountId: data.preferredAccountId,
      preferredAccountEmail: preferredAccount?.accountEmail,
      status: 'Pending Approval',
      workflowId: activeWf.id,
      currentStageIndex: 0,
      stages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAccessRequests((prev) => [newReq, ...prev]);

    // Send notification to first stage approver
    const firstApproverId = stages[0]?.assignedApproverId;
    if (firstApproverId) {
      addNotification({
        title: `Access Request: ${newReq.requestNumber}`,
        message: `${currentUser.name} requested shared access to ${newReq.serviceName} (${newReq.duration}). Your approval and account seat assignment are required.`,
        type: 'approval',
        recipientId: firstApproverId,
        linkAction: { view: 'requisitions', id: newReq.id },
      });
    }

    addAuditLog({
      action: 'ACCESS_REQUEST_CREATED',
      entity: 'AccessRequest',
      entityId: newReq.id,
      details: `Created access request ${newReq.requestNumber} for ${newReq.serviceName} (${newReq.duration}) by ${currentUser.name}`,
    });

    return newReq;
  };

  const approveAccessRequest = (
    requestId: string,
    assignedAccountId: string,
    accessNotes?: string,
    comment?: string
  ) => {
    const targetAccount = accounts.find((a) => a.id === assignedAccountId);
    if (!targetAccount) {
      console.error('Assigned account not found');
      return;
    }

    setAccessRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const updatedStages = [...req.stages];
        const currentStage = updatedStages[req.currentStageIndex];

        if (currentStage) {
          currentStage.status = 'Approved';
          currentStage.actionDate = new Date().toISOString();
          currentStage.comment = comment || `Approved and assigned account: ${targetAccount.accountEmail}`;
          currentStage.actorName = currentUser.name;
        }

        const nextIndex = req.currentStageIndex + 1;
        const allRequiredApproved = updatedStages
          .filter((s) => s.isRequired)
          .every((s) => s.status === 'Approved');

        const isFinalApproval = !updatedStages[nextIndex] || allRequiredApproved;

        if (isFinalApproval) {
          // Fully Approved: update account with shared user!
          setAccounts((prevAccounts) =>
            prevAccounts.map((acc) => {
              if (acc.id === assignedAccountId) {
                const existingUserIds = acc.sharedUserIds || [];
                const existingUserNames = acc.sharedUserNames || [];
                const newIds = existingUserIds.includes(req.requesterId)
                  ? existingUserIds
                  : [...existingUserIds, req.requesterId];
                const newNames = existingUserNames.includes(req.requesterName)
                  ? existingUserNames
                  : [...existingUserNames, req.requesterName];
                return {
                  ...acc,
                  sharedUserIds: newIds,
                  sharedUserNames: newNames,
                  updatedAt: new Date().toISOString(),
                };
              }
              return acc;
            })
          );

          // Notify requester
          addNotification({
            title: `Tool Access Granted: ${req.serviceName}`,
            message: `Your request ${req.requestNumber} for ${req.serviceName} was approved by ${currentUser.name}. You have been assigned account: ${targetAccount.accountEmail}.${accessNotes ? ` Instructions: ${accessNotes}` : ''}`,
            type: 'requisition',
            recipientId: req.requesterId,
            linkAction: { view: 'requisitions', id: req.id },
          });

          addAuditLog({
            action: 'ACCESS_REQUEST_APPROVED',
            entity: 'AccessRequest',
            entityId: req.id,
            details: `Approved access request ${req.requestNumber} for ${req.serviceName}. Assigned account ${targetAccount.accountEmail} to requester ${req.requesterName} by ${currentUser.name}.`,
          });

          return {
            ...req,
            status: 'Approved',
            stages: updatedStages,
            assignedAccountId: targetAccount.id,
            assignedAccountEmail: targetAccount.accountEmail,
            assignedPlanName: targetAccount.planTier || targetAccount.planName,
            accessGrantedDate: new Date().toISOString(),
            accessGrantedById: currentUser.id,
            accessGrantedByName: currentUser.name,
            accessNotes: accessNotes || comment || undefined,
            updatedAt: new Date().toISOString(),
          };
        } else {
          // Advance to next stage approver
          const nextStage = updatedStages[nextIndex];
          if (nextStage?.assignedApproverId) {
            addNotification({
              title: `Access Request Approval Required: ${req.requestNumber}`,
              message: `Access request ${req.requestNumber} (${req.serviceName}) has passed stage ${req.currentStageIndex + 1} and awaits your approval.`,
              type: 'approval',
              recipientId: nextStage.assignedApproverId,
              linkAction: { view: 'requisitions', id: req.id },
            });
          }

          addAuditLog({
            action: 'ACCESS_REQUEST_STAGE_APPROVED',
            entity: 'AccessRequest',
            entityId: req.id,
            details: `Stage "${currentStage?.stageName}" for ${req.requestNumber} approved by ${currentUser.name}`,
          });

          return {
            ...req,
            currentStageIndex: nextIndex,
            stages: updatedStages,
            assignedAccountId: targetAccount.id,
            assignedAccountEmail: targetAccount.accountEmail,
            assignedPlanName: targetAccount.planTier || targetAccount.planName,
            updatedAt: new Date().toISOString(),
          };
        }
      })
    );
  };

  const rejectAccessRequest = (requestId: string, comment: string) => {
    setAccessRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const updatedStages = [...req.stages];
        const currentStage = updatedStages[req.currentStageIndex];
        if (currentStage) {
          currentStage.status = 'Rejected';
          currentStage.actionDate = new Date().toISOString();
          currentStage.comment = comment;
          currentStage.actorName = currentUser.name;
        }

        addNotification({
          title: `Access Request Rejected (${req.requestNumber})`,
          message: `Your access request for ${req.serviceName} was rejected by ${currentUser.name}. Reason: "${comment}"`,
          type: 'requisition',
          recipientId: req.requesterId,
          linkAction: { view: 'requisitions', id: req.id },
        });

        addAuditLog({
          action: 'ACCESS_REQUEST_REJECTED',
          entity: 'AccessRequest',
          entityId: req.id,
          details: `Access request ${req.requestNumber} for ${req.serviceName} rejected by ${currentUser.name}. Reason: "${comment}"`,
        });

        return {
          ...req,
          status: 'Rejected',
          stages: updatedStages,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const returnAccessRequest = (requestId: string, comment: string) => {
    setAccessRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;

        const updatedStages = [...req.stages];
        const currentStage = updatedStages[req.currentStageIndex];
        if (currentStage) {
          currentStage.status = 'Returned';
          currentStage.actionDate = new Date().toISOString();
          currentStage.comment = comment;
          currentStage.actorName = currentUser.name;
        }

        addNotification({
          title: `Access Request Returned for Modification (${req.requestNumber})`,
          message: `${currentUser.name} requested modifications for access request ${req.requestNumber}: "${comment}"`,
          type: 'requisition',
          recipientId: req.requesterId,
          linkAction: { view: 'requisitions', id: req.id },
        });

        addAuditLog({
          action: 'ACCESS_REQUEST_RETURNED',
          entity: 'AccessRequest',
          entityId: req.id,
          details: `Access request ${req.requestNumber} returned to requester by ${currentUser.name}. Feedback: "${comment}"`,
        });

        return {
          ...req,
          status: 'Returned for Modification',
          stages: updatedStages,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const revokeAccessRequest = (requestId: string, reason: string) => {
    const targetReq = accessRequests.find((r) => r.id === requestId);
    if (!targetReq) return;

    if (targetReq.assignedAccountId) {
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => {
          if (acc.id === targetReq.assignedAccountId) {
            return {
              ...acc,
              sharedUserIds: (acc.sharedUserIds || []).filter((id) => id !== targetReq.requesterId),
              sharedUserNames: (acc.sharedUserNames || []).filter((name) => name !== targetReq.requesterName),
              updatedAt: new Date().toISOString(),
            };
          }
          return acc;
        })
      );
    }

    setAccessRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          status: 'Revoked',
          updatedAt: new Date().toISOString(),
        };
      })
    );

    addNotification({
      title: `Access Revoked: ${targetReq.serviceName}`,
      message: `Your access to ${targetReq.serviceName} (${targetReq.assignedAccountEmail || 'Tool Account'}) has been revoked by ${currentUser.name}. Reason: ${reason}`,
      type: 'requisition',
      recipientId: targetReq.requesterId,
      linkAction: { view: 'requisitions', id: targetReq.id },
    });

    addAuditLog({
      action: 'ACCESS_REVOKED',
      entity: 'AccessRequest',
      entityId: targetReq.id,
      details: `Revoked access for ${targetReq.requesterName} on account ${targetReq.assignedAccountEmail || 'N/A'}. Reason: "${reason}"`,
    });
  };

  // PURCHASES & PROCUREMENT
  const completePurchase = (purchaseData: {
    requisitionId: string;
    actualPlan: string;
    actualAmount: number;
    currency: 'USD' | 'BDT' | 'EUR' | 'GBP';
    billingCycle: BillingCycle;
    purchaseDate: string;
    purchaseSource: 'Direct' | 'Vendor';
    providerName: string;
    providerWebsite?: string;
    vendorId?: string;
    paymentCardId?: string;
    paymentReference: string;
    invoiceFileName?: string;
    nextRenewalDate?: string;
    accountEmail: string;
  }) => {
    const req = requisitions.find((r) => r.id === purchaseData.requisitionId);
    if (!req) return;

    const diff = purchaseData.actualAmount - req.estimatedAmount;
    const vendor = vendors.find((v) => v.id === purchaseData.vendorId);
    const purchaseId = `pur-${Date.now()}`;

    // Auto calculate renewal date if recurring and not manually overridden
    const calculatedRenewal =
      purchaseData.nextRenewalDate ||
      calculateRenewalDate(purchaseData.purchaseDate, purchaseData.billingCycle);

    const newPurchase: PurchaseRecord = {
      id: purchaseId,
      requisitionId: req.id,
      requisitionNumber: req.requisitionNumber,
      serviceId: req.serviceId || 'srv-gen',
      serviceName: req.serviceName,
      accountEmail: purchaseData.accountEmail,
      actualPlan: purchaseData.actualPlan,
      actualAmount: purchaseData.actualAmount,
      currency: purchaseData.currency,
      billingCycle: purchaseData.billingCycle,
      purchaseDate: purchaseData.purchaseDate,
      purchaseSource: purchaseData.purchaseSource,
      providerName: purchaseData.providerName,
      providerWebsite: purchaseData.providerWebsite,
      vendorId: purchaseData.vendorId,
      vendorName: vendor?.name,
      paymentCardId: purchaseData.paymentCardId,
      paymentCardMaskedLabel: 'Restricted Card',
      paymentReference: purchaseData.paymentReference,
      invoiceFileName: purchaseData.invoiceFileName || 'Invoice_Attached.pdf',
      nextRenewalDate: calculatedRenewal,
      renewalAmount: purchaseData.actualAmount,
      requestedAmount: req.estimatedAmount,
      differenceAmount: diff,
      purchaserId: currentUser.id,
      purchaserName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    // Update requisition to Purchased
    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: 'Purchased',
              actualPurchaseId: purchaseId,
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );

    // Register individual account
    const newAccount: ServiceAccount = {
      id: `acc-${Date.now()}`,
      serviceId: req.serviceId || 'srv-gen',
      serviceName: req.serviceName,
      accountEmail: purchaseData.accountEmail,
      planName: purchaseData.actualPlan,
      purchaseDate: purchaseData.purchaseDate,
      purchaseAmount: purchaseData.actualAmount,
      currency: purchaseData.currency,
      billingCycle: purchaseData.billingCycle,
      nextRenewalDate: calculatedRenewal,
      renewalAmount: purchaseData.actualAmount,
      purchaseSource: purchaseData.purchaseSource,
      vendorId: purchaseData.vendorId,
      vendorName: vendor?.name,
      paymentCardId: purchaseData.paymentCardId,
      accountStatus: 'Active',
      paymentStatus: purchaseData.billingCycle === 'One-time' ? 'One-Time Settled' : 'Paid',
      assignedUserId: req.requesterId,
      assignedUserName: req.requesterName,
      linkedPurchaseId: purchaseId,
    };
    setAccounts((prev) => [newAccount, ...prev]);

    // Create Subscription if recurring (PRD Section 9 & AC-12, AC-13)
    if (purchaseData.billingCycle !== 'One-time') {
      const newSub: Subscription = {
        id: `sub-${Date.now()}`,
        serviceId: req.serviceId || 'srv-gen',
        serviceName: req.serviceName,
        accountId: newAccount.id,
        accountEmail: newAccount.accountEmail,
        planName: purchaseData.actualPlan,
        billingCycle: purchaseData.billingCycle,
        purchaseDate: purchaseData.purchaseDate,
        startDate: purchaseData.purchaseDate,
        currentAmount: purchaseData.actualAmount,
        currency: purchaseData.currency,
        nextRenewalDate: calculatedRenewal,
        expectedRenewalAmount: purchaseData.actualAmount,
        autoRenewal: true,
        status: 'Active',
        lastPaymentDate: purchaseData.purchaseDate,
        paymentCardId: purchaseData.paymentCardId,
      };
      setSubscriptions((prev) => [newSub, ...prev]);
    }

    // Update service spend & count
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === req.serviceId) {
          return {
            ...s,
            accountsCount: s.accountsCount + 1,
            totalMonthlySpend:
              s.totalMonthlySpend +
              (purchaseData.billingCycle === 'Yearly'
                ? purchaseData.actualAmount / 12
                : purchaseData.actualAmount),
          };
        }
        return s;
      })
    );

    // If purchased via vendor, update vendor purchase amount
    if (purchaseData.vendorId) {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === purchaseData.vendorId
            ? { ...v, totalPurchaseAmount: v.totalPurchaseAmount + purchaseData.actualAmount }
            : v
        )
      );
    }

    // Notify requester
    addNotification({
      title: `Service Purchased: ${req.serviceName}`,
      message: `Your requested tool ${req.serviceName} has been purchased by ${currentUser.name}. Account: ${purchaseData.accountEmail}.`,
      type: 'purchase',
      recipientId: req.requesterId,
      linkAction: { view: 'accounts', id: newAccount.id },
    });

    addAuditLog({
      action: 'PURCHASE_COMPLETED',
      entity: 'Purchase',
      entityId: purchaseId,
      details: `Purchase completed for ${req.requisitionNumber} (${req.serviceName}). Actual amount: ${purchaseData.currency} ${purchaseData.actualAmount}. Created account ${newAccount.accountEmail}.`,
    });
  };

  // SUBSCRIPTION & ACCOUNTS
  const addAccount = (accData: Omit<ServiceAccount, 'id'>) => {
    const newAcc: ServiceAccount = {
      id: `acc-${Date.now()}`,
      ...accData,
    };
    setAccounts((prev) => [newAcc, ...prev]);
    setServices((prev) =>
      prev.map((s) =>
        s.id === accData.serviceId ? { ...s, accountsCount: s.accountsCount + 1 } : s
      )
    );
    addAuditLog({
      action: 'ACCOUNT_CREATED',
      entity: 'ServiceAccount',
      entityId: newAcc.id,
      details: `Added new account ${newAcc.accountEmail} for ${newAcc.serviceName}`,
    });
  };

  const updateAccountStatus = (id: string, status: ServiceAccount['accountStatus']) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, accountStatus: status } : a))
    );
    addAuditLog({
      action: 'ACCOUNT_STATUS_CHANGED',
      entity: 'ServiceAccount',
      entityId: id,
      details: `Updated account status to ${status}`,
    });
  };

  const recordRenewalPayment = (
    subId: string,
    data: { amount: number; paymentReference: string; newRenewalDate: string; cardId?: string }
  ) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id !== subId) return sub;

        const todayStr = new Date().toISOString().split('T')[0];
        const nextDate =
          data.newRenewalDate ||
          calculateRenewalDate(todayStr, sub.billingCycle) ||
          todayStr;

        addAuditLog({
          action: 'RENEWAL_PAYMENT_RECORDED',
          entity: 'Subscription',
          entityId: sub.id,
          details: `Recorded renewal payment for ${sub.serviceName} (${sub.planName}). Amount: ${sub.currency} ${data.amount}. Ref: ${data.paymentReference}. Next renewal: ${nextDate}`,
        });

        return {
          ...sub,
          lastPaymentDate: todayStr,
          nextRenewalDate: nextDate,
          currentAmount: data.amount,
          paymentCardId: data.cardId || sub.paymentCardId,
        };
      })
    );
  };

  // CATALOGUE
  const createService = (
    svcData: Omit<CatalogueService, 'id' | 'accountsCount' | 'totalMonthlySpend' | 'createdAt'>
  ): CatalogueService => {
    const newSvc: CatalogueService = {
      id: `srv-${Date.now()}`,
      ...svcData,
      accountsCount: 0,
      totalMonthlySpend: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setServices((prev) => [newSvc, ...prev]);
    addAuditLog({
      action: 'SERVICE_CREATED',
      entity: 'CatalogueService',
      entityId: newSvc.id,
      details: `Registered new service/tool: ${newSvc.name} under ${newSvc.category}`,
    });
    return newSvc;
  };

  const addCategory = (type: 'Tool' | 'Service', name: string, subcategories: string[]) => {
    const newCat: ServiceCategory = {
      id: `cat-${Date.now()}`,
      type,
      name,
      subcategories,
    };
    setCategories((prev) => [...prev, newCat]);
    addAuditLog({
      action: 'CATEGORY_CREATED',
      entity: 'ServiceCategory',
      entityId: newCat.id,
      details: `Added new ${type} category: ${name}`,
    });
  };

  const createVendor = (
    vendorData: Omit<Vendor, 'id' | 'totalPurchaseAmount' | 'activeServicesCount' | 'createdAt'>
  ) => {
    const newVendor: Vendor = {
      id: `ven-${Date.now()}`,
      ...vendorData,
      totalPurchaseAmount: 0,
      activeServicesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setVendors((prev) => [...prev, newVendor]);
    addAuditLog({
      action: 'VENDOR_CREATED',
      entity: 'Vendor',
      entityId: newVendor.id,
      details: `Added vendor ${newVendor.name}`,
    });
  };

  const saveWorkflow = (wf: ApprovalWorkflow) => {
    setWorkflows((prev) => {
      const idx = prev.findIndex((w) => w.id === wf.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = wf;
        return updated;
      }
      return [...prev, wf];
    });
    addAuditLog({
      action: 'WORKFLOW_SAVED',
      entity: 'ApprovalWorkflow',
      entityId: wf.id,
      details: `Saved workflow "${wf.name}" (version ${wf.version}) with ${wf.stages.length} approval stages.`,
    });
  };

  // ORG & INVITATION LIFECYCLE
  const inviteEmployee = (data: {
    name: string;
    email: string;
    phone: string;
    designation: string;
    departmentId: string;
    teamId?: string;
    roles: UserRole[];
  }) => {
    const dept = departments.find((d) => d.id === data.departmentId);
    const team = teams.find((t) => t.id === data.teamId);

    const now = new Date();
    const expiry = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

    const newEmp: User = {
      id: `usr-inv-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      designation: data.designation,
      departmentId: data.departmentId,
      departmentName: dept?.name || 'General',
      teamId: data.teamId,
      teamName: team?.name,
      roles: data.roles,
      accountStatus: 'Pending Invitation',
      invitationSentAt: now.toISOString(),
      invitationExpiresAt: expiry.toISOString(),
      cardPermissionLevel: 'none',
    };

    setUsers((prev) => [...prev, newEmp]);
    addNotification({
      title: 'Employee Invitation Sent',
      message: `Account activation link sent to ${newEmp.email}. Invitation is valid for 48 hours.`,
      type: 'requisition',
      recipientId: currentUser.id,
    });
    addAuditLog({
      action: 'EMPLOYEE_INVITED',
      entity: 'User',
      entityId: newEmp.id,
      details: `Invited employee ${newEmp.name} (${newEmp.email}) as ${newEmp.roles.join(', ')}. Token valid until ${expiry.toISOString()}`,
    });
  };

  const resendInvitation = (userId: string) => {
    const now = new Date();
    const expiry = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              accountStatus: 'Pending Invitation',
              invitationSentAt: now.toISOString(),
              invitationExpiresAt: expiry.toISOString(),
            }
          : u
      )
    );

    addAuditLog({
      action: 'INVITATION_RESENT',
      entity: 'User',
      entityId: userId,
      details: `Resent activation invitation to user ${userId}. Extended expiry window by 48 hours.`,
    });
  };

  const simulateActivateAccount = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              accountStatus: 'Active',
            }
          : u
      )
    );
    addAuditLog({
      action: 'EMPLOYEE_ACTIVATED',
      entity: 'User',
      entityId: userId,
      details: `Employee account ${userId} activated successfully via activation link.`,
    });
  };

  const createDepartment = (dept: Omit<Department, 'id' | 'teamsCount' | 'employeesCount'>) => {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      ...dept,
      teamsCount: 0,
      employeesCount: 0,
    };
    setDepartments((prev) => [...prev, newDept]);
    addAuditLog({
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      entityId: newDept.id,
      details: `Created department: ${newDept.name}`,
    });
  };

  const createTeam = (team: Omit<Team, 'id' | 'membersCount'>) => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      ...team,
      membersCount: 0,
    };
    setTeams((prev) => [...prev, newTeam]);
    setDepartments((prev) =>
      prev.map((d) => (d.id === team.departmentId ? { ...d, teamsCount: d.teamsCount + 1 } : d))
    );
    addAuditLog({
      action: 'TEAM_CREATED',
      entity: 'Team',
      entityId: newTeam.id,
      details: `Created team: ${newTeam.name} under ${newTeam.departmentName}`,
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const triggerMonthlyPlanningDispatch = () => {
    const pendingPurchases = requisitions.filter((r) => r.status === 'Approved');
    const totalPending = pendingPurchases.reduce((acc, r) => acc + r.estimatedAmount, 0);

    const upcomingSubs = subscriptions.filter((s) => s.status === 'Active');
    const totalRenewals = upcomingSubs.reduce((acc, s) => acc + (s.expectedRenewalAmount || s.currentAmount), 0);

    const admins = users.filter((u) => u.roles.includes('Super Admin') || u.roles.includes('Finance'));
    admins.forEach((admin) => {
      addNotification({
        title: 'Monthly Purchase Planning Summary (Auto-Scheduler Triggered)',
        message: `Planning report: ${pendingPurchases.length} approved requisitions ($${totalPending.toFixed(2)}) awaiting purchase; ${upcomingSubs.length} subscriptions ($${totalRenewals.toFixed(2)}) renewing next month.`,
        type: 'planning',
        recipientId: admin.id,
        linkAction: { view: 'reports' },
      });
    });

    addAuditLog({
      action: 'MONTHLY_PURCHASE_PLANNING_TRIGGERED',
      entity: 'Scheduler',
      entityId: 'sched-month-end',
      details: `Triggered 7-day pre-month-end purchase planning summary dispatch to designated administrators. Total forecasted commitment: $${(totalPending + totalRenewals).toFixed(2)} USD`,
    });
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUserId('usr-admin');
    setDepartments(INITIAL_DEPARTMENTS);
    setTeams(INITIAL_TEAMS);
    setCategories(INITIAL_CATEGORIES);
    setServices(INITIAL_SERVICES);
    setAccounts(INITIAL_ACCOUNTS);
    setSubscriptions(INITIAL_SUBSCRIPTIONS);
    setCards(INITIAL_CARDS);
    setCardLogs(INITIAL_CARD_LOGS);
    setVendors(INITIAL_VENDORS);
    setWorkflows(INITIAL_WORKFLOWS);
    setRequisitions(INITIAL_REQUISITIONS);
    setAccessRequests(INITIAL_ACCESS_REQUESTS);
    setPurchases(INITIAL_PURCHASES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setEmergencyAccessCardIds([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        switchUser,
        darkMode,
        toggleDarkMode,
        currentView,
        setCurrentView,
        selectedItemId,
        users,
        departments,
        teams,
        categories,
        services,
        accounts,
        subscriptions,
        cards,
        cardLogs,
        vendors,
        workflows,
        requisitions,
        accessRequests,
        purchases,
        notifications,
        auditLogs,
        canViewCardDetails,
        canViewCardNameOnly,
        getCardMaskedInfo,
        emergencyAccessCard,
        updateCardAuthorizedUsers,
        createCard,
        createRequisition,
        approveStage,
        rejectStage,
        returnForModification,
        resubmitRequisition,
        createAccessRequest,
        approveAccessRequest,
        rejectAccessRequest,
        returnAccessRequest,
        revokeAccessRequest,
        completePurchase,
        addAccount,
        updateAccountStatus,
        recordRenewalPayment,
        calculateRenewalDate,
        createService,
        addCategory,
        createVendor,
        saveWorkflow,
        inviteEmployee,
        resendInvitation,
        simulateActivateAccount,
        createDepartment,
        createTeam,
        markNotificationRead,
        markAllNotificationsRead,
        triggerMonthlyPlanningDispatch,
        resetToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
