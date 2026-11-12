import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldCheck,
  Building,
  User as UserIcon,
  Clock,
  Sparkles,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NewAccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: string;
}

export const NewAccessRequestModal: React.FC<NewAccessRequestModalProps> = ({
  isOpen,
  onClose,
  initialServiceId,
}) => {
  const { services, accounts, currentUser, workflows, predefinedReasons, createAccessRequest } = useApp();

  const [serviceId, setServiceId] = useState<string>(initialServiceId || (services[0]?.id || ''));
  const [preferredAccountId, setPreferredAccountId] = useState<string>('');
  const [requestedAccessType, setRequestedAccessType] = useState<string>('Standard User Seat');
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [customReasonText, setCustomReasonText] = useState('');
  const [additionalExplanation, setAdditionalExplanation] = useState('');
  const [duration, setDuration] = useState<
    'Permanent' | 'Project-based (3 Months)' | 'Project-based (6 Months)' | 'Temporary (1 Month)'
  >('Project-based (3 Months)');
  const [error, setError] = useState('');

  // Active predefined reasons sorted by displayOrder
  const enabledReasons = (predefinedReasons || [])
    .filter((r) => r.isEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  // Set default selectedReasonId when reasons are available
  React.useEffect(() => {
    if (!selectedReasonId && enabledReasons.length > 0) {
      setSelectedReasonId(enabledReasons[0].id);
    }
  }, [enabledReasons, selectedReasonId]);

  // Update serviceId when initialServiceId changes
  React.useEffect(() => {
    if (initialServiceId) {
      setServiceId(initialServiceId);
    } else if (!serviceId && services.length > 0) {
      setServiceId(services[0].id);
    }
  }, [initialServiceId, services]);

  if (!isOpen) return null;

  const selectedService = services.find((s) => s.id === serviceId);
  const serviceAccounts = accounts.filter((a) => a.serviceId === serviceId && a.accountStatus === 'Active');

  // Preview the access workflow
  const accessWorkflow =
    workflows.find((w) => w.isActive && w.purpose === 'Access-sharing requests') ||
    workflows.find((w) => w.purpose === 'Access-sharing requests') ||
    workflows[0];

  const selectedReasonObj = enabledReasons.find((r) => r.id === selectedReasonId);
  const isOtherReason = selectedReasonObj?.name.toLowerCase() === 'other';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId) {
      setError('Please select a service or tool.');
      return;
    }

    const effectiveReasonName = isOtherReason
      ? customReasonText.trim()
      : selectedReasonObj?.name || 'Business Requirement';

    if (!effectiveReasonName) {
      setError('Please select or specify a reason for requiring access.');
      return;
    }

    if (isOtherReason && !customReasonText.trim()) {
      setError('Please explain your reason under "Specify Reason".');
      return;
    }

    createAccessRequest({
      serviceId,
      requestedAccessType,
      reasonId: selectedReasonId || undefined,
      reason: effectiveReasonName,
      additionalExplanation: additionalExplanation.trim() || undefined,
      duration,
      preferredAccountId: preferredAccountId || undefined,
    });

    onClose();
    setCustomReasonText('');
    setAdditionalExplanation('');
    setPreferredAccountId('');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Request Tool / Service Access
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit an access sharing request. The approver will assign an available account or seat upon review.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Requester Identity Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {currentUser.name}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Requester
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUser.departmentName} &bull; {currentUser.teamName || 'Engineering'}
                </div>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              {currentUser.email}
            </div>
          </div>

          {/* Target Tool or Service Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Tool or Service <span className="text-rose-500">*</span>
            </label>
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setPreferredAccountId('');
              }}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              required
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category} - {s.subcategory})
                </option>
              ))}
            </select>
          </div>

          {/* Requested Access Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Requested Access Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={requestedAccessType}
              onChange={(e) => setRequestedAccessType(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              required
            >
              <option value="Standard User Seat">Standard User Seat (Shared License / Team Member)</option>
              <option value="Full Dedicated Account">Full Dedicated Account (Individual Credentials Managed)</option>
              <option value="Administrator Access">Administrator / Project Owner Access</option>
              <option value="Viewer / Read-Only">Viewer / Read-Only / Auditor</option>
              <option value="API / Developer Key">API / Developer Access / Token</option>
            </select>
          </div>

          {/* Predefined Business Reason Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Predefined Business Reason <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedReasonId}
              onChange={(e) => setSelectedReasonId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              required
            >
              {enabledReasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.description ? `— ${r.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Custom reason when "Other" is selected */}
          {isOtherReason && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Specify Reason <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customReasonText}
                onChange={(e) => setCustomReasonText(e.target.value)}
                placeholder="Specify your specific business reason..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                required
              />
            </div>
          )}

          {/* Additional Business Explanation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Explanation & Context (Optional)
            </label>
            <textarea
              rows={2}
              value={additionalExplanation}
              onChange={(e) => setAdditionalExplanation(e.target.value)}
              placeholder="Provide any specific project codes, client requirements, or details to assist the approver..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Available Accounts Summary for selected service */}
          {selectedService && (
            <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Active Accounts Registered in RLTSMS: {serviceAccounts.length}
                </span>
                <span className="text-[10px] text-sky-700 dark:text-sky-400">
                  Approver selects account during review
                </span>
              </div>

              {serviceAccounts.length > 0 ? (
                <div className="space-y-1.5">
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400">
                    Preferred Account / Seat (Optional):
                  </label>
                  <select
                    value={preferredAccountId}
                    onChange={(e) => setPreferredAccountId(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="">No preference — let approver assign best available seat</option>
                    {serviceAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountEmail} ({acc.planTier || acc.planName} - {acc.assignmentType || (acc.assignedUserName ? 'Dedicated' : 'Shared Pool')})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Note: No active accounts currently registered for this tool. Approver or Purchaser can assign or provision one upon approval.
                </p>
              )}
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Access Duration <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  'Project-based (3 Months)',
                  'Project-based (6 Months)',
                  'Temporary (1 Month)',
                  'Permanent',
                ] as const
              ).map((dur) => (
                <button
                  type="button"
                  key={dur}
                  onClick={() => setDuration(dur)}
                  className={`px-2.5 py-2 text-xs rounded-lg border text-center transition-all cursor-pointer ${
                    duration === dur
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
          </div>



          {/* Workflow routing preview */}
          {accessWorkflow && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                  Routing via: {accessWorkflow.name}
                </span>
                <span className="text-[10px] text-slate-400">{accessWorkflow.stages.length} Stage Approval</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-slate-500 dark:text-slate-400">
                {accessWorkflow.stages.map((stg, idx) => (
                  <div key={stg.id} className="flex items-center gap-1.5 shrink-0">
                    <span className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{stg.name}</span>
                    {idx < accessWorkflow.stages.length - 1 && <span className="text-slate-300">&rarr;</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Submit Access Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
