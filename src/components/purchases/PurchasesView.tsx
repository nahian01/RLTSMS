import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  DollarSign,
  Building,
  CreditCard,
  FileText,
  Upload,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Requisition, PurchaseRecord, BillingCycle } from '../../types';
import { RestrictedCardBadge } from '../common/RestrictedCardBadge';

export const PurchasesView: React.FC = () => {
  const {
    requisitions,
    purchases,
    vendors,
    cards,
    currentUser,
    completePurchase,
    calculateRenewalDate,
    selectedItemId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [selectedReqForPurchase, setSelectedReqForPurchase] = useState<Requisition | null>(null);

  // Purchase Form State
  const [actualPlan, setActualPlan] = useState('');
  const [actualAmount, setActualAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<'USD' | 'BDT' | 'EUR' | 'GBP'>('USD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseSource, setPurchaseSource] = useState<'Direct' | 'Vendor'>('Direct');
  const [providerName, setProviderName] = useState('');
  const [providerWebsite, setProviderWebsite] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [paymentCardId, setPaymentCardId] = useState(cards[0]?.id || '');
  const [paymentReference, setPaymentReference] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [nextRenewalDate, setNextRenewalDate] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [formError, setFormError] = useState('');

  // Auto-select requisition if passed in via link
  React.useEffect(() => {
    if (selectedItemId) {
      const match = requisitions.find((r) => r.id === selectedItemId);
      if (match && match.status === 'Approved') {
        initPurchaseForm(match);
      }
    }
  }, [selectedItemId, requisitions]);

  const approvedPendingPurchases = requisitions.filter(
    (r) => r.status === 'Approved'
  );

  const initPurchaseForm = (req: Requisition) => {
    setSelectedReqForPurchase(req);
    setActualPlan(req.requestedPlan);
    setActualAmount(req.estimatedAmount);
    setCurrency(req.currency);
    setBillingCycle(req.billingCycle);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseSource('Direct');
    setProviderName(req.serviceName);
    setProviderWebsite('');
    setVendorId('');
    setPaymentCardId(cards[0]?.id || '');
    setPaymentReference(`TXN-${Date.now().toString().slice(-6)}`);
    setInvoiceFileName(`Invoice_${req.requisitionNumber}.pdf`);
    setAccountEmail(req.accountEmail || `${req.requesterEmail.split('@')[0]}@riseuplabs.com`);

    const autoRenewal = calculateRenewalDate(
      new Date().toISOString().split('T')[0],
      req.billingCycle
    );
    setNextRenewalDate(autoRenewal || '');
    setFormError('');
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForPurchase) return;

    if (actualAmount <= 0) {
      setFormError('Please enter a valid actual purchase amount.');
      return;
    }
    if (!accountEmail.trim()) {
      setFormError('Please specify the account email / login handle created.');
      return;
    }
    if (!paymentReference.trim()) {
      setFormError('Please enter the payment or invoice transaction reference.');
      return;
    }
    if (purchaseSource === 'Vendor' && !vendorId) {
      setFormError('Please select the vendor who fulfilled this purchase.');
      return;
    }

    completePurchase({
      requisitionId: selectedReqForPurchase.id,
      actualPlan: actualPlan.trim(),
      actualAmount: Number(actualAmount),
      currency,
      billingCycle,
      purchaseDate,
      purchaseSource,
      providerName: providerName.trim() || selectedReqForPurchase.serviceName,
      providerWebsite,
      vendorId: purchaseSource === 'Vendor' ? vendorId : undefined,
      paymentCardId,
      paymentReference: paymentReference.trim(),
      invoiceFileName: invoiceFileName.trim() || 'Invoice.pdf',
      nextRenewalDate: billingCycle !== 'One-time' ? nextRenewalDate : undefined,
      accountEmail: accountEmail.trim(),
    });

    setSelectedReqForPurchase(null);
    setActiveTab('completed');
  };

  // Difference calculation
  const difference = selectedReqForPurchase
    ? actualAmount - selectedReqForPurchase.estimatedAmount
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Purchases & Procurement Execution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Process approved requisitions, record financial invoice details, and register active assets
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Purchases ({approvedPendingPurchases.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed Purchases ({purchases.length})</span>
          </button>
        </div>
      </div>

      {/* PENDING PURCHASES QUEUE */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {approvedPendingPurchases.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
              <div className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
                No Pending Purchases in Queue
              </div>
              <div>All approved requisitions have been purchased and recorded by procurement.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedPendingPurchases.map((req) => (
                <div
                  key={req.id}
                  className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-sky-200 dark:border-sky-900/60 shadow-2xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                          {req.requisitionNumber}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {req.serviceName}
                        </h3>
                        <div className="text-xs text-slate-500">
                          {req.requestedPlan} · {req.billingCycle}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                          ${req.estimatedAmount}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Approved limit
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-lg text-xs space-y-1">
                      <div className="text-slate-600 dark:text-slate-300">
                        Requester: <strong>{req.requesterName}</strong> ({req.departmentName})
                      </div>
                      <div className="text-slate-500 text-[11px] line-clamp-2">
                        Purpose: "{req.purpose}"
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved by All Required Stages
                    </span>

                    <button
                      onClick={() => initPurchaseForm(req)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span>Complete Purchase</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPLETED PURCHASES TABLE */}
      {activeTab === 'completed' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Purchase ID</th>
                  <th className="py-3 px-4">Requisition</th>
                  <th className="py-3 px-4">Service & Plan</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Requested</th>
                  <th className="py-3 px-4 text-right">Actual Paid</th>
                  <th className="py-3 px-4 text-right">Difference</th>
                  <th className="py-3 px-4">Card Used</th>
                  <th className="py-3 px-4">Purchased By</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {purchases.map((pur) => (
                  <tr
                    key={pur.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {pur.id}
                    </td>

                    <td className="py-3 px-4 font-mono text-sky-600 dark:text-sky-400">
                      {pur.requisitionNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {pur.serviceName}
                      </div>
                      <div className="text-[11px] text-slate-400">{pur.actualPlan}</div>
                    </td>

                    <td className="py-3 px-4">
                      {pur.purchaseSource === 'Direct' ? (
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">Direct</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                          Vendor: {pur.vendorName}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      ${pur.requestedAmount.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${pur.actualAmount.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium">
                      {pur.differenceAmount === 0 ? (
                        <span className="text-slate-400">$0.00</span>
                      ) : pur.differenceAmount < 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          -${Math.abs(pur.differenceAmount).toFixed(2)} (Saved)
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">
                          +${pur.differenceAmount.toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Restricted Payment Card Badge */}
                    <td className="py-3 px-4">
                      <RestrictedCardBadge cardId={pur.paymentCardId} size="sm" />
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {pur.purchaserName}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {pur.purchaseDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PURCHASE COMPLETION FORM MODAL (PRD Section 7 & 24.2 Item 8) */}
      {selectedReqForPurchase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
          onClick={() => setSelectedReqForPurchase(null)}
        >
          <div
            className="w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
              <div>
                <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                  {selectedReqForPurchase.requisitionNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Purchase Completion & Payment Recording
                </h3>
              </div>
              <button
                onClick={() => setSelectedReqForPurchase(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Financial comparison banner */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl border border-sky-100 dark:border-sky-900/50">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Requested Amount
                  </span>
                  <div className="text-base font-mono font-bold text-slate-900 dark:text-white">
                    ${selectedReqForPurchase.estimatedAmount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400">Pre-approved budget</div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Actual Payment (Entering)
                  </span>
                  <div className="text-base font-mono font-bold text-sky-600 dark:text-sky-400">
                    ${Number(actualAmount).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400">Invoice total paid</div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Variance Difference
                  </span>
                  <div
                    className={`text-base font-mono font-bold ${
                      difference < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : difference > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {difference === 0
                      ? '$0.00'
                      : difference < 0
                      ? `-$${Math.abs(difference).toFixed(2)} (Savings)`
                      : `+$${difference.toFixed(2)} (Over)`}
                  </div>
                  <div className="text-[10px] text-slate-400">Auto-calculated diff</div>
                </div>
              </div>

              {/* Direct vs Vendor Toggle (PRD Section 7 & 24.2 Item 8) */}
              <div className="space-y-2">
                <label className="font-semibold block">Purchase Source</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPurchaseSource('Direct')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      purchaseSource === 'Direct'
                        ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold">Direct Purchase</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Purchased directly from official service provider site
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseSource('Vendor')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      purchaseSource === 'Vendor'
                        ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold">Vendor / Reseller</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Purchased via external reseller (SoftwareOne, CloudReseller, etc.)
                    </div>
                  </button>
                </div>
              </div>

              {/* If Vendor source chosen, show vendor dropdown */}
              {purchaseSource === 'Vendor' && (
                <div>
                  <label className="font-semibold block mb-1">Select Reseller / Vendor</label>
                  <select
                    required
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Vendor Directory Entry --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.contactPerson} · {v.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actual Plan and Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Actual Plan Purchased</label>
                  <input
                    type="text"
                    required
                    value={actualPlan}
                    onChange={(e) => setActualPlan(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Actual Final Amount Paid ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={actualAmount}
                    onChange={(e) => setActualAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Account Email & Payment Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">
                    Purchased Account Email / Handle
                  </label>
                  <input
                    type="email"
                    required
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Transaction / Invoice Reference</label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. INV-990429 or Stripe Ch_..."
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Company Payment Card Selector with Privacy Boundary */}
              <div>
                <label className="font-semibold block mb-1 flex items-center justify-between">
                  <span>Company Payment Card Used</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Protected card registry
                  </span>
                </label>
                <select
                  value={paymentCardId}
                  onChange={(e) => setPaymentCardId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {cards.map((c) => {
                    const isAuth =
                      c.authorizedUserIds.includes(currentUser.id) ||
                      currentUser.cardPermissionLevel === 'masked_details' ||
                      currentUser.cardPermissionLevel === 'manage';
                    return (
                      <option key={c.id} value={c.id}>
                        {isAuth
                          ? `${c.cardName} (${c.network} ending in •••• ${c.lastFour})`
                          : `Restricted Company Card #${c.id.slice(-4)} (Protected)`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Next Renewal Date with authorized override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">
                    Next Renewal Date (Auto-calculated: {billingCycle})
                  </label>
                  <input
                    type="date"
                    disabled={billingCycle === 'One-time'}
                    value={nextRenewalDate}
                    onChange={(e) => setNextRenewalDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Invoice Document Name</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={invoiceFileName}
                      onChange={(e) => setInvoiceFileName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Info notice */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                Completing this form will mark the requisition as <strong>Purchased</strong>, register the account seat under the master catalogue item, and initiate the recurring subscription tracker.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedReqForPurchase(null)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
                >
                  Record Completed Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
