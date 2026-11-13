import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  Plus,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Network,
  ChevronRight,
  ChevronDown,
  Shield,
  Search,
  Filter,
  List,
  FolderTree,
  Copy,
  Check,
  Phone,
  UserCheck,
  UserX,
  CreditCard,
  Briefcase,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

export const OrganizationView: React.FC = () => {
  const {
    departments,
    teams,
    users,
    inviteEmployee,
    resendInvitation,
    simulateActivateAccount,
    toggleUserStatus,
    createDepartment,
    createTeam,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'invitations'>('employees');
  const [viewMode, setViewMode] = useState<'hierarchy' | 'table'>('hierarchy');

  // Filter States for Employees
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');

  // Collapsed sections in hierarchy view
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Invite Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [teamId, setTeamId] = useState('');
  const [reportingLeadId, setReportingLeadId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['Employee']);

  // Dept / Team Form State
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptLeadId, setDeptLeadId] = useState('');

  const [teamName, setTeamName] = useState('');
  const [teamDeptId, setTeamDeptId] = useState(departments[0]?.id || '');

  const availableRoles: UserRole[] = [
    'Employee',
    'Team Lead',
    'Department Lead',
    'Operation Manager',
    'Purchaser',
    'Finance',
    'Management',
    'Card Information Viewer',
    'System Admin',
  ];

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    inviteEmployee({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || '+880 1710-000000',
      designation: designation.trim() || 'Software Engineer',
      departmentId,
      teamId: teamId || undefined,
      reportingLeadId: reportingLeadId || undefined,
      roles: selectedRoles.length > 0 ? selectedRoles : ['Employee'],
    });

    setIsInviteModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setDesignation('');
    setReportingLeadId('');
    setSelectedRoles(['Employee']);
  };

  const handleCreateDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    const lead = users.find((u) => u.id === deptLeadId);

    createDepartment({
      name: deptName.trim(),
      description: deptDesc.trim() || 'Department unit',
      leadId: deptLeadId || undefined,
      leadName: lead?.name,
      isActive: true,
    });

    setIsDeptModalOpen(false);
    setDeptName('');
    setDeptDesc('');
    setDeptLeadId('');
  };

  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamDeptId) return;
    const dept = departments.find((d) => d.id === teamDeptId);

    createTeam({
      name: teamName.trim(),
      departmentId: teamDeptId,
      departmentName: dept?.name || 'Engineering',
      isActive: true,
    });

    setIsTeamModalOpen(false);
    setTeamName('');
  };

  const toggleDeptCollapse = (deptId: string) => {
    setCollapsedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const toggleTeamExpand = (teamKey: string) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamKey]: !prev[teamKey],
    }));
  };

  const copyMagicLink = (user: User) => {
    const magicLink = `${window.location.origin}/activate?token=act_${user.id}_${Date.now()}`;
    navigator.clipboard.writeText(magicLink);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Pending invitations list
  const pendingUsers = users.filter(
    (u) => u.accountStatus === 'Pending Invitation' || u.accountStatus === 'Expired Invitation'
  );

  // Active / registered employees
  const registeredUsers = useMemo(() => {
    return users.filter(
      (u) => u.accountStatus === 'Active' || u.accountStatus === 'Inactive'
    );
  }, [users]);

  // Filtered employees
  const filteredUsers = useMemo(() => {
    return registeredUsers.filter((u) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.designation.toLowerCase().includes(searchQuery.toLowerCase());

      // Department filter
      const matchesDept = departmentFilter === 'all' || u.departmentId === departmentFilter;

      // Team filter
      const matchesTeam =
        teamFilter === 'all' || (teamFilter === 'unassigned' ? !u.teamId : u.teamId === teamFilter);

      // Role filter
      const matchesRole = roleFilter === 'all' || u.roles.includes(roleFilter as UserRole);

      // Status filter
      const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;

      return matchesSearch && matchesDept && matchesTeam && matchesRole && matchesStatus;
    });
  }, [registeredUsers, searchQuery, departmentFilter, teamFilter, roleFilter, statusFilter]);

  // Department-wise & team-wise grouped data
  const groupedDepartments = useMemo(() => {
    return departments
      .map((dept) => {
        // Find all filtered users in this department
        const deptUsers = filteredUsers.filter((u) => u.departmentId === dept.id);
        const deptTeams = teams.filter((t) => t.departmentId === dept.id);

        const teamsWithUsers = deptTeams.map((team) => ({
          team,
          members: deptUsers.filter((u) => u.teamId === team.id),
        }));

        const poolMembers = deptUsers.filter((u) => !u.teamId);

        return {
          dept,
          totalDeptMembers: deptUsers.length,
          teams: teamsWithUsers,
          poolMembers,
        };
      })
      .filter((group) => {
        // If there's an active filter/search, hide empty departments
        if (searchQuery || departmentFilter !== 'all' || teamFilter !== 'all' || roleFilter !== 'all') {
          return group.totalDeptMembers > 0;
        }
        return true;
      });
  }, [departments, teams, filteredUsers, searchQuery, departmentFilter, teamFilter, roleFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EA5400]/10 flex items-center justify-center text-[#EA5400]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Organization & Employees
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Centralized hierarchy: Departments → Teams → Employees, with 48-hour secure invitation lifecycle
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            + Add Department
          </button>
          <button
            onClick={() => {
              setTeamDeptId(departments[0]?.id || '');
              setIsTeamModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            + Add Team
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#d04b00] rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Employee</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'employees'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#EA5400]" />
            <span>Employees ({registeredUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'invitations'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Invitations ({pendingUsers.length})</span>
            {pendingUsers.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'departments'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-sky-500" />
            <span>Departments & Teams ({departments.length})</span>
          </button>
        </div>

        {/* View Mode Toggle when on Employees Tab */}
        {activeTab === 'employees' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setViewMode('hierarchy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'hierarchy'
                  ? 'bg-white dark:bg-slate-900 text-[#EA5400] font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="View employees grouped by Department and Team"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Dept & Team Hierarchy</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-[#EA5400] font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="View flat table of all employees"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table Roster</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. EMPLOYEES TAB (DEPARTMENT & TEAM WISE / HIERARCHY + FLAT TABLE)       */}
      {/* ========================================================================= */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee name, email, or designation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Dept:</label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setTeamFilter('all'); // reset team when dept changes
                }}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Team:</label>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
              >
                <option value="all">All Teams</option>
                <option value="unassigned">General Dept Pool (No Team)</option>
                {teams
                  .filter((t) => departmentFilter === 'all' || t.departmentId === departmentFilter)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
              >
                <option value="all">All Roles</option>
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {(searchQuery || departmentFilter !== 'all' || teamFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDepartmentFilter('all');
                  setTeamFilter('all');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-[#EA5400] hover:underline font-medium cursor-pointer ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* VIEW MODE 1: HIERARCHICAL DEPARTMENT & TEAM WISE CARDS */}
          {viewMode === 'hierarchy' && (
            <div className="space-y-4">
              {groupedDepartments.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No employees match your search or filter criteria
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try adjusting your search query or reset filters.
                  </p>
                </div>
              ) : (
                groupedDepartments.map(({ dept, totalDeptMembers, teams: deptTeamsWithUsers, poolMembers }) => {
                  const isDeptCollapsed = collapsedDepts[dept.id];

                  return (
                    <div
                      key={dept.id}
                      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden transition-all"
                    >
                      {/* Department Accordion Header */}
                      <div
                        onClick={() => toggleDeptCollapse(dept.id)}
                        className="p-4 bg-slate-50/75 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-sky-600/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {dept.name}
                              </h3>
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60">
                                {totalDeptMembers} {totalDeptMembers === 1 ? 'Employee' : 'Employees'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                • {deptTeamsWithUsers.length} {deptTeamsWithUsers.length === 1 ? 'Team' : 'Teams'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                              <span>
                                Head / Lead: <strong className="text-slate-700 dark:text-slate-200">{dept.leadName || 'Unassigned'}</strong>
                              </span>
                              {dept.description && (
                                <span className="hidden md:inline text-slate-400">• {dept.description}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">
                            {isDeptCollapsed ? 'Expand' : 'Collapse'}
                          </span>
                          {isDeptCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90 transition-transform" />
                          )}
                        </div>
                      </div>

                      {/* Department Content Body */}
                      {!isDeptCollapsed && (
                        <div className="p-4 space-y-5 divide-y divide-slate-100 dark:divide-slate-700/60">
                          {/* Teams within Department */}
                          {deptTeamsWithUsers.map(({ team, members }) => (
                            <div key={team.id} className="pt-4 first:pt-0 space-y-3">
                              {/* Team Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[#EA5400]" />
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    {team.name}
                                  </h4>
                                  <span className="text-[10px] px-2 py-0.2 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    {members.length} {members.length === 1 ? 'member' : 'members'}
                                  </span>
                                  {team.leadName && (
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
                                      (Lead: <span className="text-slate-700 dark:text-slate-300 font-medium">{team.leadName}</span>)
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Members Grid / Cards */}
                              {members.length === 0 ? (
                                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/40 rounded-lg text-xs text-slate-400 italic">
                                  No employees currently assigned to this team.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {members.map((member) => (
                                    <div
                                      key={member.id}
                                      className="p-3 bg-slate-50/75 dark:bg-slate-850 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between gap-3 hover:border-[#EA5400]/40 transition-colors"
                                    >
                                      <div>
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-[#211E1F] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                                              {member.name.charAt(0)}
                                            </div>
                                            <div>
                                              <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                                                {member.name}
                                              </div>
                                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                {member.email}
                                              </div>
                                            </div>
                                          </div>

                                          <span
                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                              member.accountStatus === 'Active'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                            }`}
                                          >
                                            {member.accountStatus}
                                          </span>
                                        </div>

                                        <div className="mt-2.5 space-y-1 text-xs">
                                          <div className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                                            <Briefcase className="w-3 h-3 text-slate-400" />
                                            <span>{member.designation}</span>
                                          </div>
                                          {member.reportingLeadName && (
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                              Reports to: <span className="font-medium text-slate-700 dark:text-slate-300">{member.reportingLeadName}</span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Roles Badges */}
                                        <div className="flex flex-wrap gap-1 mt-2.5">
                                          {member.roles.map((r) => (
                                            <span
                                              key={r}
                                              className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                            >
                                              {r}
                                            </span>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Card Footer with Quick Toggle */}
                                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between text-[11px]">
                                        <span className="text-slate-400 font-mono text-[10px]">{member.phone}</span>
                                        <button
                                          onClick={() => toggleUserStatus(member.id)}
                                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                                            member.accountStatus === 'Active'
                                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
                                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                          }`}
                                        >
                                          {member.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Pool Members (Assigned to Department, but not to a specific team) */}
                          {poolMembers.length > 0 && (
                            <div className="pt-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-400" />
                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                  Department Pool (No Specific Team Assigned)
                                </h4>
                                <span className="text-[10px] px-2 py-0.2 rounded-full font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {poolMembers.length}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {poolMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="p-3 bg-slate-50/75 dark:bg-slate-850 rounded-xl border border-slate-200/70 dark:border-slate-700/60 flex flex-col justify-between gap-3 hover:border-[#EA5400]/40 transition-colors"
                                  >
                                    <div>
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-8 h-8 rounded-full bg-[#211E1F] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                                            {member.name.charAt(0)}
                                          </div>
                                          <div>
                                            <div className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                                              {member.name}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                              {member.email}
                                            </div>
                                          </div>
                                        </div>
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                            member.accountStatus === 'Active'
                                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                              : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                          }`}
                                        >
                                          {member.accountStatus}
                                        </span>
                                      </div>

                                      <div className="mt-2.5 space-y-1 text-xs">
                                        <div className="text-slate-700 dark:text-slate-300 font-medium">
                                          {member.designation}
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-1 mt-2.5">
                                        {member.roles.map((r) => (
                                          <span
                                            key={r}
                                            className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                          >
                                            {r}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between text-[11px]">
                                      <span className="text-slate-400 font-mono text-[10px]">{member.phone}</span>
                                      <button
                                        onClick={() => toggleUserStatus(member.id)}
                                        className="text-[10px] font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                                      >
                                        {member.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW MODE 2: TABULAR ROSTER VIEW */}
          {viewMode === 'table' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Employee Name & Email</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Department / Team</th>
                      <th className="py-3 px-4">Reporting Lead</th>
                      <th className="py-3 px-4">System Roles</th>
                      <th className="py-3 px-4">Card Visibility</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          No employees match the specified criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#211E1F] text-white flex items-center justify-center font-bold text-[11px] uppercase">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-white">
                                  {u.name}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            {u.designation}
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {u.departmentName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {u.teamName ? `Team: ${u.teamName}` : 'Dept Pool'}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {u.reportingLeadName ? (
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {u.reportingLeadName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((r) => (
                                <span
                                  key={r}
                                  className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {u.cardPermissionLevel && u.cardPermissionLevel !== 'none' ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                                {u.cardPermissionLevel}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No access</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                u.accountStatus === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {u.accountStatus}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer ${
                                u.accountStatus === 'Active'
                                  ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                              }`}
                            >
                              {u.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INVITATIONS & EXPIRATION LIFECYCLE (PRD Section 3 & AC-02)             */}
      {/* ========================================================================= */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <Clock className="w-4 h-4 text-[#EA5400]" />
              <span>48-Hour Invitation Token Policy & 7-Day Auto-Prune (PRD Section 3.2):</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
              When an administrator invites an employee, a secure 48-hour magic activation token is created. Unactivated invitations expire after 48 hours and switch to <code className="bg-amber-100 dark:bg-amber-900 px-1 py-0.2 rounded font-mono">Expired Invitation</code>. Profiles unactivated after 7 days are automatically pruned. You can resend the token, copy the magic link directly, or simulate activation for testing.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Invited Employee</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Designation & Dept</th>
                    <th className="py-3 px-4">Assigned Roles</th>
                    <th className="py-3 px-4">Invitation Sent</th>
                    <th className="py-3 px-4">Token Expiry (48h)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {pendingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No pending invitations. All invited employees have activated their accounts.
                      </td>
                    </tr>
                  ) : (
                    pendingUsers.map((u) => {
                      const isExpired = u.accountStatus === 'Expired Invitation';
                      const isCopied = copiedId === u.id;

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {u.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {u.email}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            <div>{u.designation}</div>
                            <div className="text-[11px] text-slate-400">
                              {u.departmentName} {u.teamName ? `• ${u.teamName}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((r) => (
                                <span
                                  key={r}
                                  className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {u.invitationSentAt ? new Date(u.invitationSentAt).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className={isExpired ? 'text-rose-600 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
                              {u.invitationExpiresAt ? new Date(u.invitationExpiresAt).toLocaleString() : 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isExpired
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {u.accountStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => copyMagicLink(u)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-md cursor-pointer inline-flex items-center gap-1"
                              title="Copy activation link URL"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                              <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                            </button>
                            <button
                              onClick={() => resendInvitation(u.id)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-md cursor-pointer"
                              title="Reset 48-hour expiration timer"
                            >
                              Resend Token
                            </button>
                            <button
                              onClick={() => simulateActivateAccount(u.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md cursor-pointer"
                              title="Instantly activate account without waiting for email link"
                            >
                              Simulate Activate
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DEPARTMENTS & TEAMS TAB                                                */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const deptTeams = teams.filter((t) => t.departmentId === dept.id);
            const deptEmployees = registeredUsers.filter((u) => u.departmentId === dept.id);

            return (
              <div
                key={dept.id}
                className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{dept.description}</p>
                    <div className="text-xs text-[#EA5400] mt-1 font-semibold">
                      Department Lead: {dept.leadName || 'Unassigned'}
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {deptEmployees.length} members
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase text-[10px] tracking-wider">
                      Teams ({deptTeams.length})
                    </span>
                    <button
                      onClick={() => {
                        setTeamDeptId(dept.id);
                        setIsTeamModalOpen(true);
                      }}
                      className="text-[#EA5400] hover:underline cursor-pointer font-semibold"
                    >
                      + Add Team
                    </button>
                  </div>

                  <div className="space-y-2">
                    {deptTeams.map((t) => {
                      const teamMembers = deptEmployees.filter((u) => u.teamId === t.id);
                      const isExpanded = expandedTeams[t.id];

                      return (
                        <div
                          key={t.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                Team Lead: <strong className="text-slate-700 dark:text-slate-200">{t.leadName || 'Unassigned'}</strong>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-400 text-[11px]">
                                {teamMembers.length} members
                              </span>
                              <button
                                onClick={() => toggleTeamExpand(t.id)}
                                className="text-[10px] font-semibold text-[#EA5400] hover:underline cursor-pointer"
                              >
                                {isExpanded ? 'Hide Roster' : 'View Roster'}
                              </button>
                            </div>
                          </div>

                          {/* Expandable Team Roster */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1.5 animate-in fade-in">
                              {teamMembers.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">No employees assigned to this team.</p>
                              ) : (
                                <div className="space-y-1">
                                  {teamMembers.map((m) => (
                                    <div
                                      key={m.id}
                                      className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-slate-800 text-[11px]"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</span>
                                        <span className="text-slate-400 ml-2">({m.designation})</span>
                                      </div>
                                      <span className="text-slate-400 font-mono text-[10px]">{m.email}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS (INVITE EMPLOYEE, ADD DEPT, ADD TEAM)                           */}
      {/* ========================================================================= */}

      {/* Invite Employee Modal */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsInviteModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EA5400]/10 flex items-center justify-center text-[#EA5400]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Invite Employee to RLTSMS
                </h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahfuzur Rahman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Riseup Labs Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@riseuplabs.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Mobile Engineer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+880 1710-000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      setTeamId('');
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Team Assignment</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                  >
                    <option value="">General Department Pool (No Team)</option>
                    {teams
                      .filter((t) => t.departmentId === departmentId)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Reporting Lead Selection (Requirement 2.2) */}
              <div>
                <label className="font-semibold block mb-1">Reporting Lead / Team Lead (Optional)</label>
                <select
                  value={reportingLeadId}
                  onChange={(e) => setReportingLeadId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                >
                  <option value="">-- Direct to Department Lead / Unassigned --</option>
                  {registeredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation} • {u.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <div>
                <label className="font-semibold block mb-1">Assigned Permissions & Roles</label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                  {availableRoles.map((role) => {
                    const isSelected = selectedRoles.includes(role);
                    return (
                      <button
                        type="button"
                        key={role}
                        onClick={() => handleRoleToggle(role)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#EA5400] text-white font-semibold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>48-Hour Cryptographic Activation Link:</strong> The employee receives an invitation email. If unactivated after 48 hours, the token expires. After 7 days, unactivated records are automatically pruned.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-[#EA5400] hover:bg-[#d04b00] rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {isDeptModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsDeptModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Department
              </h3>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeptSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence & R&D"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Primary scope of work and projects..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Department Lead</label>
                <select
                  value={deptLeadId}
                  onChange={(e) => setDeptLeadId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                >
                  <option value="">-- Assign Lead --</option>
                  {registeredUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-[#EA5400] hover:bg-[#d04b00] rounded-lg cursor-pointer"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {isTeamModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsTeamModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Team
              </h3>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeamSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Parent Department *</label>
                <select
                  value={teamDeptId}
                  onChange={(e) => setTeamDeptId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flutter Mobile Engineering"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#EA5400]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-[#EA5400] hover:bg-[#d04b00] rounded-lg cursor-pointer"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
