import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Settings,
  Sparkles,
  User,
  Shield,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationsView: React.FC = () => {
  const {
    currentUser,
    notifications,
    allNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    triggerMonthlyPlanningDispatch,
    setCurrentView,
    hasPermission,
  } = useApp();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [schedulerNotice, setSchedulerNotice] = useState<string | null>(null);
  const [viewScope, setViewScope] = useState<'my' | 'all'>('my');

  // Renewal reminder settings
  const [remind7Days, setRemind7Days] = useState(true);
  const [remind3Days, setRemind3Days] = useState(true);
  const [remind1Day, setRemind1Day] = useState(true);
  const [remindOnDate, setRemindOnDate] = useState(true);

  const canManageSettings = hasPermission('settings:manage') || currentUser?.roles?.includes('Super Admin');

  const activeNotificationList = (canManageSettings && viewScope === 'all')
    ? (allNotifications || notifications)
    : notifications;

  const filtered = activeNotificationList.filter((n) => {
    if (selectedType !== 'all' && n.type !== selectedType) return false;
    return true;
  });

  const handleTriggerScheduler = () => {
    triggerMonthlyPlanningDispatch();
    setSchedulerNotice('Monthly purchasing summary generated and dispatched to designated administrators.');
    setTimeout(() => setSchedulerNotice(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Notifications & Scheduled Alerts
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-medium bg-[#EA5400]/10 text-[#EA5400] dark:bg-[#EA5400]/20 rounded-full">
              {currentUser?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {canManageSettings && viewScope === 'all'
              ? 'All system-wide notifications, approvals, and reminders across all users (Admin View)'
              : 'Notifications and approval updates specifically addressed to your account'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {canManageSettings && (
            <div className="flex items-center bg-slate-100 dark:bg-[#2A2627] p-0.5 rounded-lg border border-slate-200 dark:border-[#2D292A] text-xs">
              <button
                onClick={() => setViewScope('my')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewScope === 'my'
                    ? 'bg-white dark:bg-[#211E1F] text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                My Alerts ({notifications.filter((n) => !n.isRead).length})
              </button>
              <button
                onClick={() => setViewScope('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  viewScope === 'all'
                    ? 'bg-white dark:bg-[#211E1F] text-[#EA5400] shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All System ({allNotifications ? allNotifications.filter((n) => !n.isRead).length : 0})
              </button>
            </div>
          )}

          <button
            onClick={markAllNotificationsRead}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#211E1F] border border-slate-200 dark:border-[#2D292A] hover:bg-slate-50 dark:hover:bg-[#2A2627] rounded-lg cursor-pointer transition-colors"
          >
            Mark All Read
          </button>

          {canManageSettings && (
            <button
              onClick={handleTriggerScheduler}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#D44C00] rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Trigger Monthly Planning Dispatch</span>
            </button>
          )}
        </div>
      </div>

      {schedulerNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{schedulerNotice}</span>
        </div>
      )}

      {/* Main Grid: notifications list + admin reminder config */}
      <div className={`grid grid-cols-1 ${canManageSettings ? 'lg:grid-cols-3' : ''} gap-6 items-start`}>
        {/* Left: Notifications List */}
        <div className={`${canManageSettings ? 'lg:col-span-2' : 'max-w-4xl'} space-y-3`}>
          <div className="flex items-center justify-between pb-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['all', 'approval', 'purchase', 'renewal', 'planning', 'access', 'requisition'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-md capitalize cursor-pointer transition-colors ${
                    selectedType === t
                      ? 'bg-[#EA5400] text-white font-semibold'
                      : 'bg-slate-100 dark:bg-[#2A2627] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#343031]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono text-slate-400 shrink-0">{filtered.length} alerts</span>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#2A2627] flex items-center justify-center mx-auto text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">No notifications</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  You are all caught up! New approval requests, access provisioning alerts, and tool updates addressed to you will appear here.
                </p>
              </div>
            ) : (
              filtered.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.linkAction) {
                      setCurrentView(notif.linkAction.view, notif.linkAction.id);
                    }
                  }}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                    notif.isRead
                      ? 'bg-white dark:bg-[#211E1F] border-slate-200 dark:border-[#2D292A] shadow-2xs hover:border-slate-300 dark:hover:border-slate-600'
                      : 'bg-[#FFF8F5] dark:bg-[#2A1F1B] border-[#EA5400]/30 shadow-xs hover:border-[#EA5400]/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {notif.title}
                        </span>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#EA5400] shrink-0" />
                        )}
                        {canManageSettings && viewScope === 'all' && notif.recipientId && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#2D292A] text-slate-500 dark:text-slate-400">
                            To: {notif.recipientId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Scheduled Reminders Config (Shown for Admins) */}
        {canManageSettings && (
          <div className="p-5 bg-white dark:bg-[#211E1F] rounded-xl border border-slate-200 dark:border-[#2D292A] shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#2D292A]">
              <Clock className="w-4 h-4 text-[#EA5400]" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Renewal Cadence Rules
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Configure automated email and in-app reminder schedules sent to administrators and purchasers before recurring subscriptions expire.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#2A2627] cursor-pointer">
                <span className="text-slate-700 dark:text-slate-200">7 days before renewal</span>
                <input
                  type="checkbox"
                  checked={remind7Days}
                  onChange={(e) => setRemind7Days(e.target.checked)}
                  className="rounded text-[#EA5400] focus:ring-[#EA5400]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#2A2627] cursor-pointer">
                <span className="text-slate-700 dark:text-slate-200">3 days before renewal</span>
                <input
                  type="checkbox"
                  checked={remind3Days}
                  onChange={(e) => setRemind3Days(e.target.checked)}
                  className="rounded text-[#EA5400] focus:ring-[#EA5400]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#2A2627] cursor-pointer">
                <span className="text-slate-700 dark:text-slate-200">1 day before renewal</span>
                <input
                  type="checkbox"
                  checked={remind1Day}
                  onChange={(e) => setRemind1Day(e.target.checked)}
                  className="rounded text-[#EA5400] focus:ring-[#EA5400]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#2A2627] cursor-pointer">
                <span className="text-slate-700 dark:text-slate-200">On the renewal date</span>
                <input
                  type="checkbox"
                  checked={remindOnDate}
                  onChange={(e) => setRemindOnDate(e.target.checked)}
                  className="rounded text-[#EA5400] focus:ring-[#EA5400]"
                />
              </label>
            </div>

            {/* Monthly Planning Reminder Information */}
            <div className="p-3 bg-[#FFF1EB] dark:bg-[#EA5400]/10 rounded-lg text-[11px] text-[#EA5400] dark:text-[#FF8A4C] space-y-1">
              <strong>Monthly Purchasing Notification (PRD 12.3):</strong>
              <p className="text-slate-600 dark:text-slate-300">
                Seven days before the end of each month, RLTSMS collects approved unpurchased requisitions and upcoming commitments, automatically delivering a financial planning briefing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
