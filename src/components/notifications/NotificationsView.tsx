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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    triggerMonthlyPlanningDispatch,
    setCurrentView,
  } = useApp();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [schedulerNotice, setSchedulerNotice] = useState<string | null>(null);

  // Renewal reminder settings
  const [remind7Days, setRemind7Days] = useState(true);
  const [remind3Days, setRemind3Days] = useState(true);
  const [remind1Day, setRemind1Day] = useState(true);
  const [remindOnDate, setRemindOnDate] = useState(true);

  const filtered = notifications.filter((n) => {
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notifications & Scheduled Alerts Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Procurement alerts, multi-stage approval pings, and monthly purchase planning triggers (PRD Section 12)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={markAllNotificationsRead}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            Mark All Read
          </button>
          <button
            onClick={handleTriggerScheduler}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Trigger Monthly Planning Dispatch</span>
          </button>
        </div>
      </div>

      {schedulerNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{schedulerNotice}</span>
        </div>
      )}

      {/* Two-column layout: Notifications list + Reminder Rules Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: Notifications List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5 text-xs">
              {['all', 'approval', 'purchase', 'renewal', 'planning'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-md capitalize cursor-pointer transition-colors ${
                    selectedType === t
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <span className="text-xs font-mono text-slate-400">{filtered.length} alerts</span>
          </div>

          <div className="space-y-2">
            {filtered.map((notif) => (
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
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 shadow-2xs'
                    : 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
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
            ))}
          </div>
        </div>

        {/* Right: Scheduled Reminders Config (PRD Section 12) */}
        <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
            <Clock className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Renewal Cadence Rules
            </h3>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Configure automated email and in-app reminder schedules sent to administrators and purchasers before recurring subscriptions expire.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 cursor-pointer">
              <span>7 days before renewal</span>
              <input
                type="checkbox"
                checked={remind7Days}
                onChange={(e) => setRemind7Days(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 cursor-pointer">
              <span>3 days before renewal</span>
              <input
                type="checkbox"
                checked={remind3Days}
                onChange={(e) => setRemind3Days(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 cursor-pointer">
              <span>1 day before renewal</span>
              <input
                type="checkbox"
                checked={remind1Day}
                onChange={(e) => setRemind1Day(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 cursor-pointer">
              <span>On the renewal date</span>
              <input
                type="checkbox"
                checked={remindOnDate}
                onChange={(e) => setRemindOnDate(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
            </label>
          </div>

          {/* Monthly Planning Reminder Information */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
            <strong>Monthly Purchasing Notification (PRD 12.3):</strong>
            <p>
              Seven days before the end of each month, RLTSMS collects approved unpurchased requisitions and upcoming commitments, automatically delivering a financial planning briefing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
