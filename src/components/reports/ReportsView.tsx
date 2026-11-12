import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ReportsView: React.FC = () => {
  const { purchases, requisitions, services, departments, canViewCardDetails } = useApp();

  const [reportType, setReportType] = useState<'monthly' | 'annual'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Financial aggregates
  const totalActualSpend = purchases.reduce((acc, p) => acc + p.actualAmount, 0);
  const totalRequested = purchases.reduce((acc, p) => acc + p.requestedAmount, 0);
  const totalVariance = totalActualSpend - totalRequested;

  // Breakdown by purchase source
  const directSpend = purchases
    .filter((p) => p.purchaseSource === 'Direct')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  const vendorSpend = purchases
    .filter((p) => p.purchaseSource === 'Vendor')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  // Recurring vs One-time
  const recurringSpend = purchases
    .filter((p) => p.billingCycle !== 'One-time')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  const oneTimeSpend = purchases
    .filter((p) => p.billingCycle === 'One-time')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  // CSV Export with card security boundary enforcement (PRD Section 14 & AC-16)
  const handleExportCSV = () => {
    const headers = [
      'Purchase ID',
      'Requisition #',
      'Service Name',
      'Plan',
      'Purchase Date',
      'Source',
      'Vendor',
      'Requested Cost',
      'Actual Cost',
      'Difference',
      'Payment Card Used (Protected)',
      'Transaction Ref',
    ];

    const rows = purchases.map((p) => {
      const isCardAuth = canViewCardDetails(p.paymentCardId || '');
      const cardField = isCardAuth ? `Authorized SCB-8492` : 'Restricted Card';

      return [
        p.id,
        p.requisitionNumber,
        `"${p.serviceName}"`,
        `"${p.actualPlan}"`,
        p.purchaseDate,
        p.purchaseSource,
        `"${p.vendorName || 'N/A'}"`,
        p.requestedAmount,
        p.actualAmount,
        p.differenceAmount,
        `"${cardField}"`,
        `"${p.paymentReference}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RLTSMS_Expenditure_Report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('CSV Export downloaded. Restricted card data was sanitized per security policy.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Financial & Expenditure Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-ready expenditure reporting, financial variance analysis, and secure data exports (PRD Section 14)
          </p>
        </div>

        {/* Report Period Selector & Exports */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                reportType === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly Report
            </button>
            <button
              onClick={() => setReportType('annual')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                reportType === 'annual'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Annual Report
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV / Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Financial Comparison KPI Strip (PRD Section 14) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400">Total Requested Amount</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            ${totalRequested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Initial requisition estimates</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400">Actual Purchase Expenditure</span>
          <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
            ${totalActualSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400">Actual audited payouts</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400">Net Budget Variance</span>
          <div
            className={`text-xl font-bold font-mono ${
              totalVariance < 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : totalVariance > 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-700'
            }`}
          >
            {totalVariance < 0 ? `-$${Math.abs(totalVariance).toFixed(2)}` : `+$${totalVariance.toFixed(2)}`}
          </div>
          <div className="text-[10px] text-slate-400">
            {totalVariance < 0 ? 'Favorable procurement savings' : 'Over estimated budget'}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-1">
          <span className="text-[11px] text-slate-400">Direct vs Vendor Ratio</span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {Math.round((directSpend / (totalActualSpend || 1)) * 100)}% / {Math.round((vendorSpend / (totalActualSpend || 1)) * 100)}%
          </div>
          <div className="text-[10px] text-slate-400">Direct card vs vendor invoice</div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source & Recurrence Breakdown */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Procurement Channels & Cadence
          </h2>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Direct Purchases</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ${directSpend.toLocaleString()} USD
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  style={{ width: `${(directSpend / (totalActualSpend || 1)) * 100}%` }}
                  className="h-full bg-sky-600"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Vendor Reseller Invoices</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ${vendorSpend.toLocaleString()} USD
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  style={{ width: `${(vendorSpend / (totalActualSpend || 1)) * 100}%` }}
                  className="h-full bg-purple-600"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Recurring Subscriptions</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  ${recurringSpend.toLocaleString()} USD
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  style={{ width: `${(recurringSpend / (totalActualSpend || 1)) * 100}%` }}
                  className="h-full bg-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Automated Archive Deliveries (PRD Section 14) */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Report Archives & Scheduled Deliveries
            </h2>
            <span className="text-[11px] text-slate-400">Automated Dispatch</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {[
              {
                title: 'October 2026 Monthly Expenditure Report',
                date: '2026-11-01',
                recipients: 'CFO David Vance, Abdullah Nahian',
                total: '$4,100.00 USD',
              },
              {
                title: 'Q3 2026 Procurement Variance Summary',
                date: '2026-10-01',
                recipients: 'Management Board',
                total: '$11,450.00 USD',
              },
              {
                title: 'FY2025 Annual Digital Assets & License Audit',
                date: '2025-12-31',
                recipients: 'Directors & Audit Committee',
                total: '$44,280.00 USD',
              },
            ].map((arch, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{arch.title}</div>
                  <div className="text-[11px] text-slate-400">
                    Generated: {arch.date} · Delivered to: {arch.recipients}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {arch.total}
                  </span>
                  <button
                    onClick={handleExportCSV}
                    className="block text-[11px] text-sky-600 hover:underline mt-0.5 cursor-pointer"
                  >
                    Download Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Line Item Comparison Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Procurement Financial Reconciliation (Requested vs Approved vs Actual)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {purchases.length} settled purchase records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                <th className="py-3 px-4">Req #</th>
                <th className="py-3 px-4">Service & Plan</th>
                <th className="py-3 px-4">Source / Vendor</th>
                <th className="py-3 px-4 text-right">Requested</th>
                <th className="py-3 px-4 text-right">Actual Paid</th>
                <th className="py-3 px-4 text-right">Budget Variance</th>
                <th className="py-3 px-4">Card Used (Sanitized)</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {purchases.map((p) => {
                const isCardAuth = canViewCardDetails(p.paymentCardId || '');
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                    <td className="py-3 px-4 font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {p.requisitionNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {p.serviceName}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.actualPlan}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {p.purchaseSource === 'Direct' ? 'Direct Provider' : p.vendorName}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      ${p.requestedAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      ${p.actualAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium">
                      {p.differenceAmount === 0 ? (
                        <span className="text-slate-400">$0.00</span>
                      ) : p.differenceAmount < 0 ? (
                        <span className="text-emerald-600">-${Math.abs(p.differenceAmount).toFixed(2)}</span>
                      ) : (
                        <span className="text-rose-600">+${p.differenceAmount.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {isCardAuth ? 'SCB •••• 8492' : 'Restricted Card'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.purchaseDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
