import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Briefcase,
  Mail,
  User,
  Loader2,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ActivateAccountPageProps {
  token: string;
  onGoToLogin?: () => void;
}

export const ActivateAccountPage: React.FC<ActivateAccountPageProps> = ({
  token,
  onGoToLogin,
}) => {
  const { verifyActivationToken, activateAccountWithPassword } = useApp();

  // Verification state
  const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid' | 'expired' | 'already_active' | 'success'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [invitedUser, setInvitedUser] = useState<{
    id?: string;
    name?: string;
    email?: string;
    designation?: string;
    departmentName?: string;
    roles?: string[];
  } | null>(null);

  // Form fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Document title
  useEffect(() => {
    document.title = 'Activate Account & Set Password | Riseup Labs';
  }, []);

  // Verify token on mount or token change
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      setStatus('verifying');
      setErrorMessage('');

      if (!token) {
        if (isMounted) {
          setStatus('invalid');
          setErrorMessage('No activation token was provided in the URL link.');
        }
        return;
      }

      const res = await verifyActivationToken(token);
      if (!isMounted) return;

      if (res.valid && res.user) {
        setInvitedUser(res.user);
        setStatus('valid');
      } else if (res.alreadyActive) {
        setInvitedUser(res.user || null);
        setStatus('already_active');
        setErrorMessage(res.error || 'This account has already been activated.');
      } else {
        setStatus('invalid');
        setErrorMessage(
          res.error || 'The activation link is invalid, has already been consumed, or has expired (48-hour limit).'
        );
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token, verifyActivationToken]);

  // Password Validation Criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const strengthScore = useMemo(() => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumberOrSymbol) score++;
    return score;
  }, [hasMinLength, hasUppercase, hasLowercase, hasNumberOrSymbol]);

  const strengthLabel = useMemo(() => {
    if (!password) return '';
    if (strengthScore <= 1) return 'Weak';
    if (strengthScore <= 3) return 'Medium';
    return 'Strong';
  }, [password, strengthScore]);

  const strengthColor = useMemo(() => {
    if (strengthScore <= 1) return 'bg-rose-500 text-rose-600';
    if (strengthScore <= 3) return 'bg-amber-500 text-amber-600';
    return 'bg-emerald-500 text-emerald-600';
  }, [strengthScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!hasMinLength) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await activateAccountWithPassword(token, password);
      if (res.success) {
        setStatus('success');
        // Clean URL to prevent re-activation on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setFormError(res.error || 'Failed to activate account. Please try again.');
      }
    } catch {
      setFormError('An unexpected network error occurred while activating your account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSignIn = () => {
    window.history.replaceState({}, document.title, '/');
    if (onGoToLogin) {
      onGoToLogin();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 transition-colors font-sans">
      {/* Container card */}
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
        {/* Brand Banner */}
        <div className="bg-[#211E1F] p-6 sm:p-7 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#EA5400]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-white rounded-2xl p-2.5 shadow-lg flex items-center justify-center mb-3.5 border border-slate-100/20">
              <img
                src="/assets/riseuplabs-logo.png"
                alt="Riseup Labs"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Riseup Labs</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#EA5400] text-white">
                RLTSMS
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xs font-medium">
              Tools &amp; Services Management System &bull; Employee Onboarding
            </p>
          </div>
        </div>

        {/* Dynamic State Views */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* 1. VERIFYING TOKEN SPINNER */}
          {status === 'verifying' && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#EA5400] animate-spin" />
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Verifying Invitation Link...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Checking cryptographic token validity and 48-hour expiration window.
                </p>
              </div>
            </div>
          )}

          {/* 2. INVALID OR EXPIRED TOKEN */}
          {(status === 'invalid' || status === 'expired') && (
            <div className="text-center space-y-5 py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Invitation Link Invalid or Expired
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {errorMessage ||
                    'This invitation link is not valid, has already been used, or has exceeded its 48-hour validity period.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  What can you do?
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Contact your department head or system administrator (<code className="bg-slate-200/60 dark:bg-slate-700 px-1 py-0.5 rounded">admin@riseuplabs.com</code>) to click <strong>Resend Invitation</strong> from the organization dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToSignIn}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] transition-colors cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5"
              >
                <span>Go to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 3. ALREADY ACTIVE ACCOUNT */}
          {status === 'already_active' && (
            <div className="text-center space-y-5 py-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Account is Already Active!
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {invitedUser?.name ? `Hello ${invitedUser.name}, your` : 'Your'} account has already been activated and configured. You can sign in immediately using your work email and password.
                </p>
              </div>

              {invitedUser?.email && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
                  {invitedUser.email}
                </div>
              )}

              <button
                type="button"
                onClick={handleGoToSignIn}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] transition-colors cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 4. VALID TOKEN: SET PASSWORD & ACTIVATE FORM */}
          {status === 'valid' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Employee Welcome Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-[#EA5400]/20 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EA5400] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {(invitedUser?.name || 'User')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Welcome to the Team
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {invitedUser?.name || 'New Employee'}
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Verified
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="truncate">
                    <strong className="text-slate-500 block text-[10px] uppercase">Work Email</strong>
                    <span className="font-mono">{invitedUser?.email}</span>
                  </div>
                  <div className="truncate">
                    <strong className="text-slate-500 block text-[10px] uppercase">Department</strong>
                    <span>{invitedUser?.departmentName || 'Engineering'}</span>
                  </div>
                </div>
              </div>

              {/* Form Heading */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Set Your Account Password
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Create a secure password to activate your workspace access and license permissions.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter at least 8 characters"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EA5400] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Password Strength:</span>
                      <span className={`font-semibold ${strengthColor.split(' ')[1]}`}>
                        {strengthLabel}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 1 ? strengthColor.split(' ')[0] : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 2 ? strengthColor.split(' ')[0] : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 3 ? strengthColor.split(' ')[0] : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 rounded-full ${strengthScore >= 4 ? strengthColor.split(' ')[0] : 'bg-transparent'}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#EA5400] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className="text-[11px] flex items-center gap-1.5 pt-0.5">
                    {passwordsMatch ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Password Checklist */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-[11px]">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Security Checklist:
                </div>
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>At least 8 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase && hasLowercase ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Contains both uppercase and lowercase letters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Contains at least one number or symbol</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !hasMinLength || !passwordsMatch}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-[#EA5400]/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Set Password &amp; Activate Account</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleGoToSignIn}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Already have your password configured? <span className="text-[#EA5400] font-semibold">Sign in &rarr;</span>
                </button>
              </div>
            </form>
          )}

          {/* 5. SUCCESS CELEBRATION */}
          {status === 'success' && (
            <div className="text-center space-y-5 py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg ring-8 ring-emerald-50 dark:ring-emerald-950/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Sparkles className="w-3 h-3" /> Account Active
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  Welcome aboard, {invitedUser?.name || 'Team Member'}!
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Your password has been successfully configured. You can now use your work email <strong className="text-slate-900 dark:text-white font-mono">{invitedUser?.email}</strong> and this password to sign in anytime.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div><strong>Department:</strong> {invitedUser?.departmentName || 'Engineering'}</div>
                <div><strong>Designation:</strong> {invitedUser?.designation || 'Team Member'}</div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.history.replaceState({}, document.title, '/');
                  window.location.reload();
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] transition-colors cursor-pointer shadow-lg shadow-[#EA5400]/25 flex items-center justify-center gap-2"
              >
                <span>Enter RLTSMS Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-850 px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Riseup Labs &bull; Enterprise Tools &amp; Cloud Subscription Management &bull; Zero-PAN Security
        </div>
      </div>
    </div>
  );
};
