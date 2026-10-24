import React, { useState } from 'react';
import { Droplets, MapPin, FlaskConical, CloudRain, BookOpen, MessageSquare, Globe, ShieldCheck, User, LogIn, LogOut, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';

export type ActiveTab = 'chat' | 'directory' | 'checker' | 'rwh' | 'footprint' | 'guide' | 'login';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Hindi', label: 'हिन्दी (Hindi)' },
  { code: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'Telugu', label: 'తెలుగు (Telugu)' },
  { code: 'Tamil', label: 'தமிழ் (Tamil)' },
  { code: 'Marathi', label: 'मराठी (Marathi)' },
  { code: 'Bengali', label: 'বাংলা (Bengali)' },
  { code: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedLanguage,
  setSelectedLanguage,
  currentUser = null,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-sky-100 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-teal-400 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform flex items-center justify-center text-white">
              <Droplets className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-700 dark:from-sky-400 dark:to-teal-300 bg-clip-text text-transparent">
                  Jal-Jeevan
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Hydro-AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Groundwater Intelligence & Water Quality Portal
              </p>
            </div>
          </div>

          {/* Navigation Items (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Jal-Doot AI</span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'directory'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Regional Levels</span>
            </button>

            <button
              onClick={() => setActiveTab('checker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'checker'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Water Lab Checker</span>
            </button>

            <button
              onClick={() => setActiveTab('rwh')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'rwh'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>RWH Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('footprint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'footprint'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-500" />
              <span>Water Footprint</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'guide'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>BIS Guide</span>
            </button>
          </nav>

          {/* Right actions: Language selector & Login/User Profile */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>CGWB & BIS IS 10500</span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none pr-1 py-1 cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* User Profile or Login Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs transition-colors"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-600 to-teal-500 text-white font-bold flex items-center justify-center text-[10px]">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[100px] leading-tight">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold block leading-tight">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2.5 z-50 text-xs space-y-2">
                    <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {currentUser.email}
                      </span>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium block mt-0.5">
                        📍 {currentUser.district}, {currentUser.state}
                      </span>
                    </div>

                    <div className="px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg text-[10px] text-slate-500">
                      Role: <strong>{currentUser.roleTitle}</strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout?.();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all ${
                  activeTab === 'login'
                    ? 'bg-sky-700 text-white'
                    : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white shadow-sky-500/20'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'chat'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Jal-Doot AI
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'directory'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Regional Levels
          </button>
          <button
            onClick={() => setActiveTab('checker')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'checker'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Lab Checker
          </button>
          <button
            onClick={() => setActiveTab('rwh')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'rwh'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            RWH Calc
          </button>
          <button
            onClick={() => setActiveTab('footprint')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'footprint'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            Footprint
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'guide'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Standards
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeTab === 'login'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            {currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}
          </button>
        </div>
      </div>
    </header>
  );
};
