import React, { useState } from 'react';
import {
  Building,
  Search,
  Plus,
  Mail,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  DollarSign,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Vendor } from '../../types';

export const VendorsView: React.FC = () => {
  const { vendors, purchases, createVendor } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New vendor state
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Active' | 'Preferred'>('Active');

  const filtered = vendors.filter((v) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createVendor({
      name: name.trim(),
      contactPerson: contactPerson.trim() || 'Account Manager',
      email: email.trim() || 'contact@vendor.com',
      phone: phone.trim() || '+880 2-000000',
      website: website.trim() || 'https://vendor.com',
      address: address.trim() || 'Dhaka, Bangladesh',
      notes: notes.trim() || undefined,
      status,
    });

    setIsAddModalOpen(false);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setAddress('');
    setNotes('');
  };

  // Related purchases for selected vendor
  const vendorPurchases = selectedVendor
    ? purchases.filter((p) => p.vendorId === selectedVendor.id)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Vendors & Resellers Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Maintain external license resellers, volume software distributors, and billing partners (PRD Section 11)
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendors by name, representative, email, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">{filtered.length} vendors</span>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((ven) => {
          const venPurchases = purchases.filter((p) => p.vendorId === ven.id);
          const totalPaid = venPurchases.reduce((acc, p) => acc + p.actualAmount, 0);

          return (
            <div
              key={ven.id}
              onClick={() => setSelectedVendor(ven)}
              className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {ven.name}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Rep: {ven.contactPerson}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      ven.status === 'Preferred'
                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                    }`}
                  >
                    {ven.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ven.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{ven.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <a
                      href={ven.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sky-600 hover:underline truncate"
                    >
                      {ven.website.replace('https://', '')}
                    </a>
                  </div>
                </div>

                {ven.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2">
                    "{ven.notes}"
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Invoiced</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ${(ven.totalPurchaseAmount || totalPaid).toLocaleString()} USD
                  </span>
                </div>
                <span className="text-sky-600 dark:text-sky-400 font-semibold text-[11px]">
                  View Orders ({venPurchases.length}) →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vendor Orders Modal */}
      {selectedVendor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedVendor(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Vendor Record: {selectedVendor.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedVendor.contactPerson} · {selectedVendor.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Services Purchased Through This Reseller ({vendorPurchases.length})
              </h4>

              {vendorPurchases.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  No purchases linked to this vendor yet.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {vendorPurchases.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {p.serviceName} ({p.actualPlan})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.requisitionNumber} · Date: {p.purchaseDate} · Ref: {p.paymentReference}
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${p.actualAmount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add New Vendor / Reseller
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Vendor / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SoftwareOne Bangladesh Ltd."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Kazi Naimul"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+880 2-..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Website</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Office Address</label>
                <input
                  type="text"
                  placeholder="e.g. Gulshan-2, Dhaka"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Contract / Resale Notes</label>
                <textarea
                  rows={2}
                  placeholder="Payment credit terms, currency agreements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
