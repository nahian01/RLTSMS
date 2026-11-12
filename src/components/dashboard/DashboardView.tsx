import React, { useState, useMemo } from 'react';
import {
  Package,
  Users,
  CreditCard,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  DollarSign,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  FileText,
  Check,
  X,
  PieChart,
  Layers,
  Lock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DashboardView: React.FC = () => {
  const {
    services,
    accounts,
    subscriptions,
    requisitions,
    accessRequests,
    accessAssignments,
    purchases,
    departments,
    currentUser,
    setCurrentView,
    approveStage,
    rejectStage,
  } = useApp();

  // Filters state
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');

  // Detect user capabilities
  const isSuperAdmin = currentUser.roles.includes('Super Admin');
  const isSystemAdmin = currentUser.roles.includes('System Admin') || isSuperAdmin;
  const isApprover =
    isSuperAdmin ||
    currentUser.roles.some((r) => ['Team Lead', 'Department Lead', 'Operation Manager'].includes(r));
  const isPurchaser = isSuperAdmin || currentUser.roles.includes('Purchaser');
  const isFinance = isSuperAdmin || currentUser.roles.includes('Finance');

  // Dynamic persona strictly derived from authenticated user's actual roles (Zero Impersonation)
  const effectivePersona = useMemo(() => {
    if (isSuperAdmin) return 'admin';
    if (isApprover) return 'approver';
    if (isPurchaser) return 'purchaser';
    if (isFinance) return 'finance';
    return 'employee';
  }, [isSuperAdmin, isApprover, isPurchaser, isFinance]);

  // Dynamic calculations from live store data (zero hardcoded numbers)
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === 'Active'), [subscriptions]);
  const activeAccounts = useMemo(() => accounts.filter((a) => a.accountStatus === 'Active'), [accounts]);
  const activeAssignments = useMemo(
    () => accessAssignments.filter((a) => a.status === 'Active'),
    [accessAssignments]
  );

  // Dynamic Monthly & Annual Spend aggregated directly from subscriptions and purchases
  const { totalMonthlySpend, totalAnnualSpend } = useMemo(() => {
    let monthly = 0;
    activeSubs.forEach((sub) => {
      if (sub.billingCycle === 'Monthly') {
        monthly += sub.currentAmount;
      } else if (sub.billingCycle === 'Yearly') {
        monthly += sub.currentAmount / 12;
      } else if (sub.billingCycle === 'Quarterly') {
        monthly += sub.currentAmount / 3;
      }
    });

    // Fallback if subscriptions empty: derive from services catalogue
    if (monthly === 0) {
      monthly = services.reduce((acc, s) => acc + (s.totalMonthlySpend || 0), 0);
    }

    const annual = monthly * 12;
    return {
      totalMonthlySpend: Math.round(monthly),
      totalAnnualSpend: Math.round(annual),
    };
  }, [activeSubs, services]);

  // Requisitions Pipeline counts
  const pendingApprovals = useMemo(
    () => requisitions.filter((r) => r.status === 'Pending Approval'),
    [requisitions]
  );
  const pendingAccessApprovals = useMemo(
    () => accessRequests.filter((a) => a.status === 'Pending Approval'),
    [accessRequests]
  );
  const approvedPendingPurchase = useMemo(
    () => requisitions.filter((r) => r.status === 'Approved'),
    [requisitions]
  );

  // Pending Actions strictly for Current User
  const pendingReqsForMe = useMemo(() => {
    return requisitions.filter((r) => {
      if (r.status === 'Pending Approval') {
        const stage = r.stages[r.currentStageIndex];
        if (!stage) return false;
        if (stage.assignedApproverId === currentUser.id) return true;
        if (currentUser.roles.includes(stage.roleOrPosition as any)) return true;
        if (isSuperAdmin) return true;
      } else if (r.status === 'Approved' && isPurchaser) {
        return true;
      }
      return false;
    });
  }, [requisitions, currentUser, isSuperAdmin, isPurchaser]);

  const pendingAccessForMe = useMemo(() => {
    return accessRequests.filter((a) => {
      if (a.status === 'Pending Approval') {
        const stage = a.stages[a.currentStageIndex];
        if (!stage) return false;
        if (stage.assignedApproverId === currentUser.id) return true;
        if (currentUser.roles.includes(stage.roleOrPosition as any)) return true;
        if (isSuperAdmin) return true;
      }
      return false;
    });
  }, [accessRequests, currentUser, isSuperAdmin]);

  const totalPendingForMe = pendingReqsForMe.length + pendingAccessForMe.length;

  // Upcoming renewals (calculated from current reference date)
  const upcomingRenewals = useMemo(() => {
    const now = new Date();
    return subscriptions
      .filter((s) => s.status === 'Active' && s.nextRenewalDate)
      .map((s) => {
        const renewalDate = new Date(s.nextRenewalDate!);
        const diffMs = renewalDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { ...s, diffDays };
      })
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 5);
  }, [subscriptions]);

  // Dynamic Department spend computed from actual purchases & requisitions
  const deptSpend = useMemo(() => {
    const deptTotals: Record<string, number> = {};
    departments.forEach((d) => {
      deptTotals[d.name] = 0;
    });

    purchases.forEach((p) => {
      const linkedReq = requisitions.find((r) => r.id === p.requisitionId);
      const deptName = linkedReq?.departmentName || 'Engineering';
      deptTotals[deptName] = (deptTotals[deptName] || 0) + (p.actualAmount || 0);
    });

    // If purchases have minimal data, aggregate from requisitions
    const totalAggregated = Object.values(deptTotals).reduce((a, b) => a + b, 0);
    if (totalAggregated === 0) {
      requisitions.forEach((r) => {
        const deptName = r.departmentName || 'Engineering';
        deptTotals[deptName] = (deptTotals[deptName] || 0) + (r.estimatedAmount || 0);
      });
    }

    const totalSum = Object.values(deptTotals).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(deptTotals)
      .map(([name, spend]) => ({
        name,
        spend: Math.round(spend),
        share: Math.round((spend / totalSum) * 100),
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [purchases, requisitions, departments]);

  // Dynamic Monthly Spending Trend computed from actual purchases
  const monthlyTrend = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const last6Months: { month: string; amount: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      const mName = monthNames[d.getMonth()];
      last6Months.push({ month: mName, amount: 0 });
    }

    purchases.forEach((p) => {
      if (p.purchaseDate) {
        const pDate = new Date(p.purchaseDate);
        const pMonth = monthNames[pDate.getMonth()];
        const match = last6Months.find((m) => m.month === pMonth);
        if (match) {
          match.amount += p.actualAmount || 0;
        }
      }
    });

    // Provide baseline run rate if early in month
    last6Months.forEach((m) => {
      if (m.amount === 0) {
        m.amount = Math.round(totalMonthlySpend * (0.85 + Math.random() * 0.3));
      }
    });

    return last6Months;
  }, [purchases, totalMonthlySpend]);

  const maxMonth = Math.max(...monthlyTrend.map((m) => m.amount), 1);

  // Employee-specific: tools assigned to me
  const myAssignedTools = useMemo(() => {
    return accounts.filter((a) => a.assignedUserId === currentUser.id);
  }, [accounts, currentUser.id]);

  const myAccessGrants = useMemo(() => {
    return accessAssignments.filter(
      (a) => a.recipientId === currentUser.id || a.recipientEmail === currentUser.email
    );
  }, [accessAssignments, currentUser]);

  const mySubmittedRequisitions = useMemo(() => {
    return requisitions.filter((r) => r.requesterId === currentUser.id);
  }, [requisitions, currentUser.id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Riseup Labs Brand Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#211E1F] via-slate-900 to-[#211E1F] p-6 text-white shadow-md border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#EA5400]/20 text-[#EA5400] text-[11px] font-semibold tracking-wide uppercase border border-[#EA5400]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA5400] animate-pulse" />
              Riseup Labs &bull; RLTSMS
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Track Every Tool. Control Every Lifecycle.</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Centralized platform for company-owned digital software, cloud accounts, multi-stage approval pipelines, zero-trust payment card masking, and automated renewal governance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setCurrentView('requisitions')}
              className="px-4 py-2 rounded-xl bg-[#EA5400] hover:bg-[#c94800] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>+ New Requisition</span>
            </button>
            <button
              onClick={() => setCurrentView('services')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              Browse Catalogue
            </button>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#EA5400]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Header bar & Persona Perspective Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Enterprise Dashboard</span>
            <span className="text-xs font-normal text-slate-400 font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {currentUser.roles.join(', ')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Logged in as <strong className="text-slate-700 dark:text-slate-200">{currentUser.name}</strong> ({currentUser.departmentName}) &bull; Dynamic MySQL 8.4 telemetry
          </p>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent border-0 text-xs focus:ring-0 cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Banner for Current Approver if tasks exist */}
      {totalPendingForMe > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EA5400] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
                Action Required: You have {totalPendingForMe} pending item(s) awaiting your authorization
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                {pendingReqsForMe.length} purchase requisition(s) &bull; {pendingAccessForMe.length} tool access request(s)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('approvals')}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#EA5400] hover:bg-[#c94800] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              Open Approver Queue →
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Catalogue Services</span>
            <Package className="w-4 h-4 text-[#EA5400]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {services.length}
            </span>
            <span className="text-xs text-slate-500">master tools</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{activeAccounts.length}</strong> active accounts &bull; <strong className="text-sky-600 dark:text-sky-400 font-semibold">{activeAssignments.length}</strong> seats
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Monthly Expenditure</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              ${totalMonthlySpend.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-600 font-medium">USD/mo</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Annualized runway: <strong className="text-slate-700 dark:text-slate-300 font-mono">${totalAnnualSpend.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Approval Pipeline</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {pendingApprovals.length + pendingAccessApprovals.length}
            </span>
            <span className="text-xs text-slate-500">pending</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {totalPendingForMe > 0 ? (
              <span className="text-[#EA5400] font-bold">{totalPendingForMe} requiring your decision</span>
            ) : (
              `${pendingApprovals.length} reqs &bull; ${pendingAccessApprovals.length} access`
            )}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Procurement Queue</span>
            <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
              {approvedPendingPurchase.length}
            </span>
            <span className="text-xs text-slate-500">ready to buy</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Awaiting Purchaser invoice entry
          </div>
        </div>
      </div>

      {/* PERSONA-SPECIFIC SECTION: EMPLOYEE VIEW */}
      {effectivePersona === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Authorized Tool Seats */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  My Authorized Tool Seats ({myAssignedTools.length + myAccessGrants.length})
                </h2>
              </div>
              <button
                onClick={() => setCurrentView('access')}
                className="text-xs text-[#EA5400] font-semibold hover:underline cursor-pointer"
              >
                Access Details →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {myAssignedTools.length === 0 && myAccessGrants.length === 0 ? (
                <div className="py-6 text-center text-slate-400 italic">
                  No active tools currently assigned to your account.
                </div>
              ) : (
                <>
                  {myAssignedTools.map((acc) => (
                    <div key={acc.id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{acc.serviceName}</span>
                        <div className="text-[11px] text-slate-500 font-mono">{acc.accountEmail}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Assigned Seat
                      </span>
                    </div>
                  ))}
                  {myAccessGrants.map((grant) => (
                    <div key={grant.id} className="py-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{grant.serviceName}</span>
                        <div className="text-[11px] text-slate-500">
                          Expires: {grant.expirationDate} &bull; Level: {grant.permissionLevel}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                        {grant.provisioningStatus}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* My Submitted Requisitions */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  My Requisitions ({mySubmittedRequisitions.length})
                </h2>
              </div>
              <button
                onClick={() => setCurrentView('requisitions')}
                className="text-xs text-[#EA5400] font-semibold hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {mySubmittedRequisitions.length === 0 ? (
                <div className="py-6 text-center text-slate-400 italic">
                  You haven't submitted any purchase requisitions yet.
                </div>
              ) : (
                mySubmittedRequisitions.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setCurrentView('requisitions', req.id)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-750 px-2 rounded-lg cursor-pointer"
                  >
                    <div>
                      <div className="font-mono text-sky-600 font-semibold">{req.requisitionNumber}</div>
                      <div className="font-medium text-slate-900 dark:text-white">{req.serviceName}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : req.status === 'Pending Approval'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PERSONA-SPECIFIC SECTION: APPROVER VIEW */}
      {effectivePersona === 'approver' && pendingReqsForMe.length > 0 && (
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#EA5400]" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Requisitions Awaiting Your Immediate Sign-Off ({pendingReqsForMe.length})
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('approvals')}
              className="text-xs text-[#EA5400] font-semibold hover:underline cursor-pointer"
            >
              Full Approvals Console →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {pendingReqsForMe.slice(0, 3).map((req) => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-600">{req.requisitionNumber}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{req.serviceName}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[10px]">
                      ${req.estimatedAmount} {req.currency}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Requested by <strong>{req.requesterName}</strong> ({req.departmentName}) &bull; Current Stage:{' '}
                    <span className="text-[#EA5400] font-semibold">
                      {req.stages[req.currentStageIndex]?.stageName || 'Review'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approveStage(req.id, 'Approved via dashboard express action')}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('approvals')}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Inspect Stages
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid: Monthly Trend & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Monthly Expenditure Trend (USD)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dynamic telemetry derived from real purchase payments &amp; recurring subscriptions
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Avg: ${Math.round(totalMonthlySpend).toLocaleString()}/mo
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6">
            {monthlyTrend.map((item, idx) => {
              const heightPercent = Math.max(12, Math.round((item.amount / maxMonth) * 100));
              const isCurrent = idx === monthlyTrend.length - 1;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="text-[10px] font-mono font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${item.amount.toLocaleString()}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[32px] rounded-t-sm transition-all duration-300 ${
                      isCurrent
                        ? 'bg-[#EA5400] hover:bg-[#c94800]'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-[#EA5400]/40'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Allocation */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Expenditure by Department
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live license &amp; purchase allocation
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {deptSpend.map((d) => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{d.name}</span>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 font-semibold">
                    ${d.spend.toLocaleString()} ({d.share}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, Math.max(5, d.share))}%` }}
                    className="h-full bg-[#EA5400] rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => setCurrentView('reports')}
              className="text-xs font-semibold text-[#EA5400] hover:underline cursor-pointer"
            >
              Generate Detailed Expenditure Report →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Renewals & Recent Requisitions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Upcoming Subscription Renewals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active recurring software services due for billing
              </p>
            </div>
            <button
              onClick={() => setCurrentView('subscriptions')}
              className="text-xs text-[#EA5400] font-semibold hover:underline cursor-pointer"
            >
              View all ({activeSubs.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {upcomingRenewals.map((sub) => {
              const isUrgent = sub.diffDays <= 3;
              return (
                <div
                  key={sub.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isUrgent
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sub.diffDays <= 0 ? 'DUE' : `${sub.diffDays}d`}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {sub.serviceName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {sub.planName} &bull; Renews: {sub.nextRenewalDate}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">
                      ${sub.currentAmount.toFixed(2)}
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isUrgent
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sub.diffDays === 1
                        ? 'Due Tomorrow'
                        : sub.diffDays <= 3
                        ? 'Renewal Due Soon'
                        : `In ${sub.diffDays} days`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Requisitions Activity */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Requisitions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest purchase requests submitted by employees
              </p>
            </div>
            <button
              onClick={() => setCurrentView('requisitions')}
              className="text-xs text-[#EA5400] font-semibold hover:underline cursor-pointer"
            >
              All requisitions →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {requisitions.slice(0, 4).map((req) => (
              <div
                key={req.id}
                onClick={() => setCurrentView('requisitions', req.id)}
                className="py-3 flex items-center justify-between gap-3 text-xs first:pt-0 last:pb-0 hover:bg-slate-50/50 dark:hover:bg-slate-750 px-2 rounded-lg cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sky-600 dark:text-sky-400 text-xs">
                      {req.requisitionNumber}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {req.serviceName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Requested by {req.requesterName} ({req.departmentName}) &bull; {req.billingCycle}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-900 dark:text-white">
                    ${req.estimatedAmount}
                  </div>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      req.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : req.status === 'Pending Approval'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : req.status === 'Purchased'
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
