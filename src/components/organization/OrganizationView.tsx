import React, { useState } from 'react';
import {
  Building2,
  Users,
  Plus,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Network,
  ChevronRight,
  Shield,
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
    createDepartment,
    createTeam,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'invitations'>('employees');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Invite Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [teamId, setTeamId] = useState('');
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
      email: email.trim(),
      phone: phone.trim() || '+880 1710-000000',
      designation: designation.trim() || 'Software Engineer',
      departmentId,
      teamId: teamId || undefined,
      roles: selectedRoles.length > 0 ? selectedRoles : ['Employee'],
    });

    setIsInviteModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setDesignation('');
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

  // Pending invitations list
  const pendingUsers = users.filter(
    (u) => u.accountStatus === 'Pending Invitation' || u.accountStatus === 'Expired Invitation'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Organization & Employee Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Departments, teams, approval positions, and 48-hour invitation lifecycle (PRD Section 3)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer"
          >
            + Add Department
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Employee</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start text-xs">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
            activeTab === 'employees'
              ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Employees ({users.filter((u) => u.accountStatus === 'Active').length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'invitations'
              ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Invitations & Expirations ({pendingUsers.length})
          {pendingUsers.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-white dark:bg-slate-900 text-sky-600 shadow-2xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Departments & Teams ({departments.length})
        </button>
      </div>

      {/* EMPLOYEES TAB */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Employee Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Department / Team</th>
                  <th className="py-3 px-4">Assigned Roles</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Card Visibility Level</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {users
                  .filter((u) => u.accountStatus === 'Active')
                  .map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {u.designation}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div>{u.departmentName}</div>
                        {u.teamName && (
                          <div className="text-[10px] text-slate-400">{u.teamName}</div>
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

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {u.phone}
                      </td>

                      <td className="py-3 px-4">
                        {u.cardPermissionLevel && u.cardPermissionLevel !== 'none' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                            {u.cardPermissionLevel}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No card access</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVITATION & EXPIRATION LIFECYCLE (PRD Section 3 & AC-02) */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-100 dark:border-sky-900/50 text-xs text-sky-900 dark:text-sky-200 leading-relaxed space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>48-Hour Invitation Token Policy & 7-Day Auto-Prune (PRD Section 3):</span>
            </div>
            <p className="text-[11px] text-sky-800 dark:text-sky-300">
              Invitations expire if not activated within 48 hours. Expired invitations cannot create active logins. Unactivated accounts are automatically pruned 7 days after the original invite. Administrators can resend tokens or test activation.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Invited Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role & Dept</th>
                  <th className="py-3 px-4">Invitation Sent</th>
                  <th className="py-3 px-4">Token Expiry (48h)</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {pendingUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No pending or expired invitations.
                    </td>
                  </tr>
                ) : (
                  pendingUsers.map((u) => {
                    const isExpired = u.accountStatus === 'Expired Invitation';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {u.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{u.email}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {u.designation} · {u.departmentName}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {u.invitationSentAt
                            ? new Date(u.invitationSentAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {u.invitationExpiresAt ? (
                            <span className={isExpired ? 'text-rose-500' : 'text-amber-600'}>
                              {new Date(u.invitationExpiresAt).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          ) : (
                            '—'
                          )}
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
                            onClick={() => resendInvitation(u.id)}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-md cursor-pointer"
                          >
                            Resend Token
                          </button>
                          <button
                            onClick={() => simulateActivateAccount(u.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md cursor-pointer"
                            title="Simulate user clicking activation link from email"
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
      )}

      {/* DEPARTMENTS & TEAMS TAB */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept) => {
            const deptTeams = teams.filter((t) => t.departmentId === dept.id);
            const deptEmployees = users.filter((u) => u.departmentId === dept.id);

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
                    <div className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-medium">
                      Department Lead: {dept.leadName || 'Unassigned'}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
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
                      className="text-sky-600 hover:underline cursor-pointer"
                    >
                      + Add Team
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {deptTeams.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{t.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Team Lead: {t.leadName || 'Unassigned'}
                          </div>
                        </div>
                        <span className="font-mono text-slate-400">{t.membersCount} devs</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Invite Employee to RLTSMS
              </h3>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahfuzur Rahman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@riseuplabs.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Mobile Engineer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+880 171..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
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
                  <label className="font-semibold block mb-1">Team</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">General Department Pool</option>
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
                            ? 'bg-sky-600 text-white font-semibold'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-300">
                Notice: Employee will receive a 48-hour activation link. If unactivated after 7 days, the pending account is deleted automatically per PRD Section 3.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
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
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeptSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence Research"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Primary scope of work..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Department Lead</label>
                <select
                  value={deptLeadId}
                  onChange={(e) => setDeptLeadId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Assign Lead --</option>
                  {users.map((u) => (
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
                  className="px-4 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg cursor-pointer"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
