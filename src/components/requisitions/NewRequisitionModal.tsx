import React, { useState } from 'react';
import {
  X,
  Package,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Building,
  Mail,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BillingCycle, ServiceType } from '../../types';

interface NewRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewRequisitionModal: React.FC<NewRequisitionModalProps> = ({ isOpen, onClose }) => {
  const { services, categories, createRequisition, currentUser } = useApp();

  const [isNewService, setIsNewService] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Tool');
  const [selectedCategory, setSelectedCategory] = useState('AI Tools');
  const [selectedSubcategory, setSelectedSubcategory] = useState('AI Development Tools');
  const [requestedPlan, setRequestedPlan] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [estimatedAmount, setEstimatedAmount] = useState<number>(20);
  const [currency, setCurrency] = useState<'USD' | 'BDT' | 'EUR' | 'GBP'>('USD');
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Duplicate service detection
  const duplicateMatch = isNewService
    ? services.find(
        (s) =>
          customServiceName.trim().length > 2 &&
          s.name.toLowerCase().includes(customServiceName.trim().toLowerCase())
      )
    : null;

  // Available subcategories for selected category
  const activeCatObj = categories.find((c) => c.name === selectedCategory);
  const subcategories = activeCatObj?.subcategories || [];

  const handleServiceSelect = (svcId: string) => {
    setSelectedServiceId(svcId);
    const svc = services.find((s) => s.id === svcId);
    if (svc) {
      setServiceType(svc.type);
      setSelectedCategory(svc.category);
      setSelectedSubcategory(svc.subcategory);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNewService && !selectedServiceId) {
      setError('Please select an existing service or toggle "Propose New Service".');
      return;
    }
    if (isNewService && !customServiceName.trim()) {
      setError('Please provide the proposed software or service name.');
      return;
    }
    if (!requestedPlan.trim()) {
      setError('Please specify the requested plan or seat tier.');
      return;
    }
    if (estimatedAmount <= 0) {
      setError('Please enter a valid estimated amount.');
      return;
    }
    if (!purpose.trim() || purpose.trim().length < 15) {
      setError('Please provide a substantive business justification (min 15 characters).');
      return;
    }

    const serviceName = isNewService
      ? customServiceName.trim()
      : services.find((s) => s.id === selectedServiceId)?.name || 'Service';

    createRequisition({
      serviceId: isNewService ? undefined : selectedServiceId,
      serviceName,
      isNewServiceProposal: isNewService,
      type: serviceType,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      requestedPlan: requestedPlan.trim(),
      accountEmail: accountEmail.trim() || undefined,
      billingCycle,
      estimatedAmount: Number(estimatedAmount),
      currency,
      expectedPurchaseDate: expectedDate,
      purpose: purpose.trim(),
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const selectedServiceObj = services.find((s) => s.id === selectedServiceId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Submit New Purchase Requisition
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Request procurement of software, seats, AI tools, or digital services for Riseup Labs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content + Right-hand Live Summary Split */}
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Main Form Fields (2 columns) */}
          <div className="lg:col-span-2 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Service Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-900 dark:text-white">
                  1. Service / Software Selection
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewService(!isNewService);
                    setSelectedServiceId('');
                  }}
                  className="text-xs text-sky-600 dark:text-sky-400 hover:underline cursor-pointer font-medium"
                >
                  {isNewService ? '← Select Existing Service from Catalogue' : '+ Propose New Service / Tool'}
                </button>
              </div>

              {!isNewService ? (
                <div>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  >
                    <option value="">-- Choose from Registered Catalogue Items ({services.length}) --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category} · {s.accountsCount} active accounts)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                    placeholder="Enter new service or tool name (e.g. Claude Enterprise, Postman Pro)..."
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                  />

                  {/* Duplicate warning (PRD Section 4 & Section 20.B) */}
                  {duplicateMatch && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <strong>Possible Duplicate Detected:</strong> "{duplicateMatch.name}" is already registered in the catalogue. We recommend requesting an additional account under the existing service rather than creating a duplicate.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Classification (Type -> Category -> Subcategory) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="Tool">Tool (SaaS / App)</option>
                  <option value="Service">Service (Cloud/Hosting/Ads)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                >
                  {categories
                    .filter((c) => c.type === serviceType)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subcategory
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                >
                  {subcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section 3: Plan, Seat Email & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Requested Plan / License
                </label>
                <input
                  type="text"
                  value={requestedPlan}
                  onChange={(e) => setRequestedPlan(e.target.value)}
                  placeholder="e.g. Team Pro (2 seats), Developer Seat..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Account Email / Seat Handle
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  placeholder="e.g. employee.name@riseuplabs.com"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Section 4: Billing Cycle, Currency & Estimated Amount */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Billing Cycle
                </label>
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="Monthly">Monthly Recurring</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-yearly">Half-yearly</option>
                  <option value="Yearly">Yearly (Annual)</option>
                  <option value="One-time">One-time / Lifetime</option>
                  <option value="Custom recurring">Custom recurring</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Estimated Cost
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="USD">USD ($)</option>
                  <option value="BDT">BDT (৳)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Target Date */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Expected Purchase Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full sm:w-1/2 text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            {/* Business Purpose */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Business Justification & Project Scope (Required)
              </label>
              <textarea
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Explain why this tool is necessary for your deliverables, client work, or team efficiency..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500 focus:outline-hidden"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Additional Notes or Quotation Link
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional supplier quote link, promotional code, or license terms..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Right-hand Live Summary Card (PRD Section 24.2) */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Requisition Summary
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400">Requester</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {currentUser.departmentName} · {currentUser.teamName || 'General'}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400">Service</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {isNewService
                      ? customServiceName || 'New Proposed Service'
                      : selectedServiceObj?.name || 'Not selected'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {selectedCategory} · {selectedSubcategory}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400">Plan & Billing</span>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {requestedPlan || 'Standard Tier'}
                  </div>
                  <div className="text-[10px] text-slate-500">{billingCycle} cadence</div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400">Estimated Commitment</span>
                  <div className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                    ${Number(estimatedAmount).toFixed(2)} {currency}
                  </div>
                  {billingCycle === 'Yearly' && (
                    <div className="text-[10px] text-slate-500">
                      ≈ ${(Number(estimatedAmount) / 12).toFixed(2)}/mo
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400">Approval Route</span>
                  <div className="mt-1 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span>Stage 1: Team Lead (Required)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>Stage 2: Dept Lead (Optional)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      <span>Stage 3: Operation Manager (Required)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed border border-blue-100 dark:border-blue-900/50">
              Upon approval, request transitions to <strong>Approved / Pending Purchase</strong> for the designated Purchaser to execute with authorized payment method.
            </div>
          </div>
        </form>

        {/* Footer buttons */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Submit Purchase Requisition
          </button>
        </div>
      </div>
    </div>
  );
};
