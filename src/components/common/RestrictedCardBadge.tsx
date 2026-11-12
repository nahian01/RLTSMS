import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RestrictedCardBadgeProps {
  cardId?: string;
  size?: 'sm' | 'md';
  showDetailsModalOnClick?: boolean;
}

export const RestrictedCardBadge: React.FC<RestrictedCardBadgeProps> = ({
  cardId,
  size = 'md',
  showDetailsModalOnClick = true,
}) => {
  const { getCardMaskedInfo, currentUser, emergencyAccessCard } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [justification, setJustification] = useState('');
  const [emergencyError, setEmergencyError] = useState('');

  if (!cardId) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        No card linked
      </span>
    );
  }

  const cardInfo = getCardMaskedInfo(cardId);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDetailsModalOnClick) {
      setShowModal(true);
    }
  };

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim() || justification.trim().length < 10) {
      setEmergencyError('Please provide a legitimate audit justification (min 10 characters).');
      return;
    }
    emergencyAccessCard(cardId, justification.trim());
    setJustification('');
    setEmergencyError('');
  };

  // If authorized to view masked details
  if (cardInfo.isAuthorized) {
    return (
      <>
        <button
          type="button"
          onClick={handleOpenModal}
          className={`inline-flex items-center gap-1.5 font-mono text-xs tracking-tight transition-colors cursor-pointer ${
            size === 'sm' ? 'py-0.5 px-2' : 'py-1 px-2.5'
          } rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60`}
          title={`Authorized payment card: ${cardInfo.cardName} (${cardInfo.network} •••• ${cardInfo.lastFour})`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium text-emerald-900 dark:text-emerald-200">{cardInfo.network}</span>
          <span className="tabular-nums">•••• {cardInfo.lastFour}</span>
        </button>

        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          >
            <div
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Authorized Card Details
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Viewable by authorized financial personnel
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1 rounded-md"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Card Name</span>
                  <span className="font-medium text-slate-900 dark:text-white">{cardInfo.cardName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Bank / Issuer</span>
                  <span className="font-medium text-slate-900 dark:text-white">{cardInfo.bankName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Card Network</span>
                  <span className="font-medium text-slate-900 dark:text-white">{cardInfo.network}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Masked Number</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-white">
                    •••• •••• •••• {cardInfo.lastFour}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">Cardholder</span>
                  <span className="text-slate-900 dark:text-white text-xs">{cardInfo.holderName}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Per Riseup Labs policy (PRD Section 10), full CVV, PIN, and complete 16-digit PAN are never stored. Access to this masked record is actively audited.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // If unauthorized: Neutral "Restricted Card" badge (PRD Section 10: Rule 3 & Section 24)
  return (
    <>
      <button
        type="button"
        onClick={handleOpenModal}
        className={`inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${
          size === 'sm' ? 'py-0.5 px-2' : 'py-1 px-2.5'
        } rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700`}
        title="Restricted Card: Financial details are restricted to explicitly authorized personnel."
      >
        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {cardInfo.cardName ? `${cardInfo.cardName} (Restricted)` : 'Restricted Card'}
        </span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Access Restricted
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Payment card information is protected
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your active role (<strong>{currentUser.name}</strong> -{' '}
              {currentUser.roles.join(', ')}) does not have explicit authorization to inspect company card numbers or banking institutions.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Need access?</p>
              <p>
                Contact Super Administrator <strong>Abdullah Nahian</strong> or Finance Officer <strong>David Vance</strong> to request Card Information Viewer permissions.
              </p>
            </div>

            {/* Emergency access mechanism (PRD Section 10 Rule 10) */}
            <form onSubmit={handleEmergencySubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Audited Emergency Access Override</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Authorized auditors or department heads can invoke an audited one-time viewing by providing a justification.
              </p>
              <input
                type="text"
                placeholder="Enter justification (e.g. Urgent invoice audit #491)..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
              {emergencyError && <p className="text-xs text-rose-500">{emergencyError}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors cursor-pointer"
                >
                  Log & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
