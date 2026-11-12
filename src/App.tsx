import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { NewRequisitionModal } from './components/requisitions/NewRequisitionModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { RequisitionsView } from './components/requisitions/RequisitionsView';
import { ServicesCatalogueView } from './components/services/ServicesCatalogueView';
import { AccountsView } from './components/accounts/AccountsView';
import { AccessManagementView } from './components/access/AccessManagementView';
import { ServiceSharingHubView } from './components/sharing/ServiceSharingHubView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { SubscriptionsView } from './components/subscriptions/SubscriptionsView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { VendorsView } from './components/vendors/VendorsView';
import { PaymentCardsView } from './components/cards/PaymentCardsView';
import { OrganizationView } from './components/organization/OrganizationView';
import { WorkflowBuilderView } from './components/workflows/WorkflowBuilderView';
import { ReportsView } from './components/reports/ReportsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { currentView } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewRequisitionOpen, setIsNewRequisitionOpen] = useState(false);

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'requisitions':
        return <RequisitionsView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'services':
        return <ServicesCatalogueView />;
      case 'accounts':
        return <AccountsView />;
      case 'access':
      case 'sharing':
        return <ServiceSharingHubView />;
      case 'subscriptions':
        return <SubscriptionsView />;
      case 'procurement':
      case 'purchases':
        return <PurchasesView />;
      case 'expenses':
        return <ExpensesView />;
      case 'vendors':
        return <VendorsView />;
      case 'cards':
        return <PaymentCardsView />;
      case 'organization':
        return <OrganizationView />;
      case 'workflows':
        return <WorkflowBuilderView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'audit':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar adhering to 3-zone contract */}
      <Navbar
        onOpenNewRequisition={() => setIsNewRequisitionOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex-1 flex">
        {/* Left Fixed / Responsive Sidebar with 14 module destinations */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 md:pl-64 min-w-0 flex flex-col">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Command Palette (Cmd/Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewRequisition={() => setIsNewRequisitionOpen(true)}
      />

      {/* Global Guided Requisition Creator */}
      <NewRequisitionModal
        isOpen={isNewRequisitionOpen}
        onClose={() => setIsNewRequisitionOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
