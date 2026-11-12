import React, { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Users,
  DollarSign,
  LayoutGrid,
  List,
  CheckCircle2,
  FolderTree,
  ChevronRight,
  X,
  CreditCard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CatalogueService, ServiceType } from '../../types';

export const ServicesCatalogueView: React.FC = () => {
  const { services, categories, accounts, subscriptions, purchases, createService, selectedItemId } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ServiceType | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<CatalogueService | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New service form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ServiceType>('Tool');
  const [newCategory, setNewCategory] = useState('AI Tools');
  const [newSubcategory, setNewSubcategory] = useState('AI Assistants / Chatbots');
  const [newProvider, setNewProvider] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [createError, setCreateError] = useState('');

  // Auto-open if selectedItemId matches
  React.useEffect(() => {
    if (selectedItemId) {
      const match = services.find((s) => s.id === selectedItemId);
      if (match) setSelectedService(match);
    }
  }, [selectedItemId, services]);

  const filteredServices = services.filter((s) => {
    if (selectedType !== 'All' && s.type !== selectedType) return false;
    if (selectedCategory !== 'All' && s.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.name.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.subcategory.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setCreateError('Please enter service name.');
      return;
    }
    // Duplicate check
    const existing = services.find(
      (s) => s.name.toLowerCase() === newName.trim().toLowerCase()
    );
    if (existing) {
      setCreateError(`A service named "${existing.name}" already exists in the catalogue.`);
      return;
    }

    createService({
      name: newName.trim(),
      type: newType,
      category: newCategory,
      subcategory: newSubcategory,
      provider: newProvider.trim() || 'Direct Provider',
      website: newWebsite.trim() || 'https://riseuplabs.com',
      description: newDesc.trim() || 'Company software tool',
      status: 'Active',
      createdBy: 'Administrator',
    });

    setIsCreateModalOpen(false);
    setNewName('');
    setNewProvider('');
    setNewWebsite('');
    setNewDesc('');
    setCreateError('');
  };

  // Accounts under selected service
  const serviceAccounts = selectedService
    ? accounts.filter((a) => a.serviceId === selectedService.id)
    : [];

  // Purchases under selected service
  const servicePurchases = selectedService
    ? purchases.filter((p) => p.serviceId === selectedService.id)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Services & Tools Catalogue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Master directory of all software tools and digital infrastructure services licensed by Riseup Labs
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Service</span>
          </button>
        </div>
      </div>

      {/* Main Content with Left Category Tree Filter and Right Grid/Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Category Filter Tree (PRD Section 4: Type -> Category) */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-sky-600" />
              Catalogue Hierarchy
            </span>
            {(selectedType !== 'All' || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSelectedType('All');
                  setSelectedCategory('All');
                }}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Type 1: Tools */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setSelectedType(selectedType === 'Tool' ? 'All' : 'Tool');
                setSelectedCategory('All');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedType === 'Tool' && selectedCategory === 'All'
                  ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <span>Type 1: Software Tools</span>
              <span className="text-[10px] font-mono text-slate-400">
                {services.filter((s) => s.type === 'Tool').length}
              </span>
            </button>

            <div className="pl-3 space-y-0.5 border-l border-slate-100 dark:border-slate-700 ml-2">
              {categories
                .filter((c) => c.type === 'Tool')
                .map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  const count = services.filter((s) => s.category === cat.name).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedType('Tool');
                        setSelectedCategory(cat.name);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-100/70 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] font-mono opacity-60">{count}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Type 2: Services */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => {
                setSelectedType(selectedType === 'Service' ? 'All' : 'Service');
                setSelectedCategory('All');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedType === 'Service' && selectedCategory === 'All'
                  ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              <span>Type 2: Digital Services</span>
              <span className="text-[10px] font-mono text-slate-400">
                {services.filter((s) => s.type === 'Service').length}
              </span>
            </button>

            <div className="pl-3 space-y-0.5 border-l border-slate-100 dark:border-slate-700 ml-2">
              {categories
                .filter((c) => c.type === 'Service')
                .map((cat) => {
                  const isSelected = selectedCategory === cat.name;
                  const count = services.filter((s) => s.category === cat.name).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedType('Service');
                        setSelectedCategory(cat.name);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-sky-100/70 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200 font-semibold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] font-mono opacity-60">{count}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right Side: Services Directory */}
        <div className="lg:col-span-3 space-y-4">
          {/* Search bar & active filter display */}
          <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search catalogue by name, vendor, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
              {filteredServices.length} items
            </span>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => setSelectedService(svc)}
                  className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                          {svc.category} · {svc.subcategory}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors mt-0.5">
                          {svc.name}
                        </h3>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Provider: {svc.provider}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {svc.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {svc.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="font-mono">{svc.accountsCount}</strong> seats
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        ${svc.totalMonthlySpend}/mo
                      </span>
                    </div>

                    <span className="text-sky-600 dark:text-sky-400 font-medium text-[11px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      Details & Accounts →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4 text-center">Active Seats</th>
                    <th className="py-3 px-4 text-right">Monthly Spend</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredServices.map((svc) => (
                    <tr
                      key={svc.id}
                      onClick={() => setSelectedService(svc)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {svc.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{svc.category}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {svc.provider}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {svc.accountsCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        ${svc.totalMonthlySpend}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {svc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Service Detail Drawer */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-6 space-y-6 overflow-y-auto animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                  {selectedService.type} · {selectedService.category}
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {selectedService.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{selectedService.provider}</span>
                  {selectedService.website && (
                    <a
                      href={selectedService.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 flex items-center gap-0.5 hover:underline"
                    >
                      Official Site <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedService.description}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400">Registered Accounts</span>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                  {serviceAccounts.length} seats
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">Current Monthly Spend</span>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  ${selectedService.totalMonthlySpend}/mo
                </div>
              </div>
            </div>

            {/* Sub-Accounts Inventory Under This Service (PRD Section 8) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Purchased Accounts ({serviceAccounts.length})
                </h3>
                <span className="text-[11px] text-slate-400">Multi-seat directory</span>
              </div>

              {serviceAccounts.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-400">
                  No individual accounts registered yet under this master service record.
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-semibold text-slate-900 dark:text-white">
                          {acc.accountEmail}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {acc.planName} · {acc.billingCycle} · Assigned: {acc.assignedUserName || 'Shared'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          ${acc.purchaseAmount}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {acc.accountStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Purchases History */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Purchase History ({servicePurchases.length})
              </h3>
              {servicePurchases.length === 0 ? (
                <div className="text-xs text-slate-400">No linked purchases recorded.</div>
              ) : (
                <div className="space-y-2">
                  {servicePurchases.map((pur) => (
                    <div
                      key={pur.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {pur.requisitionNumber} · {pur.actualPlan}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Date: {pur.purchaseDate} · By {pur.purchaserName} ({pur.purchaseSource})
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        ${pur.actualAmount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Service Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add New Master Service / Tool
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Service / Tool Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Claude Enterprise, Postman, Vercel..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ServiceType)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Tool">Tool (Software/App)</option>
                    <option value="Service">Service (Cloud/Infrastructure)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories
                      .filter((c) => c.type === newType)
                      .map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Provider / Vendor Company</label>
                <input
                  type="text"
                  placeholder="e.g. Anthropic, PBC"
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Official Website</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newWebsite}
                  onChange={(e) => setNewWebsite(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description / Business Use</label>
                <textarea
                  rows={2}
                  placeholder="Purpose of tool for Riseup Labs..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
                >
                  Save to Catalogue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
