import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Filter,
  Search,
  AlertCircle,
  FileText,
  UserCheck,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Requisition, ApprovalStageAction } from '../../types';

export const ApprovalsView: React.FC = () => {
  const { requisitions, currentUser, approveStage, rejectStage, returnForModification, setCurrentView } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [actionError, setActionError] = useState('');

  // Requisitions awaiting approval
  const pendingRequisitions = requisitions.filter((r) => r.status === 'Pending Approval');

  // Filter requisitions that match current user's role or assigned approver
  const actionableForMe = pendingRequisitions.filter((r) => {
    const stage = r.stages[r.currentStageIndex];
    if (!stage) return false;
    if (stage.assignedApproverId === currentUser.id) return true;
    if (currentUser.roles.includes(stage.roleOrPosition as any)) return true;
    if (currentUser.roles.includes('Super Admin')) return true;
    return false;
  });

  const filtered = pendingRequisitions.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.requisitionNumber.toLowerCase().includes(q) ||
        r.serviceName.toLowerCase().includes(q) ||
        r.requesterName.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !actionType) return;

    if ((actionType === 'reject' || actionType === 'return') && !actionComment.trim()) {
      setActionError(`A comment is required to ${actionType === 'reject' ? 'reject' : 'request modifications for'} this requisition.`);
      return;
    }

    if (actionType === 'approve') {
      approveStage(selectedReq.id, actionComment.trim() || undefined);
    } else if (actionType === 'reject') {
      rejectStage(selectedReq.id, actionComment.trim());
    } else if (actionType === 'return') {
      returnForModification(selectedReq.id, actionComment.trim());
    }

    setSelectedReq(null);
    setActionType(null);
    setActionComment('');
    setActionError('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-[#211E1F] text-white border border-[#2D292A] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EA5400]/20 text-[#EA5400] flex items-center justify-center shrink-0 border border-[#EA5400]/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Requisition Approvals Queue
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Review and authorize pending software and digital service requests across department workflow stages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#1A1718] text-[#EA5400] border border-[#EA5400]/30 font-semibold">
            {actionableForMe.length} pending your action
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by requisition number, tool, requester, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2D292A] bg-slate-50 dark:bg-[#1A1718] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
          />
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#2D292A] bg-slate-50/80 dark:bg-[#1A1718] text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Requisition</th>
                <th className="py-3 px-4">Service & Tool</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Estimated Amount</th>
                <th className="py-3 px-4">Active Stage</th>
                <th className="py-3 px-4">Workflow Progress</th>
                <th className="py-3 px-4 text-center">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2D292A]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No pending requisitions waiting for approval.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const currentStage = req.stages[req.currentStageIndex];
                  const isActionable =
                    currentStage &&
                    (currentStage.assignedApproverId === currentUser.id ||
                      currentUser.roles.includes(currentStage.roleOrPosition as any) ||
                      currentUser.roles.includes('Super Admin'));

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#2A2627]/50 transition-colors ${
                        isActionable ? 'bg-[#FFF1EB]/40 dark:bg-[#EA5400]/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {req.requisitionNumber}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {req.serviceName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {req.requestedPlan} · {req.billingCycle}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {req.requesterName}
                        </div>
                        <div className="text-[10px] text-slate-400">{req.departmentName}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                        ${req.estimatedAmount.toLocaleString()} {req.currency}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-[#EA5400]">
                          {currentStage?.stageName || 'Review'}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          Role: {currentStage?.roleOrPosition} {currentStage?.isRequired ? '(Required)' : '(Optional)'}
                        </div>
                      </td>

                      {/* Visual Progress Steps */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {req.stages.map((stg, i) => (
                            <div
                              key={i}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                stg.status === 'Approved'
                                  ? 'bg-emerald-600 text-white'
                                  : i === req.currentStageIndex
                                  ? 'bg-[#EA5400] text-white animate-pulse'
                                  : 'bg-slate-200 dark:bg-[#2D292A] text-slate-500'
                              }`}
                              title={`${stg.stageName}: ${stg.status}`}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isActionable ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType('approve');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType('return');
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-md border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                            >
                              Return
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReq(req);
                                setActionType('reject');
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Awaiting {currentStage?.roleOrPosition}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Confirmation Modal */}
      {selectedReq && actionType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedReq(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#211E1F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D292A] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {actionType === 'approve' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {actionType === 'reject' && <XCircle className="w-5 h-5 text-rose-600" />}
              {actionType === 'return' && <RotateCcw className="w-5 h-5 text-amber-600" />}
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {actionType} Requisition: {selectedReq.requisitionNumber}
              </h3>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#1A1718] rounded-lg text-xs space-y-1">
              <div><strong>Service:</strong> {selectedReq.serviceName}</div>
              <div><strong>Requester:</strong> {selectedReq.requesterName} ({selectedReq.departmentName})</div>
              <div><strong>Estimated Cost:</strong> ${selectedReq.estimatedAmount} {selectedReq.currency} ({selectedReq.billingCycle})</div>
              <div><strong>Purpose:</strong> {selectedReq.purpose}</div>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-3 text-xs">
              {actionError && <p className="text-rose-500 text-xs">{actionError}</p>}
              <div>
                <label className="font-semibold block mb-1">
                  {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Review Feedback / Rationale (Required)'}
                </label>
                <textarea
                  rows={3}
                  required={actionType !== 'approve'}
                  placeholder={
                    actionType === 'approve'
                      ? 'e.g. Budget authorized for team expansion'
                      : 'State specific reasons or requested modifications...'
                  }
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 font-semibold text-white rounded-lg cursor-pointer ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : actionType === 'reject'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirm {actionType.toUpperCase()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
