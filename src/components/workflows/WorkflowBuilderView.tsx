import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Trash2,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Building,
  Shield,
  Layers,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApprovalWorkflow, WorkflowStageDefinition } from '../../types';

export const WorkflowBuilderView: React.FC = () => {
  const { workflows, users, departments, teams, saveWorkflow } = useApp();

  const [activeWorkflowId, setActiveWorkflowId] = useState<string>(workflows[0]?.id || 'wf-1');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const activeWf = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  // Editable local stages copy
  const [stages, setStages] = useState<WorkflowStageDefinition[]>(activeWf ? activeWf.stages : []);
  const [wfName, setWfName] = useState(activeWf ? activeWf.name : '');
  const [wfPurpose, setWfPurpose] = useState<any>(activeWf ? activeWf.purpose : 'Purchase Requisitions');

  // Sync when switching active workflow
  React.useEffect(() => {
    if (activeWf) {
      setStages(activeWf.stages);
      setWfName(activeWf.name);
      setWfPurpose(activeWf.purpose);
      setSimulationResult(null);
    }
  }, [activeWorkflowId, workflows]);

  // Validation
  const hasAtLeastOneRequired = stages.some((s) => s.isRequired);
  const isValid = stages.length > 0 && hasAtLeastOneRequired;

  // Add stage helpers
  const addRoleStage = (roleName: string) => {
    const newStage: WorkflowStageDefinition = {
      id: `stg-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      name: `${roleName} Approval`,
      type: 'organizational_role',
      roleName,
      isRequired: true,
    };
    setStages((prev) => [...prev, newStage]);
  };

  const addEmployeeStage = (emp: { id: string; name: string; designation: string }) => {
    const newStage: WorkflowStageDefinition = {
      id: `stg-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
      name: `${emp.name} Approval`,
      type: 'specific_employee',
      employeeId: emp.id,
      employeeName: `${emp.name} (${emp.designation})`,
      isRequired: true,
    };
    setStages((prev) => [...prev, newStage]);
  };

  const toggleRequired = (idx: number) => {
    setStages((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, isRequired: !s.isRequired } : s))
    );
  };

  const removeStage = (idx: number) => {
    setStages((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveStage = (idx: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && idx === 0) ||
      (direction === 'down' && idx === stages.length - 1)
    ) {
      return;
    }
    const newStages = [...stages];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newStages[idx];
    newStages[idx] = newStages[targetIdx];
    newStages[targetIdx] = temp;
    setStages(newStages);
  };

  const handleSave = () => {
    if (!isValid) return;

    // Calculate bumped version
    const currentVersionNum = parseFloat(activeWf.version) || 1.0;
    const newVersion = (currentVersionNum + 0.1).toFixed(1);

    const updatedWf: ApprovalWorkflow = {
      ...activeWf,
      name: wfName,
      purpose: wfPurpose,
      stages,
      version: newVersion,
    };

    saveWorkflow(updatedWf);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Run Test Simulation (PRD Section 6)
  const runSimulation = () => {
    const requiredStages = stages.filter((s) => s.isRequired);
    const optionalStages = stages.filter((s) => !s.isRequired);

    setSimulationResult(
      `Simulation Validated: Requisition starts at Stage 1. If ${requiredStages.map((s) => s.name).join(' & ')} approve, request proceeds to Purchaser immediately, even if optional stages (${optionalStages.length > 0 ? optionalStages.map((s) => s.name).join(', ') : 'none'}) are skipped or pending.`
    );
  };

  // Filter employees for palette
  const filteredUsers = users.filter((u) => {
    if (selectedDeptFilter !== 'all' && u.departmentId !== selectedDeptFilter) return false;
    if (employeeSearch.trim()) {
      const q = employeeSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Approval Workflow Builder
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Design multi-stage approval sequences with required and optional gate logic (PRD Section 6)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Workflow Saved (v{activeWf.version})
            </span>
          )}

          <button
            onClick={runSimulation}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 text-sky-600" />
            <span>Simulate Flow</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isValid}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            Save & Publish
          </button>
        </div>
      </div>

      {/* Workflow Selector Bar */}
      <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-slate-500 pl-2 uppercase tracking-wider whitespace-nowrap">
          Active Workflows:
        </span>
        {workflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => setActiveWorkflowId(wf.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeWorkflowId === wf.id
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {wf.name} <span className="text-[10px] opacity-60">v{wf.version}</span>
          </button>
        ))}
      </div>

      {/* Simulation banner if triggered */}
      {simulationResult && (
        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
            <span>{simulationResult}</span>
          </div>
          <button
            onClick={() => setSimulationResult(null)}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Validation warning */}
      {!hasAtLeastOneRequired && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Configuration Rule Violation: Every workflow must have at least one <strong>Required</strong> approval stage before proceeding to purchasing.
          </span>
        </div>
      )}

      {/* Canvas Layout: Left Palette + Center Stages Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Palette: Organizational Roles & Employee Picker */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. Add Organizational Role
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click to append standard hierarchical positions
            </p>

            <div className="mt-3 space-y-2">
              {[
                { role: 'Team Lead', desc: 'Direct team lead of the requester' },
                { role: 'Department Lead', desc: 'Head of requester department' },
                { role: 'Operation Manager', desc: 'Company operations budget approval' },
                { role: 'Finance', desc: 'Financial controller review' },
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => addRoleStage(item.role)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-slate-750 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white group-hover:text-sky-600">
                      + {item.role}
                    </span>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">Add</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. Add Specific Employee
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Assign named individuals (e.g. CFO David Vance)
            </p>

            <div className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="Search employee..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white"
              />

              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredUsers.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    onClick={() => addEmployeeStage(u)}
                    className="w-full p-2 rounded-lg text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-400">{u.designation}</div>
                    </div>
                    <span className="text-[10px] text-sky-600 font-medium">+ Add</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Stage Sequence Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Workflow: {wfName}
                </span>
                <span className="text-[11px] text-slate-400 ml-2 font-mono">
                  v{activeWf.version}
                </span>
              </div>
              <span className="text-xs text-slate-500">{stages.length} stages configured</span>
            </div>

            {/* Sequence nodes */}
            <div className="space-y-3">
              {/* Submission Start Node */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                    0
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Employee Submits Requisition
                    </div>
                    <div className="text-[11px] text-slate-400">
                      System initiates workflow and routes to Stage 1
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">ENTRY</span>
              </div>

              {/* Connecting arrow */}
              <div className="flex justify-center">
                <ArrowDown className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </div>

              {/* Dynamic Stages */}
              {stages.map((stg, idx) => (
                <React.Fragment key={stg.id}>
                  <div
                    className={`p-4 rounded-xl transition-all ${
                      stg.isRequired
                        ? 'border-2 border-slate-800 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xs'
                        : 'border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            stg.isRequired
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {stg.name}
                            </h4>

                            {/* Required vs Optional Toggle Button (PRD Section 6 & 24) */}
                            <button
                              type="button"
                              onClick={() => toggleRequired(idx)}
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors ${
                                stg.isRequired
                                  ? 'bg-slate-900 text-white hover:bg-slate-700'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                              }`}
                            >
                              {stg.isRequired ? 'Required Stage' : 'Optional (Non-blocking)'}
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1">
                            Approver:{' '}
                            <strong className="text-slate-700 dark:text-slate-200">
                              {stg.type === 'specific_employee' ? stg.employeeName : stg.roleName}
                            </strong>
                          </div>

                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {stg.isRequired
                              ? 'Must explicitly approve before purchase is authorized'
                              : 'Can approve or skip; will NOT block workflow if required stages pass'}
                          </div>
                        </div>
                      </div>

                      {/* Controls: Move Up/Down + Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => moveStage(idx, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move stage earlier"
                        >
                          ↑
                        </button>
                        <button
                          disabled={idx === stages.length - 1}
                          onClick={() => moveStage(idx, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move stage later"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeStage(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                          title="Remove stage"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <ArrowDown className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  </div>
                </React.Fragment>
              ))}

              {/* End Node: Assigned Purchaser (PRD Section 6 Step 8) */}
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 dark:text-emerald-200">
                      Procurement Hand-off (Approved)
                    </div>
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-400">
                      Requisition enters <strong>Pending Purchase</strong> status for{' '}
                      <strong>{activeWf.purchaserRoleName}</strong>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  END NODE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
