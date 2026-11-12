import { Router, Request, Response } from 'express';
import { dbStore } from '../data/store';

export const reportsRouter = Router();

// GET /api/reports/summary - Aggregate financial summary directly from database records
reportsRouter.get('/summary', (req: Request, res: Response) => {
  const state = dbStore.getState();

  const totalActualSpend = state.purchases.reduce((acc, p) => acc + p.actualAmount, 0);
  const totalRequested = state.purchases.reduce((acc, p) => acc + p.requestedAmount, 0);
  const totalVariance = totalActualSpend - totalRequested;

  // Spend by source
  const directSpend = state.purchases
    .filter((p) => p.purchaseSource === 'Direct')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  const vendorSpend = state.purchases
    .filter((p) => p.purchaseSource === 'Vendor')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  // Spend by cycle
  const recurringSpend = state.purchases
    .filter((p) => p.billingCycle !== 'One-time')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  const oneTimeSpend = state.purchases
    .filter((p) => p.billingCycle === 'One-time')
    .reduce((acc, p) => acc + p.actualAmount, 0);

  // Monthly breakdown
  const monthlyMap: Record<string, number> = {};
  state.purchases.forEach((p) => {
    const month = p.purchaseDate.slice(0, 7); // YYYY-MM
    monthlyMap[month] = (monthlyMap[month] || 0) + p.actualAmount;
  });

  return res.json({
    totalActualSpend,
    totalRequested,
    totalVariance,
    directSpend,
    vendorSpend,
    recurringSpend,
    oneTimeSpend,
    monthlyBreakdown: monthlyMap,
    purchasesCount: state.purchases.length,
    activeSubscriptionsCount: state.subscriptions.filter((s) => s.status === 'Active').length,
    activeAccountsCount: state.accounts.filter((a) => a.accountStatus === 'Active').length,
  });
});

// GET /api/reports/export/csv - Sanitized CSV with card details masked per zero-trust policy
reportsRouter.get('/export/csv', (req: Request, res: Response) => {
  const state = dbStore.getState();

  const headers = [
    'Purchase ID',
    'Requisition #',
    'Service Name',
    'Plan',
    'Purchase Date',
    'Source',
    'Vendor',
    'Requested Cost (USD)',
    'Actual Cost (USD)',
    'Variance',
    'Payment Card (Protected)',
    'Transaction Reference',
  ];

  const rows = state.purchases.map((p) => {
    const card = state.cards.find((c) => c.id === p.paymentCardId);
    const cardMasked = card ? `${card.cardName} (•••• ${card.lastFour})` : 'Restricted Card';

    return [
      p.id,
      p.requisitionNumber,
      `"${p.serviceName.replace(/"/g, '""')}"`,
      `"${p.actualPlan.replace(/"/g, '""')}"`,
      p.purchaseDate,
      p.purchaseSource,
      `"${(p.vendorName || 'N/A').replace(/"/g, '""')}"`,
      p.requestedAmount.toFixed(2),
      p.actualAmount.toFixed(2),
      p.differenceAmount.toFixed(2),
      `"${cardMasked}"`,
      `"${p.paymentReference.replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=RLTSMS_Expenditure_Report_${Date.now()}.csv`);
  return res.send(csv);
});
