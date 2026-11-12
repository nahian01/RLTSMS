import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  DollarSign,
  Building,
  User as UserIcon,
  Calendar,
  FileText,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { Requisition } from '../../types';
import { useApp } from '../../context/AppContext';

interface RequisitionDetailModalProps {
  requisition: Requisition | null;
  onClose: () => void;
}

export const RequisitionDetailModal: React.FC<RequisitionDetailModalProps> = ({
  requisition,
  onClose,
}) => {
  const { currentUser, approveStage, rejectStage, returnForModification, setCurrentView } = useApp();
  const [comment, setComment] = useState('');
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [actionError, setActionError] = useState('');

  if (!requisition) return null;

  // Check if current user can act on this stage
  const currentStage = requisition.stages[requisition.currentStageIndex];
  const canAct =
    requisition.status === 'Pending Approval' &&
    currentStage &&
    (currentStage.assignedApproverId === currentUser.id ||
      currentUser.roles.includes(currentStage.roleOrPosition as any) ||
      currentUser.roles.includes('Super Admin'));

  const handleSubmitAction = () => {
    if (activeAction === 'reject' && !comment.trim()) {
      setActionError('A rejection reason is required.');
      return;
    }
    if (activeAction === 'return' && !comment.trim()) {
      setActionError('Please specify the modifications needed.');
      return;
    }

    if (activeAction === 'approve') {
      approveStage(requisition.id, comment.trim());
    } else if (activeAction === 'reject') {
      rejectStage(requisition.id, comment.trim());
    } else if (activeAction === 'return') {
      returnForModification(requisition.id, comment.trim());
    }

    setActiveAction(null);
    setComment('');
    setActionError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-sky-600 dark:text-sky-400">
                {requisition.requisitionNumber}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  requisition.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : requisition.status === 'Pending Approval'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : requisition.status === 'Purchased'
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                    : requisition.status === 'Returned for Modification'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {requisition.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
              {requisition.serviceName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Financial Comparison Summary (PRD Section 7 & 14) */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Requested Amount</span>
              <div className="font-mono font-bold text-base text-slate-900 dark:text-white mt-0.5">
                ${requisition.estimatedAmount.toFixed(2)}{' '}
                <span className="text-xs text-slate-400 font-normal">{requisition.currency}</span>
              </div>
              <div className="text-[10px] text-slate-400">{requisition.billingCycle}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Approved Amount</span>
              <div className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                {requisition.approvedAmount ? `$${requisition.approvedAmount.toFixed(2)}` : 'Pending'}
              </div>
              <div className="text-[10px] text-slate-400">Fixed authorization cap</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Actual Purchase Amount</span>
              <div className="font-mono font-bold text-base text-sky-600 dark:text-sky-400 mt-0.5">
                {requisition.status === 'Purchased'
                  ? `$${(requisition.approvedAmount || requisition.estimatedAmount).toFixed(2)}`
                  : '—'}
              </div>
              <div className="text-[10px] text-slate-400">Recorded by Purchaser</div>
            </div>
          </div>

          {/* Core Requisition Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Requester</span>
              <div className="font-medium text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                {requisition.requesterName}
              </div>
              <div className="text-[11px] text-slate-500">{requisition.requesterEmail}</div>
            </div>
            <div>
              <span className="text-slate-400">Department / Team</span>
              <div className="font-medium text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {requisition.departmentName}
              </div>
              <div className="text-[11px] text-slate-500">{requisition.teamName || 'Department General'}</div>
            </div>
            <div>
              <span className="text-slate-400">Category & Plan</span>
              <div className="font-medium text-slate-900 dark:text-white mt-0.5">
                {requisition.requestedPlan}
              </div>
              <div className="text-[11px] text-slate-500">{requisition.category}</div>
            </div>
            <div>
              <span className="text-slate-400">Target Purchase Date</span>
              <div className="font-medium text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {requisition.expectedPurchaseDate}
              </div>
              <div className="text-[11px] text-slate-500">
                Created: {new Date(requisition.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Account email target */}
          {requisition.accountEmail && (
            <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-lg border border-sky-100 dark:border-sky-900/40 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between">
              <div>
                <span className="font-semibold">Target Account / Seat:</span>{' '}
                <span className="font-mono">{requisition.accountEmail}</span>
              </div>
              <span className="text-[11px] text-sky-600 dark:text-sky-400">
                Will be registered automatically upon purchase
              </span>
            </div>
          )}

          {/* Business Justification */}
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Business Purpose & Justification:
            </span>
            <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {requisition.purpose}
            </div>
          </div>

          {/* Visual Approval Timeline (PRD Section 6 & 24) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Approval Workflow Stages
              </span>
              <span className="text-[11px] text-slate-400">
                Workflow ID: {requisition.workflowId}
              </span>
            </div>

            <div className="space-y-2.5">
              {requisition.stages.map((stg, idx) => {
                const isCurrent = idx === requisition.currentStageIndex && requisition.status === 'Pending Approval';
                const isCompleted = stg.status === 'Approved';
                const isBypassed = stg.status === 'Bypassed';
                const isRejected = stg.status === 'Rejected';
                const isReturned = stg.status === 'Returned';

                return (
                  <div
                    key={stg.stageId}
                    className={`p-3.5 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? 'border-amber-400 dark:border-amber-500/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                        : isCompleted
                        ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : isRejected
                        ? 'border-rose-200 dark:border-rose-800/60 bg-rose-50/20 dark:bg-rose-950/10'
                        : isReturned
                        ? 'border-orange-200 dark:border-orange-800/60 bg-orange-50/20 dark:bg-orange-950/10'
                        : stg.isRequired
                        ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                        : 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isRejected
                              ? 'bg-rose-600 text-white'
                              : isReturned
                              ? 'bg-orange-600 text-white'
                              : isCurrent
                              ? 'bg-amber-500 text-white animate-pulse'
                              : isBypassed
                              ? 'bg-slate-300 text-slate-700'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isRejected ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {stg.stageName}
                            </span>

                            {/* Required vs Optional Badge (PRD Section 6) */}
                            {stg.isRequired ? (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-white dark:bg-slate-700">
                                Required
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-medium border border-dashed border-slate-400 text-slate-600 dark:text-slate-400">
                                Optional Stage
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Assigned:{' '}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {stg.assignedApproverName || stg.roleOrPosition}
                            </strong>{' '}
                            ({stg.roleOrPosition})
                          </div>

                          {stg.comment && (
                            <div className="mt-2 p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {stg.actorName || 'Approver'} notes:
                              </span>{' '}
                              "{stg.comment}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-semibold text-[11px] ${
                            isCompleted
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isRejected
                              ? 'text-rose-600 dark:text-rose-400'
                              : isCurrent
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {stg.status}
                        </span>
                        {stg.actionDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(stg.actionDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar for assigned approver or Super Admin */}
          {canAct && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Decision as {currentUser.name} ({currentStage.roleOrPosition}):
                </span>
                {!currentStage.isRequired && (
                  <span className="text-[11px] text-slate-400">
                    (This is an optional stage: skipping or rejecting will not block the request)
                  </span>
                )}
              </div>

              {!activeAction ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveAction('approve')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Stage
                  </button>
                  <button
                    onClick={() => setActiveAction('return')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Return for Modification
                  </button>
                  <button
                    onClick={() => setActiveAction('reject')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white capitalize">
                      Confirm {activeAction}
                    </span>
                    <button
                      onClick={() => {
                        setActiveAction(null);
                        setActionError('');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      activeAction === 'approve'
                        ? 'Optional comments (e.g. Approved under Q4 tooling budget)...'
                        : activeAction === 'return'
                        ? 'Required modifications or questions for requester...'
                        : 'Required reason for rejecting this requisition...'
                    }
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                  {actionError && <p className="text-xs text-rose-600">{actionError}</p>}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setActiveAction(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitAction}
                      className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer ${
                        activeAction === 'approve'
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : activeAction === 'return'
                          ? 'bg-amber-600 hover:bg-amber-500'
                          : 'bg-rose-600 hover:bg-rose-500'
                      }`}
                    >
                      Submit Decision
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick link to purchase form if approved */}
          {requisition.status === 'Approved' && currentUser.roles.includes('Purchaser') && (
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                  Ready for Purchase Execution
                </div>
                <div className="text-[11px] text-sky-700 dark:text-sky-300">
                  All required approvals complete. Complete the purchase to record actual card & plan details.
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  setCurrentView('purchases', requisition.id);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Complete Purchase →
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
