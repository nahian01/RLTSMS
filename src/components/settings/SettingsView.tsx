import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Lock,
  Users,
  Building,
  Key,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { resetToDefaults } = useApp();

  const [fiscalYearStart, setFiscalYearStart] = useState('07'); // July (common for BD & international)
  const [currencyDefault, setCurrencyDefault] = useState('USD');
  const [resetNotice, setResetNotice] = useState(false);

  const roleMatrix = [
    {
      role: 'Super Admin',
      responsibilities: 'Complete system control, role assignments, card security policies',
      canSubmit: true,
      canApprove: true,
      canPurchase: true,
      canViewCards: true,
      canViewReports: true,
    },
    {
      role: 'System Admin',
      responsibilities: 'Manage users, organization units, catalogue services & workflows',
      canSubmit: true,
      canApprove: false,
      canPurchase: false,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Employee',
      responsibilities: 'Submit purchase requisitions and track own licenses',
      canSubmit: true,
      canApprove: false,
      canPurchase: false,
      canViewCards: false,
      canViewReports: false,
    },
    {
      role: 'Team Lead',
      responsibilities: 'Review and approve first-stage team purchase requests',
      canSubmit: true,
      canApprove: true,
      canPurchase: false,
      canViewCards: false,
      canViewReports: false,
    },
    {
      role: 'Department Lead',
      responsibilities: 'Review and approve department-wide requisitions',
      canSubmit: true,
      canApprove: true,
      canPurchase: false,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Operation Manager',
      responsibilities: 'Provide operational and budgetary purchase authorizations',
      canSubmit: true,
      canApprove: true,
      canPurchase: false,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Purchaser',
      responsibilities: 'Complete approved requests, enter invoices, register accounts',
      canSubmit: true,
      canApprove: false,
      canPurchase: true,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Finance',
      responsibilities: 'Financial records, payments, variance analysis and accounting',
      canSubmit: true,
      canApprove: false,
      canPurchase: false,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Card Information Viewer',
      responsibilities: 'Strictly authorized viewer of masked card details and holder data',
      canSubmit: false,
      canApprove: false,
      canPurchase: false,
      canViewCards: true,
      canViewReports: true,
    },
  ];

  const handleReset = () => {
    if (window.confirm('Reset all RLTSMS records back to initial Riseup Labs demo baseline?')) {
      resetToDefaults();
      setResetNotice(true);
      setTimeout(() => setResetNotice(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          System Configuration & RBAC Roles
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Role-based permissions matrix, fiscal calendar settings, and demo environment reset (PRD Section 2)
        </p>
      </div>

      {resetNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System state restored to Riseup Labs default baseline.</span>
        </div>
      )}

      {/* Role-Based Access Control (RBAC) Matrix (PRD Section 2) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Role-Based Access Control Matrix
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">10 Configurable System Roles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Core Responsibilities</th>
                <th className="py-3 px-4 text-center">Submit Req</th>
                <th className="py-3 px-4 text-center">Approve Req</th>
                <th className="py-3 px-4 text-center">Execute Purchase</th>
                <th className="py-3 px-4 text-center">Inspect Card</th>
                <th className="py-3 px-4 text-center">Reports</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {roleMatrix.map((item) => (
                <tr key={item.role} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {item.role}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {item.responsibilities}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.canSubmit ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.canApprove ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.canPurchase ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.canViewCards ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                        <Lock className="w-3 h-3" /> Explicit
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {item.canViewReports ? (
                      <span className="text-emerald-600 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fiscal Period & Reporting Parameters (PRD Section 14) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Reporting & Fiscal Parameters
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">Financial Year Start Month</label>
              <select
                value={fiscalYearStart}
                onChange={(e) => setFiscalYearStart(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="01">January (Calendar Year: Jan - Dec)</option>
                <option value="07">July (Riseup Labs Fiscal Year: Jul - Jun)</option>
                <option value="04">April (UK/Commonwealth: Apr - Mar)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Annual reports align to this configurable period per PRD Section 14.
              </p>
            </div>

            <div>
              <label className="font-semibold block mb-1">Default Base Currency</label>
              <select
                value={currencyDefault}
                onChange={(e) => setCurrencyDefault(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="USD">USD ($) - Standard International Tech Procurement</option>
                <option value="BDT">BDT (৳) - Local Operating Currency</option>
                <option value="EUR">EUR (€) - European Subscriptions</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reset & Maintenance */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Demo Database Management
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              If you have created new requisitions, modified approval workflows, or tested emergency card unlock, you can reset the system to its initial seed data state at any time.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
            >
              Reset to Factory Seed Baseline
            </button>
          </div>
        </div>
        {/* About RLTSMS */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-sky-950 rounded-xl border border-sky-800/40 text-white shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
                  RL
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  RLTSMS Platform
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 font-mono">
                v1.2.0-prod
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Riseup Labs Tools &amp; Services Management System.
            </p>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase font-semibold text-sky-400 block tracking-wider">Official Slogan</span>
              <p className="text-xs font-semibold text-sky-200 mt-0.5 italic">
                “Your Tools. Your Services. Every Stage, Tracked”
              </p>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 border-t border-white/10 flex items-center justify-between">
            <span>Enterprise Digital Asset Lifecycle</span>
            <span className="text-emerald-400 font-medium">RBAC Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
