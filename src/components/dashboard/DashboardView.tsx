import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DashboardView: React.FC = () => {
  const {
    services,
    accounts,
    subscriptions,
    requisitions,
    accessRequests,
    departments,
    currentUser,
    setCurrentView,
    approveStage,
  } = useApp();

  // Filters state
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');

  // Filtered subscriptions & accounts
  const activeSubs = subscriptions.filter((s) => s.status === 'Active');
  const activeAccounts = accounts.filter((a) => a.accountStatus === 'Active');

  // Calculations
  const totalMonthlySpend = services.reduce((acc, s) => acc + s.totalMonthlySpend, 0);
  const totalAnnualSpend = totalMonthlySpend * 12 + 3240; // Including Figma yearly

  const pendingApprovals = requisitions.filter((r) => r.status === 'Pending Approval');
  const pendingAccessApprovals = accessRequests.filter((a) => a.status === 'Pending Approval');
  const approvedPendingPurchase = requisitions.filter((r) => r.status === 'Approved');

  // "Pending Actions for Me" across Requisitions and Access Sharing
  const pendingReqsForMe = requisitions.filter((r) => {
    if (r.status === 'Pending Approval') {
      const stage = r.stages[r.currentStageIndex];
      if (!stage) return false;
      if (stage.assignedApproverId === currentUser.id) return true;
      if (currentUser.roles.includes(stage.roleOrPosition as any)) return true;
      if (currentUser.roles.includes('Super Admin')) return true;
    } else if (r.status === 'Approved' && currentUser.roles.includes('Purchaser')) {
      return true;
    }
    return false;
  });

  const pendingAccessForMe = accessRequests.filter((a) => {
    if (a.status === 'Pending Approval') {
      const stage = a.stages[a.currentStageIndex];
      if (!stage) return false;
      if (stage.assignedApproverId === currentUser.id) return true;
      if (currentUser.roles.includes(stage.roleOrPosition as any)) return true;
      if (currentUser.roles.includes('Super Admin')) return true;
    }
    return false;
  });

  const totalPendingForMe = pendingReqsForMe.length + pendingAccessForMe.length;

  // Upcoming renewals (sorted by days until nextRenewalDate)
  const now = new Date('2026-11-11T08:28:00Z');
  const upcomingRenewals = subscriptions
    .filter((s) => s.status === 'Active' && s.nextRenewalDate)
    .map((s) => {
      const renewalDate = new Date(s.nextRenewalDate!);
      const diffMs = renewalDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...s, diffDays };
    })
    .sort((a, b) => a.diffDays - b.diffDays)
    .slice(0, 5);

  // Department spend breakdown
  const deptSpend = [
    { name: 'Engineering', spend: 2350, share: 62 },
    { name: 'Creative & Design', spend: 690, share: 18 },
    { name: 'Quality Assurance', spend: 420, share: 11 },
    { name: 'Product & Operations', spend: 210, share: 6 },
    { name: 'Finance & Admin', spend: 119, share: 3 },
  ];

  // Monthly trends (12 months)
  const monthlyTrend = [
    { month: 'Dec', amount: 3100 },
    { month: 'Jan', amount: 3250 },
    { month: 'Feb', amount: 3400 },
    { month: 'Mar', amount: 3350 },
    { month: 'Apr', amount: 3600 },
    { month: 'May', amount: 3550 },
    { month: 'Jun', amount: 6800 }, // Annual renewals
    { month: 'Jul', amount: 3700 },
    { month: 'Aug', amount: 3850 },
    { month: 'Sep', amount: 3900 },
    { month: 'Oct', amount: 4100 },
    { month: 'Nov', amount: 3789 },
  ];

  const maxMonth = Math.max(...monthlyTrend.map((m) => m.amount));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* RLTSMS Brand Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-6 text-white shadow-xs border border-sky-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-semibold tracking-wide uppercase border border-sky-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              RLTSMS
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Your Tools. Your Services. Every Stage, Tracked.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Enterprise digital tools &amp; services management for Riseup Labs — seamless requisitioning, multi-stage approval workflows, procurement tracking, zero-trust card governance, and renewal forecasting.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setCurrentView('requisitions')}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              + New Requisition
            </button>
            <button
              onClick={() => setCurrentView('services')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
            >
              Browse Catalogue
            </button>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Riseup Labs software licensing, active seats, approval pipeline & financial runway
          </p>
        </div>

        {/* Compact Filter Strip */}
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

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="bg-transparent border-0 text-xs focus:ring-0 cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Billing Cycles</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="Quarterly">Quarterly</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Catalogue Services</span>
            <Package className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {services.length}
            </span>
            <span className="text-xs text-slate-500">master tools</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <strong className="text-emerald-600 dark:text-emerald-400">{activeAccounts.length}</strong> active seats registered
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
            Annual run rate: <strong className="text-slate-700 dark:text-slate-300 font-mono">${totalAnnualSpend.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {pendingApprovals.length + pendingAccessApprovals.length}
            </span>
            <span className="text-xs text-slate-500">pipeline</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {totalPendingForMe > 0 ? (
              <span className="text-amber-600 font-semibold">{totalPendingForMe} requiring your review</span>
            ) : (
              `${pendingApprovals.length} reqs · ${pendingAccessApprovals.length} access`
            )}
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Pending Purchases</span>
            <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
              {approvedPendingPurchase.length}
            </span>
            <span className="text-xs text-slate-500">approved</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Awaiting Purchaser execution
          </div>
        </div>
      </div>

      {/* Action Banner for Current User if tasks exist */}
      {totalPendingForMe > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Action Required: You have {totalPendingForMe} pending item(s) awaiting your review ({pendingReqsForMe.length} requisitions, {pendingAccessForMe.length} tool access requests)
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-400">
                Logged in as <strong>{currentUser.name}</strong> ({currentUser.roles.join(', ')})
              </div>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('requisitions')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Review Approval Queue →
          </button>
        </div>
      )}

      {/* Charts Grid: Monthly Trend & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Monthly Expenditure Trend (USD)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                12-month historical subscription & one-time payments
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              Avg: $3,810/mo
            </span>
          </div>

          {/* Bar Chart Container */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6">
            {monthlyTrend.map((item, idx) => {
              const heightPercent = Math.round((item.amount / maxMonth) * 100);
              const isCurrent = idx === monthlyTrend.length - 1;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${item.amount}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 ${
                      isCurrent
                        ? 'bg-sky-600 hover:bg-sky-500'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-sky-300 dark:hover:bg-slate-600'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 font-medium">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Allocation */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Expenditure by Department
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current monthly license allocation
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {deptSpend.map((d) => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{d.name}</span>
                  <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    ${d.spend} ({d.share}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    style={{ width: `${d.share}%` }}
                    className="h-full bg-sky-600 dark:bg-sky-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={() => setCurrentView('reports')}
              className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
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
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Upcoming Renewals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Subscriptions due for payment in the next 30 days
              </p>
            </div>
            <button
              onClick={() => setCurrentView('subscriptions')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
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
                        {sub.planName} · Renews on {sub.nextRenewalDate}
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
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Recent Requisitions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest purchase requests submitted by employees
              </p>
            </div>
            <button
              onClick={() => setCurrentView('requisitions')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
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
                    Requested by {req.requesterName} ({req.departmentName}) · {req.billingCycle}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-semibold text-slate-900 dark:text-white">
                    ${req.estimatedAmount}
                  </div>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
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
