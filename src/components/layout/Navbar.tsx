import React, { useState } from 'react';
import {
  Search,
  Bell,
  Plus,
  Moon,
  Sun,
  Shield,
  UserCheck,
  ChevronDown,
  Menu,
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
    switchUser,
    users,
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

  // Friendly title mapping for breadcrumb
  const viewTitleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    requisitions: 'Requisitions',
    services: 'Services & Tools Catalogue',
    accounts: 'Individual Accounts',
    subscriptions: 'Subscriptions & Renewals',
    purchases: 'Purchases & Procurement',
    vendors: 'Vendors Directory',
    cards: 'Restricted Payment Cards',
    organization: 'Organization & Teams',
    workflows: 'Approval Workflows',
    reports: 'Expenditure Reports',
    notifications: 'Notifications Center',
    audit: 'Audit & Security Logs',
    settings: 'System & RBAC Settings',
  };

  const currentTitle = viewTitleMap[currentView] || 'Overview';

  return (
    <header className="sticky top-0 z-40 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 md:gap-8 transition-colors">
      {/* Zone 1: Mobile toggle + Brand & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0" title="RLTSMS – Your Tools. Your Services. Every Stage, Tracked">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            RL
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">
              RLTSMS
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1.5 font-normal">
              Riseup Labs
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center text-xs text-slate-400 dark:text-slate-500 pl-3 border-l border-slate-200 dark:border-slate-800">
          <span>{currentTitle}</span>
          {selectedItemId && (
            <>
              <span className="mx-1.5">/</span>
              <span className="font-mono text-slate-600 dark:text-slate-300 font-medium">
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
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Search services, requisitions, accounts...</span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
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
          className="sm:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Primary CTA: New Requisition */}
        <button
          type="button"
          onClick={onOpenNewRequisition}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
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
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 p-3 space-y-2 animate-in fade-in slide-in-from-top-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Notifications ({unreadNotifications.length} unread)
                </span>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
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
                        ? 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-sky-50/70 dark:bg-sky-950/30 text-slate-800 dark:text-slate-200 hover:bg-sky-100/60 font-medium'
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

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    setCurrentView('notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
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
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Role & Persona Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px]">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden md:block text-left">
              <div className="font-semibold text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                <span>{currentUser.name}</span>
                {currentUser.roles.includes('Super Admin') && (
                  <Shield className="w-3 h-3 text-sky-600 dark:text-sky-400" />
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
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 p-2 space-y-2 animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
                <div className="font-semibold text-slate-900 dark:text-white">Active User Switcher</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Switch personas to test approval levels, card restrictions & procurement view.
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          {u.name}
                          {isCurrent && <UserCheck className="w-3.5 h-3.5 text-sky-600" />}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {u.roles.join(', ')} · {u.departmentName}
                        </div>
                      </div>
                      {u.cardPermissionLevel && u.cardPermissionLevel !== 'none' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          Card Viewer
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
                RBAC session synced with permissions
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
