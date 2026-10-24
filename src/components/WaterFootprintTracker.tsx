import React, { useState, useEffect } from 'react';
import { DailyWaterLog, WaterFootprintActivities, UserProfile } from '../types';
import { exportFootprintPDF } from '../utils/pdfGenerator';
import {
  Droplets,
  Calendar,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  MessageSquare,
  FileDown,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

interface WaterFootprintTrackerProps {
  currentUser?: UserProfile | null;
  onConsultAIWithFootprint: (summary: string) => void;
}

const STORAGE_KEY_LOGS = 'jal_jeevan_water_logs';
const STORAGE_KEY_MEMBERS = 'jal_jeevan_household_size';

const DEFAULT_ACTIVITIES: WaterFootprintActivities = {
  bathing: 30, // 1 bucket or short shower
  flushing: 25, // ~5 flushes
  cookingDrinking: 15,
  dishwashing: 35,
  laundry: 50,
  cleaning: 15,
  gardeningCar: 20,
  roRejectLoss: 25,
};

// Generates default 7-day initial history if empty
function generateDefaultWeeklyLogs(householdSize: number): DailyWaterLog[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const currentDayIndex = today.getDay(); // 0 is Sun, 1 is Mon...
  
  return days.map((dayLabel, idx) => {
    // Generate dates for current week
    const d = new Date();
    const diff = idx - (currentDayIndex === 0 ? 6 : currentDayIndex - 1);
    d.setDate(today.getDate() + diff);
    const dateStr = d.toISOString().split('T')[0];

    // Varied typical consumption per day
    const baseMult = idx === 5 || idx === 6 ? 1.25 : idx === 2 ? 0.9 : 1.05; // Weekend higher
    const acts: WaterFootprintActivities = {
      bathing: Math.round(30 * baseMult * householdSize),
      flushing: Math.round(25 * baseMult * householdSize),
      cookingDrinking: Math.round(15 * householdSize),
      dishwashing: Math.round(35 * householdSize),
      laundry: idx === 1 || idx === 5 ? Math.round(75 * householdSize * 0.7) : 0,
      cleaning: Math.round(15 * householdSize * 0.8),
      gardeningCar: idx === 5 ? 40 : 15,
      roRejectLoss: Math.round(25 * householdSize * 0.9),
    };

    const totalLitres = Object.values(acts).reduce((acc, val) => acc + val, 0);
    const perCapitaLitres = Math.round(totalLitres / householdSize);

    return {
      date: dateStr,
      dayLabel,
      householdSize,
      activities: acts,
      totalLitres,
      perCapitaLitres,
    };
  });
}

export const WaterFootprintTracker: React.FC<WaterFootprintTrackerProps> = ({
  currentUser = null,
  onConsultAIWithFootprint,
}) => {
  const [householdSize, setHouseholdSize] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
      return saved ? parseInt(saved, 10) : 3;
    } catch {
      return 3;
    }
  });

  const [weeklyLogs, setWeeklyLogs] = useState<DailyWaterLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return generateDefaultWeeklyLogs(3);
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const todayIndex = new Date().getDay();
    return todayIndex === 0 ? 6 : todayIndex - 1; // 0=Mon, 6=Sun
  });

  const [activities, setActivities] = useState<WaterFootprintActivities>(() => {
    const todayLog = weeklyLogs[selectedDayIndex] || weeklyLogs[weeklyLogs.length - 1];
    return todayLog ? todayLog.activities : DEFAULT_ACTIVITIES;
  });

  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [logSavedToast, setLogSavedToast] = useState(false);

  // Sync activities when changing selected day
  useEffect(() => {
    if (weeklyLogs[selectedDayIndex]) {
      setActivities(weeklyLogs[selectedDayIndex].activities);
    }
  }, [selectedDayIndex, weeklyLogs]);

  // Save changes to localStorage
  const saveLogs = (updatedLogs: DailyWaterLog[]) => {
    setWeeklyLogs(updatedLogs);
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
    } catch {
      // Ignore
    }
  };

  const handleHouseholdChange = (size: number) => {
    setHouseholdSize(size);
    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, size.toString());
    } catch {
      // Ignore
    }
    // Recalculate default logs with new size
    const updated = generateDefaultWeeklyLogs(size);
    saveLogs(updated);
  };

  const handleActivityChange = (key: keyof WaterFootprintActivities, value: number) => {
    const cleanVal = Math.max(0, isNaN(value) ? 0 : value);
    const updatedActivities = { ...activities, [key]: cleanVal };
    setActivities(updatedActivities);

    // Update active day log in state
    const totalLitres = Object.values(updatedActivities).reduce((a, b) => a + b, 0);
    const perCapitaLitres = Math.round(totalLitres / householdSize);

    const updatedWeekly = [...weeklyLogs];
    if (updatedWeekly[selectedDayIndex]) {
      updatedWeekly[selectedDayIndex] = {
        ...updatedWeekly[selectedDayIndex],
        activities: updatedActivities,
        totalLitres,
        perCapitaLitres,
        householdSize,
      };
      saveLogs(updatedWeekly);
    }
  };

  const applyPreset = (preset: 'eco' | 'average' | 'high') => {
    let presetActs: WaterFootprintActivities;
    if (preset === 'eco') {
      // ~65 LPCD per person
      presetActs = {
        bathing: 20 * householdSize, // bucket
        flushing: 18 * householdSize, // dual flush
        cookingDrinking: 12 * householdSize,
        dishwashing: 20 * householdSize,
        laundry: 15 * householdSize,
        cleaning: 10 * householdSize,
        gardeningCar: 5,
        roRejectLoss: 0, // Recycled
      };
    } else if (preset === 'average') {
      // ~125 LPCD per person (urban normal)
      presetActs = {
        bathing: 35 * householdSize,
        flushing: 28 * householdSize,
        cookingDrinking: 15 * householdSize,
        dishwashing: 35 * householdSize,
        laundry: 40 * householdSize,
        cleaning: 15 * householdSize,
        gardeningCar: 20,
        roRejectLoss: 25 * householdSize,
      };
    } else {
      // High usage day
      presetActs = {
        bathing: 65 * householdSize, // Long showers
        flushing: 45 * householdSize,
        cookingDrinking: 20 * householdSize,
        dishwashing: 50 * householdSize,
        laundry: 70 * householdSize,
        cleaning: 25 * householdSize,
        gardeningCar: 60, // Hose wash
        roRejectLoss: 40 * householdSize,
      };
    }

    setActivities(presetActs);
    const totalLitres = Object.values(presetActs).reduce((a, b) => a + b, 0);
    const perCapitaLitres = Math.round(totalLitres / householdSize);

    const updatedWeekly = [...weeklyLogs];
    if (updatedWeekly[selectedDayIndex]) {
      updatedWeekly[selectedDayIndex] = {
        ...updatedWeekly[selectedDayIndex],
        activities: presetActs,
        totalLitres,
        perCapitaLitres,
        householdSize,
      };
      saveLogs(updatedWeekly);
    }

    setLogSavedToast(true);
    setTimeout(() => setLogSavedToast(false), 2000);
  };

  // Metrics calculations
  const currentDayLog = weeklyLogs[selectedDayIndex] || weeklyLogs[0];
  const weeklyTotalLitres = weeklyLogs.reduce((acc, log) => acc + log.totalLitres, 0);
  const weeklyAverageLPCD = Math.round(
    weeklyLogs.reduce((acc, log) => acc + log.perCapitaLitres, 0) / weeklyLogs.length
  );

  // Status rating
  let statusRating: 'Eco Hero' | 'Balanced Urban' | 'High Footprint' = 'Balanced Urban';
  let statusBadgeClass = 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300';

  if (currentDayLog.perCapitaLitres <= 85) {
    statusRating = 'Eco Hero';
    statusBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
  } else if (currentDayLog.perCapitaLitres > 140) {
    statusRating = 'High Footprint';
    statusBadgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
  }

  // PDF Export
  const handleExportPDF = () => {
    try {
      exportFootprintPDF(currentDayLog, weeklyAverageLPCD, currentUser, statusRating);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to export Footprint PDF:', err);
      window.print();
    }
  };

  // Consult AI
  const handleSendToAI = () => {
    const summary = `I audited my Personal Water Footprint with Jal-Jeevan:
- Household Size: ${householdSize} member(s)
- Today's Total Consumption: ${currentDayLog.totalLitres} Litres (${currentDayLog.perCapitaLitres} Litres Per Capita/Day)
- 7-Day Weekly Average: ${weeklyAverageLPCD} LPCD
- National CPHEEO Standard: 135 LPCD | Jal Jeevan Mission Rural: 55 LPCD
- Activity Breakdown:
  * Bathing & Showering: ${activities.bathing}L
  * Toilet Flushing: ${activities.flushing}L
  * Kitchen & Cooking: ${activities.cookingDrinking}L
  * Dishwashing: ${activities.dishwashing}L
  * Laundry: ${activities.laundry}L
  * Mopping & Cleaning: ${activities.cleaning}L
  * Gardening & Car Wash: ${activities.gardeningCar}L
  * RO Filter Reject Loss: ${activities.roRejectLoss}L
Can you provide 3 actionable, high-impact strategies to lower my household water footprint, save on water bills, and recharge the local groundwater table?`;

    onConsultAIWithFootprint(summary);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300">
              <Droplets className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Personal Water Footprint Tracker
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Log your daily domestic water consumption across activities, monitor your 7-day rolling trend, and benchmark your household against national standards (CPHEEO 135 LPCD & Jal Jeevan Mission 55 LPCD).
          </p>
        </div>

        {/* Action Buttons: Export PDF & Ask Jal-Doot */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              pdfDownloaded
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            }`}
            title="Download certified Water Footprint Audit PDF"
          >
            {pdfDownloaded ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved PDF!</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Export Footprint PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSendToAI}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Water Audit</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Today's LPCD */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Today's Per Capita
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-extrabold ${
                currentDayLog.perCapitaLitres <= 85
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : currentDayLog.perCapitaLitres <= 135
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {currentDayLog.perCapitaLitres}
            </span>
            <span className="text-xs text-slate-500 font-semibold">LPCD</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Litres/person/day</span>
        </div>

        {/* Card 2: Household Total Today */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Household Total ({currentDayLog.dayLabel})
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {currentDayLog.totalLitres}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Litres</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            for {householdSize} family member(s)
          </span>
        </div>

        {/* Card 3: 7-Day Average */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            7-Day Rolling Avg
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {weeklyAverageLPCD}
            </span>
            <span className="text-xs text-slate-500 font-semibold">LPCD</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            Target: &le; 135 LPCD (Urban)
          </span>
        </div>

        {/* Card 4: Eco Standing */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Efficiency Rating
          </span>
          <div>
            <span
              className={`inline-block px-2.5 py-1 rounded-xl text-xs font-bold border ${statusBadgeClass}`}
            >
              {statusRating}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">
            {currentDayLog.perCapitaLitres <= 135
              ? `${135 - currentDayLog.perCapitaLitres}L below urban ceiling`
              : `${currentDayLog.perCapitaLitres - 135}L above urban ceiling`}
          </span>
        </div>
      </div>

      {/* 7-Day Interactive Weekly Trend Chart & Benchmark */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-600" />
              <span>Weekly Water Consumption Trend (Litres Per Capita / Day)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Click on any day bar to view or log consumption for that specific date.
            </p>
          </div>

          {/* Reference benchmark legend */}
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>JJM Rural (55L)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>CPHEEO Urban (135L)</span>
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="h-56 pt-6 pb-2 px-2 flex items-end justify-between gap-2 sm:gap-4 relative border-b border-slate-200 dark:border-slate-700">
          {/* Benchmark guide line: CPHEEO 135L */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-sky-400/80 pointer-events-none z-10 flex items-center justify-end pr-2"
            style={{ bottom: `${Math.min(90, (135 / 220) * 100)}%` }}
          >
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 shadow-xs">
              CPHEEO Urban Benchmark (135 LPCD)
            </span>
          </div>

          {/* Benchmark guide line: JJM Rural 55L */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400/70 pointer-events-none z-10 flex items-center justify-end pr-2"
            style={{ bottom: `${Math.min(90, (55 / 220) * 100)}%` }}
          >
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shadow-xs">
              Jal Jeevan Mission Rural Target (55 LPCD)
            </span>
          </div>

          {/* 7 Bars for Mon to Sun */}
          {weeklyLogs.map((log, idx) => {
            const isSelected = selectedDayIndex === idx;
            const barHeightPercent = Math.min(100, Math.max(12, (log.perCapitaLitres / 220) * 100));

            const barColor =
              log.perCapitaLitres <= 85
                ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                : log.perCapitaLitres <= 135
                ? 'bg-gradient-to-t from-sky-500 to-cyan-400'
                : 'bg-gradient-to-t from-rose-500 to-amber-500';

            return (
              <div
                key={log.dayLabel}
                onClick={() => setSelectedDayIndex(idx)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              >
                {/* Litre label above bar */}
                <span
                  className={`text-[11px] font-bold mb-1 transition-transform group-hover:-translate-y-1 ${
                    isSelected ? 'text-sky-600 dark:text-sky-400 scale-110' : 'text-slate-500'
                  }`}
                >
                  {log.perCapitaLitres}L
                </span>

                {/* Animated Bar */}
                <div
                  className="w-full max-w-[48px] rounded-t-xl transition-all relative overflow-hidden group-hover:opacity-90"
                  style={{
                    height: `${barHeightPercent}%`,
                  }}
                >
                  <div className={`w-full h-full ${barColor}`} />
                  {isSelected && (
                    <div className="absolute inset-0 ring-2 ring-sky-600 dark:ring-sky-400 rounded-t-xl" />
                  )}
                </div>

                {/* Day label */}
                <div
                  className={`mt-2 text-xs font-semibold py-0.5 px-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}
                >
                  {log.dayLabel}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer explanation */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Total 7-day household volume: <strong>{weeklyTotalLitres.toLocaleString()} Litres</strong> (~{(weeklyTotalLitres / 5000).toFixed(1)} water tankers equivalent).
          </span>
          <span className="text-teal-600 dark:text-teal-400 font-semibold">
            Currently editing: <strong>{currentDayLog.dayLabel} ({currentDayLog.date})</strong>
          </span>
        </div>
      </div>

      {/* Activity Logger Form Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Activity Sliders */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Log Water Consumed by Activity ({currentDayLog.dayLabel})
              </h3>
              <p className="text-xs text-slate-400">
                Adjust the litres spent across daily domestic uses.
              </p>
            </div>

            {/* Quick Activity Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] mr-1 hidden sm:inline">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('eco')}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 text-[11px] transition-colors"
              >
                🌱 Eco Hero
              </button>
              <button
                type="button"
                onClick={() => applyPreset('average')}
                className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800 hover:bg-sky-100 text-[11px] transition-colors"
              >
                🏙️ Urban Avg
              </button>
              <button
                type="button"
                onClick={() => applyPreset('high')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 text-[11px] transition-colors"
              >
                🧺 Heavy Wash
              </button>
            </div>
          </div>

          {/* Activity Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bathing */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🚿 Bathing & Showering</span>
                </label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {activities.bathing} Litres
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={activities.bathing}
                onChange={(e) => handleActivityChange('bathing', parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Bucket (20L)</span>
                <span>Shower (~70L)</span>
                <span>Multiple Showers (150L+)</span>
              </div>
            </div>

            {/* Toilet Flushing */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🚽 Toilet Flushing</span>
                </label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {activities.flushing} Litres
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={activities.flushing}
                onChange={(e) => handleActivityChange('flushing', parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Dual-flush (15L)</span>
                <span>Standard (40L)</span>
                <span>Single high tank (80L+)</span>
              </div>
            </div>

            {/* Cooking & Drinking */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🍲 Cooking & Drinking</span>
                </label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {activities.cookingDrinking} Litres
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={activities.cookingDrinking}
                onChange={(e) => handleActivityChange('cookingDrinking', parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Minimal (10L)</span>
                <span>Full meals (25L)</span>
                <span>Large kitchen (50L+)</span>
              </div>
            </div>

            {/* Dishwashing */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🍽️ Dishwashing & Sink</span>
                </label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {activities.dishwashing} Litres
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={activities.dishwashing}
                onChange={(e) => handleActivityChange('dishwashing', parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Bowl wash (20L)</span>
                <span>Dishwasher (35L)</span>
                <span>Running tap wash (80L+)</span>
              </div>
            </div>

            {/* Laundry */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🧺 Laundry / Washing Machine</span>
                </label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {activities.laundry} Litres
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="10"
                value={activities.laundry}
                onChange={(e) => handleActivityChange('laundry', parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>No wash today (0L)</span>
                <span>1 Load (60L)</span>
                <span>Multiple loads (150L+)</span>
              </div>
            </div>

            {/* House Cleaning */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🧹 House Cleaning / Mopping</span>
                </label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {activities.cleaning} Litres
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={activities.cleaning}
                onChange={(e) => handleActivityChange('cleaning', parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 Bucket (15L)</span>
                <span>2 Buckets (30L)</span>
                <span>Deep cleaning (60L+)</span>
              </div>
            </div>

            {/* Gardening & Car Wash */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🌿 Gardening & Car Wash</span>
                </label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {activities.gardeningCar} Litres
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={activities.gardeningCar}
                onChange={(e) => handleActivityChange('gardeningCar', parseInt(e.target.value, 10))}
                className="w-full accent-sky-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Drip/Can (15L)</span>
                <span>Bucket wash (30L)</span>
                <span>Hose pipe (100L+)</span>
              </div>
            </div>

            {/* RO Reject Loss */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <div className="flex justify-between items-center text-xs mb-1">
                <label className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <span>💧 RO Purifier Reject Loss</span>
                </label>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {activities.roRejectLoss} Litres
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={activities.roRejectLoss}
                onChange={(e) => handleActivityChange('roRejectLoss', parseInt(e.target.value, 10))}
                className="w-full accent-amber-600 h-2 bg-amber-100 dark:bg-amber-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-amber-700/80 dark:text-amber-400 mt-1">
                <span>0L (Recycled!)</span>
                <span>20L (Standard)</span>
                <span>60L+ (Unmanaged reject)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Household Profile & Smart Conservation Insights */}
        <div className="lg:col-span-4 space-y-4">
          {/* Household Size Configuration */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-600" />
                <span>Household Size</span>
              </h4>
              <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400">
                {householdSize} Person(s)
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Used to compute your per-capita daily water footprint (LPCD).
            </p>

            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleHouseholdChange(size)}
                  className={`py-1.5 rounded-xl border font-bold transition-all ${
                    householdSize === size
                      ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Water-Saving Audit Insights */}
          <div className="bg-gradient-to-br from-cyan-500/10 via-teal-500/10 to-sky-500/10 dark:from-cyan-950/40 dark:to-teal-950/40 rounded-3xl p-5 border border-cyan-200 dark:border-cyan-800 space-y-3 text-xs">
            <h4 className="font-bold text-cyan-950 dark:text-cyan-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>Smart Conservation Actions</span>
            </h4>

            <div className="space-y-2 text-slate-700 dark:text-slate-300">
              {activities.roRejectLoss > 0 && (
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-cyan-100 dark:border-cyan-900">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
                    💡 Capture RO Reject Pipe:
                  </span>
                  Routing the reject pipe into a 30L bucket saves up to{' '}
                  <strong>{activities.roRejectLoss * 30} Litres/month</strong> for mopping and toilet flushing.
                </div>
              )}

              {activities.bathing > 40 * householdSize && (
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-cyan-100 dark:border-cyan-900">
                  <span className="font-bold text-sky-700 dark:text-sky-300 block mb-0.5">
                    🚿 Shower Flow Aerator:
                  </span>
                  Installing a 6-LPM aerator or switching to bucket baths saves approx{' '}
                  <strong>{Math.round(activities.bathing * 0.4)} Litres daily</strong> for your family.
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-cyan-100 dark:border-cyan-900">
                <span className="font-bold text-teal-700 dark:text-teal-300 block mb-0.5">
                  🌧️ Groundwater Recharge Offset:
                </span>
                Your household consumes approx{' '}
                <strong>{(currentDayLog.totalLitres * 365).toLocaleString()} Litres/year</strong>. A 1,200 sq. ft rooftop rainwater harvesting pit can replenish 100% of this back into your local aquifer!
              </div>
            </div>

            {/* CTA to consult chatbot */}
            <button
              type="button"
              onClick={handleSendToAI}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Jal-Doot for Household Water Budget</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
