import { useState, useCallback, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { Department, Team, User } from '../../types';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'error';
}

let toastIdSeq = 0;

function ToastBanner({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 mb-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium ${
            t.kind === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-4 text-current opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        isActive
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-lg leading-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6">
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs rounded-lg text-white font-medium transition-colors disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Form Field Helpers ───────────────────────────────────────────────────────

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA5400] focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed';

// ─── Department Form ──────────────────────────────────────────────────────────

interface DeptFormState {
  name: string;
  description: string;
  leadId: string;
  isActive: boolean;
}

const defaultDeptForm: DeptFormState = {
  name: '',
  description: '',
  leadId: '',
  isActive: true,
};

function DepartmentFormModal({
  initial,
  activeUsers,
  onSave,
  onClose,
  saving,
  error,
}: {
  initial: DeptFormState;
  activeUsers: User[];
  onSave: (data: DeptFormState) => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<DeptFormState>(initial);

  const handleChange =
    (field: keyof DeptFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  const isEdit = initial.name !== '';

  return (
    <Modal title={isEdit ? 'Edit Department' : 'Add Department'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Name */}
        <div>
          <FieldLabel htmlFor="dept-name" required>
            Name
          </FieldLabel>
          <input
            id="dept-name"
            type="text"
            required
            value={form.name}
            onChange={handleChange('name')}
            placeholder="e.g. Engineering"
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div>
          <FieldLabel htmlFor="dept-desc">Description</FieldLabel>
          <textarea
            id="dept-desc"
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Short description…"
            rows={3}
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* Lead */}
        <div>
          <FieldLabel htmlFor="dept-lead">Department Lead</FieldLabel>
          <select
            id="dept-lead"
            value={form.leadId}
            onChange={handleChange('leadId')}
            className={inputClass}
          >
            <option value="">— No lead —</option>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Status
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#EA5400] ${
              form.isActive ? 'bg-[#EA5400]' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                form.isActive ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-2">
          {form.isActive ? 'Active' : 'Inactive'}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs rounded-lg bg-[#EA5400] hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Department'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Team Form ────────────────────────────────────────────────────────────────

interface TeamFormState {
  name: string;
  departmentId: string;
  departmentName: string;
  leadId: string;
  isActive: boolean;
}

const defaultTeamForm: TeamFormState = {
  name: '',
  departmentId: '',
  departmentName: '',
  leadId: '',
  isActive: true,
};

function TeamFormModal({
  initial,
  departments,
  activeUsers,
  isEdit,
  onSave,
  onClose,
  saving,
  error,
}: {
  initial: TeamFormState;
  departments: Department[];
  activeUsers: User[];
  isEdit: boolean;
  onSave: (data: TeamFormState) => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<TeamFormState>(initial);

  const handleChange =
    (field: keyof TeamFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (field === 'departmentId') {
        const dept = departments.find((d) => d.id === e.target.value);
        setForm((prev) => ({
          ...prev,
          departmentId: e.target.value,
          departmentName: dept?.name ?? '',
        }));
      } else {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal title={isEdit ? 'Edit Team' : 'Add Team'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Name */}
        <div>
          <FieldLabel htmlFor="team-name" required>
            Name
          </FieldLabel>
          <input
            id="team-name"
            type="text"
            required
            value={form.name}
            onChange={handleChange('name')}
            placeholder="e.g. Frontend"
            className={inputClass}
          />
        </div>

        {/* Department */}
        <div>
          <FieldLabel htmlFor="team-dept" required>
            Department
          </FieldLabel>
          {isEdit ? (
            <input
              id="team-dept"
              type="text"
              value={form.departmentName}
              readOnly
              className={inputClass + ' bg-slate-50 dark:bg-slate-700/50 cursor-not-allowed'}
            />
          ) : (
            <select
              id="team-dept"
              required
              value={form.departmentId}
              onChange={handleChange('departmentId')}
              className={inputClass}
            >
              <option value="">— Select department —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}
          {isEdit && (
            <p className="text-[10px] text-slate-400 mt-1">
              Department cannot be changed after creation.
            </p>
          )}
        </div>

        {/* Lead */}
        <div>
          <FieldLabel htmlFor="team-lead">Team Lead</FieldLabel>
          <select
            id="team-lead"
            value={form.leadId}
            onChange={handleChange('leadId')}
            className={inputClass}
          >
            <option value="">— No lead —</option>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Status
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#EA5400] ${
              form.isActive ? 'bg-[#EA5400]' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                form.isActive ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 -mt-2">
          {form.isActive ? 'Active' : 'Inactive'}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs rounded-lg bg-[#EA5400] hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Departments Tab ───────────────────────────────────────────────────────────

function DepartmentsTab() {
  const {
    departments,
    teams,
    users,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useApp();

  const activeUsers = users.filter((u) => u.accountStatus === 'Active');

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const pushToast = useCallback((message: string, kind: 'success' | 'error') => {
    const id = ++toastIdSeq;
    setToasts((prev) => [...prev, { id, message, kind }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current.delete(id);
    }, 3000);
    toastTimers.current.set(id, timer);
  }, []);

  const dismissToast = useCallback((id: number) => {
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Modal state
  type ModalMode = 'add' | 'edit';
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [formInitial, setFormInitial] = useState<DeptFormState>(defaultDeptForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setFormInitial(defaultDeptForm);
    setFormError(null);
    setEditTarget(null);
    setModalMode('add');
  };

  const openEdit = (dept: Department) => {
    setFormInitial({
      name: dept.name,
      description: dept.description,
      leadId: dept.leadId ?? '',
      isActive: dept.isActive,
    });
    setFormError(null);
    setEditTarget(dept);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
    setFormError(null);
  };

  const handleSave = async (data: DeptFormState) => {
    setSaving(true);
    setFormError(null);
    try {
      const lead = activeUsers.find((u) => u.id === data.leadId);
      const payload: Omit<Department, 'id' | 'teamsCount' | 'employeesCount'> = {
        name: data.name.trim(),
        description: data.description.trim(),
        leadId: data.leadId || undefined,
        leadName: lead?.name,
        isActive: data.isActive,
      };
      if (modalMode === 'add') {
        await createDepartment(payload);
        pushToast('Department created successfully.', 'success');
        closeModal();
      } else if (modalMode === 'edit' && editTarget) {
        const result = await updateDepartment(editTarget.id, payload);
        if (result) {
          pushToast('Department updated successfully.', 'success');
          closeModal();
        } else {
          setFormError('Update failed. Please try again.');
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteDepartment(deleteTarget.id);
      if (result.success) {
        const count = result.unassignedEmployeesCount ?? 0;
        pushToast(
          count > 0
            ? `Deleted "${deleteTarget.name}". ${count} employee${count === 1 ? '' : 's'} unassigned.`
            : `Deleted "${deleteTarget.name}".`,
          'success',
        );
        setDeleteTarget(null);
      } else {
        pushToast(result.message || 'Delete failed.', 'error');
        setDeleteTarget(null);
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <ToastBanner toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Departments
        </h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#EA5400] hover:bg-orange-600 text-white text-xs font-medium transition-colors"
        >
          <span>+</span> Add Department
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {departments.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            No departments yet. Create one to organize your team.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  {[
                    'Department Name',
                    'Description',
                    'Lead',
                    'Teams',
                    'Employees',
                    'Status',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {departments.map((dept) => {
                  const liveTeamsCount = teams.filter(
                    (t) => t.departmentId === dept.id,
                  ).length;
                  const liveEmpCount = users.filter(
                    (u) => u.departmentId === dept.id,
                  ).length;
                  return (
                    <tr
                      key={dept.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {dept.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                        {dept.description || (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {dept.leadName ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">
                        {liveTeamsCount}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">
                        {liveEmpCount}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={dept.isActive} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(dept)}
                            className="text-[#EA5400] hover:text-orange-700 font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(dept)}
                            className="text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Department Form Modal */}
      {modalMode !== null && (
        <DepartmentFormModal
          initial={formInitial}
          activeUsers={activeUsers}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          error={formError}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget !== null && (
        <ConfirmDialog
          message={`Deleting "${deleteTarget.name}" will auto-unassign ${
            users.filter((u) => u.departmentId === deleteTarget.id).length
          } employee${
            users.filter((u) => u.departmentId === deleteTarget.id).length === 1 ? '' : 's'
          } and delete ${
            teams.filter((t) => t.departmentId === deleteTarget.id).length
          } team${
            teams.filter((t) => t.departmentId === deleteTarget.id).length === 1 ? '' : 's'
          }. This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─── Teams Tab ─────────────────────────────────────────────────────────────────

function TeamsTab() {
  const {
    departments,
    teams,
    users,
    createTeam,
    updateTeam,
    deleteTeam,
  } = useApp();

  const activeUsers = users.filter((u) => u.accountStatus === 'Active');

  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const pushToast = useCallback((message: string, kind: 'success' | 'error') => {
    const id = ++toastIdSeq;
    setToasts((prev) => [...prev, { id, message, kind }]);
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      toastTimers.current.delete(id);
    }, 3000);
    toastTimers.current.set(id, timer);
  }, []);

  const dismissToast = useCallback((id: number) => {
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const timers = toastTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Filter
  const [deptFilter, setDeptFilter] = useState<string>('');

  const filteredTeams = deptFilter
    ? teams.filter((t) => t.departmentId === deptFilter)
    : teams;

  // Modal state
  type ModalMode = 'add' | 'edit';
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editTarget, setEditTarget] = useState<Team | null>(null);
  const [formInitial, setFormInitial] = useState<TeamFormState>(defaultTeamForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<Team | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setFormInitial(defaultTeamForm);
    setFormError(null);
    setEditTarget(null);
    setModalMode('add');
  };

  const openEdit = (team: Team) => {
    setFormInitial({
      name: team.name,
      departmentId: team.departmentId,
      departmentName: team.departmentName,
      leadId: team.leadId ?? '',
      isActive: team.isActive,
    });
    setFormError(null);
    setEditTarget(team);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditTarget(null);
    setFormError(null);
  };

  const handleSave = async (data: TeamFormState) => {
    setSaving(true);
    setFormError(null);
    try {
      const lead = activeUsers.find((u) => u.id === data.leadId);
      const payload: Omit<Team, 'id' | 'membersCount'> = {
        name: data.name.trim(),
        departmentId: data.departmentId,
        departmentName: data.departmentName,
        leadId: data.leadId || undefined,
        leadName: lead?.name,
        isActive: data.isActive,
      };
      if (modalMode === 'add') {
        await createTeam(payload);
        pushToast('Team created successfully.', 'success');
        closeModal();
      } else if (modalMode === 'edit' && editTarget) {
        const result = await updateTeam(editTarget.id, payload);
        if (result) {
          pushToast('Team updated successfully.', 'success');
          closeModal();
        } else {
          setFormError('Update failed. Please try again.');
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteTeam(deleteTarget.id);
      if (result.success) {
        const count = result.unassignedEmployeesCount ?? 0;
        pushToast(
          count > 0
            ? `Deleted "${deleteTarget.name}". ${count} member${count === 1 ? '' : 's'} unassigned.`
            : `Deleted "${deleteTarget.name}".`,
          'success',
        );
        setDeleteTarget(null);
      } else {
        pushToast(result.message || 'Delete failed.', 'error');
        setDeleteTarget(null);
      }
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <ToastBanner toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Teams
        </h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#EA5400] hover:bg-orange-600 text-white text-xs font-medium transition-colors"
        >
          <span>+</span> Add Team
        </button>
      </div>

      {/* Department filter */}
      <div className="mb-4">
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#EA5400] focus:border-transparent"
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-slate-200 dark:border-slate-800 overflow-hidden">
        {filteredTeams.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            {deptFilter
              ? 'No teams in this department.'
              : 'No teams yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  {[
                    'Team Name',
                    'Department',
                    'Lead',
                    'Members',
                    'Status',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTeams.map((team) => {
                  const liveMembersCount = users.filter(
                    (u) => u.teamId === team.id,
                  ).length;
                  return (
                    <tr
                      key={team.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {team.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {team.departmentName}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {team.leadName ?? (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">
                        {liveMembersCount}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={team.isActive} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEdit(team)}
                            className="text-[#EA5400] hover:text-orange-700 font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(team)}
                            className="text-red-500 hover:text-red-700 font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Form Modal */}
      {modalMode !== null && (
        <TeamFormModal
          initial={formInitial}
          departments={departments}
          activeUsers={activeUsers}
          isEdit={modalMode === 'edit'}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
          error={formError}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget !== null && (
        <ConfirmDialog
          message={`Deleting "${deleteTarget.name}" will auto-unassign ${
            users.filter((u) => u.teamId === deleteTarget.id).length
          } member${
            users.filter((u) => u.teamId === deleteTarget.id).length === 1 ? '' : 's'
          }. This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

type TabId = 'departments' | 'teams';

export function DepartmentTeamView() {
  const [activeTab, setActiveTab] = useState<TabId>('departments');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'departments', label: 'Departments' },
    { id: 'teams', label: 'Teams' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Departments &amp; Teams
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your organization's structure
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-[#EA5400] text-[#EA5400]'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'departments' ? <DepartmentsTab /> : <TeamsTab />}
    </div>
  );
}
