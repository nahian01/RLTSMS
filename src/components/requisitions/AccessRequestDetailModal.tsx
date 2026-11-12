import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  KeyRound,
  ShieldCheck,
  Building,
  User as UserIcon,
  Calendar,
  AlertTriangle,
  Users,
  Check,
  Info,
  Ban,
} from 'lucide-react';
import { AccessRequest, AccessRequestStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { RestrictedCardBadge } from '../common/RestrictedCardBadge';

interface AccessRequestDetailModalProps {
  accessRequest: AccessRequest | null;
  onClose: () => void;
}

export const AccessRequestDetailModal: React.FC<AccessRequestDetailModalProps> = ({
  accessRequest,
  onClose,
}) => {
  const {
    currentUser,
    accounts,
    approveAccessRequest,
    rejectAccessRequest,
    returnAccessRequest,
    revokeAccessRequest,
  } = useApp();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [accessNotes, setAccessNotes] = useState('');
  const [comment, setComment] = useState('');
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [actionError, setActionError] = useState('');
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  // Auto-select preferred account or first account when opening
  React.useEffect(() => {
    if (accessRequest) {
      if (accessRequest.assignedAccountId) {
        setSelectedAccountId(accessRequest.assignedAccountId);
      } else if (accessRequest.preferredAccountId) {
        setSelectedAccountId(accessRequest.preferredAccountId);
      } else {
        const matching = accounts.filter(
          (a) => a.serviceId === accessRequest.serviceId && a.accountStatus === 'Active'
        );
        if (matching.length > 0) {
          setSelectedAccountId(matching[0].id);
        }
      }
      setActiveAction(null);
      setComment('');
      setAccessNotes('');
      setActionError('');
      setShowRevokeConfirm(false);
      setRevokeReason('');
    }
  }, [accessRequest, accounts]);

  if (!accessRequest) return null;

  // Filter accounts for this tool
  const matchingAccounts = accounts.filter(
    (a) => a.serviceId === accessRequest.serviceId && a.accountStatus === 'Active'
  );

  // If no exact match by serviceId, provide all accounts as fallback options
  const selectableAccounts = matchingAccounts.length > 0 ? matchingAccounts : accounts;

  // Check if current user can act on this stage
  const currentStage = accessRequest.stages[accessRequest.currentStageIndex];
  const canAct =
    accessRequest.status === 'Pending Approval' &&
    currentStage &&
    (currentStage.assignedApproverId === currentUser.id ||
      currentUser.roles.includes(currentStage.roleOrPosition as any) ||
      currentUser.roles.includes('Super Admin'));

  const canRevoke =
    accessRequest.status === 'Approved' &&
    (currentUser.roles.includes('Super Admin') ||
      currentUser.roles.includes('Department Lead') ||
      currentUser.roles.includes('Operation Manager'));

  const handleSubmitAction = () => {
    setActionError('');

    if (activeAction === 'approve') {
      if (!selectedAccountId) {
        setActionError('Please select which tool/service account will be granted to this employee.');
        return;
      }
      approveAccessRequest(
        accessRequest.id,
        selectedAccountId,
        accessNotes.trim() || undefined,
        comment.trim() || undefined
      );
      onClose();
    } else if (activeAction === 'reject') {
      if (!comment.trim()) {
        setActionError('A rejection reason is required.');
        return;
      }
      rejectAccessRequest(accessRequest.id, comment.trim());
      onClose();
    } else if (activeAction === 'return') {
      if (!comment.trim()) {
        setActionError('Please specify what modifications are needed.');
        return;
      }
      returnAccessRequest(accessRequest.id, comment.trim());
      onClose();
    }
  };

  const handleRevokeSubmit = () => {
    if (!revokeReason.trim()) {
      setActionError('Please provide a reason for revoking access.');
      return;
    }
    revokeAccessRequest(accessRequest.id, revokeReason.trim());
    setShowRevokeConfirm(false);
    onClose();
  };

  const getStatusBadge = (status: AccessRequestStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved & Granted
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Pending Approval
          </span>
        );
      case 'Returned for Modification':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            <RotateCcw className="w-3.5 h-3.5" />
            Returned for Modification
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'Revoked':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Ban className="w-3.5 h-3.5" />
            Access Revoked
          </span>
        );
    }
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
                {accessRequest.requestNumber}
              </span>
              {getStatusBadge(accessRequest.status)}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-500" />
              {accessRequest.serviceName}
              <span className="text-xs font-normal text-slate-400">({accessRequest.category})</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Key Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Requester</span>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                {accessRequest.requesterName}
              </div>
              <div className="text-[10px] text-slate-400">{accessRequest.requesterEmail}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Department / Team</span>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                {accessRequest.departmentName}
              </div>
              <div className="text-[10px] text-slate-400">{accessRequest.teamName || 'General'}</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Duration Requested</span>
              <div className="font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                {accessRequest.duration}
              </div>
              <div className="text-[10px] text-slate-400">Sharing Policy</div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Submitted Date</span>
              <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                {new Date(accessRequest.createdAt).toLocaleDateString()}
              </div>
              <div className="text-[10px] text-slate-400">
                {new Date(accessRequest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Business Reason & Preferred Account */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Business Reason & Purpose:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {accessRequest.reason}
              </p>

              {accessRequest.preferredAccountEmail && (
                <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Requester Preferred Account:</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded-sm">
                    {accessRequest.preferredAccountEmail}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* If already Approved: Show Assigned Account Details */}
          {accessRequest.status === 'Approved' && accessRequest.assignedAccountEmail && (
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Access Granted & Account Assigned
                    </h3>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Employee has been provisioned on this tool account.
                    </p>
                  </div>
                </div>

                {canRevoke && (
                  <button
                    type="button"
                    onClick={() => setShowRevokeConfirm(!showRevokeConfirm)}
                    className="px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
                  >
                    Revoke Access
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200/60 dark:border-emerald-900/60">
                <div>
                  <span className="text-[11px] text-slate-400">Assigned Account Handle</span>
                  <div className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                    {accessRequest.assignedAccountEmail}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Plan Tier</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {accessRequest.assignedPlanName || 'Standard'}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Granted By & Date</span>
                  <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {accessRequest.accessGrantedByName || 'Approver'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {accessRequest.accessGrantedDate
                      ? new Date(accessRequest.accessGrantedDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
              </div>

              {accessRequest.accessNotes && (
                <div className="mt-3 text-xs text-emerald-900 dark:text-emerald-200 bg-emerald-100/60 dark:bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  <span className="font-semibold">Access / Credentials Notes: </span>
                  {accessRequest.accessNotes}
                </div>
              )}

              {/* Revoke confirmation box */}
              {showRevokeConfirm && (
                <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 space-y-2">
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Confirm Revoking Access for {accessRequest.requesterName}
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    This will remove the user from the shared account list and notify them.
                  </p>
                  <input
                    type="text"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                    placeholder="Enter reason for revoking (e.g. Project completion, team transfer)..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-md border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRevokeConfirm(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRevokeSubmit}
                      className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md shadow-xs cursor-pointer"
                    >
                      Confirm Revocation
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visual Multi-Stage Approval Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              Approval Workflow Timeline
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {accessRequest.stages.map((stg, idx) => {
                const isCurrent = idx === accessRequest.currentStageIndex && accessRequest.status === 'Pending Approval';
                const isPast = idx < accessRequest.currentStageIndex || stg.status === 'Approved';

                let icon = <Clock className="w-3.5 h-3.5 text-slate-400" />;
                let dotBg = 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600';

                if (stg.status === 'Approved') {
                  icon = <Check className="w-3.5 h-3.5 text-white" />;
                  dotBg = 'bg-emerald-500 border-emerald-500';
                } else if (stg.status === 'Rejected') {
                  icon = <XCircle className="w-3.5 h-3.5 text-white" />;
                  dotBg = 'bg-rose-500 border-rose-500';
                } else if (stg.status === 'Returned') {
                  icon = <RotateCcw className="w-3.5 h-3.5 text-white" />;
                  dotBg = 'bg-orange-500 border-orange-500';
                } else if (isCurrent) {
                  icon = <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
                  dotBg = 'bg-amber-100 border-amber-500';
                }

                return (
                  <div key={stg.stageId} className="relative group">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${dotBg}`}
                    >
                      {icon}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            Stage {idx + 1}: {stg.stageName}
                          </span>
                          <span className="text-[10px] text-slate-400">({stg.roleOrPosition})</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            stg.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : stg.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : stg.status === 'Returned'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                              : isCurrent
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {stg.status === 'Pending' && isCurrent ? 'Action Needed' : stg.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                        <span>
                          Assigned: <strong>{stg.assignedApproverName || stg.roleOrPosition}</strong>
                        </span>
                        {stg.actionDate && (
                          <span className="text-[10px]">
                            {new Date(stg.actionDate).toLocaleDateString()} at{' '}
                            {new Date(stg.actionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {stg.comment && (
                        <div className="mt-2 text-[11px] p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 italic">
                          &ldquo;{stg.comment}&rdquo;
                          {stg.actorName && (
                            <span className="block text-[10px] text-slate-400 not-italic font-medium mt-0.5">
                              &mdash; {stg.actorName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRITICAL FEATURE: Approver Action Box & Account Selector */}
          {canAct && (
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border-2 border-sky-300 dark:border-sky-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-600 text-white">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-sky-950 dark:text-sky-200">
                    Review Access Request & Select Tool Account
                  </h3>
                  <p className="text-[11px] text-sky-700 dark:text-sky-400">
                    As an authorized approver ({currentUser.name} &bull; {currentStage?.roleOrPosition}), select which service account/seat {accessRequest.requesterName} will be granted access to.
                  </p>
                </div>
              </div>

              {actionError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Account Selection Card Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select Tool Account to Assign: <span className="text-rose-500">*</span>
                </label>

                {selectableAccounts.length === 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                    No active accounts registered for {accessRequest.serviceName}. You can still approve and leave credentials or provisioning instructions below.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectableAccounts.map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      const isPreferred = accessRequest.preferredAccountId === acc.id;
                      const sharedCount = acc.sharedUserIds?.length || 0;

                      return (
                        <div
                          key={acc.id}
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-xs relative ${
                            isSelected
                              ? 'border-sky-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-sky-500/20'
                              : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="selectedAccount"
                                checked={isSelected}
                                onChange={() => setSelectedAccountId(acc.id)}
                                className="text-sky-600 focus:ring-sky-500"
                              />
                              <div>
                                <span className="font-mono font-bold text-slate-900 dark:text-white block">
                                  {acc.accountEmail}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {acc.planTier || acc.planName} &bull; {acc.assignmentType || (acc.assignedUserName ? 'Dedicated' : 'Team / Shared')}
                                </span>
                              </div>
                            </div>

                            {isPreferred && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-semibold shrink-0">
                                Preferred
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{sharedCount} active seat{sharedCount === 1 ? '' : 's'}</span>
                            </div>
                            <RestrictedCardBadge cardId={acc.paymentCardId} size="sm" />
                          </div>

                          {acc.sharedUserNames && acc.sharedUserNames.length > 0 && (
                            <div className="mt-1 text-[10px] text-slate-400 truncate">
                              Used by: {acc.sharedUserNames.join(', ')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Access Notes / Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Access Notes / Instructions for Requester (Optional):
                </label>
                <input
                  type="text"
                  value={accessNotes}
                  onChange={(e) => setAccessNotes(e.target.value)}
                  placeholder="e.g. Workspace invite sent to email, or 2FA credentials saved in 1Password Engineering vault"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Decision / Review Actions */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Decision & Review Comment:
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional note for approval, or required justification for return/reject..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAction('return');
                        if (!comment.trim()) {
                          setActionError('Please provide modification feedback in the comment box.');
                        } else {
                          handleSubmitAction();
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-950/60 rounded-lg transition-colors cursor-pointer border border-orange-200 dark:border-orange-800 flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return for Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveAction('reject');
                        if (!comment.trim()) {
                          setActionError('Please provide a reason for rejection in the comment box.');
                        } else {
                          handleSubmitAction();
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer border border-rose-200 dark:border-rose-800 flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveAction('approve');
                      if (!selectedAccountId && selectableAccounts.length > 0) {
                        setActionError('Please select which tool account to assign.');
                      } else {
                        handleSubmitAction();
                      }
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Grant Account Access</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
