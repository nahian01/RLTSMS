import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  CalendarDays,
  ShoppingBag,
  Building,
  CreditCard,
  Network,
  Workflow,
  BarChart3,
  Bell,
  History,
  Settings,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeColor?: string;
  isProtected?: boolean;
}

interface SidebarSection {
  label: string;
  items: SidebarMenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { currentView, setCurrentView, requisitions, purchases } = useApp();

  // Compute live badges
  const pendingApprovalsCount = requisitions.filter(
    (r) => r.status === 'Pending Approval'
  ).length;

  const pendingPurchasesCount = requisitions.filter(
    (r) => r.status === 'Approved'
  ).length;

  const menuSections: SidebarSection[] = [
    {
      label: 'Main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'requisitions',
          label: 'Requisitions',
          icon: FileText,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        },
        {
          id: 'services',
          label: 'Services & Tools',
          icon: Package,
        },
        {
          id: 'accounts',
          label: 'Accounts',
          icon: Users,
        },
        {
          id: 'subscriptions',
          label: 'Subscriptions',
          icon: CalendarDays,
        },
        {
          id: 'purchases',
          label: 'Purchases',
          icon: ShoppingBag,
          badge: pendingPurchasesCount > 0 ? pendingPurchasesCount : undefined,
          badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
        },
      ],
    },
    {
      label: 'Procurement & Security',
      items: [
        {
          id: 'vendors',
          label: 'Vendors',
          icon: Building,
        },
        {
          id: 'cards',
          label: 'Payment Cards',
          icon: CreditCard,
          isProtected: true,
        },
        {
          id: 'workflows',
          label: 'Approval Workflows',
          icon: Workflow,
        },
        {
          id: 'organization',
          label: 'Organization',
          icon: Network,
        },
      ],
    },
    {
      label: 'Analysis & Administration',
      items: [
        {
          id: 'reports',
          label: 'Reports & Spend',
          icon: BarChart3,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
        },
        {
          id: 'audit',
          label: 'Audit Logs',
          icon: History,
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
        },
      ],
    },
  ];

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuSections.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {section.label}
              </div>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                        {item.isProtected && (
                          <span title="Protected Restricted Area">
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          </span>
                        )}
                      </div>

                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-white text-sky-800 font-bold'
                              : item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer info: System version, RLTSMS brand tag & Slogan */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>RLTSMS Enterprise</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono">v1.2</span>
          </div>
          <div className="text-[10px] text-sky-400 font-medium tracking-tight" title="Your Tools. Your Services. Every Stage, Tracked">
            Your Tools. Your Services. Every Stage, Tracked
          </div>
        </div>
      </aside>
    </>
  );
};
