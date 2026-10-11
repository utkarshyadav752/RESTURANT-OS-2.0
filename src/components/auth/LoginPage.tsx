import React, { useState } from 'react';
import { 
  Lock, Mail, Eye, EyeOff, Sparkles, UtensilsCrossed, 
  ArrowRight, Shield, Smartphone, HelpCircle, CheckCircle2,
  ChevronRight, Building2, UserCheck, ChefHat, Receipt, 
  Layers, Package, Calculator, Globe, Scan, ArrowRightLeft, 
  ShieldCheck, Activity, Check, ExternalLink, Clock, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ForgotPasswordModal } from './ForgotPasswordModal.tsx';
import { TwoFactorModal } from './TwoFactorModal.tsx';
import { RoleType } from '../../types/index.ts';
import { api } from '../../lib/api.ts';
import { SpatialBackground3D } from '../3d/SpatialBackground3D.tsx';
import { TiltCard3D } from '../3d/TiltCard3D.tsx';

interface Props {
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<Props> = ({ onNavigateRegister }) => {
  const { login, loginWithOTP, isLoading, twoFactorPending } = useAuth();

  const [authMode, setAuthMode] = useState<'PASSWORD' | 'PHONE_OTP'>('PASSWORD');
  const [identifier, setIdentifier] = useState('owner@restaurantos.io');
  const [password, setPassword] = useState('Owner@123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Phone OTP state
  const [phone, setPhone] = useState('+91 98100 11223');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<'TERMS' | 'PRIVACY' | 'SUPPORT' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const demoAccounts: {
    role: RoleType;
    label: string;
    sublabel: string;
    email: string;
    pass: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      role: 'OWNER',
      label: 'Rajesh Mehra',
      sublabel: 'Restaurant Owner (Full Access)',
      email: 'owner@restaurantos.io',
      pass: 'Owner@123',
      icon: <Building2 className="w-4 h-4" />,
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:border-amber-400',
    },
    {
      role: 'MANAGER',
      label: 'Rahul Verma',
      sublabel: 'General Manager (Operations)',
      email: 'manager@restaurantos.io',
      pass: 'Manager@123',
      icon: <UserCheck className="w-4 h-4" />,
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10 hover:border-blue-400',
    },
    {
      role: 'CASHIER',
      label: 'Priya Sharma',
      sublabel: 'Cashier (Smart POS & Billing)',
      email: 'cashier@restaurantos.io',
      pass: 'Cashier@123',
      icon: <Receipt className="w-4 h-4" />,
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:border-emerald-400',
    },
    {
      role: 'WAITER',
      label: 'Amit Kumar',
      sublabel: 'Captain / Waiter (Tables & Orders)',
      email: 'waiter@restaurantos.io',
      pass: 'Waiter@123',
      icon: <Layers className="w-4 h-4" />,
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10 hover:border-indigo-400',
    },
    {
      role: 'KITCHEN',
      label: 'Vikram Singh',
      sublabel: 'Head Chef (KDS Station)',
      email: 'kitchen@restaurantos.io',
      pass: 'Kitchen@123',
      icon: <ChefHat className="w-4 h-4" />,
      color: 'border-orange-500/40 text-orange-400 bg-orange-500/10 hover:border-orange-400',
    },
    {
      role: 'INVENTORY_MANAGER',
      label: 'Sunita Rao',
      sublabel: 'Inventory & Wastage Lead',
      email: 'inventory@restaurantos.io',
      pass: 'Inventory@123',
      icon: <Package className="w-4 h-4" />,
      color: 'border-teal-500/40 text-teal-400 bg-teal-500/10 hover:border-teal-400',
    },
    {
      role: 'ACCOUNTANT',
      label: 'Deepak Gupta',
      sublabel: 'Chartered Accountant (Tax & Margin)',
      email: 'accountant@restaurantos.io',
      pass: 'Accountant@123',
      icon: <Calculator className="w-4 h-4" />,
      color: 'border-violet-500/40 text-violet-400 bg-violet-500/10 hover:border-violet-400',
    },
  ];

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      const res = await login(identifier, password, rememberMe);
      if (res?.requires2FA) {
        setShowTwoFactorModal(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleSendPhoneOTP = async () => {
    if (!phone) {
      setErrorMessage('Please enter your mobile number.');
      return;
    }
    setErrorMessage(null);
    try {
      await api.post('/auth/send-otp', { phone });
      setOtpSent(true);
      setOtpCode('123456'); // pre-fill demo OTP
      setOtpCountdown(60);
      const timer = setInterval(() => {
        setOtpCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send OTP.');
    }
  };

  const handlePhoneOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setErrorMessage('Please enter the verification code.');
      return;
    }
    setErrorMessage(null);
    try {
      await loginWithOTP(phone, otpCode);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid OTP code.');
    }
  };

  const handleQuickDemoSelect = (acc: typeof demoAccounts[0]) => {
    setAuthMode('PASSWORD');
    setIdentifier(acc.email);
    setPassword(acc.pass);
    setErrorMessage(null);
  };

  const handleDirectLogin = async (acc: typeof demoAccounts[0]) => {
    setAuthMode('PASSWORD');
    setIdentifier(acc.email);
    setPassword(acc.pass);
    setErrorMessage(null);
    try {
      const res = await login(acc.email, acc.pass, true);
      if (res?.requires2FA) {
        setShowTwoFactorModal(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden">
      {/* 3D Spatial Background Canvas (RiskLens Topology) */}
      <SpatialBackground3D opacity={0.4} />

      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-amber-500/8 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-orange-600/8 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">RestaurantOS</span>
              <span className="text-[10px] tracking-wider font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Enterprise AI
              </span>
            </div>
            <p className="text-xs text-slate-400">Your AI-powered restaurant operating system</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveInfoModal('SUPPORT')}
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Support & Guide
          </button>
          <button
            onClick={onNavigateRegister}
            className="text-xs font-semibold px-4 py-2 rounded-xl btn-3d btn-3d-slate transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Create Restaurant Account
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10 my-4 space-y-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Brand / Assigned Staff Profiles */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Multi-Tenant Hospitality & Kirana OS</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                From POS & Kitchen to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">Kirana Inventory & Staff Progress</span>.
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Strict role-based authentication ensures staff only access their assigned role and branch. Owners monitor live employee progress, cashier revenue, kitchen ticket speed, and barcode stock ledger in real-time.
              </p>
            </div>

            {/* Assigned Staff Profiles - Strict Role Clearance */}
            <div className="p-5 rounded-3xl card-3d-elevated border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Assigned Staff Personnel (Strict Role Access)
                </span>
                <span className="text-[11px] font-mono text-slate-400">1-Click Fast Login</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => {
                  const isSelected = identifier === acc.email;
                  return (
                    <TiltCard3D key={acc.role} maxTilt={6} className="rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleQuickDemoSelect(acc)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer card-3d ${
                          isSelected 
                            ? 'border-amber-500 bg-amber-500/20 shadow-md shadow-amber-500/20' 
                            : 'border-slate-800/80 bg-slate-900/80 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg border ${acc.color}`}>
                            {acc.icon}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-200 truncate">{acc.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">{acc.sublabel}</div>
                          </div>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-1" />
                        )}
                      </button>
                    </TiltCard3D>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col gap-2 text-[11px] text-slate-400 px-1 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span>Selected Staff: <strong className="text-amber-300 font-mono">{identifier}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      const acc = demoAccounts.find(a => a.email === identifier) || demoAccounts[0];
                      handleDirectLogin(acc);
                    }}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 btn-3d btn-3d-amber text-xs font-extrabold rounded-xl transition-all shadow cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Entering...' : `Login as ${demoAccounts.find(a => a.email === identifier)?.label.split(' ')[0]} →`}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 leading-snug">
                  🔒 Strict Role Security: Only the assigned individual can access their designated role. To change person or hand over shift, simply log out and log in with the new staff credentials.
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Card with 3D Depth */}
          <div className="lg:col-span-6">
            <TiltCard3D maxTilt={4} className="rounded-3xl">
              <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl card-3d-elevated bg-slate-900/95 border border-slate-700/80 shadow-2xl relative">
                
                {/* Tabs: Password vs Phone OTP */}
                <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6 trough-3d">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('PASSWORD'); setErrorMessage(null); }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      authMode === 'PASSWORD'
                        ? 'btn-3d btn-3d-amber font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email / Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('PHONE_OTP'); setErrorMessage(null); }}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      authMode === 'PHONE_OTP'
                        ? 'btn-3d btn-3d-amber font-extrabold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Phone OTP Login
                  </button>
                </div>

                <div className="mb-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white tracking-tight">
                      {authMode === 'PASSWORD' ? 'Sign into RestaurantOS' : 'Quick Mobile Verification'}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Vercel Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Select any staff profile on the left or enter credentials to sign in.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pl-3.5">
                      💡 Tip: Click any staff card on the left (e.g. Rajesh Mehra / Owner) for instant 1-click entry!
                    </div>
                  </div>
                )}

                {/* Password Login Form */}
                {authMode === 'PASSWORD' && (
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email or Mobile Number
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="owner@restaurantos.io"
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
                        />
                        Remember this terminal
                      </label>
                      <span className="text-[11px] text-slate-500">256-Bit SSL Secured</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 btn-3d btn-3d-amber rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Authenticating Role...' : 'Authenticate & Enter Shift'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Phone OTP Login Form */}
                {authMode === 'PHONE_OTP' && (
                  <form onSubmit={handlePhoneOTPLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Registered Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98100 11223"
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendPhoneOTP}
                          disabled={otpCountdown > 0}
                          className="px-4 py-2.5 btn-3d btn-3d-slate text-xs font-bold rounded-xl disabled:opacity-50"
                        >
                          {otpCountdown > 0 ? `${otpCountdown}s` : otpSent ? 'Resend' : 'Send OTP'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        6-Digit Security OTP
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-center text-lg font-mono tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !otpCode}
                      className="w-full py-3 px-4 btn-3d btn-3d-amber rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying OTP...' : 'Verify & Enter Workspace'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Social / SSO Divider */}
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-slate-900 text-slate-500 uppercase tracking-wider text-[10px]">
                      Enterprise SSO
                    </span>
                  </div>
                </div>

                {/* Google Workspace Login Simulation */}
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('owner@restaurantos.io');
                    setPassword('Owner@123');
                    login('owner@restaurantos.io', 'Owner@123', true);
                  }}
                  className="w-full py-2.5 px-4 btn-3d btn-3d-slate rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Continue with Google Workspace
                </button>

                {/* Onboarding Link */}
                <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                  <p className="text-xs text-slate-400">
                    New restaurant chain or single outlet?{' '}
                    <button
                      type="button"
                      onClick={onNavigateRegister}
                      className="text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                    >
                      Register Restaurant Workspace →
                    </button>
                  </p>
                </div>

              </div>
            </TiltCard3D>
          </div>

        </div>

        {/* ======================================================== */}
        {/* COMPREHENSIVE FRONT PAGE PLATFORM DETAILS & SHOWCASE */}
        {/* ======================================================== */}
        <div className="w-full max-w-5xl space-y-10 pt-8 border-t border-slate-800/80">
          
          {/* Key Metrics Counter with 3D Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TiltCard3D maxTilt={6} className="rounded-2xl">
              <div className="p-4 rounded-2xl stat-card-3d text-center space-y-1 h-full">
                <span className="text-2xl font-black font-mono text-amber-400">1,240+</span>
                <span className="text-xs font-bold text-white block">Active Outlets</span>
                <span className="text-[10px] text-slate-400">Cafes, Bistros & Cloud Kitchens</span>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={6} className="rounded-2xl">
              <div className="p-4 rounded-2xl stat-card-3d text-center space-y-1 h-full">
                <span className="text-2xl font-black font-mono text-emerald-400">₹4.8 Cr+</span>
                <span className="text-xs font-bold text-white block">Daily Transactions</span>
                <span className="text-[10px] text-slate-400">100% Tax & GST Audited</span>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={6} className="rounded-2xl">
              <div className="p-4 rounded-2xl stat-card-3d text-center space-y-1 h-full">
                <span className="text-2xl font-black font-mono text-blue-400">&lt; 1.2s</span>
                <span className="text-xs font-bold text-white block">Barcode Scan Latency</span>
                <span className="text-[10px] text-slate-400">Camera & Laser Gun Engine</span>
              </div>
            </TiltCard3D>

            <TiltCard3D maxTilt={6} className="rounded-2xl">
              <div className="p-4 rounded-2xl stat-card-3d text-center space-y-1 h-full">
                <span className="text-2xl font-black font-mono text-purple-400">100%</span>
                <span className="text-xs font-bold text-white block">Tenant Isolation</span>
                <span className="text-[10px] text-slate-400">Strict Multi-Branch Security</span>
              </div>
            </TiltCard3D>
          </div>

          {/* Deep Feature Modules Breakdown with 3D Cards */}
          <div className="space-y-4">
            <div className="text-center space-y-1.5 max-w-xl mx-auto">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Enterprise Restaurant Architecture
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                Everything You Need to Run High-Volume Food Service
              </h3>
              <p className="text-xs text-slate-400">
                A unified operating kernel bridging front-of-house hospitality, back-of-house culinary stations, and Kirana warehouse inventory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Feature 1 */}
              <TiltCard3D maxTilt={5} className="rounded-3xl">
                <div className="p-5 rounded-3xl card-3d space-y-3 h-full">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Smart POS & Split Billing</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Touch-optimized order entry with modifiers, instant table hold/resume, KOT fire to kitchen, dynamic UPI QR generation, and thermal receipt printing with itemized CGST/SGST breakdown.
                  </p>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold">
                    ✓ Cash, Card, UPI & Split Bill Ready
                  </div>
                </div>
              </TiltCard3D>

              {/* Feature 2 */}
              <TiltCard3D maxTilt={5} className="rounded-3xl">
                <div className="p-5 rounded-3xl card-3d space-y-3 h-full">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">KiranaSetu Barcode & Stock Ledger</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Camera and USB laser barcode scanner for instant inwarding, physical shelf audits, EAN-13 GS1 barcode generation, printable shelf stickers, and double-entry stock movement tracking.
                  </p>
                  <div className="text-[10px] font-mono text-amber-400 font-bold">
                    ✓ Optical Viewfinder & Laser Scanner
                  </div>
                </div>
              </TiltCard3D>

              {/* Feature 3 */}
              <TiltCard3D maxTilt={5} className="rounded-3xl">
                <div className="p-5 rounded-3xl card-3d space-y-3 h-full">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Real-Time Kitchen Display (KDS)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Eliminate lost paper tickets. 4-column kanban pipeline (New, Preparing, Ready, Served) with cooking timers, station routing (Tandoor, Curry, Bar), and recipe portion standards.
                  </p>
                  <div className="text-[10px] font-mono text-orange-400 font-bold">
                    ✓ Ticket Cooking Timers & Rush Alerts
                  </div>
                </div>
              </TiltCard3D>

              {/* Feature 4 */}
              <TiltCard3D maxTilt={5} className="rounded-3xl">
                <div className="p-5 rounded-3xl card-3d space-y-3 h-full">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Gemini AI Invoice & Demand Forecaster</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Paste messy WhatsApp orders or Mandi invoices to auto-extract line items into the stock ledger. AI predicts tomorrow's covers and warns against overstocking perishable items.
                  </p>
                  <div className="text-[10px] font-mono text-purple-400 font-bold">
                    ✓ Powered by Gemini 3.8 Flash
                  </div>
                </div>
              </TiltCard3D>

              {/* Feature 5 */}
              <TiltCard3D maxTilt={5} className="rounded-3xl">
                <div className="p-5 rounded-3xl card-3d space-y-3 h-full">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Strict Multi-Role Security & Shift Handover</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Strict role clearance ensures cashiers only bill, chefs only prepare, and waiters only seat. Shift transitions follow explicit logout and login authentication.
                  </p>
                  <div className="text-[10px] font-mono text-blue-400 font-bold">
                    ✓ 7 Granular Operational Roles
                  </div>
                </div>
              </TiltCard3D>

              {/* Feature 6 */}
              <TiltCard3D maxTilt={5} className="rounded-3xl">
                <div className="p-5 rounded-3xl card-3d space-y-3 h-full">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Owner's Live Staff Progress Tracker</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Owners can oversee everyone's real-time progress: bills issued by cashiers, tables turned by waiters, tickets cleared by chefs, and barcode inwarding completed by inventory managers.
                  </p>
                  <div className="text-[10px] font-mono text-rose-400 font-bold">
                    ✓ Real-time Staff Activity & KPI Feed
                  </div>
                </div>
              </TiltCard3D>

            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION A: STRICT LOGIN & SHIFT HANDOVER ARCHITECTURE */}
          {/* ======================================================== */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    Strict Role-Based Authentication & Shift Handover
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                    Strict RBAC Enforced
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Only assigned personnel can log into their designated operational role and branch. In-app account switching is strictly disabled. When a shift ends or another staff member needs to operate the system, the current operator logs out, and the incoming operator logs in.
                </p>
              </div>

              <div className="px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-amber-300 font-mono shrink-0">
                Shift Handover: Logout → Login
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <TiltCard3D maxTilt={6} className="rounded-xl">
                <div className="p-3.5 rounded-xl card-3d bg-slate-950/80 border border-slate-800/80 h-full">
                  <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block mb-0.5">
                    1. Strict Assigned Roles
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Cashiers cannot access owner P&L or recipe costs; chefs cannot tamper with billing; waiters only punch orders.
                  </p>
                </div>
              </TiltCard3D>

              <TiltCard3D maxTilt={6} className="rounded-xl">
                <div className="p-3.5 rounded-xl card-3d bg-slate-950/80 border border-slate-800/80 h-full">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block mb-0.5">
                    2. Clean Shift Handover
                  </span>
                  <p className="text-[11px] text-slate-400">
                    To transition terminals: outgoing staff member clicks Logout. Incoming staff member enters their credentials or selects their profile.
                  </p>
                </div>
              </TiltCard3D>

              <TiltCard3D maxTilt={6} className="rounded-xl">
                <div className="p-3.5 rounded-xl card-3d bg-slate-950/80 border border-slate-800/80 h-full">
                  <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block mb-0.5">
                    3. Owner Oversees Everyone
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Owner dashboard aggregates live progress: Priya's POS revenue, Vikram's KDS speed, Amit's table orders, and Sunita's barcode scans.
                  </p>
                </div>
              </TiltCard3D>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION B: LIVE MULTI-BRANCH NETWORK STATUS */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Multi-Branch Infrastructure
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  Live Outlets & Synchronized Operations
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Zero POS Latency (4ms)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    Connaught Place Flagship
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Dining Area:</span>
                    <strong className="text-slate-200">18 Tables Seated</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Today's Net Revenue:</span>
                    <strong className="text-amber-400 font-mono">₹48,650</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Shift Crew:</span>
                    <strong className="text-slate-200">6 Assigned Staff</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    Indiranagar Hub
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Dining Area:</span>
                    <strong className="text-slate-200">12 Tables Seated</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Today's Net Revenue:</span>
                    <strong className="text-amber-400 font-mono">₹32,100</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Shift Crew:</span>
                    <strong className="text-slate-200">5 Assigned Staff</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    Cyber Hub Cloud Kitchen
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                    Online
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Virtual Dispatch:</span>
                    <strong className="text-slate-200">8 Station KOTs</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Today's Net Revenue:</span>
                    <strong className="text-amber-400 font-mono">₹27,800</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Shift Crew:</span>
                    <strong className="text-slate-200">4 Assigned Staff</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION C: STRICT ROLE CAPABILITY MATRIX */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Role-Based Access Control (RBAC)
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  Operational Permissions & Isolation Matrix
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Guaranteed zero unauthorized role escalation
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 font-mono">
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Staff In-Charge</th>
                    <th className="p-3">Primary Operational Scope</th>
                    <th className="p-3">Strictly Allowed</th>
                    <th className="p-3 text-rose-400">Restricted / Blocked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
                  <tr className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-amber-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      Restaurant Owner
                    </td>
                    <td className="p-3 text-slate-200 font-medium">Rajesh Mehra</td>
                    <td className="p-3 text-slate-400">Executive P&L & Enterprise Strategy</td>
                    <td className="p-3 text-emerald-400 font-mono text-[11px]">Full 100% System Access</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">None (Super Administrator)</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-blue-300 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      General Manager
                    </td>
                    <td className="p-3 text-slate-200 font-medium">Rahul Verma</td>
                    <td className="p-3 text-slate-400">Daily Floor Ops & Shift Management</td>
                    <td className="p-3 text-slate-300">Tables, KDS, Shifts, PO Approvals</td>
                    <td className="p-3 text-rose-400 font-mono text-[11px]">Owner Bank Details & Taxes</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-emerald-300 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      Cashier
                    </td>
                    <td className="p-3 text-slate-200 font-medium">Priya Sharma</td>
                    <td className="p-3 text-slate-400">Touch POS, Split Bills & Payment QR</td>
                    <td className="p-3 text-slate-300">Billing, Settlement, Thermal Print</td>
                    <td className="p-3 text-rose-400 font-mono text-[11px]">Cannot edit recipe BOM / P&L</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-indigo-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Waiter / Captain
                    </td>
                    <td className="p-3 text-slate-200 font-medium">Amit Kumar</td>
                    <td className="p-3 text-slate-400">Floor Seating, KOT Punching & Service</td>
                    <td className="p-3 text-slate-300">Fire KOT, Table Status, Modifiers</td>
                    <td className="p-3 text-rose-400 font-mono text-[11px]">Cannot access cash drawer or ledger</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-orange-300 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                      Head Chef
                    </td>
                    <td className="p-3 text-slate-200 font-medium">Vikram Singh</td>
                    <td className="p-3 text-slate-400">Kitchen Display System & Station Routing</td>
                    <td className="p-3 text-slate-300">Prep Timers, Bump KOT, Mark 86</td>
                    <td className="p-3 text-rose-400 font-mono text-[11px]">Cannot view bills or guest phones</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-teal-300 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-teal-400" />
                      Inventory Lead
                    </td>
                    <td className="p-3 text-slate-200 font-medium">Sunita Rao</td>
                    <td className="p-3 text-slate-400">Kirana Barcode Scanning, Batches & PO</td>
                    <td className="p-3 text-slate-300">Barcode Inward, AI Invoices, Expiry</td>
                    <td className="p-3 text-rose-400 font-mono text-[11px]">Cannot issue sales refunds</td>
                  </tr>
                  <tr className="hover:bg-slate-850/50">
                    <td className="p-3 font-bold text-violet-300 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-violet-400" />
                      Accountant
                    </td>
                    <td className="p-3 text-slate-200 font-medium">Deepak Gupta</td>
                    <td className="p-3 text-slate-400">Statutory GST Filing & Contribution Margin</td>
                    <td className="p-3 text-slate-300">Day Books, Tax Tally, Food Margins</td>
                    <td className="p-3 text-rose-400 font-mono text-[11px]">Cannot alter live kitchen orders</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION D: KIRANASETU BARCODE & AI INVENTORY SHOWCASE */}
          {/* ======================================================== */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400 font-bold flex items-center gap-1.5">
                  <Scan className="w-3.5 h-3.5" />
                  KiranaSetu Barcode & AI Engine
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  Hardware Scanner Support, GS1 EAN-13 & AI Invoice Inwarding
                </h4>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Gemini 3.8 Flash Powered
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">1. Live Camera Scanner</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Webcam & mobile camera viewfinder with red laser crosshair for instant SKU scanning and instant stock inwarding.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">2. USB Laser Gun Listener</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automatic global keystroke listener for physical handheld barcode guns. Pull the trigger anywhere to locate SKU.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">3. GS1 EAN-13 Generator</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generate Indian GS1 standard 890... barcodes with 1-click printable shelf stickers, MRP, batch number, and expiry date.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">4. AI Invoice Parser</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Paste messy Mandi invoices or vendor receipts; Gemini AI extracts product lines, rates, quantities, and inward batches automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Security Guarantee */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400 border border-slate-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">
                  Enterprise Compliance & Statutory Standard
                </span>
                <span className="text-slate-400">
                  ISO 27001 Data Security • GST E-Invoicing • FSSAI Food Safety Audit Trail • 100% Immutable Stock Ledgers
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow transition-all shrink-0 cursor-pointer"
            >
              Start 30-Day Free Trial →
            </button>
          </div>

        </div>
      </main>

      {/* Footer Links & Compliance */}
      <footer className="w-full px-6 py-4 border-t border-slate-800/80 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 z-10">
        <div className="flex items-center gap-2">
          <span>© 2026 RestaurantOS Inc.</span>
          <span>·</span>
          <span>India GST & Global Tax Compliant</span>
          <span>·</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All Systems Operational
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveInfoModal('TERMS')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span>·</span>
          <button
            onClick={() => setActiveInfoModal('PRIVACY')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button
            onClick={() => setActiveInfoModal('SUPPORT')}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            Help & Documentation
          </button>
        </div>
      </footer>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSuccess={() => {
          setShowForgotModal(false);
          setErrorMessage(null);
        }}
      />

      <TwoFactorModal
        isOpen={showTwoFactorModal || !!twoFactorPending}
        onClose={() => setShowTwoFactorModal(false)}
        email={twoFactorPending?.email || identifier}
        mobile={twoFactorPending?.mobile || '+91 98100 11223'}
      />

      {/* Support / Help Modal */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 rounded-2xl glass-panel-elevated bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {activeInfoModal === 'TERMS' && 'RestaurantOS Terms of Service'}
                {activeInfoModal === 'PRIVACY' && 'Enterprise Data & Privacy Policy'}
                {activeInfoModal === 'SUPPORT' && 'RestaurantOS Architecture & Role Guide'}
              </h3>
              <button
                onClick={() => setActiveInfoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="my-4 text-xs text-slate-300 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {activeInfoModal === 'SUPPORT' && (
                <>
                  <p className="font-semibold text-amber-300">Role-Based Access Hierarchy:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                    <li><strong className="text-white">Restaurant Owner:</strong> Complete control over all branches, financial audits, AI configurations, menu pricing, staff invitations, and branch management.</li>
                    <li><strong className="text-white">Manager:</strong> Operations, table floor plan, real-time orders, staff shifts, review AI purchase plans.</li>
                    <li><strong className="text-white">Cashier:</strong> High-speed POS, split billing, discounts (with permission), payment processing (Cash, Card, UPI), KOT firing.</li>
                    <li><strong className="text-white">Head Chef (Kitchen):</strong> Kitchen Display System (KDS), station tickets, order preparation status, out-of-stock marking.</li>
                    <li><strong className="text-white">Inventory Manager:</strong> Stock ledger, batch expiry tracking, wastage recording, PO receiving.</li>
                    <li><strong className="text-white">Accountant:</strong> Tax / GST reports, contribution margins, recipe costs, financial exports.</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300">
                    💡 Tip: Click any role button on the left to instantly test how the interface and permissions adapt.
                  </div>
                </>
              )}

              {activeInfoModal === 'TERMS' && (
                <>
                  <p>RestaurantOS guarantees strict tenant isolation. Every database record carries organization_id, restaurant_id, and branch_id. Multi-branch access tokens are verified at the backend API layer.</p>
                  <p>All stock movements (PURCHASE, SALE_CONSUMPTION, WASTAGE, RETURN, ADJUSTMENT) generate permanent ledger entries for statutory compliance.</p>
                </>
              )}

              {activeInfoModal === 'PRIVACY' && (
                <>
                  <p>Customer phone numbers and billing information are encrypted in transit and at rest. Historical transaction records remain immutable; corrections require credit notes or logged adjustments.</p>
                </>
              )}
            </div>

            <button
              onClick={() => setActiveInfoModal(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
