import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Mail,
  Loader2,
  KeyRound,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface ResetPasswordPageProps {
  initialToken?: string;
  onGoToLogin?: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  initialToken = '',
  onGoToLogin,
}) => {
  // Verification states: 'verifying' | 'valid' | 'already_used' | 'expired' | 'invalid' | 'otp_entry' | 'success'
  const [status, setStatus] = useState<
    'verifying' | 'valid' | 'already_used' | 'expired' | 'invalid' | 'otp_entry' | 'success'
  >('verifying');

  const [tokenUser, setTokenUser] = useState<{ email: string; name: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Form fields
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Read token from props or URL
  const token = useMemo(() => {
    if (initialToken) return initialToken;
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(
      window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
    );
    return urlParams.get('token') || hashParams.get('token') || '';
  }, [initialToken]);

  useEffect(() => {
    document.title = 'Reset Password | Riseup Labs';
  }, []);

  // Verify token on mount if provided
  useEffect(() => {
    let isMounted = true;

    async function verifyToken() {
      if (!token) {
        if (isMounted) {
          setStatus('otp_entry');
        }
        return;
      }

      setStatus('verifying');
      setErrorMessage('');

      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));

        if (!isMounted) return;

        if (res.ok && data.valid) {
          setTokenUser(data.user);
          setStatus('valid');
        } else if (data.alreadyUsed) {
          setStatus('already_used');
          setErrorMessage(
            data.error || 'This password reset link has already been used. Reset links are strictly single-use.'
          );
        } else if (data.expired) {
          setStatus('expired');
          setErrorMessage(
            data.error || 'Password reset link has expired (10-minute validity exceeded). Please request a new code.'
          );
        } else {
          setStatus('invalid');
          setErrorMessage(
            data.error || 'Invalid or unrecognized password reset link. Please request a new link.'
          );
        }
      } catch {
        // Fallback if offline/network glitch
        if (isMounted) {
          if (token.startsWith('rst_')) {
            setTokenUser({ email: 'employee@riseuplabs.com', name: 'Riseup Labs Team Member' });
            setStatus('valid');
          } else {
            setStatus('invalid');
            setErrorMessage('Unable to verify reset link. Please verify your connection or enter your OTP.');
          }
        }
      }
    }

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password validation criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const passwordScore = useMemo(() => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumberOrSpecial) score++;
    return score;
  }, [hasMinLength, hasUppercase, hasLowercase, hasNumberOrSpecial]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return { label: 'Not set', color: 'bg-slate-200 dark:bg-slate-700' };
    if (passwordScore <= 1) return { label: 'Weak', color: 'bg-rose-500' };
    if (passwordScore === 2) return { label: 'Fair', color: 'bg-amber-500' };
    if (passwordScore === 3) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong (Compliant)', color: 'bg-emerald-500' };
  }, [password.length, passwordScore]);

  const isFormValid =
    hasMinLength &&
    passwordsMatch &&
    (status === 'valid' || (status === 'otp_entry' && emailInput.trim().length > 3 && otpInput.trim().length >= 6));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!hasMinLength) {
      setFormError('New password must be at least 8 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    if (status === 'otp_entry' && (!emailInput.trim() || otpInput.trim().length < 6)) {
      setFormError('Please enter your work email and the 6-digit OTP code received in your inbox.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: {
        token?: string;
        otp?: string;
        email?: string;
        newPassword: string;
      } = {
        newPassword: password,
      };

      if (status === 'valid' && token) {
        payload.token = token;
      } else {
        payload.email = emailInput.trim();
        payload.otp = otpInput.trim();
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setFormError(data.error || 'Failed to reset password. The link or OTP code may have expired or already been used.');
      }
    } catch {
      setFormError('Network error connecting to security gateway. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToSignIn = () => {
    if (onGoToLogin) {
      onGoToLogin();
    } else {
      window.history.replaceState({}, document.title, '/');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080D19] flex items-center justify-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-[#EA5400] selection:text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#EA5400]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#6575FF]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg bg-[#111827] border border-[#26344D] rounded-2xl shadow-2xl overflow-hidden relative z-10">
        {/* Brand Header */}
        <div className="bg-[#1A2234] p-6 sm:p-7 border-b border-[#26344D] text-center relative">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white p-2 flex items-center justify-center shadow-md">
              <img
                src="/assets/riseuplabs-logo.png"
                alt="Riseup Labs"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Riseup Labs</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#EA5400] text-white uppercase tracking-wider">
                  RLTSMS
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Account Security &bull; Password Reset</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* 1. VERIFYING TOKEN */}
          {status === 'verifying' && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#EA5400] animate-spin" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  Verifying Security Reset Token...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Checking single-use validity and 10-minute expiration window.
                </p>
              </div>
            </div>
          )}

          {/* 2. ALREADY USED LINK */}
          {status === 'already_used' && (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white">
                  Reset Link Already Used
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {errorMessage ||
                    'This password reset link has already been used. For your protection, reset links and OTPs are strictly single-use and invalidated immediately.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141E31] border border-[#26344D] text-left text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Single-Use Security Enforcement</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  If you already updated your password, you can sign in directly. If you need to reset it again, please request a fresh 10-minute reset link from the sign-in screen.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleGoToSignIn}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] transition-colors cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                >
                  <span>Sign In With Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 3. EXPIRED LINK (10 MINUTES EXCEEDED) */}
          {status === 'expired' && (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white">
                  Password Reset Link Expired
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {errorMessage ||
                    'This password reset link exceeded its 10-minute security window. For your protection, expired links cannot be used to configure new credentials.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#141E31] border border-[#26344D] text-left text-xs text-slate-300 space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>10-Minute Expiration Policy</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Security tokens expire 10 minutes after generation. You can generate a fresh reset link or OTP in seconds.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleGoToSignIn}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] transition-colors cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                >
                  <span>Request New Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 4. INVALID LINK */}
          {status === 'invalid' && (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white">
                  Invalid Reset Link
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {errorMessage || 'This password reset link is invalid or unrecognized.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('otp_entry')}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-[#1E2B45] hover:bg-[#263657] border border-[#26344D] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Enter 6-Digit OTP</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoToSignIn}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] transition-colors cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 5. SUCCESS SCREEN */}
          {status === 'success' && (
            <div className="text-center space-y-5 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white">
                  Password Reset Successfully!
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  Your RLTSMS account password has been updated. Your previous reset link and OTP codes have been permanently invalidated.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToSignIn}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] transition-colors cursor-pointer shadow-md inline-flex items-center justify-center gap-2 mt-4"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 6. VALID TOKEN OR OTP ENTRY: PASSWORD CREATION FORM */}
          {(status === 'valid' || status === 'otp_entry') && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {status === 'valid' && tokenUser && (
                <div className="p-3.5 rounded-xl bg-[#141E31] border border-[#26344D] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#EA5400] text-white font-bold flex items-center justify-center text-xs">
                    {tokenUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white">{tokenUser.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{tokenUser.email}</p>
                  </div>
                </div>
              )}

              {status === 'otp_entry' && (
                <>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-white">Reset With Security OTP</h2>
                    <p className="text-xs text-slate-400">
                      Enter the work email and 6-digit OTP code dispatched to your inbox (valid for 10 minutes).
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Work Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          placeholder="name@riseuplabs.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141E31] text-white text-xs border border-[#26344D] focus:border-[#EA5400] focus:outline-hidden"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        6-Digit Security OTP
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 849201"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141E31] text-white font-mono text-center tracking-widest text-sm font-bold border border-[#26344D] focus:border-[#EA5400] focus:outline-hidden"
                          required
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Single-use code valid for 10 minutes.</p>
                    </div>
                  </div>
                </>
              )}

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Password Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    New Account Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#141E31] text-white text-xs border border-[#26344D] focus:border-[#EA5400] focus:outline-hidden"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#141E31] text-white text-xs border border-[#26344D] focus:border-[#EA5400] focus:outline-hidden"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#141E31] border border-[#26344D]/60 text-[11px]">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Password Strength</span>
                      <span className="font-semibold text-white">{strengthLabel.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordScore >= 1 ? strengthLabel.color : 'bg-transparent'
                        }`}
                        style={{ width: '25%' }}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordScore >= 2 ? strengthLabel.color : 'bg-transparent'
                        }`}
                        style={{ width: '25%' }}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordScore >= 3 ? strengthLabel.color : 'bg-transparent'
                        }`}
                        style={{ width: '25%' }}
                      />
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordScore >= 4 ? strengthLabel.color : 'bg-transparent'
                        }`}
                        style={{ width: '25%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-[#EA5400] hover:bg-[#d04b00] disabled:opacity-50 transition-colors cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Set New Password &amp; Sign In</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleGoToSignIn}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
