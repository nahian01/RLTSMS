import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Calendar,
  DollarSign,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceAccount } from '../../types';
import { RestrictedCardBadge } from '../common/RestrictedCardBadge';
import { NewAccessRequestModal } from '../requisitions/NewAccessRequestModal';

export const AccountsView: React.FC = () => {
  const { accounts, services, vendors, addAccount, updateAccountStatus, selectedItemId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessModalServiceId, setAccessModalServiceId] = useState<string>('');

  // Form state
  const [newServiceId, setNewServiceId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [newCost, setNewCost] = useState(20);
  const [newCycle, setNewCycle] = useState<any>('Monthly');
  const [newSource, setNewSource] = useState<'Direct' | 'Vendor'>('Direct');
  const [newVendorId, setNewVendorId] = useState('');

  const filtered = accounts.filter((acc) => {
    if (selectedService !== 'all' && acc.serviceId !== selectedService) return false;
    if (selectedStatus !== 'all' && acc.accountStatus !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        acc.accountEmail.toLowerCase().includes(q) ||
        acc.serviceName.toLowerCase().includes(q) ||
        acc.planName.toLowerCase().includes(q) ||
        (acc.assignedUserName && acc.assignedUserName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceId || !newEmail.trim()) return;

    const svc = services.find((s) => s.id === newServiceId);
    const vendor = vendors.find((v) => v.id === newVendorId);

    addAccount({
      serviceId: newServiceId,
      serviceName: svc?.name || 'Service',
      accountEmail: newEmail.trim(),
      planName: newPlan.trim() || 'Standard Seat',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseAmount: Number(newCost),
      currency: 'USD',
      billingCycle: newCycle,
      nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      renewalAmount: Number(newCost),
      purchaseSource: newSource,
      vendorId: newSource === 'Vendor' ? newVendorId : undefined,
      vendorName: newSource === 'Vendor' ? vendor?.name : undefined,
      accountStatus: 'Active',
      paymentStatus: 'Paid',
    });

    setIsAddModalOpen(false);
    setNewEmail('');
    setNewPlan('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Individual Purchased Accounts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Per-service seat inventory, login handles, billing attribution & account lifecycle
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              setAccessModalServiceId('');
              setIsAccessModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Request Tool Access</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account / Seat</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by account email, service, or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Services ({services.length})</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Account Handle / Email</th>
                <th className="py-3 px-4">Master Service</th>
                <th className="py-3 px-4">Plan / License Tier</th>
                <th className="py-3 px-4">Assigned / Shared Users</th>
                <th className="py-3 px-4">Purchase Source</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Next Renewal</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No accounts found matching filter.
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => (
                  <tr
                    key={acc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">
                        {acc.accountEmail}
                      </div>
                      <div className="text-[10px] text-slate-400">ID: {acc.id}</div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-sky-600 dark:text-sky-400">
                      {acc.serviceName}
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      <div>{acc.planName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ${acc.purchaseAmount} · {acc.billingCycle}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {acc.assignedUserName ? (
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {acc.assignedUserName}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Shared Seat Pool</span>
                      )}

                      {acc.sharedUserNames && acc.sharedUserNames.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {acc.sharedUserNames.map((name, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.2 rounded-sm bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {acc.purchaseSource === 'Direct' ? (
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">Direct</span>
                      ) : (
                        <div>
                          <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                            Vendor
                          </span>
                          <div className="text-[10px] text-slate-400">{acc.vendorName}</div>
                        </div>
                      )}
                    </td>

                    {/* Restricted Payment Card Component */}
                    <td className="py-3 px-4">
                      <RestrictedCardBadge cardId={acc.paymentCardId} size="sm" />
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {acc.nextRenewalDate || 'No Recurring'}
                    </td>

                    {/* Account Status (PRD Section 8: separated from subscription status) */}
                    <td className="py-3 px-4">
                      <select
                        value={acc.accountStatus}
                        onChange={(e) => updateAccountStatus(acc.id, e.target.value as any)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-hidden ${
                          acc.accountStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : acc.accountStatus === 'Suspended'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Expired">Expired</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                          acc.paymentStatus === 'Paid' || acc.paymentStatus === 'One-Time Settled'
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50'
                            : acc.paymentStatus === 'Upcoming'
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50'
                            : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50'
                        }`}
                      >
                        {acc.paymentStatus}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAccessModalServiceId(acc.serviceId);
                          setIsAccessModalOpen(true);
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-md transition-colors cursor-pointer border border-sky-200 dark:border-sky-800 inline-flex items-center gap-1"
                        title="Request shared access to this tool"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Request</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Total: <strong>{filtered.length}</strong> individual accounts registered
          </span>
          <span className="text-[11px]">
            Account status is managed independently from subscription renewal status
          </span>
        </div>
      </div>

      {/* Manual Add Account Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Register Individual Account Seat
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Select Master Service</label>
                <select
                  required
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Catalogue Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Account Email / Seat Login Handle</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. dev4@riseuplabs.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Plan Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Plus Plan, Pro Seat"
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Billing Frequency</label>
                  <select
                    value={newCycle}
                    onChange={(e) => setNewCycle(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Purchase Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Direct">Direct Purchase</option>
                    <option value="Vendor">Vendor / Reseller</option>
                  </select>
                </div>
              </div>

              {newSource === 'Vendor' && (
                <div>
                  <label className="font-semibold block mb-1">Vendor</label>
                  <select
                    value={newVendorId}
                    onChange={(e) => setNewVendorId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Request Modal */}
      <NewAccessRequestModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        initialServiceId={accessModalServiceId}
      />
    </div>
  );
};
