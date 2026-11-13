import React, { useState, useMemo } from 'react';
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  Search,
  AlertTriangle,
  Users,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RoleDefinition, PermissionDefinition, UserRole } from '../../types';

export const RBACView: React.FC = () => {
  const {
    roles,
    permissions,
    users,
    createRole,
    updateRole,
    deleteRole,
    createPermission,
    updatePermission,
    deletePermission,
    updateUserRoles,
    getUserPermissions,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'assignment'>('roles');

  // Roles state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] });
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');

  // Permissions state
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<PermissionDefinition | null>(null);
  const [permForm, setPermForm] = useState({ code: '', name: '', module: '', description: '' });
  const [permSearch, setPermSearch] = useState('');

  // User assignment state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignRoles, setAssignRoles] = useState<UserRole[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'role' | 'permission'; id: string; name: string } | null>(null);

  // Grouped permissions by module
  const permissionsByModule = useMemo(() => {
    const grouped: Record<string, PermissionDefinition[]> = {};
    permissions.forEach((p) => {
      if (!grouped[p.module]) grouped[p.module] = [];
      grouped[p.module].push(p);
    });
    return grouped;
  }, [permissions]);

  const filteredRoles = useMemo(() =>
    roles.filter((r) => r.name.toLowerCase().includes(roleSearch.toLowerCase())),
    [roles, roleSearch]
  );

  const filteredPerms = useMemo(() =>
    permissions.filter((p) =>
      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.module.toLowerCase().includes(permSearch.toLowerCase())
    ),
    [permissions, permSearch]
  );

  const registeredUsers = useMemo(() =>
    users.filter((u) => u.accountStatus === 'Active' || u.accountStatus === 'Inactive'),
    [users]
  );

  const filteredUsers = useMemo(() =>
    registeredUsers.filter((u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    ),
    [registeredUsers, userSearch]
  );

  const selectedUser = useMemo(() =>
    registeredUsers.find((u) => u.id === selectedUserId),
    [registeredUsers, selectedUserId]
  );

  // Role Modal
  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '', permissions: [] });
    setIsRoleModalOpen(true);
  };

  const openEditRole = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description, permissions: [...role.permissions] });
    setIsRoleModalOpen(true);
  };

  const handleRoleSave = async () => {
    if (!roleForm.name.trim()) return;
    if (editingRole) {
      await updateRole(editingRole.id, {
        name: roleForm.name.trim() as UserRole,
        description: roleForm.description.trim(),
        permissions: roleForm.permissions,
      });
    } else {
      await createRole({
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        permissions: roleForm.permissions,
      });
    }
    setIsRoleModalOpen(false);
  };

  const togglePermInRole = (code: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter((c) => c !== code)
        : [...prev.permissions, code],
    }));
  };

  // Permission Modal
  const openCreatePerm = () => {
    setEditingPerm(null);
    setPermForm({ code: '', name: '', module: '', description: '' });
    setIsPermModalOpen(true);
  };

  const openEditPerm = (perm: PermissionDefinition) => {
    setEditingPerm(perm);
    setPermForm({ code: perm.code, name: perm.name, module: perm.module, description: perm.description });
    setIsPermModalOpen(true);
  };

  const handlePermSave = async () => {
    if (!permForm.code.trim() || !permForm.name.trim() || !permForm.module.trim()) return;
    if (editingPerm) {
      await updatePermission(editingPerm.id, {
        code: permForm.code.trim().toLowerCase(),
        name: permForm.name.trim(),
        module: permForm.module.trim(),
        description: permForm.description.trim(),
      });
    } else {
      await createPermission({
        code: permForm.code.trim().toLowerCase(),
        name: permForm.name.trim(),
        module: permForm.module.trim(),
        description: permForm.description.trim(),
      });
    }
    setIsPermModalOpen(false);
  };

  // User Role Assignment
  const handleSelectUser = (uid: string) => {
    const u = registeredUsers.find((x) => x.id === uid);
    setSelectedUserId(uid);
    setAssignRoles(u ? [...u.roles] : []);
    setSaveMsg('');
  };

  const toggleAssignRole = (roleName: UserRole) => {
    setAssignRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUserId || assignRoles.length === 0) return;
    setSavingUser(true);
    await updateUserRoles(selectedUserId, assignRoles);
    setSavingUser(false);
    setSaveMsg('Roles updated successfully');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'role') await deleteRole(confirmDelete.id);
    else await deletePermission(confirmDelete.id);
    setConfirmDelete(null);
  };

  const moduleColors: Record<string, string> = {
    'Dashboard': 'text-sky-600 bg-sky-50 dark:bg-sky-950',
    'Requisitions': 'text-amber-600 bg-amber-50 dark:bg-amber-950',
    'Approvals': 'text-orange-600 bg-orange-50 dark:bg-orange-950',
    'Services': 'text-violet-600 bg-violet-50 dark:bg-violet-950',
    'Accounts': 'text-purple-600 bg-purple-50 dark:bg-purple-950',
    'Access Sharing': 'text-green-600 bg-green-50 dark:bg-green-950',
    'Procurement': 'text-blue-600 bg-blue-50 dark:bg-blue-950',
    'Subscriptions': 'text-teal-600 bg-teal-50 dark:bg-teal-950',
    'Finance': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
    'Payment Cards': 'text-rose-600 bg-rose-50 dark:bg-rose-950',
    'Organization': 'text-[#EA5400] bg-orange-50 dark:bg-orange-950/40',
    'RBAC': 'text-slate-600 bg-slate-100 dark:bg-slate-800',
    'Workflows': 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950',
    'Reports': 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950',
    'Audit': 'text-red-600 bg-red-50 dark:bg-red-950',
    'Settings': 'text-gray-600 bg-gray-50 dark:bg-gray-900',
  };

  const getModuleColor = (module: string) =>
    moduleColors[module] || 'text-slate-600 bg-slate-100 dark:bg-slate-800';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              RBAC — Roles & Permissions
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dynamically create, edit, and assign roles & permissions to any user
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs w-fit">
        {(['roles', 'permissions', 'assignment'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all cursor-pointer capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'assignment' ? 'User Assignment' : tab === 'roles' ? `Roles (${roles.length})` : `Permissions (${permissions.length})`}
          </button>
        ))}
      </div>

      {/* ===== ROLES TAB ===== */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={openCreateRole}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Role
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Permissions</th>
                  <th className="py-3 px-4 text-center">Users</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredRoles.map((role) => {
                  const roleUserCount = users.filter((u) => u.roles.includes(role.name)).length;
                  const isExpanded = expandedRole === role.id;
                  const hasWildcard = role.permissions.includes('*');

                  return (
                    <React.Fragment key={role.id}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <span className="font-bold text-slate-900 dark:text-white">{role.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs">{role.description}</td>
                        <td className="py-3 px-4 text-center">
                          {hasWildcard ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800">
                              All Access
                            </span>
                          ) : (
                            <span className="font-mono text-slate-700 dark:text-slate-300">{role.permissions.length}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{roleUserCount}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {role.isSystem ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Lock className="w-2.5 h-2.5" /> System
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Unlock className="w-2.5 h-2.5" /> Custom
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditRole(role)}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 rounded-lg transition-colors cursor-pointer"
                              title="Edit role"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {role.name !== 'Super Admin' && (
                              <button
                                onClick={() => setConfirmDelete({ type: 'role', id: role.id, name: role.name })}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors cursor-pointer"
                                title="Delete role"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/60 dark:bg-slate-850/60">
                          <td colSpan={6} className="px-8 py-3">
                            <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
                              Assigned Permissions ({hasWildcard ? 'All' : role.permissions.length})
                            </div>
                            {hasWildcard ? (
                              <span className="text-xs text-sky-600 font-semibold">★ Super Admin has unrestricted access to all system permissions.</span>
                            ) : role.permissions.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">No permissions assigned to this role.</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {role.permissions.map((code) => {
                                  const permDef = permissions.find((p) => p.code === code);
                                  return (
                                    <span
                                      key={code}
                                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${permDef ? getModuleColor(permDef.module) : 'bg-slate-100 text-slate-500'}`}
                                    >
                                      {code}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredRoles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No roles match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== PERMISSIONS TAB ===== */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, code, module..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={openCreatePerm}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Permission
            </button>
          </div>

          {permSearch ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredPerms.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                      <td className="py-3 px-4 font-mono text-[11px] text-sky-700 dark:text-sky-300">{p.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${getModuleColor(p.module)}`}>{p.module}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs">{p.description}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditPerm(p)} className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 rounded-lg cursor-pointer">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!p.isSystem && (
                            <button onClick={() => setConfirmDelete({ type: 'permission', id: p.id, name: p.name })} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${getModuleColor(module)}`}>{module}</span>
                      <span className="text-xs text-slate-400">{perms.length} permissions</span>
                    </div>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {perms.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-sky-700 dark:text-sky-300 w-48">{p.code}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white w-48">{p.name}</td>
                          <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">{p.description}</td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEditPerm(p)} className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 rounded cursor-pointer">
                                <Edit3 className="w-3 h-3" />
                              </button>
                              {!p.isSystem && (
                                <button onClick={() => setConfirmDelete({ type: 'permission', id: p.id, name: p.name })} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded cursor-pointer">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== USER ASSIGNMENT TAB ===== */}
      {activeTab === 'assignment' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* User List Panel */}
          <div className="md:col-span-2 space-y-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Select Employee</div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#EA5400]"
              />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden max-h-[520px] overflow-y-auto">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u.id)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-700/60 last:border-0 transition-colors cursor-pointer ${
                    selectedUserId === u.id
                      ? 'bg-[#EA5400]/10 border-l-2 border-l-[#EA5400]'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">{u.name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{u.designation}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {u.roles.map((r) => (
                      <span key={r} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">{r}</span>
                    ))}
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">No employees found.</div>
              )}
            </div>
          </div>

          {/* Role Assignment Panel */}
          <div className="md:col-span-3 space-y-4">
            {selectedUser ? (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">{selectedUser.email} · {selectedUser.designation}</div>
                    </div>
                    <div className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {selectedUser.accountStatus}
                    </div>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Assign Roles — toggle to enable/disable
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {roles.map((role) => {
                      const isAssigned = assignRoles.includes(role.name);
                      return (
                        <button
                          key={role.id}
                          onClick={() => toggleAssignRole(role.name as UserRole)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer text-left ${
                            isAssigned
                              ? 'bg-sky-50 dark:bg-sky-950 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-200'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          {isAssigned ? (
                            <CheckSquare className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{role.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{role.description.slice(0, 55)}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="text-xs text-slate-500">
                      {assignRoles.length === 0 && (
                        <span className="text-rose-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />At least one role required</span>
                      )}
                      {assignRoles.length > 0 && (
                        <span>{assignRoles.length} role(s) selected</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {saveMsg && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3" />{saveMsg}</span>
                      )}
                      <button
                        onClick={handleSaveUserRoles}
                        disabled={savingUser || assignRoles.length === 0}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#d04b00] disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
                      >
                        {savingUser ? 'Saving...' : 'Save Role Changes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Effective Permissions Preview */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs p-4">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Effective Permissions Preview</div>
                  {(() => {
                    const preview = new Set<string>();
                    let hasAll = false;
                    assignRoles.forEach((rn) => {
                      const rd = roles.find((r) => r.name === rn);
                      if (rd) {
                        if (rd.permissions.includes('*')) hasAll = true;
                        rd.permissions.forEach((p) => preview.add(p));
                      }
                    });
                    if (hasAll) {
                      return <span className="text-xs text-sky-600 font-semibold">★ Selected roles grant unrestricted access to all system permissions.</span>;
                    }
                    if (preview.size === 0) {
                      return <span className="text-xs text-slate-400 italic">No permissions from selected roles.</span>;
                    }
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(preview).map((code) => {
                          const p = permissions.find((x) => x.code === code);
                          return (
                            <span key={code} className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${p ? getModuleColor(p.module) : 'bg-slate-100 text-slate-500'}`}>
                              {code}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs p-12 flex flex-col items-center justify-center gap-3 text-center">
                <Users className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                <p className="text-sm text-slate-400">Select an employee from the left to manage their role assignments.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== ROLE MODAL ===== */}
      {isRoleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsRoleModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
                </h3>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-200">Role Name *</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Marketing Manager"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-200">Description</label>
                <input
                  type="text"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Role responsibilities and scope..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Permissions Picker */}
              <div>
                <label className="font-semibold block mb-2 text-slate-700 dark:text-slate-200">
                  Permissions ({roleForm.permissions.length} selected)
                </label>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {Object.entries(permissionsByModule).map(([module, perms]) => (
                    <div key={module} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${getModuleColor(module)}`}>{module}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const allCodes = perms.map((p) => p.code);
                            const allSelected = allCodes.every((c) => roleForm.permissions.includes(c));
                            if (allSelected) {
                              setRoleForm((prev) => ({ ...prev, permissions: prev.permissions.filter((c) => !allCodes.includes(c)) }));
                            } else {
                              setRoleForm((prev) => ({ ...prev, permissions: [...new Set([...prev.permissions, ...allCodes])] }));
                            }
                          }}
                          className="text-[10px] text-sky-600 hover:underline cursor-pointer"
                        >
                          {perms.every((p) => roleForm.permissions.includes(p.code)) ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                      <div className="p-2 grid grid-cols-1 gap-1">
                        {perms.map((perm) => {
                          const isChecked = roleForm.permissions.includes(perm.code);
                          return (
                            <label key={perm.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermInRole(perm.code)}
                                className="accent-sky-600 w-3.5 h-3.5"
                              />
                              <span className="font-mono text-[10px] text-sky-700 dark:text-sky-300 w-36 shrink-0">{perm.code}</span>
                              <span className="text-slate-700 dark:text-slate-300">{perm.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-3 py-1.5 text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
                <button
                  onClick={handleRoleSave}
                  disabled={!roleForm.name.trim()}
                  className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg cursor-pointer transition-colors"
                >
                  {editingRole ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PERMISSION MODAL ===== */}
      {isPermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" onClick={() => setIsPermModalOpen(false)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingPerm ? 'Edit Permission' : 'Create Permission'}
              </h3>
              <button onClick={() => setIsPermModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-200">Permission Code * <span className="text-slate-400 font-normal">(e.g. orders:view)</span></label>
                  <input type="text" value={permForm.code} onChange={(e) => setPermForm((p) => ({ ...p, code: e.target.value }))} placeholder="module:action" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono" />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-200">Module *</label>
                  <input type="text" value={permForm.module} onChange={(e) => setPermForm((p) => ({ ...p, module: e.target.value }))} placeholder="e.g. Orders" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-200">Display Name *</label>
                <input type="text" value={permForm.name} onChange={(e) => setPermForm((p) => ({ ...p, name: e.target.value }))} placeholder="Human-readable name" className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
              </div>
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-200">Description</label>
                <textarea rows={2} value={permForm.description} onChange={(e) => setPermForm((p) => ({ ...p, description: e.target.value }))} placeholder="What this permission grants access to..." className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setIsPermModalOpen(false)} className="px-3 py-1.5 text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
                <button onClick={handlePermSave} disabled={!permForm.code.trim() || !permForm.name.trim() || !permForm.module.trim()} className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-lg cursor-pointer transition-colors">
                  {editingPerm ? 'Save Changes' : 'Create Permission'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONFIRM DELETE MODAL ===== */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete {confirmDelete.type === 'role' ? 'Role' : 'Permission'}</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Are you sure you want to delete <strong>"{confirmDelete.name}"</strong>?
              {confirmDelete.type === 'role' && ' All users assigned this role will be automatically unassigned.'}
              {confirmDelete.type === 'permission' && ' This permission will be removed from all roles that have it.'}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

