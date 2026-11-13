import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Department, Team, RoleDefinition, UserRole } from '../../types';
import {
  Search,
  Filter,
  X,
  Edit2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building,
  Users,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error';
}

let toastSeq = 0;

export const EmployeeTableView: React.FC = () => {
  const {
    users,
    departments,
    teams,
    roles,
    updateEmployee,
    updateUserRoles,
    toggleUserStatus,
  } = useApp();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Modals state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [editReportingLeadId, setEditReportingLeadId] = useState('');
  const [editRoles, setEditRoles] = useState<UserRole[]>([]);
  const [editError, setEditError] = useState('');

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, kind: 'success' | 'error' = 'success') => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Filter teams based on selected department filter
  const availableTeamsForFilter = useMemo(() => {
    if (!departmentFilter) return teams;
    return teams.filter((t) => t.departmentId === departmentFilter);
  }, [teams, departmentFilter]);

  // When department filter changes, clear team filter if not valid
  useEffect(() => {
    if (departmentFilter && teamFilter) {
      const match = teams.find((t) => t.id === teamFilter && t.departmentId === departmentFilter);
      if (!match) {
        setTeamFilter('');
      }
    }
  }, [departmentFilter, teamFilter, teams]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesDesig = u.designation.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDesig) return false;
      }

      // Department filter
      if (departmentFilter && u.departmentId !== departmentFilter) {
        return false;
      }

      // Team filter
      if (teamFilter && u.teamId !== teamFilter) {
        return false;
      }

      // Role filter
      if (roleFilter && !u.roles.includes(roleFilter as UserRole)) {
        return false;
      }

      // Status filter
      if (statusFilter && u.accountStatus !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [users, searchQuery, departmentFilter, teamFilter, roleFilter, statusFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, teamFilter, roleFilter, statusFilter]);

  // Pagination calculation
  const totalEmployees = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalEmployees / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEmployees);
  const currentEmployees = filteredUsers.slice(startIndex, endIndex);

  const hasActiveFilters = Boolean(
    searchQuery || departmentFilter || teamFilter || roleFilter || statusFilter
  );

  const clearFilters = () => {
    setSearchQuery('');
    setDepartmentFilter('');
    setTeamFilter('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Open Edit Modal
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditDesignation(user.designation || '');
    setEditDepartmentId(user.departmentId || '');
    setEditTeamId(user.teamId || '');
    setEditReportingLeadId(user.reportingLeadId || '');
    setEditRoles([...user.roles]);
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setIsSaving(false);
    setEditError('');
  };

  // Handle department change in edit modal
  const handleEditDepartmentChange = (deptId: string) => {
    setEditDepartmentId(deptId);
    setEditTeamId(''); // reset team to unassigned
  };

  // Teams available in edit modal based on selected department
  const editAvailableTeams = useMemo(() => {
    if (!editDepartmentId) return [];
    return teams.filter((t) => t.departmentId === editDepartmentId);
  }, [teams, editDepartmentId]);

  // Active users for reporting lead dropdown (excluding self)
  const potentialLeads = useMemo(() => {
    return users.filter((u) => u.accountStatus === 'Active' && (!editingUser || u.id !== editingUser.id));
  }, [users, editingUser]);

  // Toggle role in edit modal
  const handleToggleRole = (roleName: UserRole) => {
    setEditRoles((prev) => {
      if (prev.includes(roleName)) {
        // Prevent removing the last role
        if (prev.length <= 1) {
          setEditError('User must have at least one role.');
          return prev;
        }
        return prev.filter((r) => r !== roleName);
      } else {
        setEditError('');
        return [...prev, roleName];
      }
    });
  };

  // Save Employee Edits
  const handleSaveEmployee = async () => {
    if (!editingUser) return;
    if (!editName.trim()) {
      setEditError('Employee name is required.');
      return;
    }
    if (editRoles.length === 0) {
      setEditError('Employee must have at least one role.');
      return;
    }

    setIsSaving(true);
    setEditError('');

    try {
      const selectedDept = departments.find((d) => d.id === editDepartmentId);
      const selectedTeam = teams.find((t) => t.id === editTeamId);
      const selectedLead = users.find((u) => u.id === editReportingLeadId);

      // 1. Update basic employee profile
      await updateEmployee(editingUser.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        designation: editDesignation.trim(),
        departmentId: editDepartmentId || '',
        departmentName: selectedDept ? selectedDept.name : '',
        teamId: editTeamId || '',
        teamName: selectedTeam ? selectedTeam.name : '',
        reportingLeadId: editReportingLeadId || '',
        reportingLeadName: selectedLead ? selectedLead.name : '',
      });

      // 2. Update user roles if changed
      const rolesChanged =
        editRoles.length !== editingUser.roles.length ||
        editRoles.some((r) => !editingUser.roles.includes(r));

      if (rolesChanged) {
        await updateUserRoles(editingUser.id, editRoles);
      }

      addToast(`Updated profile for ${editName.trim()}`);
      closeEditModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update employee';
      setEditError(msg);
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Status
  const handleStatusClick = (user: User) => {
    if (user.accountStatus === 'Active') {
      // Confirm deactivate
      setDeactivatingUser(user);
    } else {
      // Direct activate
      toggleUserStatus(user.id);
      addToast(`Activated account for ${user.name}`);
    }
  };

  const confirmDeactivate = () => {
    if (!deactivatingUser) return;
    toggleUserStatus(deactivatingUser.id);
    addToast(`Deactivated account for ${deactivatingUser.name}`);
    setDeactivatingUser(null);
  };

  // Initials helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name.slice(0, 2) || 'U').toUpperCase();
  };

  // Status color badge
  const renderStatusBadge = (status: User['accountStatus']) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Active
          </span>
        );
      case 'Pending Invitation':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Pending
          </span>
        );
      case 'Expired Invitation':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            Expired
          </span>
        );
      case 'Inactive':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 max-w-sm">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between p-3 rounded-lg shadow-lg text-xs font-medium border ${
                t.kind === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
              }`}
            >
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="ml-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Employees Directory
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-[#EA5400]/10 text-[#EA5400] border border-[#EA5400]/20">
              {users.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            All team members across departments and teams with roles and assignments
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, desig..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
            >
              <option value="">All Teams</option>
              {availableTeamsForFilter.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Invitation">Pending Invitation</option>
              <option value="Expired Invitation">Expired Invitation</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Clear filters badge */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
            <span>
              Showing {filteredUsers.length} of {users.length} employees
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-[#EA5400] hover:underline font-medium cursor-pointer"
            >
              <X className="w-3 h-3" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Employees Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Roles</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {currentEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm font-medium">No employees found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {hasActiveFilters ? 'Try adjusting your filters' : 'Invite employees to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                currentEmployees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  const team = teams.find((t) => t.id === emp.teamId);

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Employee Cell */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EA5400] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                            {getInitials(emp.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {emp.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {emp.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {emp.designation || '—'}
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4">
                        {dept ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {dept.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Team */}
                      <td className="py-3 px-4">
                        {team ? (
                          <span className="text-slate-700 dark:text-slate-300">
                            {team.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Roles */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {emp.roles.slice(0, 2).map((role) => (
                            <span
                              key={role}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            >
                              {role}
                            </span>
                          ))}
                          {emp.roles.length > 2 && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              title={emp.roles.slice(2).join(', ')}
                            >
                              +{emp.roles.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(emp.accountStatus)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 text-slate-500 hover:text-[#EA5400] hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            title="Edit Employee"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusClick(emp)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              emp.accountStatus === 'Active'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={emp.accountStatus === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {emp.accountStatus === 'Active' ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalEmployees > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{endIndex}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalEmployees}</span> employees
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Edit Employee Profile
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {editingUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {editError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+880 1..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
                  />
                </div>

                {/* Designation */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={editDepartmentId}
                    onChange={(e) => handleEditDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
                  >
                    <option value="">(Unassigned)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {!d.isActive ? '(Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team (Filtered by dept) */}
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Team
                  </label>
                  <select
                    value={editTeamId}
                    onChange={(e) => setEditTeamId(e.target.value)}
                    disabled={!editDepartmentId}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400] disabled:opacity-50"
                  >
                    <option value="">(Unassigned)</option>
                    {editAvailableTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {!t.isActive ? '(Inactive)' : ''}
                      </option>
                    ))}
                  </select>
                  {!editDepartmentId && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Select a department first to assign a team
                    </p>
                  )}
                </div>

                {/* Reporting Lead */}
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reporting Lead
                  </label>
                  <select
                    value={editReportingLeadId}
                    onChange={(e) => setEditReportingLeadId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
                  >
                    <option value="">(None)</option>
                    {potentialLeads.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.designation || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roles Multi-Select Checklist */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Assigned Roles <span className="text-rose-500">*</span>
                </label>
                <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-lg max-h-48 overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
                  {roles.map((r) => {
                    const isChecked = editRoles.includes(r.name);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-[#EA5400]/5 border border-[#EA5400]/30'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRole(r.name)}
                          className="mt-0.5 accent-[#EA5400] rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {r.name}
                            </span>
                            {r.isSystem && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                System
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {r.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEmployee}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-lg bg-[#EA5400] text-white hover:bg-orange-700 font-medium disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirm Dialog */}
      {deactivatingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Deactivate Employee?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to deactivate <span className="font-semibold">{deactivatingUser.name}</span>?
              They will immediately lose access to all RLTSMS services and tools until reactivated.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeactivatingUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 cursor-pointer"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

