import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Package,
  Users,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Building,
  KeyRound,
  History,
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CalendarClock,
  Layers,
  Sparkles,
  Info,
  Check,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CatalogueService,
  ServiceAccount,
  AccountAccessAssignment,
  AccessRequest,
  PredefinedAccessReason,
  AccountAccessHistory,
} from '../../types';
import { NewAccessRequestModal } from '../requisitions/NewAccessRequestModal';

export const ServiceSharingHubView: React.FC = () => {
  const {
    services,
    accounts,
    subscriptions,
    accessAssignments,
    accessRequests,
    predefinedReasons,
    accessHistory,
    users,
    departments,
    teams,
    currentUser,
    createAccessAssignment,
    extendAccessAssignment,
    revokeAccessAssignment,
    approveAndAssignAccess,
    createPredefinedReason,
    updatePredefinedReason,
    archivePredefinedReason,
    setCurrentView,
  } = useApp();

  // Navigation state for 3-tier hierarchy:
  // tier 1 = Master Services Directory
  // tier 2 = Individual Accounts under Service
  // tier 3 = Assigned Users under Individual Account
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Active top-level sub-tabs
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'pending_requests' | 'upcoming_events' | 'reasons_admin'>(
    'hierarchy'
  );

  // Filters state (Tier 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>('all');
  const [selectedAllocationFilter, setSelectedAllocationFilter] = useState<string>('all');

  // Filters state (Upcoming Events)
  const [upcomingTimeframe, setUpcomingTimeframe] = useState<'7' | '15' | '30' | 'expired' | 'all'>('30');
  const [upcomingTypeFilter, setUpcomingTypeFilter] = useState<'all' | 'subscription' | 'access'>('all');

  // Modal states
  const [isAccessRequestModalOpen, setIsAccessRequestModalOpen] = useState(false);
  const [requestModalServiceId, setRequestModalServiceId] = useState<string | undefined>(undefined);

  // 1-Click Approve & Assign Modal state
  const [approvingRequest, setApprovingRequest] = useState<AccessRequest | null>(null);
  const [assignModalAccountId, setAssignModalAccountId] = useState<string>('');
  const [assignModalStartDate, setAssignModalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignModalExpiryDate, setAssignModalExpiryDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [assignModalPermissionLevel, setAssignModalPermissionLevel] = useState<'read' | 'user' | 'admin' | 'full'>('user');
  const [assignModalNotes, setAssignModalNotes] = useState('');
  const [assignActionError, setAssignActionError] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Manual Grant Modal state
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantServiceId, setGrantServiceId] = useState('');
  const [grantAccountId, setGrantAccountId] = useState('');
  const [grantRecipientType, setGrantRecipientType] = useState<'employee' | 'team' | 'department'>('employee');
  const [grantRecipientId, setGrantRecipientId] = useState('');
  const [grantStartDate, setGrantStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [grantExpiryDate, setGrantExpiryDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [grantPermLevel, setGrantPermLevel] = useState<'read' | 'user' | 'admin' | 'full'>('user');
  const [grantNotes, setGrantNotes] = useState('');

  // Extend Access Modal state
  const [extendingAssignment, setExtendingAssignment] = useState<AccountAccessAssignment | null>(null);
  const [extendNewDate, setExtendNewDate] = useState('');
  const [extendReason, setExtendReason] = useState('');

  // Revoke Access Modal state
  const [revokingAssignment, setRevokingAssignment] = useState<AccountAccessAssignment | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // View Access History Modal state
  const [historyTargetAssignmentId, setHistoryTargetAssignmentId] = useState<string | null>(null);

  // Reason Manager Modal state
  const [isCreateReasonModalOpen, setIsCreateReasonModalOpen] = useState(false);
  const [newReasonName, setNewReasonName] = useState('');
  const [newReasonDesc, setNewReasonDesc] = useState('');
  const [newReasonOrder, setNewReasonOrder] = useState<number>(1);
  const [editingReason, setEditingReason] = useState<PredefinedAccessReason | null>(null);

  // Success banner notice
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const isSuperAdmin = currentUser.roles.includes('Super Admin');
  const isSystemAdmin = currentUser.roles.includes('System Admin') || isSuperAdmin;

  // Selected Service object
  const currentService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  // Selected Account object
  const currentAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  // Pending Access Requests count
  const pendingRequests = useMemo(
    () => accessRequests.filter((r) => r.status === 'Pending' || r.status === 'Pending Approval'),
    [accessRequests]
  );

  // TIER 1: Master Services with computed sharing statistics
  const masterServicesSummary = useMemo(() => {
    return services.map((svc) => {
      const svAccounts = accounts.filter((a) => a.serviceId === svc.id);
      const totalAccounts = svAccounts.length;
      const activeAccounts = svAccounts.filter((a) => a.accountStatus === 'Active').length;

      // Available: accounts where capacity is not full
      const availableAccounts = svAccounts.filter((a) => {
        if (a.accountStatus !== 'Active') return false;
        if (!a.seatLimit) return true;
        return (a.allocatedSeats || 0) < a.seatLimit;
      }).length;

      // Partially allocated: accounts where some seats are used but not all
      const partiallyAllocated = svAccounts.filter((a) => {
        if (!a.seatLimit) return (a.allocatedSeats || 0) > 0;
        return (a.allocatedSeats || 0) > 0 && (a.allocatedSeats || 0) < a.seatLimit;
      }).length;

      // Active assignments under this service
      const svAssignments = accessAssignments.filter((a) => a.serviceId === svc.id && a.status === 'Active');
      const activeAssignmentsCount = svAssignments.length;

      // Unique employees assigned
      const assignedEmployeeIds = new Set<string>();
      svAssignments.forEach((asgn) => {
        if (asgn.recipientType === 'employee') {
          assignedEmployeeIds.add(asgn.recipientId);
        }
      });
      svAccounts.forEach((acc) => {
        if (acc.assignedUserId) assignedEmployeeIds.add(acc.assignedUserId);
        (acc.sharedUserIds || []).forEach((uid) => assignedEmployeeIds.add(uid));
      });
      const totalEmployeesAssigned = assignedEmployeeIds.size;

      // Linked Subscription & Renewal info
      const linkedSub = subscriptions.find((s) => s.serviceId === svc.id && s.status === 'Active');
      const nextRenewalDate = linkedSub?.nextRenewalDate || undefined;
      const subscriptionStatus = linkedSub?.status || (activeAccounts > 0 ? 'Active' : 'No Subscription');

      // Allocation Status classification
      let allocationStatus: 'Fully Available' | 'Partially Allocated' | 'Fully Allocated' | 'Inactive' = 'Fully Available';
      if (activeAccounts === 0) {
        allocationStatus = 'Inactive';
      } else if (availableAccounts === 0) {
        allocationStatus = 'Fully Allocated';
      } else if (partiallyAllocated > 0 || (activeAccounts > availableAccounts)) {
        allocationStatus = 'Partially Allocated';
      }

      return {
        ...svc,
        totalAccounts,
        activeAccounts,
        availableAccounts,
        partiallyAllocated,
        totalEmployeesAssigned,
        activeAssignmentsCount,
        nextRenewalDate,
        subscriptionStatus,
        allocationStatus,
      };
    });
  }, [services, accounts, subscriptions, accessAssignments]);

  // Filtered Tier 1 Master Services
  const filteredServices = useMemo(() => {
    return masterServicesSummary.filter((svc) => {
      if (selectedCategory !== 'all' && svc.category !== selectedCategory) return false;
      if (selectedSubStatus !== 'all' && svc.subscriptionStatus !== selectedSubStatus) return false;
      if (selectedAllocationFilter !== 'all' && svc.allocationStatus !== selectedAllocationFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          svc.name.toLowerCase().includes(q) ||
          svc.provider.toLowerCase().includes(q) ||
          svc.category.toLowerCase().includes(q) ||
          svc.subcategory.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [masterServicesSummary, selectedCategory, selectedSubStatus, selectedAllocationFilter, searchQuery]);

  // TIER 2: Accounts under Selected Service
  const accountsUnderService = useMemo(() => {
    if (!selectedServiceId) return [];
    return accounts
      .filter((a) => a.serviceId === selectedServiceId)
      .map((acc) => {
        const accAssignments = accessAssignments.filter((asgn) => asgn.accountId === acc.id);
        const activeAsgns = accAssignments.filter((asgn) => asgn.status === 'Active');

        // Department, Team, Employee allocation counts
        const deptCount = new Set(
          activeAsgns.filter((a) => a.recipientType === 'department').map((a) => a.recipientId)
        ).size;
        const teamCount = new Set(
          activeAsgns.filter((a) => a.recipientType === 'team').map((a) => a.recipientId)
        ).size;
        const employeeCount = new Set([
          ...(acc.assignedUserId ? [acc.assignedUserId] : []),
          ...(acc.sharedUserIds || []),
          ...activeAsgns.filter((a) => a.recipientType === 'employee').map((a) => a.recipientId),
        ]).size;

        // Nearest access expiration date
        let nearestAccessExpiry: string | undefined = undefined;
        let minExpiryTime = Infinity;
        const now = Date.now();
        activeAsgns.forEach((asgn) => {
          if (asgn.expirationDate) {
            const time = new Date(asgn.expirationDate).getTime();
            if (time >= now && time < minExpiryTime) {
              minExpiryTime = time;
              nearestAccessExpiry = asgn.expirationDate;
            }
          }
        });

        // Linked Subscription Renewal
        const linkedSub = subscriptions.find((s) => s.serviceId === acc.serviceId);
        const renewalDate = acc.nextRenewalDate || linkedSub?.nextRenewalDate;

        const allocatedSeats = acc.allocatedSeats || activeAsgns.length || (acc.assignedUserId ? 1 : 0);
        const availableSeats = acc.seatLimit ? Math.max(0, acc.seatLimit - allocatedSeats) : 'Available';

        return {
          ...acc,
          allocatedSeats,
          availableSeats,
          deptCount,
          teamCount,
          employeeCount,
          renewalDate,
          nearestAccessExpiry,
          activeAsgnsCount: activeAsgns.length,
        };
      });
  }, [selectedServiceId, accounts, accessAssignments, subscriptions]);

  // TIER 3: Access Assignments under Selected Account
  const assignmentsUnderAccount = useMemo(() => {
    if (!selectedAccountId) return [];
    return accessAssignments.filter((asgn) => asgn.accountId === selectedAccountId);
  }, [selectedAccountId, accessAssignments]);

  // UPCOMING EVENTS COMPUTATION (Distinguishing Subscriptions vs Access Grants)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const list: Array<{
      id: string;
      type: 'Subscription Renewal' | 'Access Expiration';
      title: string;
      subtitle: string;
      serviceName: string;
      targetDate: string;
      diffDays: number;
      isExpired: boolean;
      statusBadge: string;
      amount?: number;
      recipientName?: string;
      cardMasked?: string;
      assignmentId?: string;
      subscriptionId?: string;
    }> = [];

    // 1. Subscription Renewals
    subscriptions
      .filter((s) => s.status === 'Active' && s.nextRenewalDate)
      .forEach((sub) => {
        const renDate = new Date(sub.nextRenewalDate!);
        const diffDays = Math.ceil((renDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = diffDays < 0;

        list.push({
          id: `sub-evt-${sub.id}`,
          type: 'Subscription Renewal',
          title: `${sub.serviceName} (${sub.billingCycle} Renewal)`,
          subtitle: `Plan: ${sub.planName} · ${sub.billingCycle} Cycle`,
          serviceName: sub.serviceName,
          targetDate: sub.nextRenewalDate!,
          diffDays,
          isExpired,
          statusBadge: isExpired ? 'Renewal Overdue' : diffDays <= 7 ? 'Renewing Soon' : 'Active Subscription',
          amount: sub.expectedRenewalAmount || sub.currentAmount,
          subscriptionId: sub.id,
        });
      });

    // 2. Access Expirations
    accessAssignments
      .filter((asgn) => asgn.status === 'Active' && asgn.expirationDate)
      .forEach((asgn) => {
        const expDate = new Date(asgn.expirationDate);
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpired = diffDays < 0;

        list.push({
          id: `asgn-evt-${asgn.id}`,
          type: 'Access Expiration',
          title: `${asgn.recipientName} - ${asgn.serviceName}`,
          subtitle: `Account: ${asgn.accountEmail} · Level: ${asgn.permissionLevel}`,
          serviceName: asgn.serviceName,
          targetDate: asgn.expirationDate,
          diffDays,
          isExpired,
          statusBadge: isExpired ? 'Access Expired' : diffDays <= 7 ? 'Expiring Imminently' : 'Granted Active',
          recipientName: asgn.recipientName,
          assignmentId: asgn.id,
        });
      });

    // Filter by timeframe
    return list
      .filter((item) => {
        if (upcomingTypeFilter === 'subscription' && item.type !== 'Subscription Renewal') return false;
        if (upcomingTypeFilter === 'access' && item.type !== 'Access Expiration') return false;

        if (upcomingTimeframe === 'expired') return item.isExpired;
        if (upcomingTimeframe === '7') return !item.isExpired && item.diffDays <= 7;
        if (upcomingTimeframe === '15') return !item.isExpired && item.diffDays <= 15;
        if (upcomingTimeframe === '30') return !item.isExpired && item.diffDays <= 30;
        return true;
      })
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [subscriptions, accessAssignments, upcomingTimeframe, upcomingTypeFilter]);

  // Handle 1-Click Approve and Assign Access Submission
  const handleApproveAndAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRequest) return;
    if (!assignModalAccountId) {
      setAssignActionError('Please select an individual account to assign.');
      return;
    }

    setIsSubmittingApproval(true);
    setAssignActionError('');

    try {
      const result = await approveAndAssignAccess(approvingRequest.id, {
        accountId: assignModalAccountId,
        startDate: assignModalStartDate,
        expirationDate: assignModalExpiryDate,
        permissionLevel: assignModalPermissionLevel,
        notes: assignModalNotes.trim() || undefined,
      });

      if (!result.success) {
        setAssignActionError(result.message);
        setIsSubmittingApproval(false);
        return;
      }

      setApprovingRequest(null);
      setStatusNotice(
        `Access approved and assigned to ${approvingRequest.requesterName} successfully. Notification dispatched without credential disclosure.`
      );
      setTimeout(() => setStatusNotice(null), 5000);
    } catch (err: any) {
      setAssignActionError(err.message || 'Failed to approve and assign access.');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Handle Manual Grant Submission
  const handleManualGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantServiceId || !grantAccountId || !grantRecipientId) return;

    createAccessAssignment({
      serviceId: grantServiceId,
      accountId: grantAccountId,
      recipientType: grantRecipientType,
      recipientId: grantRecipientId,
      startDate: grantStartDate,
      expirationDate: grantExpiryDate,
      permissionLevel: grantPermLevel,
      provisioningStatus: 'Provisioned',
      notes: grantNotes.trim() || undefined,
    });

    setIsGrantModalOpen(false);
    setStatusNotice('Access assignment created successfully. Recipient notified with zero credential disclosure.');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Handle Extend Access Submission
  const handleExtendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingAssignment || !extendNewDate) return;

    extendAccessAssignment(
      extendingAssignment.id,
      extendNewDate,
      extendReason.trim() || 'Extension requested by manager'
    );

    setExtendingAssignment(null);
    setExtendNewDate('');
    setExtendReason('');
    setStatusNotice(`Access validity extended until ${extendNewDate}.`);
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Handle Revoke Access Submission
  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingAssignment || !revokeReason.trim()) return;

    revokeAccessAssignment(revokingAssignment.id, revokeReason.trim());

    setRevokingAssignment(null);
    setRevokeReason('');
    setStatusNotice('Access revoked successfully. Historical record preserved.');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Handle Save / Add Predefined Reason
  const handleSaveReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReasonName.trim()) return;

    if (editingReason) {
      await updatePredefinedReason(editingReason.id, {
        name: newReasonName.trim(),
        description: newReasonDesc.trim() || undefined,
        displayOrder: Number(newReasonOrder) || 1,
      });
      setStatusNotice(`Predefined reason "${newReasonName}" updated.`);
    } else {
      await createPredefinedReason({
        name: newReasonName.trim(),
        description: newReasonDesc.trim() || undefined,
        displayOrder: Number(newReasonOrder) || predefinedReasons.length + 1,
        isEnabled: true,
      });
      setStatusNotice(`Predefined reason "${newReasonName}" created.`);
    }

    setIsCreateReasonModalOpen(false);
    setEditingReason(null);
    setNewReasonName('');
    setNewReasonDesc('');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Official Riseup Labs Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#EA5400]/10 text-[#EA5400] dark:bg-[#EA5400]/20">
              <ShieldCheck className="w-5 h-5 text-[#EA5400]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Services & Tools Sharing Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized governance for master services, sub-account capacity, 1-click approvals, zero-credential access grants, and renewal tracking.
          </p>
        </div>

        {/* Global Hub Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setRequestModalServiceId(undefined);
              setIsAccessRequestModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-[#EA5400] bg-[#FFF1EB] hover:bg-[#FFE4D6] dark:bg-[#EA5400]/15 dark:hover:bg-[#EA5400]/25 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 border border-[#EA5400]/30 shadow-2xs"
          >
            <KeyRound className="w-4 h-4 text-[#EA5400]" />
            <span>Request Tool Access</span>
          </button>

          {isSystemAdmin && (
            <button
              type="button"
              onClick={() => {
                setGrantServiceId(services[0]?.id || '');
                setGrantAccountId(accounts[0]?.id || '');
                setGrantRecipientId(users[0]?.id || '');
                setIsGrantModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Access</span>
            </button>
          )}
        </div>
      </div>

      {/* Status notification banner */}
      {statusNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setActiveTab('hierarchy');
            setActiveTier(1);
          }}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'hierarchy'
              ? 'border-[#EA5400] text-[#EA5400] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Services &amp; Accounts Directory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending_requests')}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'pending_requests'
              ? 'border-[#EA5400] text-[#EA5400] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Pending Access Requests</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#EA5400] text-white">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upcoming_events')}
          className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'upcoming_events'
              ? 'border-[#EA5400] text-[#EA5400] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>Upcoming Events &amp; Renewals</span>
          {upcomingEvents.filter((e) => e.diffDays <= 7).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {upcomingEvents.filter((e) => e.diffDays <= 7).length}
            </span>
          )}
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('reasons_admin')}
            className={`pb-3 px-3.5 flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'reasons_admin'
                ? 'border-[#EA5400] text-[#EA5400] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Predefined Reasons Management</span>
          </button>
        )}
      </div>

      {/* TAB 1: 3-TIER HIERARCHY */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-5">
          {/* Breadcrumb Navigation Bar */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1A1718] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <button
              onClick={() => {
                setActiveTier(1);
                setSelectedServiceId(null);
                setSelectedAccountId(null);
              }}
              className={`hover:text-[#EA5400] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTier === 1 ? 'text-[#EA5400] font-bold' : ''
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Tier 1: Master Services Overview</span>
            </button>

            {activeTier >= 2 && currentService && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => {
                    setActiveTier(2);
                    setSelectedAccountId(null);
                  }}
                  className={`hover:text-[#EA5400] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTier === 2 ? 'text-[#EA5400] font-bold' : ''
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{currentService.name} (Accounts)</span>
                </button>
              </>
            )}

            {activeTier === 3 && currentAccount && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#EA5400]" />
                  <span>{currentAccount.accountEmail} (Assigned Users)</span>
                </span>
              </>
            )}
          </div>

          {/* ========================================================= */}
          {/* TIER 1: MASTER SERVICES OVERVIEW                          */}
          {/* ========================================================= */}
          {activeTier === 1 && (
            <div className="space-y-4">
              {/* Search and Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white dark:bg-[#1A1718] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search services, provider, tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#211E1F] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#211E1F] text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  >
                    <option value="all">All Categories</option>
                    {Array.from(new Set(services.map((s) => s.category))).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subscription Status Filter */}
                <div>
                  <select
                    value={selectedSubStatus}
                    onChange={(e) => setSelectedSubStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#211E1F] text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  >
                    <option value="all">All Subscription Statuses</option>
                    <option value="Active">Active Subscription</option>
                    <option value="No Subscription">No Subscription Record</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>

                {/* Allocation Status Filter */}
                <div>
                  <select
                    value={selectedAllocationFilter}
                    onChange={(e) => setSelectedAllocationFilter(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#211E1F] text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  >
                    <option value="all">All Allocation Statuses</option>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Allocated">Partially Allocated</option>
                    <option value="Fully Allocated">Fully Allocated</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Master Services Table */}
              <div className="bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#EA5400]" />
                    <span>Company-Licensed Master Services &amp; Tools ({filteredServices.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Click "View Accounts" to inspect individual accounts &amp; capacity
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#211E1F] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4 font-semibold">Service Name</th>
                        <th className="py-3 px-3 font-semibold">Category</th>
                        <th className="py-3 px-3 font-semibold text-center">Total Accounts</th>
                        <th className="py-3 px-3 font-semibold text-center">Active</th>
                        <th className="py-3 px-3 font-semibold text-center">Available</th>
                        <th className="py-3 px-3 font-semibold text-center">Assigned Users</th>
                        <th className="py-3 px-3 font-semibold">Next Renewal</th>
                        <th className="py-3 px-3 font-semibold">Allocation Status</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredServices.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                            No services match your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredServices.map((svc) => (
                          <tr
                            key={svc.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-[#2A2627]/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{svc.name}</span>
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {svc.type}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Provider: {svc.provider}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">
                                {svc.category}
                              </span>
                              <div className="text-[10px] text-slate-400">{svc.subcategory}</div>
                            </td>

                            <td className="py-3 px-3 text-center font-mono font-semibold text-slate-900 dark:text-white">
                              {svc.totalAccounts}
                            </td>

                            <td className="py-3 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                              {svc.activeAccounts}
                            </td>

                            <td className="py-3 px-3 text-center font-mono">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  svc.availableAccounts > 0
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                }`}
                              >
                                {svc.availableAccounts}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>{svc.totalEmployeesAssigned}</span>
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              {svc.nextRenewalDate ? (
                                <div className="text-[11px]">
                                  <div className="font-mono text-slate-800 dark:text-slate-200">
                                    {svc.nextRenewalDate}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {svc.subscriptionStatus}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No Renewal Set</span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                  svc.allocationStatus === 'Fully Available'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : svc.allocationStatus === 'Partially Allocated'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : svc.allocationStatus === 'Fully Allocated'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    svc.allocationStatus === 'Fully Available'
                                      ? 'bg-emerald-500'
                                      : svc.allocationStatus === 'Partially Allocated'
                                      ? 'bg-amber-500'
                                      : svc.allocationStatus === 'Fully Allocated'
                                      ? 'bg-rose-500'
                                      : 'bg-slate-400'
                                  }`}
                                />
                                {svc.allocationStatus}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedServiceId(svc.id);
                                    setActiveTier(2);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-[#EA5400] bg-[#FFF1EB] hover:bg-[#FFE4D6] dark:bg-[#EA5400]/20 dark:hover:bg-[#EA5400]/30 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>View Accounts</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setRequestModalServiceId(svc.id);
                                    setIsAccessRequestModalOpen(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
                                  title="Request Access to this Tool"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TIER 2: INDIVIDUAL ACCOUNTS UNDER SELECTED SERVICE        */}
          {/* ========================================================= */}
          {activeTier === 2 && currentService && (
            <div className="space-y-4">
              {/* Back CTA & Service Summary Card */}
              <div className="p-4 bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTier(1)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Back to Master Services"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {currentService.name} &bull; Accounts &amp; Seat Capacity Directory
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-6">
                    Category: {currentService.category} &bull; Provider: {currentService.provider} &bull; Total Registered Accounts: {accountsUnderService.length}
                  </p>
                </div>

                <div className="flex items-center gap-2 pl-6 md:pl-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRequestModalServiceId(currentService.id);
                      setIsAccessRequestModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-[#EA5400] bg-[#FFF1EB] hover:bg-[#FFE4D6] dark:bg-[#EA5400]/20 rounded-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Request Access</span>
                  </button>

                  {isSystemAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setGrantServiceId(currentService.id);
                        setGrantAccountId(accountsUnderService[0]?.id || '');
                        setIsGrantModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign Seat</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Accounts Table */}
              <div className="bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Registered Sub-Accounts &amp; Seat Allocation Models</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Click "View Assigned Users" to manage assigned employees &amp; permissions
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#211E1F] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4 font-semibold">Account Identifier</th>
                        <th className="py-3 px-3 font-semibold">Plan / Tier</th>
                        <th className="py-3 px-3 font-semibold">Status</th>
                        <th className="py-3 px-3 font-semibold">Allocation Model</th>
                        <th className="py-3 px-3 font-semibold text-center">Seat Capacity</th>
                        <th className="py-3 px-3 font-semibold text-center">Allocated</th>
                        <th className="py-3 px-3 font-semibold text-center">Available</th>
                        <th className="py-3 px-3 font-semibold text-center">Assigned Users</th>
                        <th className="py-3 px-3 font-semibold">Upcoming Events</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {accountsUnderService.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                            No individual accounts registered under this service.
                          </td>
                        </tr>
                      ) : (
                        accountsUnderService.map((acc) => (
                          <tr
                            key={acc.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-[#2A2627]/50 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                              {acc.accountEmail}
                            </td>

                            <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                              {acc.planTier || acc.planName}
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  acc.accountStatus === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : acc.accountStatus === 'Suspended'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {acc.accountStatus}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 capitalize">
                                {(acc.allocationModel || 'seat_based').replace('_', ' ')}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-mono">
                              {acc.seatLimit ? acc.seatLimit : 'Unlimited'}
                            </td>

                            <td className="py-3 px-3 text-center font-mono font-semibold text-amber-600 dark:text-amber-400">
                              {acc.allocatedSeats}
                            </td>

                            <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                              {acc.availableSeats}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                                {acc.employeeCount} Users
                              </span>
                            </td>

                            <td className="py-3 px-3 text-[11px]">
                              {acc.renewalDate ? (
                                <div className="text-slate-600 dark:text-slate-400">
                                  Renewal: <span className="font-mono">{acc.renewalDate}</span>
                                </div>
                              ) : null}
                              {acc.nearestAccessExpiry ? (
                                <div className="text-amber-600 dark:text-amber-400">
                                  Access exp: <span className="font-mono">{acc.nearestAccessExpiry}</span>
                                </div>
                              ) : null}
                              {!acc.renewalDate && !acc.nearestAccessExpiry && (
                                <span className="text-slate-400 italic">No upcoming events</span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAccountId(acc.id);
                                    setActiveTier(3);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold text-[#EA5400] bg-[#FFF1EB] hover:bg-[#FFE4D6] dark:bg-[#EA5400]/20 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>View Users</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TIER 3: ACCOUNT DETAILS AND ASSIGNED ACCESS TABLE         */}
          {/* ========================================================= */}
          {activeTier === 3 && currentAccount && currentService && (
            <div className="space-y-4">
              {/* Account Summary Header Card */}
              <div className="p-4 bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTier(2)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                      title="Back to Accounts List"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{currentAccount.accountEmail}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                          {currentAccount.accountStatus}
                        </span>
                      </h2>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {currentService.name} &bull; Plan: {currentAccount.planTier || currentAccount.planName} &bull; Model: {currentAccount.allocationModel || 'seat_based'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSystemAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setGrantServiceId(currentService.id);
                          setGrantAccountId(currentAccount.id);
                          setIsGrantModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Grant User Access</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Capacity Meter */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Total Capacity</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {currentAccount.seatLimit ? `${currentAccount.seatLimit} Seats` : 'Configurable / Pool'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Allocated Seats</span>
                    <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {currentAccount.allocatedSeats || assignmentsUnderAccount.filter((a) => a.status === 'Active').length} Seats
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Available Seats</span>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {currentAccount.seatLimit
                        ? `${Math.max(0, currentAccount.seatLimit - (currentAccount.allocatedSeats || 0))} Remaining`
                        : 'Available'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Next Renewal</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {currentAccount.nextRenewalDate || 'Active Subscription'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Access Table */}
              <div className="bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#EA5400]" />
                    <span>Assigned Access Grants ({assignmentsUnderAccount.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Zero Credential Sharing: Access provisioned without credential disclosure
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-[#211E1F] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4 font-semibold">Recipient</th>
                        <th className="py-3 px-3 font-semibold">Type</th>
                        <th className="py-3 px-3 font-semibold">Dept / Team</th>
                        <th className="py-3 px-3 font-semibold">Permission Level</th>
                        <th className="py-3 px-3 font-semibold">Start Date</th>
                        <th className="py-3 px-3 font-semibold">Expiration Date</th>
                        <th className="py-3 px-3 font-semibold">Status</th>
                        <th className="py-3 px-3 font-semibold">Upcoming Event</th>
                        <th className="py-3 px-3 font-semibold">Granted By</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {assignmentsUnderAccount.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                            No employees or teams currently assigned to this account.
                          </td>
                        </tr>
                      ) : (
                        assignmentsUnderAccount.map((asgn) => {
                          const now = new Date();
                          const expDate = asgn.expirationDate ? new Date(asgn.expirationDate) : null;
                          const diffDays = expDate ? Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

                          return (
                            <tr
                              key={asgn.id}
                              className="hover:bg-slate-50/80 dark:hover:bg-[#2A2627]/50 transition-colors"
                            >
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {asgn.recipientName}
                                </div>
                                <div className="text-[11px] text-slate-400">{asgn.recipientEmail}</div>
                              </td>

                              <td className="py-3 px-3">
                                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 capitalize">
                                  {asgn.recipientType}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                                {asgn.departmentName || 'General'}
                                {asgn.teamName ? ` · ${asgn.teamName}` : ''}
                              </td>

                              <td className="py-3 px-3">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                                  {asgn.permissionLevel}
                                </span>
                              </td>

                              <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {asgn.startDate}
                              </td>

                              <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {asgn.expirationDate || 'Permanent'}
                              </td>

                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    asgn.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                      : asgn.status === 'Revoked'
                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {asgn.status}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-[11px]">
                                {diffDays !== null ? (
                                  diffDays < 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400 font-medium">
                                      Expired {Math.abs(diffDays)}d ago
                                    </span>
                                  ) : diffDays <= 7 ? (
                                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                      Expires in {diffDays} days
                                    </span>
                                  ) : (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {diffDays} days left
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-400">Permanent</span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                                {asgn.grantedByName}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {asgn.status === 'Active' && isSystemAdmin && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setExtendingAssignment(asgn);
                                          setExtendNewDate(
                                            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                                              .toISOString()
                                              .split('T')[0]
                                          );
                                        }}
                                        className="p-1 text-slate-400 hover:text-amber-600 rounded-md cursor-pointer"
                                        title="Extend Access Validity"
                                      >
                                        <CalendarClock className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRevokingAssignment(asgn);
                                          setRevokeReason('');
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                                        title="Revoke Access"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setHistoryTargetAssignmentId(asgn.id)}
                                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
                                    title="View Access History"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING ACCESS REQUESTS WITH 1-CLICK APPROVE & ASSIGN */}
      {activeTab === 'pending_requests' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#EA5400]" />
              <span>Pending Employee Access Sharing Requests ({pendingRequests.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review employee service/tool access justifications and execute 1-click account assignment without multiple screens.
            </p>
          </div>

          <div className="bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#211E1F] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 font-semibold">Request ID</th>
                    <th className="py-3 px-3 font-semibold">Employee</th>
                    <th className="py-3 px-3 font-semibold">Department &amp; Team</th>
                    <th className="py-3 px-3 font-semibold">Target Service</th>
                    <th className="py-3 px-3 font-semibold">Access Type</th>
                    <th className="py-3 px-3 font-semibold">Business Reason</th>
                    <th className="py-3 px-3 font-semibold">Duration</th>
                    <th className="py-3 px-3 font-semibold">Request Date</th>
                    <th className="py-3 px-4 font-semibold text-right">1-Click Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pendingRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        No pending access requests in the queue.
                      </td>
                    </tr>
                  ) : (
                    pendingRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-[#2A2627]/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#EA5400]">
                          {req.requestNumber}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {req.requesterName}
                          </div>
                          <div className="text-[11px] text-slate-400">{req.requesterEmail}</div>
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                          {req.departmentName} &bull; {req.teamName || 'General'}
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {req.serviceName}
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {req.requestedAccessType || 'Standard Seat'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[11px]">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {req.reason}
                          </span>
                          {req.additionalExplanation && (
                            <span className="text-[10px] text-slate-400 line-clamp-1">
                              {req.additionalExplanation}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                          {req.duration || 'Permanent'}
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setApprovingRequest(req);
                              const targetSvcAccounts = accounts.filter(
                                (a) => a.serviceId === req.serviceId && a.accountStatus === 'Active'
                              );
                              setAssignModalAccountId(
                                req.preferredAccountId || targetSvcAccounts[0]?.id || ''
                              );
                              setAssignModalStartDate(new Date().toISOString().split('T')[0]);
                              setAssignModalExpiryDate(
                                new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                              );
                              setAssignModalPermissionLevel('user');
                              setAssignModalNotes('');
                              setAssignActionError('');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Approve &amp; Assign</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: UPCOMING EVENTS & RENEWALS (Subscription vs Access Expiration) */}
      {activeTab === 'upcoming_events' && (
        <div className="space-y-4">
          {/* Header & Filter Controls */}
          <div className="p-4 bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#EA5400]" />
                <span>Upcoming Events &amp; Renewals Monitor</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clear distinction between financial subscription renewals (payment card charge) and employee access expirations (seat validity).
              </p>
            </div>

            {/* Timeframe & Type filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                {(['all', 'subscription', 'access'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setUpcomingTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer capitalize ${
                      upcomingTypeFilter === type
                        ? 'bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {type === 'all' ? 'All Types' : type}
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-mono">
                {(['7', '15', '30', 'expired', 'all'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setUpcomingTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      upcomingTimeframe === tf
                        ? 'bg-[#EA5400] text-white font-semibold shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tf === 'expired' ? 'Expired' : tf === 'all' ? 'All' : `${tf}d`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No upcoming renewals or expirations in the selected timeframe.
                </div>
              ) : (
                upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#2A2627]/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          evt.type === 'Subscription Renewal'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300'
                        }`}
                      >
                        {evt.type === 'Subscription Renewal' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <KeyRound className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {evt.title}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                              evt.type === 'Subscription Renewal'
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                            }`}
                          >
                            {evt.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {evt.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          {evt.targetDate}
                        </div>
                        <div
                          className={`text-[11px] font-semibold ${
                            evt.isExpired
                              ? 'text-rose-600 dark:text-rose-400'
                              : evt.diffDays <= 7
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {evt.isExpired ? `Overdue by ${Math.abs(evt.diffDays)}d` : `In ${evt.diffDays} days`}
                        </div>
                      </div>

                      {evt.type === 'Subscription Renewal' ? (
                        <button
                          type="button"
                          onClick={() => setCurrentView('subscriptions')}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <span>Manage Sub</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const asgn = accessAssignments.find((a) => a.id === evt.assignmentId);
                            if (asgn) {
                              setExtendingAssignment(asgn);
                              setExtendNewDate(
                                new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                              );
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <span>Extend</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREDEFINED ACCESS REASONS MANAGEMENT (Super Admin) */}
      {activeTab === 'reasons_admin' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#EA5400]" />
                <span>Predefined Access Reasons Configuration</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Super Admin control for business reasons available to employees when submitting service access requests.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingReason(null);
                setNewReasonName('');
                setNewReasonDesc('');
                setNewReasonOrder(predefinedReasons.length + 1);
                setIsCreateReasonModalOpen(true);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Reason</span>
            </button>
          </div>

          <div className="bg-white dark:bg-[#1A1718] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#211E1F] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 font-semibold w-16 text-center">Order</th>
                    <th className="py-3 px-3 font-semibold">Reason Name</th>
                    <th className="py-3 px-3 font-semibold">Description</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {predefinedReasons
                    .slice()
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((rsn) => (
                      <tr key={rsn.id} className="hover:bg-slate-50/60 dark:hover:bg-[#2A2627]/40">
                        <td className="py-3 px-4 font-mono text-center font-bold text-slate-500">
                          {rsn.displayOrder}
                        </td>

                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {rsn.name}
                        </td>

                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {rsn.description || <span className="text-slate-400 italic">None</span>}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              rsn.isEnabled
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {rsn.isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingReason(rsn);
                                setNewReasonName(rsn.name);
                                setNewReasonDesc(rsn.description || '');
                                setNewReasonOrder(rsn.displayOrder);
                                setIsCreateReasonModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md cursor-pointer"
                              title="Edit Reason"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updatePredefinedReason(rsn.id, { isEnabled: !rsn.isEnabled });
                              }}
                              className={`p-1 rounded-md cursor-pointer ${
                                rsn.isEnabled
                                  ? 'text-slate-400 hover:text-amber-600'
                                  : 'text-emerald-600 hover:text-emerald-700'
                              }`}
                              title={rsn.isEnabled ? 'Disable Reason' : 'Enable Reason'}
                            >
                              {rsn.isEnabled ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => archivePredefinedReason(rsn.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                              title="Archive Reason"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: 1-CLICK APPROVE & ASSIGN ACCESS                     */}
      {/* ========================================================= */}
      {approvingRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
          onClick={() => setApprovingRequest(null)}
        >
          <div
            className="w-full max-w-xl my-8 bg-white dark:bg-[#1A1718] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#211E1F]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#EA5400]/15 text-[#EA5400]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Approve &amp; Assign Access
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {approvingRequest.requestNumber} &bull; Streamlined 1-Click Assignment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovingRequest(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveAndAssignSubmit} className="p-6 space-y-4 text-xs">
              {assignActionError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{assignActionError}</span>
                </div>
              )}

              {/* Request Summary Card */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Requester</span>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {approvingRequest.requesterName}
                    </div>
                    <div className="text-[11px] text-slate-400">{approvingRequest.requesterEmail}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Org Placement</span>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {approvingRequest.departmentName} &bull; {approvingRequest.teamName || 'General'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Requested Tool</span>
                    <div className="font-bold text-[#EA5400]">{approvingRequest.serviceName}</div>
                    <div className="text-[10px] text-slate-400">{approvingRequest.requestedAccessType}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Predefined Reason</span>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {approvingRequest.reason}
                    </div>
                    {approvingRequest.additionalExplanation && (
                      <div className="text-[10px] text-slate-400 italic mt-0.5">
                        "{approvingRequest.additionalExplanation}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Target Account Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Available Account under {approvingRequest.serviceName} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignModalAccountId}
                  onChange={(e) => setAssignModalAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  required
                >
                  <option value="">-- Choose Account to Assign --</option>
                  {accounts
                    .filter((a) => a.serviceId === approvingRequest.serviceId && a.accountStatus === 'Active')
                    .map((acc) => {
                      const allocated = acc.allocatedSeats || 0;
                      const cap = acc.seatLimit ? `${allocated}/${acc.seatLimit} seats` : 'unlimited';
                      return (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountEmail} ({acc.planTier || acc.planName}) &bull; Capacity: {cap}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Start Date & Expiration Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Access Start Date
                  </label>
                  <input
                    type="date"
                    value={assignModalStartDate}
                    onChange={(e) => setAssignModalStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={assignModalExpiryDate}
                    onChange={(e) => setAssignModalExpiryDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Permission Level */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Access Permission Level
                </label>
                <select
                  value={assignModalPermissionLevel}
                  onChange={(e) =>
                    setAssignModalPermissionLevel(e.target.value as 'read' | 'user' | 'admin' | 'full')
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                >
                  <option value="user">Standard User / Seat</option>
                  <option value="read">Viewer / Read-Only</option>
                  <option value="admin">Admin / Team Lead</option>
                  <option value="full">Full Account Control</option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fulfillment Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={assignModalNotes}
                  onChange={(e) => setAssignModalNotes(e.target.value)}
                  placeholder="Notes logged in audit history..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setApprovingRequest(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApproval}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingApproval ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Approve &amp; Assign Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EXTEND ACCESS VALIDITY                             */}
      {/* ========================================================= */}
      {extendingAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setExtendingAssignment(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1A1718] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Extend Access Validity
              </h3>
              <button
                onClick={() => setExtendingAssignment(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExtendSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-[#211E1F] rounded-lg">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {extendingAssignment.recipientName}
                </div>
                <div className="text-[11px] text-slate-400">
                  {extendingAssignment.serviceName} &bull; {extendingAssignment.accountEmail}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Current Expiry: <span className="font-mono">{extendingAssignment.expirationDate}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">New Expiration Date</label>
                <input
                  type="date"
                  value={extendNewDate}
                  onChange={(e) => setExtendNewDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Extension Justification / Reason</label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={(e) => setExtendReason(e.target.value)}
                  placeholder="e.g. Project deliverable extended into next quarter..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingAssignment(null)}
                  className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#EA5400] hover:bg-[#D64D00] font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REVOKE ACCESS ASSIGNMENT                           */}
      {/* ========================================================= */}
      {revokingAssignment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setRevokingAssignment(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1A1718] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Revoke Access Grant</span>
              </h3>
              <button
                onClick={() => setRevokingAssignment(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRevokeSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg">
                <p className="text-slate-700 dark:text-slate-300">
                  Are you sure you want to revoke access for{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {revokingAssignment.recipientName}
                  </strong>{' '}
                  to <strong>{revokingAssignment.serviceName}</strong>?
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  The seat will be returned to the available pool. Full historical audit records will be retained.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Reason for Revocation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="e.g. Employee offboarded or project milestone completed..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingAssignment(null)}
                  className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-rose-600 hover:bg-rose-700 font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Revocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW ACCESS HISTORY                                */}
      {/* ========================================================= */}
      {historyTargetAssignmentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setHistoryTargetAssignmentId(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#1A1718] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#EA5400]" />
                <span>Assignment Lifecycle &amp; Audit History</span>
              </h3>
              <button
                onClick={() => setHistoryTargetAssignmentId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {accessHistory.filter((h) => h.assignmentId === historyTargetAssignmentId).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No historical mutation entries recorded for this assignment yet.
                </div>
              ) : (
                accessHistory
                  .filter((h) => h.assignmentId === historyTargetAssignmentId)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white uppercase font-mono text-[11px]">
                          {item.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300">
                        {item.reasonOrNotes || 'Action processed via administrative hub.'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Performed by: <strong className="text-slate-600 dark:text-slate-200">{item.actorName}</strong>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setHistoryTargetAssignmentId(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PREDEFINED REASON                       */}
      {/* ========================================================= */}
      {isCreateReasonModalOpen && isSuperAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsCreateReasonModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#1A1718] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingReason ? 'Edit Predefined Access Reason' : 'Add Predefined Access Reason'}
              </h3>
              <button
                onClick={() => setIsCreateReasonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReason} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Reason Name</label>
                <input
                  type="text"
                  value={newReasonName}
                  onChange={(e) => setNewReasonName(e.target.value)}
                  placeholder="e.g. Design Work, Project Requirement..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newReasonDesc}
                  onChange={(e) => setNewReasonDesc(e.target.value)}
                  placeholder="Short description or usage context..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Display Order</label>
                <input
                  type="number"
                  value={newReasonOrder}
                  onChange={(e) => setNewReasonOrder(Number(e.target.value))}
                  min={1}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateReasonModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#EA5400] hover:bg-[#D64D00] font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {editingReason ? 'Save Changes' : 'Create Reason'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MANUAL GRANT ACCESS ASSIGNMENT                     */}
      {/* ========================================================= */}
      {isGrantModalOpen && isSystemAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsGrantModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#1A1718] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#EA5400]" />
                <span>Assign Access (Zero Credentials)</span>
              </h3>
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualGrantSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Master Service</label>
                <select
                  value={grantServiceId}
                  onChange={(e) => {
                    setGrantServiceId(e.target.value);
                    const filtered = accounts.filter((a) => a.serviceId === e.target.value);
                    setGrantAccountId(filtered[0]?.id || '');
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                  required
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Target Sub-Account / Seat</label>
                <select
                  value={grantAccountId}
                  onChange={(e) => setGrantAccountId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                  required
                >
                  {accounts
                    .filter((a) => a.serviceId === grantServiceId && a.accountStatus === 'Active')
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountEmail} ({acc.planTier || acc.planName}) &bull; Capacity:{' '}
                        {acc.seatLimit ? `${acc.allocatedSeats || 0}/${acc.seatLimit}` : 'open'}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Recipient Type</label>
                  <select
                    value={grantRecipientType}
                    onChange={(e) =>
                      setGrantRecipientType(e.target.value as 'employee' | 'team' | 'department')
                    }
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                  >
                    <option value="employee">Individual Employee</option>
                    <option value="team">Team Allocation</option>
                    <option value="department">Department Allocation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Recipient</label>
                  {grantRecipientType === 'employee' ? (
                    <select
                      value={grantRecipientId}
                      onChange={(e) => setGrantRecipientId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                      required
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.departmentName})
                        </option>
                      ))}
                    </select>
                  ) : grantRecipientType === 'team' ? (
                    <select
                      value={grantRecipientId}
                      onChange={(e) => setGrantRecipientId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                      required
                    >
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.departmentName})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={grantRecipientId}
                      onChange={(e) => setGrantRecipientId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                      required
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={grantStartDate}
                    onChange={(e) => setGrantStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={grantExpiryDate}
                    onChange={(e) => setGrantExpiryDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Permission Level</label>
                <select
                  value={grantPermLevel}
                  onChange={(e) =>
                    setGrantPermLevel(e.target.value as 'read' | 'user' | 'admin' | 'full')
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white"
                >
                  <option value="user">Standard User</option>
                  <option value="read">Viewer / Read-Only</option>
                  <option value="admin">Admin / Team Lead</option>
                  <option value="full">Full Account Control</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#EA5400] hover:bg-[#D64D00] font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Access Request Modal for Employee */}
      {isAccessRequestModalOpen && (
        <NewAccessRequestModal
          isOpen={isAccessRequestModalOpen}
          onClose={() => setIsAccessRequestModalOpen(false)}
          initialServiceId={requestModalServiceId}
        />
      )}
    </div>
  );
};
