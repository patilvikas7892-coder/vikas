/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { Chatbot } from './components/Chatbot';
import { RegionalInspector } from './components/RegionalInspector';
import { WaterQualityChecker } from './components/WaterQualityChecker';
import { RainwaterCalculator } from './components/RainwaterCalculator';
import { WaterFootprintTracker } from './components/WaterFootprintTracker';
import { StandardsGuide } from './components/StandardsGuide';
import { LoginPage } from './components/LoginPage';
import { DistrictGroundwaterInfo, UserProfile } from './types';
import { Droplets, ShieldCheck } from 'lucide-react';

const STORAGE_KEY_USER = 'jal_jeevan_user';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [previousTab, setPreviousTab] = useState<ActiveTab>('chat');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictGroundwaterInfo | null>(null);

  // Authenticated user state with localStorage persistence
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleTabChange = (tab: ActiveTab) => {
    if (activeTab !== 'login') {
      setPreviousTab(activeTab);
    }
    setActiveTab(tab);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch {
      // Ignore localStorage errors in private mode
    }
    // Return to previous tab or default to checker
    setActiveTab(previousTab !== 'login' ? previousTab : 'checker');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // Ignore
    }
  };

  const handleSelectDistrictForChat = (district: DistrictGroundwaterInfo) => {
    setSelectedDistrict(district);
    handleTabChange('chat');
  };

  const handleSelectDistrictForRWH = (district: DistrictGroundwaterInfo) => {
    setSelectedDistrict(district);
    handleTabChange('rwh');
  };

  const handleConsultAIWithReport = (reportText: string) => {
    handleTabChange('chat');
    setTimeout(() => {
      const chatInput = document.querySelector('textarea') as HTMLTextAreaElement | null;
      if (chatInput) {
        chatInput.value = reportText;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        chatInput.focus();
      }
    }, 100);
  };

  const handleConsultAIWithRWH = (rwhSummary: string) => {
    handleTabChange('chat');
    setTimeout(() => {
      const chatInput = document.querySelector('textarea') as HTMLTextAreaElement | null;
      if (chatInput) {
        chatInput.value = rwhSummary;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        chatInput.focus();
      }
    }, 100);
  };

  const handleConsultAIWithFootprint = (footprintSummary: string) => {
    handleTabChange('chat');
    setTimeout(() => {
      const chatInput = document.querySelector('textarea') as HTMLTextAreaElement | null;
      if (chatInput) {
        chatInput.value = footprintSummary;
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        chatInput.focus();
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-sky-500/20">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {activeTab === 'chat' && (
          <Chatbot
            selectedDistrict={selectedDistrict}
            onClearDistrictContext={() => setSelectedDistrict(null)}
            onSelectDistrict={setSelectedDistrict}
            selectedLanguage={selectedLanguage}
          />
        )}

        {activeTab === 'directory' && (
          <RegionalInspector
            onSelectDistrictForChat={handleSelectDistrictForChat}
            onSelectDistrictForRWH={handleSelectDistrictForRWH}
          />
        )}

        {activeTab === 'checker' && (
          <WaterQualityChecker
            onConsultAIWithReport={handleConsultAIWithReport}
            currentUser={currentUser}
            selectedDistrictName={selectedDistrict ? `${selectedDistrict.district}, ${selectedDistrict.state}` : undefined}
          />
        )}

        {activeTab === 'rwh' && (
          <RainwaterCalculator
            initialDistrict={selectedDistrict}
            onConsultAIWithRWH={handleConsultAIWithRWH}
            currentUser={currentUser}
            selectedDistrictName={selectedDistrict ? `${selectedDistrict.district}, ${selectedDistrict.state}` : undefined}
          />
        )}

        {activeTab === 'footprint' && (
          <WaterFootprintTracker
            currentUser={currentUser}
            onConsultAIWithFootprint={handleConsultAIWithFootprint}
          />
        )}

        {activeTab === 'guide' && <StandardsGuide />}

        {activeTab === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onContinueAsGuest={() => setActiveTab(previousTab !== 'login' ? previousTab : 'chat')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white">
              <Droplets className="w-3 h-3" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Jal-Jeevan (जल जीवन)
            </span>
            <span>• Every Drop Counts. Conserve Groundwater, Secure Tomorrow.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> BIS IS 10500:2012 Aligned
            </span>
            <span className="text-slate-400">|</span>
            <span>Central Ground Water Board (CGWB) Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
