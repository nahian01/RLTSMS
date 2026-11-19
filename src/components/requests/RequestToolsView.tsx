import React, { useState, useMemo } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  AlertCircle,
  Eye,
  Sparkles,
  Layers,
  Tag,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccessRequest, AccountAccessAssignment } from '../../types';
import { NewAccessRequestModal } from '../requisitions/NewAccessRequestModal';
import { AccessRequestDetailModal } from '../requisitions/AccessRequestDetailModal';

export const RequestToolsView: React.FC = () => {
  const {
    currentUser,
    accessRequests,
    accessAssignments,
    services,
    accounts,
  } = useApp();

  // Active filter tab: 'approved' (default), 'pending', or 'all'
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'all'>('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<AccessRequest | null>(null);

  // Filter requests strictly belonging to current user
  const myRequests = useMemo(() => {
    return accessRequests.filter(
      (r) => r.requesterId === currentUser.id || r.requesterEmail.toLowerCase() === currentUser.email.toLowerCase()
    );
  }, [accessRequests, currentUser]);

  // Approved requests (approved status)
  const approvedRequests = useMemo(() => {
    return myRequests.filter((r) => r.status === 'Approved');
  }, [myRequests]);

  // Pending requests (in progress)
  const pendingRequests = useMemo(() => {
    return myRequests.filter(
      (r) => r.status === 'Pending Approval' || r.status === 'Under Review' || r.status === 'Pending'
    );
  }, [myRequests]);

  // Active access assignments directly granted to this employee
  const myDirectAssignments = useMemo(() => {
    return accessAssignments.filter(
      (a) =>
        (a.recipientId === currentUser.id || a.recipientEmail?.toLowerCase() === currentUser.email.toLowerCase()) &&
        a.status === 'Active'
    );
  }, [accessAssignments, currentUser]);

  // Displayed requests based on active tab and search query
  const displayedRequests = useMemo(() => {
    let list: AccessRequest[] = [];
    if (activeTab === 'approved') {
      list = approvedRequests;
    } else if (activeTab === 'pending') {
      list = pendingRequests;
    } else {
      list = myRequests;
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (r) =>
        r.serviceName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.requestNumber.toLowerCase().includes(q) ||
        (r.additionalExplanation && r.additionalExplanation.toLowerCase().includes(q))
    );
  }, [activeTab, approvedRequests, pendingRequests, myRequests, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EA5400]/10 flex items-center justify-center text-[#EA5400]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Request Service/Tools
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Submit access requests for corporate tools & services, and manage your approved seats
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#d04b00] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Request Tool / Service</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('approved')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Approved Tools & Seats</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {approvedRequests.length}
            </span>
            <span className="text-xs text-slate-500">active approved</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Authorized company seats ready for use
          </p>
        </div>

        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-1 ring-amber-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {pendingRequests.length}
            </span>
            <span className="text-xs text-slate-500">in review</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Awaiting Team Lead or Admin verification
          </p>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 ring-1 ring-sky-500/20'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Total Requests</span>
            <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {myRequests.length}
            </span>
            <span className="text-xs text-slate-500">submitted</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Lifetime access sharing requests
          </p>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved Tools ({approvedRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Approvals ({pendingRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>All Requests ({myRequests.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tool name, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
          />
        </div>
      </div>

      {/* Main Request Cards List */}
      {displayedRequests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EA5400]/10 text-[#EA5400] flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {activeTab === 'approved'
              ? 'No Approved Tool Requests Yet'
              : activeTab === 'pending'
              ? 'No Pending Requests In Review'
              : 'No Tool Requests Found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === 'approved'
              ? 'When your access requests for company tools are reviewed and approved by management, your authorized seats and access details will appear right here.'
              : 'Submit a tool or service access request to gain credentials for digital products and workspaces.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#d04b00] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Request Service/Tool Access</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedRequests.map((req) => {
            const isApproved = req.status === 'Approved';
            const isPending = req.status === 'Pending Approval' || req.status === 'Under Review' || req.status === 'Pending';
            const serviceObj = services.find((s) => s.id === req.serviceId);

            // Check if there is an active matching account assignment
            const matchingAssignment = myDirectAssignments.find(
              (a) => a.serviceId === req.serviceId
            );

            return (
              <div
                key={req.id}
                className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-2xs flex flex-col justify-between gap-4 hover:border-[#EA5400]/40 transition-colors"
              >
                <div>
                  {/* Top Bar: Tool Name & Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {req.serviceName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-slate-400">{req.requestNumber}</span>
                        {req.serviceCategory && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-medium bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300">
                            {req.serviceCategory}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isApproved && <Check className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      <span>{req.status}</span>
                    </span>
                  </div>

                  {/* Access & Reason Details */}
                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-750 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Access Type:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {req.requestedAccessType || 'Standard Seat'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">Duration:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {req.duration}
                        </span>
                      </div>
                      {matchingAssignment && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="text-slate-500 dark:text-slate-400">Assigned Account:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                            {matchingAssignment.accountEmail}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Reason Provided:
                      </span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 font-medium leading-relaxed">
                        {req.reason}
                      </p>
                      {req.additionalExplanation && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {req.additionalExplanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-750 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Workflow: Stage {req.currentStageIndex + 1}/{req.stages.length}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isApproved && serviceObj?.website && (
                      <a
                        href={serviceObj.website}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Launch</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedDetailRequest(req)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-[#EA5400] hover:bg-[#EA5400]/10 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Access Request Modal */}
      <NewAccessRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      {/* Access Request Detail Modal */}
      <AccessRequestDetailModal
        accessRequest={selectedDetailRequest}
        onClose={() => setSelectedDetailRequest(null)}
      />
    </div>
  );
};
