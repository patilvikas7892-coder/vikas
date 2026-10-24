import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Droplets, ShieldCheck, User, Mail, Lock, Eye, EyeOff, MapPin, Building, ArrowRight, CheckCircle2, AlertCircle, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
}

const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr-citizen-1',
    name: 'Ramesh Patil',
    email: 'ramesh.patil@jaljeevan.in',
    role: 'citizen',
    roleTitle: 'Resident & Farmer',
    district: 'Jaipur',
    state: 'Rajasthan',
    organization: 'Gram Panchayat Sanganer',
    phone: '+91 98765 43210',
  },
  {
    id: 'usr-tech-2',
    name: 'Dr. Pooja Sharma',
    email: 'pooja.sharma@wqi-lab.gov.in',
    role: 'technician',
    roleTitle: 'Certified Water Quality Analyst',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    organization: 'Karnataka State Water Quality Lab',
    phone: '+91 98220 12345',
  },
  {
    id: 'usr-officer-3',
    name: 'Vikas Patil',
    email: 'vikas.patil@cgwb.gov.in',
    role: 'officer',
    roleTitle: 'Senior Hydrogeologist & Nodal Officer',
    district: 'Central Division',
    state: 'National / Ministry of Jal Shakti',
    organization: 'Central Ground Water Board (CGWB)',
    phone: '+91 94140 98765',
  },
];

const POPULAR_STATES = [
  'Rajasthan',
  'Karnataka',
  'Maharashtra',
  'Punjab',
  'Uttar Pradesh',
  'Tamil Nadu',
  'Telangana',
  'Gujarat',
  'West Bengal',
  'Bihar',
  'Delhi NCR',
  'Madhya Pradesh',
  'Haryana',
  'Kerala',
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('Jaipur');
  const [stateName, setStateName] = useState('Rajasthan');
  const [role, setRole] = useState<UserRole>('citizen');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleDemoLogin = (demoUser: UserProfile) => {
    setSuccessMessage(`Welcome back, ${demoUser.name}!`);
    setTimeout(() => {
      onLoginSuccess(demoUser);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (mode === 'signup' && !name) {
      setErrorMessage('Please provide your full name.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    // Role title mapping
    const roleTitles: Record<UserRole, string> = {
      citizen: 'Citizen & Well Owner',
      technician: 'Water Quality Analyst',
      officer: 'Groundwater Officer',
    };

    const loggedInUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: mode === 'signup' ? name : email.split('@')[0].replace('.', ' '),
      email,
      role,
      roleTitle: roleTitles[role],
      district,
      state: stateName,
      organization: role === 'officer' ? 'Jal Jeevan Mission Cell' : undefined,
    };

    setSuccessMessage(mode === 'signin' ? 'Sign-in successful!' : 'Account registered successfully!');
    setTimeout(() => {
      onLoginSuccess(loggedInUser);
    }, 400);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] py-8 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Left Column: Visual Brand & Value Proposition */}
        <div className="md:col-span-5 bg-gradient-to-br from-sky-700 via-cyan-800 to-teal-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background circles */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-cyan-400/10 blur-2xl" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-teal-400/10 blur-2xl" />

          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20">
                <Droplets className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-white block">
                  Jal-Jeevan
                </span>
                <span className="text-[10px] text-cyan-200 uppercase tracking-widest font-semibold">
                  Water Intelligence Hub
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 leading-snug">
              Secure Groundwater Access, Verified Potability.
            </h2>
            <p className="text-xs text-cyan-100/90 leading-relaxed mb-6">
              Sign in to save water quality lab test records, generate certified PDF reports for panchayats and municipal authorities, and track local water table trends.
            </p>

            {/* Feature List */}
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
                <span>
                  <strong>BIS IS 10500:2012 Compliance</strong> with automated WQI health diagnostics.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Real-time CGWB Monitoring</strong> for 22+ over-exploited and critical aquifers.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Official PDF Reports</strong> branded with applicant credentials and engineering blueprints.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/10 text-[11px] text-cyan-200 flex items-center justify-between">
            <span>Every Drop Counts</span>
            <span>Jal Jeevan Mission</span>
          </div>
        </div>

        {/* Right Column: Login / Signup Form & One-Click Demos */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Top Toggle: Sign In vs Sign Up */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage('');
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage('');
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-medium text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 underline"
              >
                Continue as Guest
              </button>
            </div>

            {/* Notification messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Quick Demo Credentials Bar */}
            <div className="mb-6 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-500" />
                Instant Demo Access (Click to Login):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => handleDemoLogin(demo)}
                    className="text-left p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:shadow-sm transition-all text-xs group"
                  >
                    <span className="font-bold text-slate-900 dark:text-white block group-hover:text-sky-600 transition-colors">
                      {demo.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {demo.roleTitle}
                    </span>
                    <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 block mt-0.5">
                      📍 {demo.district}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === 'signup' && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Patil / Dr. Sunita Rao"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@jaljeevan.in or name@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Location selectors for Signup */}
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      State
                    </label>
                    <select
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {POPULAR_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Jaipur, Pune, Bengaluru"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* Role selection for Signup */}
              {mode === 'signup' && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Your Primary Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { roleKey: 'citizen', label: 'Citizen / Farmer' },
                      { roleKey: 'technician', label: 'Lab Analyst' },
                      { roleKey: 'officer', label: 'Nodal Officer' },
                    ].map((item) => (
                      <button
                        key={item.roleKey}
                        type="button"
                        onClick={() => setRole(item.roleKey as UserRole)}
                        className={`p-2 rounded-xl border text-center font-medium transition-all ${
                          role === item.roleKey
                            ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-500 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                  />
                  <span>Remember my station</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to your registered email.')}
                  className="text-slate-500 hover:text-sky-600 dark:hover:text-sky-400"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
              >
                <span>{mode === 'signin' ? 'Sign In to Jal-Jeevan' : 'Create Registered Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="mt-6 text-center text-[11px] text-slate-400">
            <span>By proceeding, you agree to Jal-Jeevan mission data policies and CGWB standards.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
