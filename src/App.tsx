import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { ActivateAccountPage } from './components/auth/ActivateAccountPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
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
import { DepartmentTeamView } from './components/organization/DepartmentTeamView';
import { EmployeeTableView } from './components/organization/EmployeeTableView';
import { RBACView } from './components/rbac/RBACView';
import { WorkflowBuilderView } from './components/workflows/WorkflowBuilderView';
import { ReportsView } from './components/reports/ReportsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { RequestToolsView } from './components/requests/RequestToolsView';

const MainLayout: React.FC = () => {
  const { currentView } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewRequisitionOpen, setIsNewRequisitionOpen] = useState(false);

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'request-tools':
        return <RequestToolsView />;
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
      case 'rbac':
        return <RBACView />;
      case 'org-structure':
        return <DepartmentTeamView />;
      case 'employees':
        return <EmployeeTableView />;
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

const AppContent: React.FC = () => {
  const { isAuthenticated } = useApp();
  const [forceLogin, setForceLogin] = useState(false);
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Check URL query parameters and pathname
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(
    window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
  );
  const rawToken = urlParams.get('token') || hashParams.get('token');

  // 1. Password Reset Route (Single-use & 10m expiry)
  const isResetRoute =
    !forceLogin &&
    (pathname.startsWith('/reset-password') ||
      urlParams.get('reset') === 'true' ||
      Boolean(rawToken && rawToken.startsWith('rst_')));

  if (isResetRoute) {
    return (
      <ResetPasswordPage
        initialToken={rawToken || ''}
        onGoToLogin={() => {
          window.history.replaceState({}, document.title, '/');
          setPathname('/');
          setForceLogin(true);
        }}
      />
    );
  }

  // 2. Account Activation Route (Single-use & 48h expiry)
  const isActivateRoute =
    !forceLogin &&
    (pathname.startsWith('/activate') ||
      urlParams.get('activate') === 'true' ||
      Boolean(rawToken && !rawToken.startsWith('rst_')));

  if (isActivateRoute) {
    return (
      <ActivateAccountPage
        token={rawToken || ''}
        onGoToLogin={() => {
          window.history.replaceState({}, document.title, '/');
          setPathname('/');
          setForceLogin(true);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
