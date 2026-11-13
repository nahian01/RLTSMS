import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShieldCheck,
  FileText,
  CheckCircle2,
  ShoppingBag,
  CalendarDays,
  DollarSign,
  CreditCard,
  BarChart3,
  Bell,
  History,
  Settings,
  Lock,
  ChevronLeft,
  ChevronRight,
  Workflow,
  Building,
  Shield,
  Network,
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
  const { currentView, setCurrentView, requisitions, accessAssignments, notifications, users } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Live badge counts
  const pendingApprovalsCount = requisitions.filter((r) => r.status === 'Pending Approval').length;
  const pendingPurchasesCount = requisitions.filter((r) => r.status === 'Approved').length;
  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  // Exact 14-destination navigation per PRD & Transformation Spec (Part 4.1)
  const menuSections: SidebarSection[] = [
    {
      label: 'Inventory & Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          id: 'services',
          label: 'Services & Tools',
          icon: Package,
        },
        {
          id: 'accounts',
          label: 'Accounts & Licenses',
          icon: Users,
        },
        {
          id: 'access',
          label: 'Service & Sharing Hub',
          icon: ShieldCheck,
          badge: accessAssignments.filter((a) => a.status === 'Active').length,
          badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-800/60',
        },
      ],
    },
    {
      label: 'Procurement Lifecycle',
      items: [
        {
          id: 'requisitions',
          label: 'Requisitions',
          icon: FileText,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          badgeColor: 'bg-amber-950 text-amber-300 border border-amber-800/60',
        },
        {
          id: 'approvals',
          label: 'Approvals',
          icon: CheckCircle2,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          badgeColor: 'bg-[#EA5400]/20 text-[#EA5400] border border-[#EA5400]/40',
        },
        {
          id: 'procurement',
          label: 'Procurement',
          icon: ShoppingBag,
          badge: pendingPurchasesCount > 0 ? pendingPurchasesCount : undefined,
          badgeColor: 'bg-sky-950 text-sky-300 border border-sky-800/60',
        },
        {
          id: 'subscriptions',
          label: 'Subscriptions',
          icon: CalendarDays,
        },
        {
          id: 'expenses',
          label: 'Expenses',
          icon: DollarSign,
        },
        {
          id: 'cards',
          label: 'Payment Cards',
          icon: CreditCard,
          isProtected: true,
        },
      ],
    },
    {
      label: 'Governance & System',
      items: [
        {
          id: 'rbac',
          label: 'RBAC & Permissions',
          icon: Shield,
        },
        {
          id: 'org-structure',
          label: 'Dept & Teams',
          icon: Network,
        },
        {
          id: 'employees',
          label: 'Employees',
          icon: Users,
          badge: users.filter((u) => u.accountStatus === 'Active').length,
          badgeColor: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
        },
        {
          id: 'organization',
          label: 'Org Hierarchy',
          icon: Building,
        },
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
          badgeColor: 'bg-[#EA5400] text-white',
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 bg-[#211E1F] text-slate-300 flex flex-col border-r border-[#2D292A] transition-all duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Collapse toggle (desktop only) */}
        <div className="hidden md:flex items-center justify-end px-3 py-2 border-b border-[#2D292A]">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#2A2627] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
          {menuSections.map((section) => (
            <div key={section.label}>
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {section.label}
                </div>
              )}
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id || (item.id === 'procurement' && currentView === 'purchases');

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center py-2.5 px-0' : 'justify-between px-3 py-2'
                      } rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#EA5400] text-white shadow-xs font-semibold'
                          : 'text-slate-300 hover:bg-[#2D292A] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                        {!isCollapsed && item.isProtected && (
                          <span title="Restricted Area">
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          </span>
                        )}
                      </div>

                      {!isCollapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-white text-[#211E1F] font-bold'
                              : item.badgeColor || 'bg-[#2D292A] text-slate-300'
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

        {/* Footer info: Slogan and official brand attribution */}
        {!isCollapsed && (
          <div className="p-3 border-t border-[#2D292A] bg-[#1A1718] text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span>RLTSMS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">from Riseup Labs</span>
            </div>
            <div className="text-[10px] text-[#EA5400] font-medium tracking-tight" title="Track Every Tool. Control Every Lifecycle.">
              Track Every Tool. Control Every Lifecycle.
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
