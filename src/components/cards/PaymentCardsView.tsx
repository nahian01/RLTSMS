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
  Search,
  Clock,
  Timer,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentCard } from '../../types';

export const PaymentCardsView: React.FC = () => {
  const {
    cards,
    cardLogs,
    cardPermissions,
    users,
    currentUser,
    canViewCardDetails,
    getCardMaskedInfo,
    revealCardWithPassword,
    grantCardVisibility,
    revokeCardVisibility,
    createCard,
    revealedCards,
  } = useApp();

  const [selectedCardForPerms, setSelectedCardForPerms] = useState<PaymentCard | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);

  // Password-Protected Reveal Modal State (Part 9.3)
  const [revealTargetCard, setRevealTargetCard] = useState<PaymentCard | null>(null);
  const [verifyPasswordInput, setVerifyPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // New card form state (Exact schema preserved!)
  const [newCardName, setNewCardName] = useState('');
  const [newNetwork, setNewNetwork] = useState<'Visa' | 'Mastercard' | 'American Express'>('Visa');
  const [newBank, setNewBank] = useState('');
  const [newHolder, setNewHolder] = useState('');
  const [newLastFour, setNewLastFour] = useState('');
  const [newCurrency, setNewCurrency] = useState<'USD' | 'BDT' | 'EUR'>('USD');
  const [newExpMonth, setNewExpMonth] = useState('12');
  const [newExpYear, setNewExpYear] = useState('2028');

  const handleRevealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revealTargetCard || !verifyPasswordInput) return;

    setIsVerifying(true);
    setPasswordError('');

    const res = await revealCardWithPassword(revealTargetCard.id, verifyPasswordInput);
    setIsVerifying(false);

    if (res.success) {
      setRevealTargetCard(null);
      setVerifyPasswordInput('');
    } else {
      setPasswordError(res.error || 'Failed to verify password.');
    }
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim() || newLastFour.length !== 4) return;

    createCard({
      cardName: newCardName.trim(),
      network: newNetwork,
      bankName: newBank.trim() || 'Commercial Bank',
      holderName: newHolder.trim() || currentUser.name,
      lastFour: newLastFour.trim(),
      currency: newCurrency,
      expiryMonth: newExpMonth,
      expiryYear: newExpYear,
      status: 'Active',
      authorizedUserIds: [currentUser.id],
      ownerId: currentUser.id,
      ownerName: currentUser.name,
    });

    setIsAddCardOpen(false);
    setNewCardName('');
    setNewLastFour('');
    setNewBank('');
    setNewHolder('');
  };

  const handleTogglePermission = async (targetUserId: string) => {
    if (!selectedCardForPerms) return;
    const isGranted = selectedCardForPerms.authorizedUserIds.includes(targetUserId);

    if (isGranted) {
      await revokeCardVisibility(selectedCardForPerms.id, targetUserId);
      setSelectedCardForPerms({
        ...selectedCardForPerms,
        authorizedUserIds: selectedCardForPerms.authorizedUserIds.filter((id) => id !== targetUserId),
      });
    } else {
      await grantCardVisibility(selectedCardForPerms.id, targetUserId);
      setSelectedCardForPerms({
        ...selectedCardForPerms,
        authorizedUserIds: [...selectedCardForPerms.authorizedUserIds, targetUserId],
      });
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.departmentName.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Secure Area Shield Banner */}
      <div className="p-5 rounded-2xl bg-[#211E1F] text-white border border-[#2D292A] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EA5400]/20 text-[#EA5400] flex items-center justify-center shrink-0 border border-[#EA5400]/40">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Restricted Payment Cards Registry
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1A1718] text-[#EA5400] border border-[#EA5400]/30 font-semibold">
                Owner-Controlled Zero-Trust
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Strict owner-governed visibility: Card information requires explicit owner authorization AND viewer password verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddCardOpen(true)}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Card</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const isOwner = card.ownerId === currentUser.id;
          const isAuthorized = canViewCardDetails(card.id);
          const cardInfo = getCardMaskedInfo(card.id);
          const isCurrentlyRevealed = Boolean(cardInfo.isRevealed);
          const timeRemaining = cardInfo.secondsRemaining || 0;
          const authorizedUsersCount = card.authorizedUserIds.length;

          return (
            <div
              key={card.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                isAuthorized
                  ? 'bg-white dark:bg-[#211E1F] border-slate-200 dark:border-[#2D292A] shadow-2xs'
                  : 'bg-slate-50 dark:bg-[#1A1718] border-slate-200/80 dark:border-[#2D292A] opacity-90'
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
                    <div className="text-[11px] text-[#EA5400] font-medium mt-0.5">
                      Owner: {card.ownerName || 'David Vance'}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isOwner
                        ? 'bg-[#FFF1EB] text-[#EA5400] dark:bg-[#EA5400]/20 dark:text-[#EA5400] border border-[#EA5400]/30'
                        : isAuthorized
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {isOwner ? 'Owner' : isAuthorized ? 'Authorized' : 'Restricted'}
                  </span>
                </div>

                {/* Card visual mask representation */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#211E1F] to-[#121011] text-white space-y-3 shadow-inner border border-[#2D292A]">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{card.bankName}</span>
                    <span className="font-bold text-[#EA5400]">{card.network}</span>
                  </div>

                  {/* Masked vs Revealed number representation */}
                  <div className="font-mono tracking-widest text-sm text-center py-2">
                    {isCurrentlyRevealed ? (
                      <div className="space-y-1">
                        <span className="tabular-nums font-bold text-emerald-400 text-base">
                          •••• •••• •••• {card.lastFour}
                        </span>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-300 font-sans tracking-normal">
                          <Timer className="w-3 h-3 animate-spin" />
                          <span>Auto-masking in {timeRemaining}s</span>
                        </div>
                      </div>
                    ) : isAuthorized ? (
                      <span className="tabular-nums font-bold text-slate-400">
                        •••• •••• •••• ••••
                      </span>
                    ) : (
                      <span className="text-slate-500 font-semibold tracking-normal text-xs flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Restricted Card Details
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-end text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <div>
                      <span className="block text-[8px] uppercase">Holder</span>
                      <span className="text-slate-200">
                        {isAuthorized ? card.holderName : 'Company Cardholder'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase">Expires</span>
                      <span className="text-slate-200 font-mono">
                        {isCurrentlyRevealed
                          ? `${card.expiryMonth}/${card.expiryYear.slice(-2)}`
                          : '••/••'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Viewers Count */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Authorized Viewers:</span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {authorizedUsersCount} user(s)
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Card Status: <strong className="text-emerald-600">{card.status}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Password Reveal & Owner Visibility Management */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#2D292A] flex items-center justify-between gap-2">
                {/* Reveal Card Info button */}
                <button
                  type="button"
                  onClick={() => {
                    setRevealTargetCard(card);
                    setVerifyPasswordInput('');
                    setPasswordError('');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isCurrentlyRevealed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-[#FFF1EB] text-[#EA5400] hover:bg-[#FFE4D6] dark:bg-[#EA5400]/20 dark:text-[#EA5400]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isCurrentlyRevealed ? `Revealed (${timeRemaining}s)` : 'Reveal Details'}</span>
                </button>

                {/* Card Owner Visibility Management button */}
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCardForPerms(card)}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#2A2627] hover:bg-slate-200 dark:hover:bg-[#332F30] rounded-lg transition-colors cursor-pointer"
                  >
                    Manage Viewers ({authorizedUsersCount})
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 italic">
                    Controlled by Owner
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Access Audit Trail (Part 9.6) */}
      <div className="p-5 bg-white dark:bg-[#211E1F] rounded-2xl border border-slate-200 dark:border-[#2D292A] shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#EA5400]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Card Detail Access & Reveal Audit Trail
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Immutable log of all password-verified reveals, authorization grants and failed attempts
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#2D292A]">
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
                  <strong className="text-slate-800 dark:text-slate-200">{log.cardName}</strong>
                  {log.justification && (
                    <div className="text-[11px] text-slate-400 italic">
                      "{log.justification}"
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1A1718] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {log.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PASSWORD VERIFICATION MODAL (Part 9.3) */}
      {revealTargetCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setRevealTargetCard(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#211E1F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D292A] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EA5400]/20 text-[#EA5400] flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Password-Protected Card Reveal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {revealTargetCard.cardName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Per Riseup Labs zero-trust card governance (Part 9), enter your <strong>RLTSMS account password</strong> to verify your identity and view this card for 30 seconds.
            </p>

            <form onSubmit={handleRevealSubmit} className="space-y-4 text-xs">
              {passwordError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="font-semibold block mb-1">Your RLTSMS Account Password</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter your account password..."
                  value={verifyPasswordInput}
                  onChange={(e) => setVerifyPasswordInput(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  (Default corporate test password: <code>RiseupLabs@2026</code>)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2D292A]">
                <button
                  type="button"
                  onClick={() => setRevealTargetCard(null)}
                  className="px-3 py-1.5 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-1.5 font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Verify & Reveal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CARD OWNER VISIBILITY MANAGEMENT MODAL (Part 9.2) */}
      {selectedCardForPerms && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedCardForPerms(null)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#211E1F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D292A] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2D292A]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Card Visibility Management: {selectedCardForPerms.cardName}
                </h3>
                <p className="text-xs text-slate-500">
                  Owner authority: Grant or revoke individual viewing permissions (Part 9.2)
                </p>
              </div>
              <button
                onClick={() => setSelectedCardForPerms(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Search user */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search employees by name, email, department..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-slate-50 dark:bg-[#1A1718] text-slate-900 dark:text-white"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {filteredUsers.map((u) => {
                const isAuth = selectedCardForPerms.authorizedUserIds.includes(u.id);
                const isCardOwner = selectedCardForPerms.ownerId === u.id;

                return (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2D292A] flex items-center justify-between bg-slate-50/50 dark:bg-[#1A1718]/50"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isCardOwner && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FFF1EB] text-[#EA5400] font-bold">
                            Owner
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {u.roles.join(', ')} · {u.departmentName}
                      </div>
                    </div>

                    {!isCardOwner ? (
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(u.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          isAuth
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                        }`}
                      >
                        {isAuth ? 'Revoke Access' : 'Grant Access'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Controlling Authority</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#2D292A]">
              <button
                onClick={() => setSelectedCardForPerms(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {isAddCardOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAddCardOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#211E1F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D292A] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2D292A]">
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
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Network</label>
                  <select
                    value={newNetwork}
                    onChange={(e) => setNewNetwork(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
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
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
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
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Last 4 Digits Only (Zero-PAN)</label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    placeholder="e.g. 8492"
                    value={newLastFour}
                    onChange={(e) => setNewLastFour(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Currency</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white"
                  >
                    <option value="USD">USD</option>
                    <option value="BDT">BDT</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Expiry Month</label>
                  <input
                    type="text"
                    maxLength={2}
                    required
                    value={newExpMonth}
                    onChange={(e) => setNewExpMonth(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Expiry Year</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={newExpYear}
                    onChange={(e) => setNewExpYear(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-[#2D292A] bg-white dark:bg-[#1A1718] text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#2D292A]">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] rounded-lg cursor-pointer"
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
