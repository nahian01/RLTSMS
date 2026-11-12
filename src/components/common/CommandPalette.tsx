import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, FileText, Users, CreditCard, Building2, Workflow, ArrowRight, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewRequisition: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenNewRequisition,
}) => {
  const { services, requisitions, accessRequests, accounts, setCurrentView } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  // Filter services
  const matchingServices = services
    .filter(
      (s) =>
        s.name.toLowerCase().includes(trimmed) ||
        s.category.toLowerCase().includes(trimmed) ||
        s.provider.toLowerCase().includes(trimmed)
    )
    .slice(0, 4);

  // Filter requisitions
  const matchingRequisitions = requisitions
    .filter(
      (r) =>
        r.requisitionNumber.toLowerCase().includes(trimmed) ||
        r.serviceName.toLowerCase().includes(trimmed) ||
        r.requesterName.toLowerCase().includes(trimmed)
    )
    .slice(0, 4);

  // Filter tool access requests
  const matchingAccessRequests = accessRequests
    .filter(
      (a) =>
        a.requestNumber.toLowerCase().includes(trimmed) ||
        a.serviceName.toLowerCase().includes(trimmed) ||
        a.requesterName.toLowerCase().includes(trimmed) ||
        (a.assignedAccountEmail && a.assignedAccountEmail.toLowerCase().includes(trimmed))
    )
    .slice(0, 3);

  // Filter accounts
  const matchingAccounts = accounts
    .filter(
      (a) =>
        a.accountEmail.toLowerCase().includes(trimmed) ||
        a.serviceName.toLowerCase().includes(trimmed)
    )
    .slice(0, 3);

  const navigationItems = [
    { label: 'Dashboard Overview', icon: ArrowRight, view: 'dashboard' },
    { label: 'All Purchase Requisitions', icon: FileText, view: 'requisitions' },
    { label: 'Services & Tools Catalogue', icon: Package, view: 'services' },
    { label: 'Purchased Accounts Inventory', icon: Users, view: 'accounts' },
    { label: 'Subscriptions & Renewals', icon: FileText, view: 'subscriptions' },
    { label: 'Purchases & Procurement', icon: CreditCard, view: 'purchases' },
    { label: 'Approval Workflow Builder', icon: Workflow, view: 'workflows' },
    { label: 'Restricted Payment Cards', icon: CreditCard, view: 'cards' },
    { label: 'Organization & Employees', icon: Building2, view: 'organization' },
    { label: 'Expenditure Reports', icon: FileText, view: 'reports' },
  ].filter((item) => item.label.toLowerCase().includes(trimmed));

  const handleSelectView = (view: string, id?: string) => {
    setCurrentView(view, id);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a service name, requisition (REQ-2026-...), email, or destination..."
            className="w-full text-sm bg-transparent border-0 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-0"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
          {/* Quick Actions */}
          <div className="p-1">
            <button
              onClick={() => {
                onClose();
                onOpenNewRequisition();
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs font-medium text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-950/70 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center font-bold">
                  +
                </span>
                Submit New Purchase Requisition
              </span>
              <span className="text-[11px] text-sky-600 dark:text-sky-300">Guided Request Form →</span>
            </button>
          </div>

          {/* Services */}
          {matchingServices.length > 0 && (
            <div className="pt-2">
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Services & Tools
              </p>
              <div className="space-y-0.5">
                {matchingServices.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => handleSelectView('services', svc.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{svc.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {svc.provider} · {svc.category}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {svc.accountsCount} accounts
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Requisitions */}
          {matchingRequisitions.length > 0 && (
            <div className="pt-2">
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Requisitions
              </p>
              <div className="space-y-0.5">
                {matchingRequisitions.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => handleSelectView('requisitions', req.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          <span className="font-mono text-sky-600 dark:text-sky-400 mr-2">
                            {req.requisitionNumber}
                          </span>
                          {req.serviceName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Requested by {req.requesterName} · {req.status}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300">
                      ${req.estimatedAmount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tool Access Sharing Requests */}
          {matchingAccessRequests.length > 0 && (
            <div className="pt-2">
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tool Access Sharing Requests
              </p>
              <div className="space-y-0.5">
                {matchingAccessRequests.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectView('requisitions', acc.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <KeyRound className="w-4 h-4 text-sky-500" />
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          <span className="font-mono text-sky-600 dark:text-sky-400 mr-2">
                            {acc.requestNumber}
                          </span>
                          {acc.serviceName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Requester: {acc.requesterName} &bull; {acc.status}
                          {acc.assignedAccountEmail && ` &bull; ${acc.assignedAccountEmail}`}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500">{acc.duration}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accounts */}
          {matchingAccounts.length > 0 && (
            <div className="pt-2">
              <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Individual Accounts
              </p>
              <div className="space-y-0.5">
                {matchingAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectView('accounts', acc.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="font-mono text-slate-900 dark:text-white">{acc.accountEmail}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {acc.serviceName} · {acc.planName}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500">{acc.accountStatus}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="pt-2">
            <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </p>
            <div className="grid grid-cols-2 gap-1">
              {navigationItems.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.view}
                    onClick={() => handleSelectView(item.view)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Riseup Labs · Enterprise Software & Tools Management</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
