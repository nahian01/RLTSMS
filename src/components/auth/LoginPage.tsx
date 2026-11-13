import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const { signIn } = useApp();

  // Mode: 'login' | 'forgot_password'
  const [mode, setMode] = useState<'login' | 'forgot_password'>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Recovery Form Field
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySubmitted, setRecoverySubmitted] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Validation & Submission States
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [recoveryEmailError, setRecoveryEmailError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Focus Refs for Keyboard Management
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const recoveryEmailInputRef = useRef<HTMLInputElement>(null);

  // WCAG 2.2 AA Document Title
  useEffect(() => {
    document.title = mode === 'login' ? 'Sign In | Riseup Labs' : 'Reset Password | Riseup Labs';
  }, [mode]);

  // Email format validator
  const isValidEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Blur handler for Work Email
  const handleEmailBlur = () => {
    if (!email.trim()) {
      setEmailError('Please enter your work email address.');
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid work email address.');
    } else {
      setEmailError(null);
    }
  };

  // Enter-key behavior on Work Email (Section 5.1):
  // Enter moves focus directly to Password. It MUST NOT submit the form.
  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailBlur();
      passwordInputRef.current?.focus();
    }
  };

  // Toggle password visibility (Enter or Space toggles, does not submit form)
  const togglePasswordVisibility = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((prev) => !prev);
  };

  // Login Form Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Step 1: Client-side validation
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Please enter your work email address.');
      if (!hasError) emailInputRef.current?.focus();
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid work email address.');
      if (!hasError) emailInputRef.current?.focus();
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      if (!hasError) passwordInputRef.current?.focus();
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) return;

    // Step 3: Authentication request
    setIsLoading(true);

    try {
      const result = await signIn(email, password, rememberMe);

      if (result.success) {
        setIsSuccess(true);
        // Transition delay before dashboard renders
      } else {
        setGeneralError(result.error || 'Unable to sign in. Check your credentials and try again.');
        setIsLoading(false);
      }
    } catch {
      setGeneralError('Unable to sign in. Check your credentials and try again.');
      setIsLoading(false);
    }
  };

  // Password Recovery Submission
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.trim() || !isValidEmail(recoveryEmail)) {
      setRecoveryEmailError('Please enter a valid work email address.');
      recoveryEmailInputRef.current?.focus();
      return;
    }

    setRecoveryEmailError(null);
    setRecoveryLoading(true);

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail.trim() }),
      });
    } catch {
      // Intentionally silent per security rules: do not reveal user existence
    } finally {
      setRecoveryLoading(false);
      setRecoverySubmitted(true);
    }
  };

  return (
    <main className="min-h-screen w-full min-w-full bg-[#080D19] text-[#F5F7FF] flex flex-col md:flex-row font-sans selection:bg-[#6575FF] selection:text-white relative overflow-hidden">
      {/* ===================================================================== */}
      {/* LEFT SECTION – VISUAL EXPERIENCE (58% on Desktop, 48% on Tablet)     */}
      {/* ===================================================================== */}
      <section
        aria-label="Riseup Labs Visual Experience"
        className="hidden md:flex md:w-[48%] lg:w-[58%] h-screen min-h-screen relative flex-col justify-between p-8 sm:p-12 lg:p-16 border-r border-[#26344D]/40 bg-[#080D19] overflow-hidden select-none"
      >
        {/* Subtle Ambient Background Lighting Layers */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#6575FF]/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#9B7BFF]/10 blur-[120px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 left-1/4 w-80 h-80 rounded-full bg-[#6575FF]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Ambient Subtle Geometric Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6575FF_1px,transparent_1px)] [background-size:24px_24px]"
          aria-hidden="true"
        />

        {/* Top-Left Corner: Brand & Identity */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/assets/riseuplabs-logo.png"
            alt="Riseup Labs Logo"
            className="w-10 h-10 rounded-xl object-contain bg-white/5 p-1.5 border border-white/10 shadow-lg shadow-black/40 backdrop-blur-xs"
          />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold tracking-[0.22em] text-[#F5F7FF] uppercase">
              RISEUP LABS
            </span>
            <span className="text-[10px] tracking-wider text-[#929CB2]">
              ENTERPRISE PLATFORM
            </span>
          </div>
        </div>

        {/* Center Content & Abstract 3D Geometric Artwork */}
        <div className="relative z-10 my-auto flex flex-col justify-center space-y-8 max-w-xl">
          {/* Headlines */}
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold text-[#F5F7FF] tracking-tight leading-[1.08]">
              Your Digital Workspace.
              <br />
              <span className="bg-gradient-to-r from-[#6575FF] via-[#9B7BFF] to-[#F5F7FF] bg-clip-text text-transparent">
                Under Control.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#929CB2] mt-4 leading-relaxed max-w-md">
              Manage software subscriptions, digital tools, purchases and company resources through one centralized platform.
            </p>
          </div>

          {/* Abstract 3D Geometric Composition (Connected Services & Technology) */}
          <div
            className="relative w-full h-72 sm:h-80 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
            style={{ perspective: '1100px' }}
          >
            {/* Ambient Radial Core Lighting */}
            <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-[#6575FF]/25 to-[#9B7BFF]/20 blur-2xl animate-pulse" />

            {/* Background Interconnected Circuit & Node Graph (SVG) */}
            <svg
              className="absolute inset-0 w-full h-full opacity-60"
              viewBox="0 0 500 320"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6575FF" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#9B7BFF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#6575FF" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Connected Network Vectors */}
              <line x1="80" y1="160" x2="190" y2="100" stroke="url(#lineGlow)" strokeWidth="1.2" strokeDasharray="4 3" />
              <line x1="190" y1="100" x2="310" y2="100" stroke="url(#lineGlow)" strokeWidth="1.5" />
              <line x1="310" y1="100" x2="420" y2="170" stroke="url(#lineGlow)" strokeWidth="1.2" strokeDasharray="4 3" />
              <line x1="190" y1="100" x2="250" y2="180" stroke="url(#lineGlow)" strokeWidth="1.2" />
              <line x1="310" y1="100" x2="250" y2="180" stroke="url(#lineGlow)" strokeWidth="1.2" />
              <line x1="250" y1="180" x2="160" y2="240" stroke="url(#lineGlow)" strokeWidth="1.2" strokeDasharray="3 3" />
              <line x1="250" y1="180" x2="340" y2="240" stroke="url(#lineGlow)" strokeWidth="1.2" strokeDasharray="3 3" />

              {/* Glowing Constellation Nodes */}
              <circle cx="80" cy="160" r="3.5" fill="#6575FF" filter="url(#glowFilter)" />
              <circle cx="190" cy="100" r="4.5" fill="#9B7BFF" filter="url(#glowFilter)" />
              <circle cx="310" cy="100" r="4.5" fill="#6575FF" filter="url(#glowFilter)" />
              <circle cx="420" cy="170" r="3.5" fill="#9B7BFF" filter="url(#glowFilter)" />
              <circle cx="160" cy="240" r="3" fill="#6575FF" opacity="0.8" />
              <circle cx="340" cy="240" r="3" fill="#9B7BFF" opacity="0.8" />
            </svg>

            {/* Layer 1: Floating Translucent Glass Panel (Left Angled) */}
            <div
              className="absolute w-44 h-32 rounded-2xl bg-gradient-to-br from-[#6575FF]/15 via-[#141E31]/40 to-[#9B7BFF]/10 border border-[#6575FF]/30 backdrop-blur-md shadow-2xl shadow-black/60 transition-transform duration-700"
              style={{
                transform: 'rotateX(22deg) rotateY(-24deg) rotateZ(6deg) translate3d(-90px, -20px, 40px)',
              }}
            >
              <div className="p-3.5 space-y-2 opacity-70">
                <div className="w-8 h-1.5 rounded-full bg-[#6575FF]/60" />
                <div className="w-20 h-1.5 rounded-full bg-[#929CB2]/30" />
                <div className="w-14 h-1.5 rounded-full bg-[#929CB2]/20" />
              </div>
            </div>

            {/* Layer 2: Floating Translucent Glass Panel (Right Angled) */}
            <div
              className="absolute w-48 h-36 rounded-2xl bg-gradient-to-br from-[#9B7BFF]/15 via-[#141E31]/40 to-[#6575FF]/10 border border-[#9B7BFF]/30 backdrop-blur-md shadow-2xl shadow-black/60 transition-transform duration-700"
              style={{
                transform: 'rotateX(18deg) rotateY(26deg) rotateZ(-8deg) translate3d(95px, 25px, 20px)',
              }}
            >
              <div className="p-3.5 space-y-2 opacity-70">
                <div className="w-10 h-1.5 rounded-full bg-[#9B7BFF]/60" />
                <div className="w-24 h-1.5 rounded-full bg-[#929CB2]/30" />
                <div className="w-16 h-1.5 rounded-full bg-[#929CB2]/20" />
              </div>
            </div>

            {/* Layer 3: Central Luminous Geometric Polyhedron Structure */}
            <div
              className="relative w-36 h-36 flex items-center justify-center transition-transform duration-500"
              style={{
                transform: 'rotateX(14deg) rotateY(-12deg) translate3d(0, 0, 70px)',
              }}
            >
              {/* Outer Isometric Facets */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#6575FF]/30 via-[#0D1424]/70 to-[#9B7BFF]/30 border border-[#6575FF]/50 backdrop-blur-lg shadow-[0_0_40px_rgba(101,117,255,0.35)] flex items-center justify-center rotate-45">
                {/* Inner Concentric Diamond */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#9B7BFF]/40 to-[#6575FF]/40 border border-[#F5F7FF]/30 flex items-center justify-center shadow-inner">
                  {/* Glowing Core Orb */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6575FF] to-[#9B7BFF] shadow-[0_0_25px_#6575FF] flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white opacity-80 animate-ping" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Left: Corporate Attribution */}
        <div className="relative z-10 pt-4 border-t border-[#26344D]/30 space-y-1">
          <div className="text-[11px] font-semibold tracking-wider text-[#6575FF] uppercase">
            SOFTWARE &amp; DIGITAL SERVICES MANAGEMENT SYSTEM
          </div>
          <div className="text-xs text-[#929CB2]">
            &copy; 2026 Riseup Labs. All rights reserved.
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* RIGHT SECTION – LOGIN INTERFACE (42% on Desktop, 52% on Tablet)       */}
      {/* ===================================================================== */}
      <section
        aria-label="Workspace Authentication Interface"
        className="w-full md:w-[52%] lg:w-[42%] min-h-screen bg-[#0D1424] bg-gradient-to-b from-[#0D1424] via-[#0E1729] to-[#0A101D] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative overflow-y-auto"
      >
        {/* Subtle Ambient Lighting on Login Section */}
        <div
          className="absolute top-10 right-10 w-72 h-72 rounded-full bg-[#6575FF]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Mobile Header (Shown on screens < 768px) */}
        <div className="md:hidden flex flex-col items-center mb-8 text-center">
          <img
            src="/assets/riseuplabs-logo.png"
            alt="Riseup Labs"
            className="w-12 h-12 rounded-xl object-contain bg-white/5 p-2 border border-white/10 shadow-lg shadow-black/40 mb-3"
          />
          <span className="text-xs font-bold tracking-[0.25em] text-[#F5F7FF] uppercase">
            RISEUP LABS
          </span>
          <span className="text-[11px] text-[#929CB2] mt-0.5">
            Software &amp; Digital Services Management
          </span>
        </div>

        {/* Interface Container: Max Width 390px */}
        <div className="w-full max-w-[390px] relative z-10">
          {/* =================================================================== */}
          {/* VIEW A: STANDARD SIGN IN FORM                                      */}
          {/* =================================================================== */}
          {mode === 'login' ? (
            <div className="space-y-6">
              {/* Introduction Header */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#6575FF] uppercase block">
                  WELCOME BACK
                </span>
                <h2 className="text-2xl sm:text-[32px] font-semibold text-[#F5F7FF] tracking-tight leading-tight">
                  Sign in to your workspace
                </h2>
                <p className="text-xs sm:text-sm text-[#929CB2] leading-relaxed">
                  Access your company's digital tools and services.
                </p>
              </div>

              {/* General Failure Alert (Role="alert") */}
              {generalError && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-relaxed">{generalError}</span>
                </div>
              )}

              {/* Success Transition Alert */}
              {isSuccess && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                  <span>Authentication successful. Opening workspace...</span>
                </div>
              )}

              {/* Semantic Form */}
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                {/* Field 1: Work Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="work-email"
                    className="block text-[13px] font-medium text-[#F5F7FF]"
                  >
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929CB2] pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="work-email"
                      ref={emailInputRef}
                      type="email"
                      tabIndex={1}
                      autoComplete="username"
                      placeholder="name@riseuplabs.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      onBlur={handleEmailBlur}
                      onKeyDown={handleEmailKeyDown}
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? 'work-email-error' : undefined}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141E31] text-[#F5F7FF] placeholder-[#929CB2]/50 text-sm border transition-all focus:outline-hidden ${
                        emailError
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-[#26344D] focus:border-[#6575FF] focus:ring-2 focus:ring-[#6575FF]/30'
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p
                      id="work-email-error"
                      role="alert"
                      className="text-[12px] text-rose-400 font-medium pl-1"
                    >
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Field 2: Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-[13px] font-medium text-[#F5F7FF]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929CB2] pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      id="password"
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      tabIndex={2}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                      }}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? 'password-error' : undefined}
                      className={`w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#141E31] text-[#F5F7FF] placeholder-[#929CB2]/50 text-sm border transition-all focus:outline-hidden ${
                        passwordError
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-[#26344D] focus:border-[#6575FF] focus:ring-2 focus:ring-[#6575FF]/30'
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={3}
                      onClick={togglePasswordVisibility}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          togglePasswordVisibility(e);
                        }
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#929CB2] hover:text-[#F5F7FF] focus:text-[#6575FF] focus:outline-hidden p-1 rounded-md cursor-pointer transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p
                      id="password-error"
                      role="alert"
                      className="text-[12px] text-rose-400 font-medium pl-1"
                    >
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Options Row (Remember Me & Forgot Password) */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      id="remember-me"
                      type="checkbox"
                      tabIndex={4}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setRememberMe((prev) => !prev);
                        }
                      }}
                      className="w-4 h-4 rounded-md border-[#26344D] bg-[#141E31] text-[#6575FF] focus:ring-[#6575FF]/40 cursor-pointer accent-[#6575FF]"
                    />
                    <label
                      htmlFor="remember-me"
                      className="text-xs text-[#929CB2] hover:text-[#F5F7FF] cursor-pointer select-none transition-colors"
                    >
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    tabIndex={5}
                    onClick={() => {
                      setMode('forgot_password');
                      setGeneralError(null);
                    }}
                    className="text-xs font-medium text-[#6575FF] hover:text-[#9B7BFF] focus:text-[#9B7BFF] focus:underline focus:outline-hidden transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  tabIndex={6}
                  disabled={isLoading || isSuccess}
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#6575FF] to-[#9B7BFF] hover:from-[#5464f0] hover:to-[#8a68f0] active:scale-[0.99] shadow-[0_4px_24px_rgba(101,117,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed focus:outline-hidden focus:ring-2 focus:ring-[#6575FF] focus:ring-offset-2 focus:ring-offset-[#0D1424]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Signing In...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                      <span>Success</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider & Security Guarantee */}
              <div className="pt-2">
                <div className="border-t border-[#26344D]/60 my-5" />
                <div className="flex items-center justify-center gap-2 text-xs text-[#929CB2]">
                  <ShieldCheck className="w-4 h-4 text-[#6575FF] shrink-0" aria-hidden="true" />
                  <span>Secure access to your company workspace.</span>
                </div>
              </div>

              {/* Discreet Pre-Seeded Accounts Assistant for Testing / Admin */}
              <div className="pt-2">
                <details className="text-[11px] text-[#929CB2] bg-[#141E31]/60 border border-[#26344D]/60 rounded-xl p-3 cursor-pointer group">
                  <summary className="font-semibold text-slate-300 flex items-center justify-between select-none">
                    <span>Initial Test &amp; Administrative Credentials</span>
                    <span className="text-[10px] text-[#6575FF] group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="mt-2.5 space-y-1.5 text-[11px] font-mono text-slate-400 border-t border-[#26344D]/40 pt-2">
                    <p className="font-sans text-[10px] text-slate-400">
                      Standard password for foundational accounts: <strong className="text-white font-mono">RiseupLabs@2026</strong>
                    </p>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('nahian@riseuplabs.com');
                          setPassword('RiseupLabs@2026');
                        }}
                        className="text-left text-sky-400 hover:underline py-0.5"
                      >
                        • Super Admin: nahian@riseuplabs.com
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('wasiur@riseuplabs.com');
                          setPassword('RiseupLabs@2026');
                        }}
                        className="text-left text-sky-400 hover:underline py-0.5"
                      >
                        • Operations: wasiur@riseuplabs.com
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmail('sarah.lin@riseuplabs.com');
                          setPassword('RiseupLabs@2026');
                        }}
                        className="text-left text-sky-400 hover:underline py-0.5"
                      >
                        • Employee: sarah.lin@riseuplabs.com
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          ) : (
            /* =================================================================== */
            /* VIEW B: FORGOT PASSWORD RECOVERY INTERFACE (Section 6.5)            */
            /* =================================================================== */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRecoverySubmitted(false);
                    setRecoveryEmailError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6575FF] hover:text-[#9B7BFF] transition-colors mb-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#6575FF] uppercase block">
                  PASSWORD RECOVERY
                </span>
                <h2 className="text-2xl sm:text-[30px] font-semibold text-[#F5F7FF] tracking-tight leading-tight">
                  Reset your password
                </h2>
                <p className="text-xs sm:text-sm text-[#929CB2] leading-relaxed">
                  Enter your work email address to receive password reset instructions.
                </p>
              </div>

              {recoverySubmitted ? (
                <div className="p-4 rounded-xl bg-[#141E31] border border-[#26344D] space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-[#F5F7FF] leading-relaxed">
                        If an account exists for this email, password reset instructions will be sent.
                      </p>
                      <p className="text-[11px] text-[#929CB2]">
                        Check your Riseup Labs inbox and spam folder for instructions within the next few minutes.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setRecoverySubmitted(false);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-[#141E31] hover:bg-[#1E2B45] border border-[#26344D] transition-colors cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecoverySubmit} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="recovery-email"
                      className="block text-[13px] font-medium text-[#F5F7FF]"
                    >
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929CB2] pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="recovery-email"
                        ref={recoveryEmailInputRef}
                        type="email"
                        placeholder="name@riseuplabs.com"
                        value={recoveryEmail}
                        onChange={(e) => {
                          setRecoveryEmail(e.target.value);
                          if (recoveryEmailError) setRecoveryEmailError(null);
                        }}
                        aria-invalid={!!recoveryEmailError}
                        aria-describedby={recoveryEmailError ? 'recovery-email-error' : undefined}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141E31] text-[#F5F7FF] placeholder-[#929CB2]/50 text-sm border transition-all focus:outline-hidden ${
                          recoveryEmailError
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-[#26344D] focus:border-[#6575FF] focus:ring-2 focus:ring-[#6575FF]/30'
                        }`}
                      />
                    </div>
                    {recoveryEmailError && (
                      <p
                        id="recovery-email-error"
                        role="alert"
                        className="text-[12px] text-rose-400 font-medium pl-1"
                      >
                        {recoveryEmailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#6575FF] to-[#9B7BFF] hover:from-[#5464f0] hover:to-[#8a68f0] shadow-[0_4px_24px_rgba(101,117,255,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {recoveryLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Sending Instructions...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Send Reset Instructions</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Mobile Footer (Shown on screens < 768px) */}
          <div className="md:hidden mt-8 text-center text-xs text-[#929CB2] space-y-1">
            <p className="text-[10px] tracking-wider text-[#6575FF] uppercase font-semibold">
              RLTSMS
            </p>
            <p>&copy; 2026 Riseup Labs. All rights reserved.</p>
          </div>
        </div>
      </section>
    </main>
  );
};
