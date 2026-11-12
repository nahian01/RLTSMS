import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Users,
  Building,
  KeyRound,
  History,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccountAccessAssignment } from '../../types';

export const AccessManagementView: React.FC = () => {
  const {
    accessAssignments,
    services,
    accounts,
    users,
    teams,
    departments,
    currentUser,
    createAccessAssignment,
    extendAccessAssignment,
    revokeAccessAssignment,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRecipientType, setSelectedRecipientType] = useState<string>('all');
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

  // Extend Modal state
  const [extendingAsgn, setExtendingAsgn] = useState<AccountAccessAssignment | null>(null);
  const [newExtendExpiry, setNewExtendExpiry] = useState('');

  // Revoke Modal state
  const [revokingAsgn, setRevokingAsgn] = useState<AccountAccessAssignment | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Grant Modal form state
  const [grantServiceId, setGrantServiceId] = useState('');
  const [grantAccountId, setGrantAccountId] = useState('');
  const [grantRecipientType, setGrantRecipientType] = useState<'employee' | 'team' | 'department'>('employee');
  const [grantRecipientId, setGrantRecipientId] = useState('');
  const [grantStartDate, setGrantStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [grantExpiryDate, setGrantExpiryDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [grantPermLevel, setGrantPermLevel] = useState<'read' | 'user' | 'admin' | 'full'>('user');
  const [grantProvisioning, setGrantProvisioning] = useState<'Provisioned' | 'Pending External Setup'>('Provisioned');
  const [grantNotes, setGrantNotes] = useState('');
  const [assignmentSuccessNotice, setAssignmentSuccessNotice] = useState<string | null>(null);

  // Accounts filtered by selected service
  const availableAccounts = accounts.filter((a) => a.serviceId === grantServiceId && a.accountStatus === 'Active');

  const filteredAssignments = accessAssignments.filter((asgn) => {
    if (selectedStatus !== 'all' && asgn.status !== selectedStatus) return false;
    if (selectedRecipientType !== 'all' && asgn.recipientType !== selectedRecipientType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        asgn.serviceName.toLowerCase().includes(q) ||
        asgn.accountEmail.toLowerCase().includes(q) ||
        asgn.recipientName.toLowerCase().includes(q) ||
        asgn.grantedByName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleGrantSubmit = (e: React.FormEvent) => {
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
      provisioningStatus: grantProvisioning,
      notes: grantNotes.trim() || undefined,
    });

    setIsGrantModalOpen(false);
    setAssignmentSuccessNotice('Access assignment created successfully. Recipient notified without credential disclosure.');
    setTimeout(() => setAssignmentSuccessNotice(null), 4000);

    // Reset fields
    setGrantServiceId('');
    setGrantAccountId('');
    setGrantNotes('');
  };

  const handleConfirmExtend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingAsgn || !newExtendExpiry) return;
    extendAccessAssignment(extendingAsgn.id, newExtendExpiry);
    setExtendingAsgn(null);
    setNewExtendExpiry('');
  };

  const handleConfirmRevoke = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingAsgn) return;
    revokeAccessAssignment(revokingAsgn.id, revokeReason || 'Administrative de-provisioning');
    setRevokingAsgn(null);
    setRevokeReason('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner: Riseup Labs Zero-Credential Security Principle */}
      <div className="p-5 rounded-2xl bg-[#211E1F] text-white border border-[#2D292A] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EA5400]/20 text-[#EA5400] flex items-center justify-center shrink-0 border border-[#EA5400]/40">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Account Access Sharing Governance
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1A1718] text-[#EA5400] border border-[#EA5400]/30 font-semibold">
                Zero Credential Sharing
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Authorize seats and team access without ever distributing service passwords, recovery emails, or login secrets.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsGrantModalOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Grant Access</span>
        </button>
      </div>

      {assignmentSuccessNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{assignmentSuccessNotice}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by tool, account, recipient, or granter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2D292A] bg-slate-50 dark:bg-[#1A1718] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRecipientType}
            onChange={(e) => setSelectedRecipientType(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2D292A] bg-white dark:bg-[#211E1F] text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Recipient Types</option>
            <option value="employee">Individual Employees</option>
            <option value="team">Teams</option>
            <option value="department">Departments</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#2D292A] bg-white dark:bg-[#211E1F] text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Statuses ({accessAssignments.length})</option>
            <option value="Active">Active</option>
            <option value="Revoked">Revoked</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Access Assignments Table */}
      <div className="bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2D292A] bg-slate-50/80 dark:bg-[#1A1718] text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Service & Tool</th>
                <th className="py-3 px-4">Allocated Account</th>
                <th className="py-3 px-4">Authorized Recipient</th>
                <th className="py-3 px-4">Permission Level</th>
                <th className="py-3 px-4">Access Period</th>
                <th className="py-3 px-4">Provider Setup Status</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2D292A]">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No access assignments matching filters.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asgn) => {
                  const isExpired = asgn.status === 'Expired' || new Date(asgn.expirationDate) < new Date();
                  const isActive = asgn.status === 'Active' && !isExpired;

                  return (
                    <tr
                      key={asgn.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#2A2627]/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {asgn.serviceName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 dark:text-slate-200">
                          {asgn.accountEmail}
                        </div>
                        <div className="text-[10px] text-slate-400">Account ID: {asgn.accountId}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          {asgn.recipientType === 'employee' && <Users className="w-3.5 h-3.5 text-slate-400" />}
                          {asgn.recipientType === 'team' && <Users className="w-3.5 h-3.5 text-[#EA5400]" />}
                          {asgn.recipientType === 'department' && <Building className="w-3.5 h-3.5 text-purple-400" />}
                          <span>{asgn.recipientName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {asgn.recipientType}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1A1718] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase font-semibold">
                          {asgn.permissionLevel}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {asgn.startDate} → {asgn.expirationDate}
                        </div>
                        <div className="text-[10px] text-slate-400">By: {asgn.grantedByName}</div>
                      </td>

                      {/* Part 8.5: Clear distinction between internal assignment and pending external/provider setup */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            asgn.provisioningStatus === 'Provisioned'
                              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {asgn.provisioningStatus === 'Provisioned' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{asgn.provisioningStatus}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                              : asgn.status === 'Revoked'
                              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isActive ? 'Active' : asgn.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isActive && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setExtendingAsgn(asgn);
                                  setNewExtendExpiry(asgn.expirationDate);
                                }}
                                className="px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A2627] rounded transition-colors cursor-pointer border border-slate-200 dark:border-[#2D292A]"
                                title="Extend Access Period"
                              >
                                Extend
                              </button>

                              <button
                                type="button"
                                onClick={() => setRevokingAsgn(asgn)}
                                className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                                title="Revoke Access Immediately"
                              >
                                Revoke
                              </button>
                            </>
                          )}
                          {!isActive && (
                            <span className="text-[11px] text-slate-400 italic">No action</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-[#1A1718] border-t border-slate-200 dark:border-[#2D292A] text-xs text-slate-500 flex items-center justify-between">
          <span>
            Total: <strong>{filteredAssignments.length}</strong> access records
          </span>
          <span className="text-[11px] text-[#EA5400] font-medium">
            Zero credentials policy enforced across all assignments
          </span>
        </div>
      </div>

      {/* Grant Access Modal (Part 8.2) */}
      {isGrantModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsGrantModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#211E1F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D292A] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2D292A]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Authorize Tool & Service Access
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure seat assignment without exposing service login credentials
                </p>
              </div>
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Select Service</label>
                <select
                  required
                  value={grantServiceId}
                  onChange={(e) => {
                    setGrantServiceId(e.target.value);
                    setGrantAccountId('');
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Master Service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Select Specific Account / License Seat</label>
                <select
                  required
                  disabled={!grantServiceId}
                  value={grantAccountId}
                  onChange={(e) => setGrantAccountId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">-- Choose Account --</option>
                  {availableAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountEmail} ({a.planName} · {a.accountStatus})
                    </option>
                  ))}
                </select>
                {grantServiceId && availableAccounts.length === 0 && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    No active accounts registered under this service.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Recipient Type</label>
                  <select
                    value={grantRecipientType}
                    onChange={(e) => {
                      setGrantRecipientType(e.target.value as any);
                      setGrantRecipientId('');
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                  >
                    <option value="employee">Individual Employee</option>
                    <option value="team">Entire Team</option>
                    <option value="department">Entire Department</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Select Recipient</label>
                  <select
                    required
                    value={grantRecipientId}
                    onChange={(e) => setGrantRecipientId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Recipient --</option>
                    {grantRecipientType === 'employee' &&
                      users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.departmentName})
                        </option>
                      ))}
                    {grantRecipientType === 'team' &&
                      teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.departmentName})
                        </option>
                      ))}
                    {grantRecipientType === 'department' &&
                      departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={grantStartDate}
                    onChange={(e) => setGrantStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                  >
                  </input>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={grantExpiryDate}
                    onChange={(e) => setGrantExpiryDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Permission Level</label>
                  <select
                    value={grantPermLevel}
                    onChange={(e) => setGrantPermLevel(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                  >
                    <option value="read">Read Only</option>
                    <option value="user">Standard User</option>
                    <option value="admin">Seat Admin</option>
                    <option value="full">Full Access</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Provider Provisioning</label>
                  <select
                    value={grantProvisioning}
                    onChange={(e) => setGrantProvisioning(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                  >
                    <option value="Provisioned">Provisioned (Active)</option>
                    <option value="Pending External Setup">Pending External Provider Setup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Notes / Justification</label>
                <input
                  type="text"
                  placeholder="e.g. Assigned for Q4 frontend migration project"
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2D292A]">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Modal */}
      {extendingAsgn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setExtendingAsgn(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#211E1F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D292A] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Extend Access: {extendingAsgn.serviceName}
            </h3>
            <p className="text-xs text-slate-500">
              Current expiry date: <strong>{extendingAsgn.expirationDate}</strong>
            </p>

            <form onSubmit={handleConfirmExtend} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">New Expiration Date</label>
                <input
                  type="date"
                  required
                  value={newExtendExpiry}
                  onChange={(e) => setNewExtendExpiry(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingAsgn(null)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg"
                >
                  Save Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokingAsgn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setRevokingAsgn(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#211E1F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D292A] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Revoke Access Authorization
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to revoke access on <strong>{revokingAsgn.serviceName}</strong> from{' '}
              <strong>{revokingAsgn.recipientName}</strong>? This action takes effect immediately.
            </p>

            <form onSubmit={handleConfirmRevoke} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Revocation Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project reassignment, seat de-provisioned..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingAsgn(null)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                >
                  Confirm Revoke
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
