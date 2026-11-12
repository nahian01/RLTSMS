import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Moon,
  Sun,
  Shield,
  ChevronDown,
  Menu,
  LogOut,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavbarProps {
  onOpenNewRequisition: () => void;
  onOpenCommandPalette: () => void;
  onToggleMobileSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewRequisition,
  onOpenCommandPalette,
  onToggleMobileSidebar,
}) => {
  const {
    currentUser,
    signOut,
    currentView,
    selectedItemId,
    darkMode,
    toggleDarkMode,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setCurrentView,
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  // Friendly title mapping for breadcrumbs
  const viewTitleMap: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    services: 'Services & Tools Catalogue',
    accounts: 'Accounts & Licenses',
    access: 'Services & Tools Sharing Hub (Zero Credentials)',
    sharing: 'Services & Tools Sharing Hub (Zero Credentials)',
    requisitions: 'Requisitions',
    approvals: 'Approvals Queue',
    procurement: 'Procurement & Purchasing',
    subscriptions: 'Subscriptions & Renewals',
    expenses: 'Expenses & Spend Breakdown',
    cards: 'Restricted Payment Cards',
    reports: 'Financial Reports',
    notifications: 'Notifications Center',
    audit: 'Audit & Security Logs',
    settings: 'Settings & Email Templates',
    vendors: 'Vendors Directory',
    organization: 'Organization Structure',
    workflows: 'Approval Workflows',
  };

  const currentTitle = viewTitleMap[currentView] || 'Overview';

  return (
    <header className="sticky top-0 z-40 h-16 bg-white dark:bg-[#1A1718] border-b border-slate-200 dark:border-[#2D292A] px-4 sm:px-6 flex items-center justify-between gap-4 md:gap-8 transition-colors">
      {/* Zone 1: Mobile toggle + Official Brand & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2627]"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0" title="RLTSMS – Track Every Tool. Control Every Lifecycle.">
          <img
            src="/assets/riseuplabs-logo.png"
            alt="Riseup Labs Logo"
            className="w-8 h-8 rounded-lg object-contain shadow-xs border border-slate-200/50 dark:border-slate-700/50 bg-white"
          />
          <div className="hidden sm:block">
            <span className="font-bold text-[#211E1F] dark:text-white tracking-tight text-base font-title">
              RLTSMS
            </span>
            <span className="text-[11px] text-[#EA5400] font-semibold ml-1.5">
              Riseup Labs
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center text-xs text-slate-400 dark:text-slate-400 pl-3 border-l border-slate-200 dark:border-[#2D292A]">
          <span>{currentTitle}</span>
          {selectedItemId && (
            <>
              <span className="mx-1.5">/</span>
              <span className="font-mono text-slate-700 dark:text-slate-200 font-medium">
                {selectedItemId}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Zone 2: Global Search Command Palette Button */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-[#211E1F] hover:bg-slate-100 dark:hover:bg-[#2D292A] rounded-lg border border-slate-200 dark:border-[#2D292A] transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Search services, requisitions, accounts...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white dark:bg-[#2D292A] rounded border border-slate-200 dark:border-slate-700">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Actions + Notification Center + User Switcher + Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search button for small mobile screen */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="sm:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2627] cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Primary CTA: New Requisition in Official Brand Orange */}
        <button
          type="button"
          onClick={onOpenNewRequisition}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D64D00] active:bg-[#B84000] rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Requisition</span>
          <span className="sm:hidden">Request</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2627] transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EA5400] ring-2 ring-white dark:ring-[#211E1F]" />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#211E1F] rounded-xl shadow-2xl border border-slate-200 dark:border-[#2D292A] z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2D292A]">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Notifications ({unreadNotifications.length} unread)
                </span>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-[#EA5400] hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-[#2D292A]">
                {notifications.slice(0, 8).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      if (notif.linkAction) {
                        setCurrentView(notif.linkAction.view, notif.linkAction.id);
                        setShowNotifications(false);
                      }
                    }}
                    className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      notif.isRead
                        ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#2D292A]/50'
                        : 'bg-[#FFF1EB] dark:bg-[#EA5400]/10 text-slate-900 dark:text-slate-100 hover:bg-[#FFE4D6] font-medium'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">{notif.title}</div>
                    <div className="text-[11px] mt-0.5 line-clamp-2">{notif.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#2D292A] text-center">
                <button
                  onClick={() => {
                    setCurrentView('notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-[#EA5400]"
                >
                  View all alerts & configuration →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#2A2627] transition-colors cursor-pointer"
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Authenticated User Profile Menu (Zero Impersonation) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-lg border border-slate-200 dark:border-[#2D292A] hover:bg-slate-50 dark:hover:bg-[#2A2627] text-xs transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#211E1F] text-white dark:bg-[#EA5400] flex items-center justify-center font-bold text-[11px] ring-1 ring-slate-200 dark:ring-slate-700">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden md:block text-left">
              <div className="font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                <span>{currentUser.name}</span>
                {currentUser.roles.includes('Super Admin') && (
                  <Shield className="w-3 h-3 text-[#EA5400]" />
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {currentUser.roles[0]}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#211E1F] rounded-xl shadow-2xl border border-slate-200 dark:border-[#2D292A] z-50 p-3 space-y-3 animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Card Header */}
              <div className="p-3 bg-slate-50 dark:bg-[#1A1718] rounded-xl border border-slate-200/60 dark:border-[#2D292A]/60">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EA5400] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Active Account" />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                      {currentUser.designation}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-[#2D292A] grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">
                      {currentUser.departmentName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Team</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">
                      {currentUser.teamName || 'Cross-Functional'}
                    </span>
                  </div>
                  {currentUser.reportingLeadName && (
                    <div className="col-span-2 pt-1">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reporting Lead</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate block">
                        {currentUser.reportingLeadName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Roles & Permissions Badges */}
              <div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5 px-0.5">
                  Assigned System Roles
                </div>
                <div className="flex flex-wrap gap-1">
                  {currentUser.roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#2D292A] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                    >
                      {role === 'Super Admin' && <Shield className="w-3 h-3 text-[#EA5400]" />}
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sign Out CTA */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#2D292A]">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of RLTSMS</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
