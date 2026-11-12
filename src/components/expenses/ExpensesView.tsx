import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  Building,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ExpensesView: React.FC = () => {
  const { purchases, subscriptions, services, departments } = useApp();
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Total expenditures
  const totalActual = purchases.reduce((acc, p) => acc + p.actualAmount, 0);
  const totalRequested = purchases.reduce((acc, p) => acc + p.requestedAmount, 0);
  const totalVariance = totalActual - totalRequested;

  // Monthly breakdown
  const monthlyMap: Record<string, number> = {};
  purchases.forEach((p) => {
    const month = p.purchaseDate.slice(0, 7);
    monthlyMap[month] = (monthlyMap[month] || 0) + p.actualAmount;
  });

  // Spend by Category
  const categorySpendMap: Record<string, number> = {};
  purchases.forEach((p) => {
    const svc = services.find((s) => s.id === p.serviceId);
    const cat = svc ? svc.category : 'Digital Services';
    categorySpendMap[cat] = (categorySpendMap[cat] || 0) + p.actualAmount;
  });

  const sortedCategories = Object.entries(categorySpendMap).sort((a, b) => b[1] - a[1]);

  // Spend by Purchase Source
  const directSpend = purchases
    .filter((p) => p.purchaseSource === 'Direct')
    .reduce((acc, p) => acc + p.actualAmount, 0);
  const vendorSpend = purchases
    .filter((p) => p.purchaseSource === 'Vendor')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  // Spend by Billing Type
  const recurringSpend = purchases
    .filter((p) => p.billingCycle !== 'One-time')
    .reduce((acc, p) => acc + p.actualAmount, 0);
  const oneTimeSpend = purchases
    .filter((p) => p.billingCycle === 'One-time')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-[#211E1F] text-white border border-[#2D292A] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#EA5400]/20 text-[#EA5400] flex items-center justify-center shrink-0 border border-[#EA5400]/40">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Expenditure & Variance Analytics
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Live corporate spend attribution, variance tracking (Requested vs Actual), and category distributions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#1A1718] text-white border border-[#2D292A]">
            Fiscal Year 2026
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Actual Spend
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            ${totalActual.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">From confirmed purchase receipts</span>
        </div>

        <div className="p-4 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Requested Estimates
          </span>
          <div className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-1">
            ${totalRequested.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Initial employee requisition totals</span>
        </div>

        <div className="p-4 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Purchase Variance (Δ)
          </span>
          <div
            className={`text-xl font-bold font-mono mt-1 flex items-center gap-1 ${
              totalVariance > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}
          >
            {totalVariance > 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            <span>
              {totalVariance >= 0 ? '+' : ''}${totalVariance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {totalVariance > 0 ? 'Over original estimate' : 'Under original estimate'}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Recurring vs One-Time
          </span>
          <div className="text-xl font-bold font-mono text-[#EA5400] mt-1">
            ${recurringSpend.toLocaleString()} / ${oneTimeSpend.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">SaaS subscriptions vs perpetual fees</span>
        </div>
      </div>

      {/* Spend Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#EA5400]" />
              <span>Spend by Service Category</span>
            </h2>
            <span className="text-[11px] text-slate-400">17 Standard Categories</span>
          </div>

          <div className="space-y-3">
            {sortedCategories.map(([category, amount]) => {
              const percentage = totalActual > 0 ? Math.round((amount / totalActual) * 100) : 0;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{category}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">
                      ${amount.toLocaleString()} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#1A1718] overflow-hidden">
                    <div
                      className="h-full bg-[#EA5400] rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source & Vendor Channel Breakdown */}
        <div className="p-5 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-[#EA5400]" />
              <span>Procurement Channel & Sourcing</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1718] border border-slate-200 dark:border-[#2D292A] space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">Direct from Provider</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                ${directSpend.toLocaleString()} USD
              </div>
              <div className="text-[11px] text-slate-500">
                {totalActual > 0 ? Math.round((directSpend / totalActual) * 100) : 0}% of company spend
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1A1718] border border-slate-200 dark:border-[#2D292A] space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">External Vendor / Reseller</span>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                ${vendorSpend.toLocaleString()} USD
              </div>
              <div className="text-[11px] text-slate-500">
                {totalActual > 0 ? Math.round((vendorSpend / totalActual) * 100) : 0}% of company spend
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#2D292A] text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div>
              <strong>Vendor Partner:</strong> SoftwareOne Bangladesh, RedDot Digital, Commercial Banks
            </div>
            <div className="text-[11px]">
              All purchases retain immutable transactional receipts and payment card linkages.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
