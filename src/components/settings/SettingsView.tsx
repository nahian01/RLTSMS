import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Lock,
  Mail,
  Send,
  Eye,
  Edit3,
  X,
  FileCode,
  Clock,
  Check,
  AlertTriangle,
  History,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EmailTemplate, EmailDeliveryLog } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    resetToDefaults,
    emailTemplates,
    emailLogs,
    updateEmailTemplate,
    sendTestEmail,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rbac' | 'email'>('rbac');
  const [fiscalYearStart, setFiscalYearStart] = useState('07'); // July (common for BD & international)
  const [currencyDefault, setCurrencyDefault] = useState('USD');
  const [resetNotice, setResetNotice] = useState(false);

  // Email template editor & preview modal state
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('preview');
  const [testEmailRecipient, setTestEmailRecipient] = useState('staff@riseuplabs.com');
  const [testSendStatus, setTestSendStatus] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const roleMatrix = [
    {
      role: 'Super Admin',
      responsibilities: 'Complete system control, role assignments, card security policies',
      canSubmit: true,
      canApprove: true,
      canPurchase: true,
      canViewCards: true,
      canViewReports: true,
    },
    {
      role: 'System Admin',
      responsibilities: 'Manage users, organization units, catalogue services & workflows',
      canSubmit: true,
      canApprove: false,
      canPurchase: false,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Employee',
      responsibilities: 'Submit purchase requisitions and track own licenses',
      canSubmit: true,
      canApprove: false,
      canPurchase: false,
      canViewCards: false,
      canViewReports: false,
    },
    {
      role: 'Team Lead',
      responsibilities: 'Review and approve first-stage team purchase requests',
      canSubmit: true,
      canApprove: true,
      canPurchase: false,
      canViewCards: false,
      canViewReports: false,
    },
    {
      role: 'Department Lead',
      responsibilities: 'Review and approve department-wide requisitions',
      canSubmit: true,
      canApprove: true,
      canPurchase: false,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Operation Manager',
      responsibilities: 'Provide operational and budgetary purchase authorizations',
      canSubmit: true,
      canApprove: true,
      canPurchase: false,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Purchaser',
      responsibilities: 'Complete approved requests, enter invoices, register accounts',
      canSubmit: true,
      canApprove: false,
      canPurchase: true,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Finance',
      responsibilities: 'Financial records, payments, variance analysis and accounting',
      canSubmit: true,
      canApprove: false,
      canPurchase: false,
      canViewCards: false,
      canViewReports: true,
    },
    {
      role: 'Card Information Viewer',
      responsibilities: 'Strictly authorized viewer of masked card details and holder data',
      canSubmit: false,
      canApprove: false,
      canPurchase: false,
      canViewCards: true,
      canViewReports: true,
    },
  ];

  const handleReset = () => {
    if (window.confirm('Reset all RLTSMS records back to initial Riseup Labs demo baseline?')) {
      resetToDefaults();
      setResetNotice(true);
      setTimeout(() => setResetNotice(false), 3000);
    }
  };

  const openTemplateModal = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditSubject(template.subject);
    setEditBody(template.bodyHtml);
    setPreviewMode('preview');
    setTestSendStatus({ loading: false });
    setSaveStatus(null);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    updateEmailTemplate(selectedTemplate.id, {
      subject: editSubject,
      bodyHtml: editBody,
      updatedAt: new Date().toISOString(),
    });
    setSelectedTemplate({
      ...selectedTemplate,
      subject: editSubject,
      bodyHtml: editBody,
      updatedAt: new Date().toISOString(),
    });
    setSaveStatus('Template updated successfully');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSendTest = async () => {
    if (!selectedTemplate) return;
    setTestSendStatus({ loading: true });
    try {
      const res = await sendTestEmail(selectedTemplate.id, testEmailRecipient);
      setTestSendStatus({
        loading: false,
        success: res.success,
        message: res.message || 'Test email dispatched successfully',
      });
    } catch {
      setTestSendStatus({
        loading: false,
        success: false,
        message: 'Failed to send test email',
      });
    }
  };

  // Replace variable placeholders with realistic samples for live preview
  const getRenderedPreviewHtml = () => {
    let html = editBody;
    const sampleValues: Record<string, string> = {
      '{{recipient_name}}': 'Abdullah Nahian',
      '{{otp_code}}': '842910',
      '{{expiry_time}}': '10 minutes',
      '{{company_name}}': 'Riseup Labs',
      '{{inviter_name}}': 'Ershadul Hoque',
      '{{activation_url}}': 'https://rltsms.riseuplabs.com/activate?token=sample_magic_token',
      '{{reset_url}}': 'https://rltsms.riseuplabs.com/reset-password?token=sample_reset_token',
      '{{service_name}}': 'Figma Enterprise Workspace',
      '{{access_status}}': 'Granted',
      '{{access_expiry_date}}': '2027-11-12',
      '{{granted_by}}': 'Wasiur Rahman',
      '{{notification_message}}': 'Your UI/UX team seat has been provisioned.',
      '{{requisition_number}}': 'REQ-2026-0042',
      '{{requisition_status}}': 'Approved',
      '{{amount}}': '$3,400.00 USD',
      '{{actor_name}}': 'Enamul Kabir',
      '{{application_url}}': 'https://rltsms.riseuplabs.com/requisitions/REQ-2026-0042',
      '{{renewal_date}}': '2026-12-01',
      '{{days_remaining}}': '18',
      '{{renewal_amount}}': '$2,400.00',
      '{{billing_cycle}}': 'Annual',
      '{{event_title}}': 'Payment Card Revealed with Password',
      '{{target_name}}': 'Corporate Silicon Valley Credit Card',
      '{{timestamp}}': new Date().toLocaleString(),
      '{{support_email}}': 'it-ops@riseuplabs.com',
    };

    Object.entries(sampleValues).forEach(([k, v]) => {
      html = html.split(k).join(v);
    });
    return html;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            System Configuration &amp; Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Role matrix, fiscal parameters, centralized email notification templates (Part 10), and demo maintenance
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rbac'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>RBAC &amp; Parameters</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#EA5400]" />
            <span>Email Templates &amp; Logs</span>
            <span className="px-1.5 py-0.2 bg-[#EA5400]/20 text-[#EA5400] text-[10px] rounded-full font-bold">
              8
            </span>
          </button>
        </div>
      </div>

      {resetNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>System state restored to Riseup Labs default baseline.</span>
        </div>
      )}

      {/* TAB 1: RBAC & PARAMETERS */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          {/* Role-Based Access Control (RBAC) Matrix (PRD Section 2) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-600" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Role-Based Access Control Matrix
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">10 Configurable System Roles</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Role Title</th>
                    <th className="py-3 px-4">Core Responsibilities</th>
                    <th className="py-3 px-4 text-center">Submit Req</th>
                    <th className="py-3 px-4 text-center">Approve Req</th>
                    <th className="py-3 px-4 text-center">Execute Purchase</th>
                    <th className="py-3 px-4 text-center">Inspect Card</th>
                    <th className="py-3 px-4 text-center">Reports</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {roleMatrix.map((item) => (
                    <tr key={item.role} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.role}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.responsibilities}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.canSubmit ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.canApprove ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.canPurchase ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.canViewCards ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                            <Lock className="w-3 h-3" /> Explicit
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.canViewReports ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fiscal Period & Reporting Parameters (PRD Section 14) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                <Calendar className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Reporting &amp; Fiscal Parameters
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Financial Year Start Month</label>
                  <select
                    value={fiscalYearStart}
                    onChange={(e) => setFiscalYearStart(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="01">January (Calendar Year: Jan - Dec)</option>
                    <option value="07">July (Riseup Labs Fiscal Year: Jul - Jun)</option>
                    <option value="04">April (UK/Commonwealth: Apr - Mar)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Annual reports align to this configurable period per PRD Section 14.
                  </p>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Default Base Currency</label>
                  <select
                    value={currencyDefault}
                    onChange={(e) => setCurrencyDefault(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="USD">USD ($) - Standard International Tech Procurement</option>
                    <option value="BDT">BDT (৳) - Local Operating Currency</option>
                    <option value="EUR">EUR (€) - European Subscriptions</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reset & Maintenance */}
            <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                  <RotateCcw className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Demo Database Management
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  If you have created new requisitions, modified approval workflows, or tested emergency card unlock, you can reset the system to its initial seed data state at any time.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors cursor-pointer"
                >
                  Reset to Factory Seed Baseline
                </button>
              </div>
            </div>

            {/* About RLTSMS */}
            <div className="p-5 bg-gradient-to-br from-[#211E1F] to-slate-900 rounded-xl border border-slate-800 text-white shadow-2xs space-y-4 flex flex-col justify-between md:col-span-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#EA5400] text-white flex items-center justify-center text-[10px] font-bold">
                      RL
                    </div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      RLTSMS Enterprise Platform
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EA5400]/20 text-[#EA5400] font-mono border border-[#EA5400]/40">
                    v2.0-production
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Riseup Labs Tools &amp; Services Management System. Single source of truth for company software, cloud infrastructure, licenses, requisitions, zero-PAN cards, and subscription lifecycle.
                </p>
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#EA5400] block tracking-wider">Official Slogan</span>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5 italic">
                      “Track Every Tool. Control Every Lifecycle.”
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Baseline Slogan</span>
                    <span className="text-xs text-slate-400 italic">“Your Tools. Your Services. Every Stage, Tracked”</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 border-t border-white/10 flex items-center justify-between">
                <span>Enterprise Digital Asset Lifecycle Architecture</span>
                <span className="text-emerald-400 font-medium">RBAC Active &bull; Zero-Credential Policy Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL TEMPLATES & LOGS (PART 10) */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Security Banner per Part 8 & 10 */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block uppercase tracking-wider text-[11px]">
                Zero-Credential Transmission Standard (Part 8.2 &amp; Part 10.3)
              </span>
              <p className="leading-relaxed text-amber-800 dark:text-amber-300/90">
                In strict accordance with Riseup Labs enterprise security policy, no email template ever transmits service passwords, OTPs for third-party tools, or root recovery keys. Access notices notify the recipient of provisioned access and seat validity only.
              </p>
            </div>
          </div>

          {/* 8 Required Email Templates Grid */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#EA5400]" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Enterprise Email Templates (8 Active Templates)
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Click any template to inspect variables, customize HTML, or dispatch a verified test
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {emailTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {template.name}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {template.key}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                        {template.category}
                      </span>
                      {template.isEnabled ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      <strong className="text-slate-500 font-semibold">Subject:</strong> {template.subject}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 flex-wrap">
                      <span className="font-semibold">Variables:</span>
                      {template.availableVariables.slice(0, 4).map((v) => (
                        <span key={v} className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-[10px] font-mono">
                          {v}
                        </span>
                      ))}
                      {template.availableVariables.length > 4 && (
                        <span className="text-[10px] text-slate-400">+{template.availableVariables.length - 4} more</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openTemplateModal(template)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-sky-600" />
                      <span>Preview &amp; Test</span>
                    </button>
                    <button
                      onClick={() => {
                        openTemplateModal(template);
                        setPreviewMode('edit');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#c94800] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Template</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Delivery Audit Log Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Recent Email Delivery Audit Logs ({emailLogs.length} Records)
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">Immutable Delivery Ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/75 dark:bg-slate-850 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Dispatched At</th>
                    <th className="py-3 px-4">Template</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Provider Message ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        No email dispatch records found.
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.dispatchedAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {log.templateName}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          <div>{log.recipientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{log.recipientEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {log.subject}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {log.status === 'Sent' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Dispatched
                            </span>
                          )}
                          {log.status === 'Queued' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Queued
                            </span>
                          )}
                          {log.status === 'Failed' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] truncate max-w-[160px]">
                          {log.providerMessageId || 'msg-local-sim'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE PREVIEW & EDITOR MODAL */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#EA5400] text-white flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">Key: {selectedTemplate.key}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Selector */}
                <div className="inline-flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                  <button
                    onClick={() => setPreviewMode('preview')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      previewMode === 'preview'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Live Preview
                  </button>
                  <button
                    onClick={() => setPreviewMode('edit')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                      previewMode === 'edit'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    HTML Source
                  </button>
                </div>

                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {saveStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveStatus}</span>
                </div>
              )}

              {/* Subject Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#EA5400] outline-hidden"
                />
              </div>

              {/* Available Variables Guide */}
              <div>
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Available Interpolation Variables (click to append)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.availableVariables.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => setEditBody((prev) => prev + ` ${variable}`)}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-[#EA5400]/10 hover:text-[#EA5400] border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Views: Live Preview or Code Editor */}
              {previewMode === 'preview' ? (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 p-4">
                  <div className="text-[11px] text-slate-400 font-mono mb-2 flex items-center justify-between">
                    <span>Branded Riseup Labs Email Layout (Rendered with sample variables)</span>
                    <span className="text-[#EA5400] font-semibold">Live Sandbox</span>
                  </div>
                  <div
                    className="bg-white rounded-lg p-2 shadow-inner overflow-x-auto text-slate-900"
                    dangerouslySetInnerHTML={{ __html: getRenderedPreviewHtml() }}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    HTML Source Template
                  </label>
                  <textarea
                    rows={12}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-emerald-400 focus:ring-2 focus:ring-[#EA5400] outline-hidden"
                  />
                </div>
              )}

              {/* Test Send Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                  Dispatch Live Verification Test
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="Recipient email address..."
                    className="flex-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={testSendStatus.loading || !testEmailRecipient}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-[#EA5400]" />
                    <span>{testSendStatus.loading ? 'Dispatching...' : 'Send Test Email'}</span>
                  </button>
                </div>

                {testSendStatus.message && (
                  <p
                    className={`text-xs font-medium flex items-center gap-1.5 ${
                      testSendStatus.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {testSendStatus.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{testSendStatus.message}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Last modified: {new Date(selectedTemplate.updatedAt).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#EA5400] hover:bg-[#c94800] rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Template Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
