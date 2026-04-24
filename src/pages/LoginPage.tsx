import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../contexts';
import { Button } from '../components';
import {
  AcademicCapIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  WrenchScrewdriverIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import ThemeToggle from '../components/ThemeToggle';

const ROLE_CONFIG = {
  student: { label: 'Student', icon: AcademicCapIcon },
  warden: { label: 'Warden', icon: ShieldCheckIcon },
  security: { label: 'Security', icon: LockClosedIcon },
  maintenance: { label: 'Maint.', icon: WrenchScrewdriverIcon },
  admin: { label: 'Admin', icon: CogIcon },
} as const;

const FEATURE_LINES = [
  'QR Gate pass — scan and exit seamlessly',
  'Parent approval — instant WhatsApp confirmations',
  'Real-time tracking — leave and complaints live',
];

const OVERVIEW_STATS = [
  { label: 'Pending', value: '2', tone: 'text-amber-400' },
  { label: 'Approved', value: '5', tone: 'text-emerald-400' },
  { label: 'Complaints', value: '1', tone: 'text-rose-400' },
];

const TRUST_BADGES = [
  { value: '12k+', label: 'Students' },
  { value: '80%', label: 'Faster approvals' },
  { value: '99.9%', label: 'Uptime' },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(email, password, selectedRole);

      if (user.isFirstLogin) {
        navigate('/change-password');
        return;
      }

      const dashboardPaths: Record<UserRole, string> = {
        student: '/',
        warden: '/warden/dashboard',
        security: '/security/dashboard',
        maintenance: '/maintenance/dashboard',
        admin: '/admin/dashboard',
      };

      navigate(dashboardPaths[user.role]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-[46%] bg-[#0f1729] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-40 right-0 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col justify-between px-12 xl:px-16 py-10">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 21V7l9-4 9 4v14H3zm2-2h14V8.3l-7-3.11L5 8.3V19zm3-2h8v-2H8v2zm0-4h8v-2H8v2z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-lg">HostelOps</span>
            </div>

            <div>
              <h2 className="text-[36px] xl:text-[42px] font-bold text-white leading-[1.12] tracking-tight">
                Streamline Your<br />Campus Living
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mt-4 max-w-md">
                Role-based smart management for leave, complaints, and gate security.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-2.5">
                {OVERVIEW_STATS.map(stat => (
                  <div key={stat.label} className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-sm">
                    <p className="text-xs text-slate-400">{stat.label}</p>
                    <p className={`text-3xl font-semibold mt-1 ${stat.tone}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                {FEATURE_LINES.map(feature => (
                  <div
                    key={feature}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all duration-300 hover:border-blue-300/35 hover:bg-white/10"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 group-hover:bg-blue-400 transition-colors" />
                    <p className="text-slate-200 text-sm leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              {TRUST_BADGES.map(badge => (
                <div key={badge.label} className="rounded-xl border border-white/10 bg-white/8 px-3 py-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-semibold leading-none text-white">{badge.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{badge.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
              <p className="text-slate-300 text-sm italic leading-relaxed">
                "The new leave approval system has cut our processing time by 80%. It's a game-changer for campus security."
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">SJ</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Dr. Sarah Jenkins</p>
                  <p className="text-slate-500 text-xs">Chief Warden, North Campus</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex flex-1 flex-col bg-white px-4 py-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-[420px] justify-end pb-2">
          <ThemeToggle variant="toolbar" />
        </div>
        <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 21V7l9-4 9 4v14H3zm2-2h14V8.3l-7-3.11L5 8.3V19zm3-2h8v-2H8v2zm0-4h8v-2H8v2z" />
              </svg>
            </div>
            <span className="text-slate-800 text-lg font-semibold">HostelOps</span>
          </div>

          <div className="mb-9">
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 mb-1.5">Welcome back</h1>
            <p className="text-sm text-slate-500">Please select your role and sign in to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-[26px]">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select role</label>
              <div className="grid grid-cols-5 gap-2.5">
                {(Object.entries(ROLE_CONFIG) as [UserRole, typeof ROLE_CONFIG.student][]).map(([role, config]) => {
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`flex flex-col items-center gap-1.5 h-[56px] justify-center rounded-[10px] border text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <config.icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-500'}`} />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 h-[46px] text-sm bg-white border border-surface-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 hover:border-surface-400 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                <button type="button" className="text-xs text-cyan-600 hover:text-cyan-700 font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 h-[46px] text-sm bg-white border border-surface-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 hover:border-surface-400 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-surface-300 text-cyan-600 focus:ring-cyan-500" />
              <span className="text-sm text-slate-600">Remember me for 30 days</span>
            </label>

            {errorMessage && (
              <div
                className={`p-3 rounded-xl border ${
                  errorMessage.toLowerCase().includes('registered') || errorMessage.toLowerCase().includes('select the')
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    errorMessage.toLowerCase().includes('registered') || errorMessage.toLowerCase().includes('select the')
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                >
                  {errorMessage}
                </p>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="large"
              disabled={isLoading}
              loading={isLoading}
              className="!h-[48px] !bg-gradient-to-r !from-blue-700 !to-blue-800 !text-white !shadow-md hover:!from-blue-800 hover:!to-blue-900 hover:!shadow-lg !rounded-[10px]"
            >
              {isLoading ? 'Signing in...' : 'Sign in to dashboard'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
            </div>

            <div className="text-center space-y-3 pt-2">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <button type="button" className="text-cyan-600 font-medium hover:text-cyan-700">
                  Contact Administrator
                </button>
              </p>
              <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                <button type="button" className="hover:text-slate-600">Terms of Service</button>
                <span>·</span>
                <button type="button" className="hover:text-slate-600">Privacy Policy</button>
                <span>·</span>
                <button type="button" className="hover:text-slate-600">Help Center</button>
              </div>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
