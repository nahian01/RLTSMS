import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  FileText,
  User as UserIcon,
  KeyRound,
  ShieldCheck,
  Ban,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Requisition, RequisitionStatus, AccessRequest, AccessRequestStatus } from '../../types';
import { RequisitionDetailModal } from './RequisitionDetailModal';
import { NewRequisitionModal } from './NewRequisitionModal';
import { AccessRequestDetailModal } from './AccessRequestDetailModal';
import { NewAccessRequestModal } from './NewAccessRequestModal';

export const RequisitionsView: React.FC = () => {
  const { requisitions, accessRequests, currentUser, selectedItemId } = useApp();

  // Mode switcher: Purchase Requisitions vs Tool Access Sharing Requests
  const [viewMode, setViewMode] = useState<'purchases' | 'access'>('purchases');

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'approvals'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [selectedAccessReq, setSelectedAccessReq] = useState<AccessRequest | null>(null);
  const [isNewReqModalOpen, setIsNewReqModalOpen] = useState(false);
  const [isNewAccessModalOpen, setIsNewAccessModalOpen] = useState(false);

  // If selectedItemId is provided via deep link, open it
  React.useEffect(() => {
    if (selectedItemId) {
      const matchAccess = accessRequests.find(
        (a) => a.id === selectedItemId || a.requestNumber === selectedItemId
      );
      if (matchAccess) {
        setViewMode('access');
        setSelectedAccessReq(matchAccess);
        return;
      }

      const matchReq = requisitions.find(
        (r) => r.id === selectedItemId || r.requisitionNumber === selectedItemId
      );
      if (matchReq) {
        setViewMode('purchases');
        setSelectedReq(matchReq);
      }
    }
  }, [selectedItemId, requisitions, accessRequests]);

  // Tab filtering for Purchase Requisitions
  const filteredPurchases = requisitions.filter((r) => {
    if (activeTab === 'my' && r.requesterId !== currentUser.id) {
      return false;
    }
    if (activeTab === 'approvals') {
      if (r.status !== 'Pending Approval') return false;
      const stage = r.stages[r.currentStageIndex];
      const isAssigned =
        stage?.assignedApproverId === currentUser.id ||
        currentUser.roles.includes(stage?.roleOrPosition as any) ||
        currentUser.roles.includes('Super Admin');
      if (!isAssigned) return false;
    }

    if (selectedStatus !== 'all' && r.status !== selectedStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.requisitionNumber.toLowerCase().includes(q) ||
        r.serviceName.toLowerCase().includes(q) ||
        r.requesterName.toLowerCase().includes(q) ||
        r.departmentName.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Tab filtering for Tool Access Requests
  const filteredAccess = accessRequests.filter((a) => {
    if (activeTab === 'my' && a.requesterId !== currentUser.id) {
      return false;
    }
    if (activeTab === 'approvals') {
      if (a.status !== 'Pending Approval') return false;
      const stage = a.stages[a.currentStageIndex];
      const isAssigned =
        stage?.assignedApproverId === currentUser.id ||
        currentUser.roles.includes(stage?.roleOrPosition as any) ||
        currentUser.roles.includes('Super Admin');
      if (!isAssigned) return false;
    }

    if (selectedStatus !== 'all' && a.status !== selectedStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        a.requestNumber.toLowerCase().includes(q) ||
        a.serviceName.toLowerCase().includes(q) ||
        a.requesterName.toLowerCase().includes(q) ||
        a.departmentName.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        (a.assignedAccountEmail && a.assignedAccountEmail.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Calculate pending counts for badge
  const pendingPurchaseApprovals = requisitions.filter((r) => {
    if (r.status !== 'Pending Approval') return false;
    const stage = r.stages[r.currentStageIndex];
    return (
      stage?.assignedApproverId === currentUser.id ||
      currentUser.roles.includes(stage?.roleOrPosition as any) ||
      currentUser.roles.includes('Super Admin')
    );
  }).length;

  const pendingAccessApprovals = accessRequests.filter((a) => {
    if (a.status !== 'Pending Approval') return false;
    const stage = a.stages[a.currentStageIndex];
    return (
      stage?.assignedApproverId === currentUser.id ||
      currentUser.roles.includes(stage?.roleOrPosition as any) ||
      currentUser.roles.includes('Super Admin')
    );
  }).length;

  const getPurchaseStatusBadge = (status: RequisitionStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pending Approval
          </span>
        );
      case 'Purchased':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <CheckCircle2 className="w-3 h-3" />
            Purchased
          </span>
        );
      case 'Returned for Modification':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <RotateCcw className="w-3 h-3" />
            Returned
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getAccessStatusBadge = (status: AccessRequestStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Approved & Granted
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pending Approval
          </span>
        );
      case 'Returned for Modification':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <RotateCcw className="w-3 h-3" />
            Returned
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'Revoked':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Ban className="w-3 h-3" />
            Revoked
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            {viewMode === 'purchases' ? (
              <>
                <FileText className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                Purchase Requisitions
              </>
            ) : (
              <>
                <KeyRound className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                Tool & Service Access Requests
              </>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {viewMode === 'purchases'
              ? 'Manage purchase submissions, multi-stage approval flows, and procurement execution'
              : 'Request access to existing catalogue tools; approvers assign specific accounts/seats upon review'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsNewAccessModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Request Tool Access</span>
          </button>

          <button
            onClick={() => setIsNewReqModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Requisition</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Segment Switcher (Purchase vs Tool Access) */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => {
              setViewMode('purchases');
              setSelectedStatus('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'purchases'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Purchase Requisitions</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
              {requisitions.length}
            </span>
            {pendingPurchaseApprovals > 0 && (
              <span
                className="w-2 h-2 rounded-full bg-amber-500"
                title={`${pendingPurchaseApprovals} pending your approval`}
              />
            )}
          </button>

          <button
            onClick={() => {
              setViewMode('access');
              setSelectedStatus('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'access'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Tool Access Sharing</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
              {accessRequests.length}
            </span>
            {pendingAccessApprovals > 0 && (
              <span
                className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                title={`${pendingAccessApprovals} pending your approval`}
              />
            )}
          </button>
        </div>

        {/* Filter and Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                viewMode === 'purchases'
                  ? 'Search by ID, tool, requester...'
                  : 'Search by ACC ID, tool, account...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-48 sm:w-60 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            {viewMode === 'purchases' && <option value="Purchased">Purchased</option>}
            <option value="Returned for Modification">Returned</option>
            <option value="Rejected">Rejected</option>
            {viewMode === 'access' && <option value="Revoked">Revoked</option>}
          </select>
        </div>
      </div>

      {/* Sub-Tabs: All / My / Needs Approval */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          All {viewMode === 'purchases' ? 'Requisitions' : 'Access Requests'} (
          {viewMode === 'purchases' ? requisitions.length : accessRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('my')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === 'my'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          My Submissions (
          {viewMode === 'purchases'
            ? requisitions.filter((r) => r.requesterId === currentUser.id).length
            : accessRequests.filter((a) => a.requesterId === currentUser.id).length}
          )
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'approvals'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Needs My Approval
          {(viewMode === 'purchases' ? pendingPurchaseApprovals : pendingAccessApprovals) > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* VIEW MODE 1: Purchase Requisitions Table */}
      {viewMode === 'purchases' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Req ID</th>
                  <th className="py-3 px-4">Service & Plan</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Estimated Cost</th>
                  <th className="py-3 px-4">Billing Cycle</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      No purchase requisitions found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((req) => {
                    const currentStage = req.stages[req.currentStageIndex];

                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedReq(req)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                          {req.requisitionNumber}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {req.serviceName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {req.requestedPlan}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {req.requesterName}
                          </div>
                          <div className="text-[10px] text-slate-400">{req.requesterEmail}</div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {req.departmentName}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                          ${req.estimatedAmount.toFixed(2)}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            {req.currency}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {req.billingCycle}
                        </td>

                        <td className="py-3 px-4 text-[11px]">
                          {currentStage && req.status === 'Pending Approval' ? (
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              Stage {req.currentStageIndex + 1}: {currentStage.stageName}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {req.status === 'Purchased' ? 'Procured' : req.status}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getPurchaseStatusBadge(req.status)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReq(req);
                            }}
                            className="p-1 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="View Requisition Timeline & Actions"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              Showing <strong>{filteredPurchases.length}</strong> of {requisitions.length} purchase requisitions
            </span>
            <span className="text-[11px]">Click any row to inspect financial details & approval actions</span>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Tool Access Sharing Requests Table */}
      {viewMode === 'access' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Tool / Service</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Purpose & Duration</th>
                  <th className="py-3 px-4">Assigned Account / Seat</th>
                  <th className="py-3 px-4">Approval Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredAccess.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <KeyRound className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      No access requests found matching the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredAccess.map((req) => {
                    const currentStage = req.stages[req.currentStageIndex];

                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedAccessReq(req)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                          {req.requestNumber}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-sky-500" />
                            {req.serviceName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {req.category}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {req.requesterName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {req.departmentName} &bull; {req.requesterEmail}
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-slate-700 dark:text-slate-300 truncate" title={req.reason}>
                            {req.reason}
                          </div>
                          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                            {req.duration}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {req.assignedAccountEmail ? (
                            <div>
                              <span className="font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-sm border border-emerald-200 dark:border-emerald-800 text-[11px]">
                                {req.assignedAccountEmail}
                              </span>
                              {req.assignedPlanName && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {req.assignedPlanName}
                                </div>
                              )}
                            </div>
                          ) : req.preferredAccountEmail ? (
                            <span className="text-[11px] text-slate-500 italic">
                              Pref: {req.preferredAccountEmail}
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                              Approver selects seat
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[11px]">
                          {currentStage && req.status === 'Pending Approval' ? (
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              Stage {req.currentStageIndex + 1}: {currentStage.stageName}
                            </span>
                          ) : (
                            <span className="text-slate-400">{req.status}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getAccessStatusBadge(req.status)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccessReq(req);
                            }}
                            className="p-1 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-sky-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Inspect Access Request & Approver Account Selector"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              Showing <strong>{filteredAccess.length}</strong> of {accessRequests.length} tool access requests
            </span>
            <span className="text-[11px]">Approver selects tool account & credentials note during approval</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <RequisitionDetailModal
        requisition={selectedReq}
        onClose={() => setSelectedReq(null)}
      />

      <AccessRequestDetailModal
        accessRequest={selectedAccessReq}
        onClose={() => setSelectedAccessReq(null)}
      />

      <NewRequisitionModal
        isOpen={isNewReqModalOpen}
        onClose={() => setIsNewReqModalOpen(false)}
      />

      <NewAccessRequestModal
        isOpen={isNewAccessModalOpen}
        onClose={() => setIsNewAccessModalOpen(false)}
      />
    </div>
  );
};
