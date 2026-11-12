import React, { useState } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  DollarSign,
  Clock,
  RotateCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  List,
  LayoutGrid,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Subscription, BillingCycle } from '../../types';
import { RestrictedCardBadge } from '../common/RestrictedCardBadge';

export const SubscriptionsView: React.FC = () => {
  const { subscriptions, services, recordRenewalPayment, calculateRenewalDate } = useApp();

  const [activeMode, setActiveMode] = useState<'table' | 'calendar'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Renewal payment modal state
  const [renewSub, setRenewSub] = useState<Subscription | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState('');
  const [customRenewalDate, setCustomRenewalDate] = useState('');

  const now = new Date('2026-11-11T08:28:00Z');

  const filtered = subscriptions.filter((sub) => {
    if (selectedCycle !== 'all' && sub.billingCycle !== selectedCycle) return false;
    if (selectedStatus !== 'all' && sub.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        sub.serviceName.toLowerCase().includes(q) ||
        sub.planName.toLowerCase().includes(q) ||
        (sub.accountEmail && sub.accountEmail.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleOpenRenewModal = (sub: Subscription) => {
    setRenewSub(sub);
    setPaymentAmount(sub.expectedRenewalAmount || sub.currentAmount);
    setPaymentRef(`REN-${Date.now().toString().slice(-6)}`);
    const nextDate = calculateRenewalDate(
      sub.nextRenewalDate || new Date().toISOString().split('T')[0],
      sub.billingCycle
    );
    setCustomRenewalDate(nextDate || '');
  };

  const handleConfirmRenewPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewSub) return;

    recordRenewalPayment(renewSub.id, {
      amount: Number(paymentAmount),
      paymentReference: paymentRef.trim() || 'RENEWAL-PAID',
      newRenewalDate: customRenewalDate,
    });

    setRenewSub(null);
  };

  const getUrgency = (nextRenewalDate?: string) => {
    if (!nextRenewalDate) return { label: 'No Renewal', color: 'slate', days: 999 };
    const rDate = new Date(nextRenewalDate);
    const diffMs = rDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return { label: 'Due Today', color: 'rose', days: diffDays };
    } else if (diffDays === 1) {
      return { label: 'Due Tomorrow', color: 'rose', days: diffDays };
    } else if (diffDays <= 3) {
      return { label: `${diffDays} days left`, color: 'amber', days: diffDays };
    } else if (diffDays <= 7) {
      return { label: `In ${diffDays} days`, color: 'sky', days: diffDays };
    } else {
      return { label: `In ${diffDays} days`, color: 'emerald', days: diffDays };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Subscriptions & Billing Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated billing cycles, renewal calculations, payment recording & license retention
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeMode === 'table'
                ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => setActiveMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeMode === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Renewal Calendar</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subscriptions by service, plan, account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Billing Cycles</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Half-yearly">Half-yearly</option>
            <option value="Yearly">Yearly</option>
            <option value="One-time">One-time</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* TABLE VIEW */}
      {activeMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Service & Plan</th>
                  <th className="py-3 px-4">Account / Seat</th>
                  <th className="py-3 px-4">Billing Frequency</th>
                  <th className="py-3 px-4 text-right">Current Amount</th>
                  <th className="py-3 px-4">Next Renewal Date</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-center">Renewal Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filtered.map((sub) => {
                  const urgency = getUrgency(sub.nextRenewalDate);

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {sub.serviceName}
                        </div>
                        <div className="text-[11px] text-slate-400">{sub.planName}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {sub.accountEmail || 'Company-wide license'}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {sub.billingCycle}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                        ${sub.currentAmount.toFixed(2)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          {sub.currency}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white">
                        {sub.nextRenewalDate || 'No Recurring'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            urgency.color === 'rose'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : urgency.color === 'amber'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : urgency.color === 'sky'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {urgency.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <RestrictedCardBadge cardId={sub.paymentCardId} size="sm" />
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenRenewModal(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60 rounded-md transition-colors cursor-pointer"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Record Renewal</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW (PRD Section 24.2 Item 7) */}
      {activeMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Renewal Schedule (November 2026)
              </h2>
              <p className="text-xs text-slate-500">
                Visual timeline showing license renewal dates and payment commitments
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &le; 3 Days
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> &le; 7 Days
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Later
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptions
              .filter((s) => s.nextRenewalDate)
              .sort((a, b) => (a.nextRenewalDate! > b.nextRenewalDate! ? 1 : -1))
              .map((sub) => {
                const urgency = getUrgency(sub.nextRenewalDate);

                return (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-xl border transition-all ${
                      urgency.color === 'rose'
                        ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20'
                        : urgency.color === 'amber'
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {sub.nextRenewalDate}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          urgency.color === 'rose'
                            ? 'bg-rose-500 text-white'
                            : urgency.color === 'amber'
                            ? 'bg-amber-500 text-white'
                            : 'bg-sky-500 text-white'
                        }`}
                      >
                        {urgency.label}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {sub.serviceName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{sub.planName}</p>
                      {sub.accountEmail && (
                        <p className="text-[11px] font-mono text-slate-400 mt-1">
                          {sub.accountEmail}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Renewal Amount</span>
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                          ${sub.currentAmount.toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenRenewModal(sub)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md cursor-pointer"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Record Renewal Payment Modal */}
      {renewSub && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setRenewSub(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Record Renewal Payment
                </h3>
                <p className="text-xs text-slate-500">
                  {renewSub.serviceName} · {renewSub.planName}
                </p>
              </div>
              <button
                onClick={() => setRenewSub(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRenewPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Renewal Payment Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Payment / Transaction Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-11-OAI..."
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  New Next Renewal Date (Auto-calculated from {renewSub.billingCycle})
                </label>
                <input
                  type="date"
                  required
                  value={customRenewalDate}
                  onChange={(e) => setCustomRenewalDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-[11px] text-blue-800 dark:text-blue-300">
                Per Riseup Labs policy (PRD Section 9 & 17), previous payments are permanently preserved in audit history. Recording this renewal updates the next billing cycle.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRenewSub(null)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
