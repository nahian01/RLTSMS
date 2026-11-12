import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Eye,
  Key,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  History,
  Info,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentCard } from '../../types';

export const PaymentCardsView: React.FC = () => {
  const {
    cards,
    cardLogs,
    users,
    currentUser,
    canViewCardDetails,
    updateCardAuthorizedUsers,
    createCard,
    emergencyAccessCard,
  } = useApp();

  const [selectedCardForPerms, setSelectedCardForPerms] = useState<PaymentCard | null>(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [emergencyCardId, setEmergencyCardId] = useState<string | null>(null);
  const [emergencyJustification, setEmergencyJustification] = useState('');
  const [emergencyError, setEmergencyError] = useState('');

  // New card form state
  const [newCardName, setNewCardName] = useState('');
  const [newNetwork, setNewNetwork] = useState<'Visa' | 'Mastercard' | 'American Express'>('Visa');
  const [newBank, setNewBank] = useState('');
  const [newHolder, setNewHolder] = useState('');
  const [newLastFour, setNewLastFour] = useState('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'BDT' | 'EUR'>('USD');
  const [newExpMonth, setNewExpMonth] = useState('12');
  const [newExpYear, setNewExpYear] = useState('2028');

  const handleToggleUserAuth = (userId: string) => {
    if (!selectedCardForPerms) return;
    const currentList = selectedCardForPerms.authorizedUserIds;
    const updated = currentList.includes(userId)
      ? currentList.filter((id) => id !== userId)
      : [...currentList, userId];

    updateCardAuthorizedUsers(selectedCardForPerms.id, updated);
    setSelectedCardForPerms({ ...selectedCardForPerms, authorizedUserIds: updated });
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim() || newLastFour.length !== 4) return;

    createCard({
      cardName: newCardName.trim(),
      network: newNetwork,
      bankName: newBank.trim() || 'Commercial Bank',
      holderName: newHolder.trim() || 'Riseup Labs Corp',
      lastFour: newLastFour.trim(),
      currency: newCurrency,
      expiryMonth: newExpMonth,
      expiryYear: newExpYear,
      status: 'Active',
      authorizedUserIds: [currentUser.id, 'usr-admin', 'usr-7'],
    });

    setIsAddCardOpen(false);
    setNewCardName('');
    setNewLastFour('');
  };

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyCardId || emergencyJustification.trim().length < 10) {
      setEmergencyError('Please enter a valid audit justification (min 10 characters).');
      return;
    }
    emergencyAccessCard(emergencyCardId, emergencyJustification.trim());
    setEmergencyCardId(null);
    setEmergencyJustification('');
    setEmergencyError('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Secure Area Shield Banner (PRD Section 10 & 24.2 Item 10) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Restricted Payment Cards Registry
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                PCI-DSS Zero-PAN Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict server-side authorization boundary: Full card numbers and CVVs are never stored. Access is audited per event.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddCardOpen(true)}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          + Register Card
        </button>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const isAuthorized = canViewCardDetails(card.id);
          const authorizedUsersCount = card.authorizedUserIds.length;

          return (
            <div
              key={card.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                isAuthorized
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 opacity-90'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">
                      {card.currency} · {card.network}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {card.cardName}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isAuthorized
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isAuthorized ? 'Authorized' : 'Restricted'}
                  </span>
                </div>

                {/* Card visual mask representation */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white space-y-3 shadow-inner">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{card.bankName}</span>
                    <span className="font-bold text-sky-400">{card.network}</span>
                  </div>

                  <div className="font-mono tracking-widest text-sm text-center py-1">
                    {isAuthorized ? (
                      <span className="tabular-nums font-bold">•••• •••• •••• {card.lastFour}</span>
                    ) : (
                      <span className="text-slate-500 font-semibold tracking-normal text-xs flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Restricted Card Details
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-end text-[10px] text-slate-400 pt-1">
                    <div>
                      <span className="block text-[8px] uppercase">Holder</span>
                      <span className="text-slate-200">
                        {isAuthorized ? card.holderName : 'Company Cardholder'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase">Expires</span>
                      <span className="text-slate-200 font-mono">
                        {isAuthorized ? `${card.expiryMonth}/${card.expiryYear.slice(-2)}` : '••/••'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permission status & Authorized viewers */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Authorized Viewers:</span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {authorizedUsersCount} user(s)
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Status: <strong className="text-emerald-600">{card.status}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCardForPerms(card)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  Manage Viewers ({authorizedUsersCount})
                </button>

                {!isAuthorized && (
                  <button
                    onClick={() => setEmergencyCardId(card.id)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
                  >
                    Emergency Unlock
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Access Audit Trail (PRD Section 10 Rule 5 & Section 15) */}
      <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Card Detail Access & Audit Log
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Immutable log of all card inspection & authorization changes
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {cardLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">{log.userName}</span>{' '}
                  <span className="text-slate-500">accessed</span>{' '}
                  <strong className="text-slate-700 dark:text-slate-200">{log.cardName}</strong>
                  {log.justification && (
                    <div className="text-[11px] text-slate-400 italic">
                      Justification: "{log.justification}"
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {log.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Authorized Users Drawer / Modal */}
      {selectedCardForPerms && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedCardForPerms(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Manage Card Viewers: {selectedCardForPerms.cardName}
                </h3>
                <p className="text-xs text-slate-500">
                  Explicitly grant or revoke card viewing rights (PRD Section 10 Rule 6)
                </p>
              </div>
              <button
                onClick={() => setSelectedCardForPerms(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {users.map((u) => {
                const isAuth = selectedCardForPerms.authorizedUserIds.includes(u.id);

                return (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {u.roles.join(', ')} · {u.departmentName}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleUserAuth(u.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        isAuth
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                      }`}
                    >
                      {isAuth ? 'Revoke Access' : 'Grant Access'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedCardForPerms(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Access Modal */}
      {emergencyCardId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setEmergencyCardId(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold">Audited Emergency Card Access</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Per Riseup Labs policy (PRD Section 10 Rule 10), any emergency access to payment card numbers must be explicitly justified and permanently recorded in the central audit ledger.
            </p>

            <form onSubmit={handleEmergencySubmit} className="space-y-3 text-xs">
              {emergencyError && <p className="text-rose-600 text-xs">{emergencyError}</p>}
              <textarea
                rows={3}
                required
                value={emergencyJustification}
                onChange={(e) => setEmergencyJustification(e.target.value)}
                placeholder="State the formal business or audit justification..."
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmergencyCardId(null)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                >
                  Authorize & View
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {isAddCardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAddCardOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Register Company Payment Card
              </h3>
              <button
                onClick={() => setIsAddCardOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Card Name / Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Production Visa, Digital Marketing Card..."
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Network</label>
                  <select
                    value={newNetwork}
                    onChange={(e) => setNewNetwork(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Chartered, HSBC"
                    value={newBank}
                    onChange={(e) => setNewBank(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Vance / Riseup Labs"
                    value={newHolder}
                    onChange={(e) => setNewHolder(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Last 4 Digits Only</label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    placeholder="e.g. 8492"
                    value={newLastFour}
                    onChange={(e) => setNewLastFour(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
                >
                  Register Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
