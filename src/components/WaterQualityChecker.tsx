import React, { useState } from 'react';
import { WaterQualityMetrics, UserProfile } from '../types';
import { calculateWQI, BIS_STANDARDS } from '../data/groundwaterData';
import { exportWaterQualityPDF } from '../utils/pdfGenerator';
import { FlaskConical, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, MessageSquare, RotateCcw, HelpCircle, Activity, FileDown, Check } from 'lucide-react';

interface WaterQualityCheckerProps {
  onConsultAIWithReport: (reportText: string) => void;
  currentUser?: UserProfile | null;
  selectedDistrictName?: string;
}

const PRESET_REPORTS = [
  {
    name: 'Typical Hardwater Borewell',
    metrics: {
      tds: 1150,
      ph: 7.8,
      fluoride: 1.1,
      nitrate: 54,
      arsenic: 0.002,
      hardness: 480,
      iron: 0.3,
    },
    description: 'Common in Bengaluru, Hyderabad, and Pune suburbs. High calcium/magnesium and moderate nitrate.',
  },
  {
    name: 'Arsenic-Laced Gangetic Well',
    metrics: {
      tds: 410,
      ph: 7.1,
      fluoride: 0.5,
      nitrate: 16,
      arsenic: 0.048, // Hazardous!
      hardness: 180,
      iron: 2.8,
    },
    description: 'Found in shallow deltaic alluvium in West Bengal, Bihar, and eastern UP. Extreme carcinogen risk.',
  },
  {
    name: 'Arid Zone Fluoride & Saline Water',
    metrics: {
      tds: 1850,
      ph: 8.2,
      fluoride: 2.7, // Very high!
      nitrate: 68,
      arsenic: 0.003,
      hardness: 560,
      iron: 0.4,
    },
    description: 'Common in Rajasthan, northern Gujarat, and Kolar belt. Causes crippling fluorosis if unpurified.',
  },
  {
    name: 'Protected Himalayan / Rain-fed Well',
    metrics: {
      tds: 160,
      ph: 7.2,
      fluoride: 0.3,
      nitrate: 8,
      arsenic: 0.001,
      hardness: 95,
      iron: 0.1,
    },
    description: 'Pristine mountain spring or well-filtered rainwater. Ideal balanced mineral content.',
  },
];

export const WaterQualityChecker: React.FC<WaterQualityCheckerProps> = ({
  onConsultAIWithReport,
  currentUser = null,
  selectedDistrictName,
}) => {
  const [metrics, setMetrics] = useState<WaterQualityMetrics>({
    tds: 650,
    ph: 7.4,
    fluoride: 0.8,
    nitrate: 35,
    arsenic: 0.002,
    hardness: 320,
    iron: 0.3,
  });

  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const analysis = calculateWQI(metrics);

  const handleExportPDF = () => {
    try {
      exportWaterQualityPDF(metrics, analysis, currentUser, selectedDistrictName);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print();
    }
  };

  const handleInputChange = (field: keyof WaterQualityMetrics, value: number) => {
    setMetrics((prev) => ({
      ...prev,
      [field]: isNaN(value) ? 0 : value,
    }));
  };

  const loadPreset = (preset: (typeof PRESET_REPORTS)[0]) => {
    setMetrics(preset.metrics);
  };

  const resetForm = () => {
    setMetrics({
      tds: 500,
      ph: 7.0,
      fluoride: 0.7,
      nitrate: 20,
      arsenic: 0.002,
      hardness: 200,
      iron: 0.2,
    });
  };

  const handleSendToAI = () => {
    const reportText = `I entered my water test lab parameters:
- TDS: ${metrics.tds} mg/L
- pH: ${metrics.ph}
- Fluoride: ${metrics.fluoride} mg/L
- Nitrate: ${metrics.nitrate} mg/L
- Arsenic: ${metrics.arsenic} mg/L
- Total Hardness: ${metrics.hardness} mg/L
- Iron: ${metrics.iron} mg/L
Calculated WQI: ${analysis.score}/100 (${analysis.status}).
Can you analyze the health risks, whether I strictly need an RO purifier or if another method is better, and what conservation/recharge actions I should take?`;

    onConsultAIWithReport(reportText);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
            <FlaskConical className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Water Quality Lab Test Analyzer
          </h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          Enter your borewell, tap, or lab report numbers to check compliance against <strong>BIS IS 10500:2012</strong> standards. Get real-time health risk warnings and clear recommendations on whether Reverse Osmosis (RO) is genuinely needed.
        </p>
      </div>

      {/* Preset selector bar */}
      <div className="mb-6 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            Quick Test Profiles (Sample Lab Reports):
          </span>
          <button
            onClick={resetForm}
            className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_REPORTS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(preset)}
              className="text-left p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:shadow-sm transition-all text-xs"
            >
              <div className="font-bold text-slate-800 dark:text-slate-100">{preset.name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
              <span>Test Parameters Input</span>
            </h2>
            <span className="text-xs text-slate-400">Values in mg/L (ppm)</span>
          </div>

          {/* Parameter 1: TDS */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Total Dissolved Solids (TDS)
              </label>
              <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                {metrics.tds} ppm
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="3000"
              step="25"
              value={metrics.tds}
              onChange={(e) => handleInputChange('tds', parseFloat(e.target.value))}
              className="w-full accent-sky-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>50 (Spring)</span>
              <span className="text-emerald-600">&lt; 500 (Desirable)</span>
              <span>2000 (Permissible Max)</span>
              <span>3000+ (Saline)</span>
            </div>
          </div>

          {/* Parameter 2: pH */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                pH (Acidity / Alkalinity)
              </label>
              <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                {metrics.ph.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="5.0"
              max="10.0"
              step="0.1"
              value={metrics.ph}
              onChange={(e) => handleInputChange('ph', parseFloat(e.target.value))}
              className="w-full accent-sky-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>5.0 (Acidic)</span>
              <span className="text-emerald-600">6.5 - 8.5 (Safe Range)</span>
              <span>10.0 (Alkaline)</span>
            </div>
          </div>

          {/* Parameter 3: Fluoride */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Fluoride (F)
              </label>
              <span
                className={`font-mono font-bold ${
                  metrics.fluoride > 1.5 ? 'text-rose-600' : 'text-sky-600 dark:text-sky-400'
                }`}
              >
                {metrics.fluoride.toFixed(2)} mg/L
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.05"
              value={metrics.fluoride}
              onChange={(e) => handleInputChange('fluoride', parseFloat(e.target.value))}
              className="w-full accent-sky-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0.0</span>
              <span className="text-emerald-600">1.0 (Desirable)</span>
              <span className="text-rose-600">&gt; 1.5 (Fluorosis Risk)</span>
              <span>4.0</span>
            </div>
          </div>

          {/* Parameter 4: Nitrate */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Nitrate (NO3)
              </label>
              <span
                className={`font-mono font-bold ${
                  metrics.nitrate > 45 ? 'text-rose-600' : 'text-sky-600 dark:text-sky-400'
                }`}
              >
                {metrics.nitrate} mg/L
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="2"
              value={metrics.nitrate}
              onChange={(e) => handleInputChange('nitrate', parseFloat(e.target.value))}
              className="w-full accent-sky-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0</span>
              <span className="text-emerald-600">45 mg/L (Max Safe Limit)</span>
              <span className="text-rose-600">120 (Hazardous)</span>
            </div>
          </div>

          {/* Parameter 5: Arsenic */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>Arsenic (As)</span>
                {metrics.arsenic > 0.01 && (
                  <span className="text-rose-500 font-bold text-[10px] uppercase">⚠️ Carcinogen</span>
                )}
              </label>
              <span
                className={`font-mono font-bold ${
                  metrics.arsenic > 0.01 ? 'text-rose-600' : 'text-sky-600 dark:text-sky-400'
                }`}
              >
                {metrics.arsenic.toFixed(3)} mg/L
              </span>
            </div>
            <input
              type="range"
              min="0.000"
              max="0.080"
              step="0.002"
              value={metrics.arsenic}
              onChange={(e) => handleInputChange('arsenic', parseFloat(e.target.value))}
              className="w-full accent-rose-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0.000 (Ideal)</span>
              <span className="text-emerald-600">0.010 (Strict BIS Limit)</span>
              <span className="text-rose-600">&gt;0.050 (Severe Danger)</span>
            </div>
          </div>

          {/* Parameter 6: Hardness */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Total Hardness (as CaCO3)
              </label>
              <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                {metrics.hardness} mg/L
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="900"
              step="10"
              value={metrics.hardness}
              onChange={(e) => handleInputChange('hardness', parseFloat(e.target.value))}
              className="w-full accent-sky-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>50 (Soft)</span>
              <span className="text-emerald-600">200 (Desirable)</span>
              <span>600 (Permissible)</span>
              <span>900 (Scaling)</span>
            </div>
          </div>

          {/* Parameter 7: Iron */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Iron (Fe)
              </label>
              <span
                className={`font-mono font-bold ${
                  metrics.iron > 1.0 ? 'text-rose-600' : 'text-sky-600 dark:text-sky-400'
                }`}
              >
                {metrics.iron.toFixed(1)} mg/L
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="5.0"
              step="0.1"
              value={metrics.iron}
              onChange={(e) => handleInputChange('iron', parseFloat(e.target.value))}
              className="w-full accent-sky-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>0.0</span>
              <span className="text-emerald-600">1.0 mg/L (Max Safe)</span>
              <span className="text-amber-600">3.0+ (Heavy Staining)</span>
            </div>
          </div>
        </div>

        {/* Diagnosis & Treatment Verdict Panel */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Quality Gauge Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Computed Water Quality Index
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span
                    className={`text-4xl font-extrabold ${
                      analysis.score >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : analysis.score >= 50
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {analysis.score}
                  </span>
                  <span className="text-slate-400 text-sm">/ 100</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                      analysis.score >= 70
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : analysis.score >= 50
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {analysis.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Export PDF & Ask Jal-Doot */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    pdfDownloaded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600'
                  }`}
                  title="Export official BIS-compliant PDF report to your device"
                >
                  {pdfDownloaded ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Saved PDF!</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Export as PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendToAI}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask Jal-Doot to Diagnose</span>
                </button>
              </div>
            </div>

            {/* Verdict Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
              {analysis.score >= 70 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Potability Recommendation:
                </span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">
                  {analysis.potability}
                </span>
              </div>
            </div>
          </div>

          {/* The RO Reality Check (Crucial Hydrogeological Advice) */}
          <div className="bg-sky-50/70 dark:bg-sky-950/40 rounded-3xl p-5 border border-sky-200 dark:border-sky-800 text-xs">
            <h3 className="font-bold text-sm text-sky-950 dark:text-sky-200 flex items-center gap-1.5 mb-2">
              <Activity className="w-4 h-4 text-sky-600" />
              The RO (Reverse Osmosis) Reality Check:
            </h3>

            {metrics.tds <= 350 && metrics.arsenic <= 0.01 && metrics.fluoride <= 1.0 ? (
              <div className="space-y-1.5 text-sky-900 dark:text-sky-300">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  ⚠️ RO is NOT recommended for your water!
                </p>
                <p>
                  Your TDS is {metrics.tds} ppm (below 350 ppm) and heavy metals are absent. Using an RO purifier here will <strong>strip away essential natural minerals (Calcium & Magnesium)</strong> and waste <strong>60-70% of precious groundwater</strong>. A standard gravity carbon filter or UV purifier is sufficient, healthier, and eco-friendly.
                </p>
              </div>
            ) : metrics.tds > 1000 || metrics.arsenic > 0.01 || metrics.fluoride > 1.5 ? (
              <div className="space-y-1.5 text-sky-900 dark:text-sky-300">
                <p className="font-semibold text-rose-700 dark:text-rose-400">
                  🛑 Active Advanced Filtration Mandatory!
                </p>
                <p>
                  Your water exceeds safe physiological thresholds:
                  {metrics.fluoride > 1.5 && ' Fluoride requires Activated Alumina defluoridation.'}
                  {metrics.arsenic > 0.01 && ' Arsenic requires certified Arsenic Removal Filtration.'}
                  {metrics.tds > 1000 && ' High TDS requires Reverse Osmosis with mineral remineralization.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 text-sky-900 dark:text-sky-300">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  ⚖️ Moderate Mineral Content ({metrics.tds} ppm)
                </p>
                <p>
                  Your water is within permissible limits (TDS 500-1000 ppm). You can use a TDS controller RO system or ion-exchange resin softener for hardness, without over-depleting water.
                </p>
              </div>
            )}
          </div>

          {/* Breakdown cards for individual parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Fluoride status */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Fluoride (F)</span>
                <span
                  className={`font-extrabold ${
                    metrics.fluoride > 1.5 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {metrics.fluoride.toFixed(2)} mg/L
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                {metrics.fluoride > 1.5
                  ? 'Exceeds 1.5 mg/L threshold. Risk of dental mottling and skeletal fluorosis.'
                  : 'Within BIS safe limit (1.0 mg/L). Safe for bones and teeth.'}
              </p>
            </div>

            {/* Nitrate status */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Nitrate (NO3)</span>
                <span
                  className={`font-extrabold ${
                    metrics.nitrate > 45 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {metrics.nitrate} mg/L
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                {metrics.nitrate > 45
                  ? 'Exceeds 45 mg/L safe ceiling. Do NOT feed to infants (Blue Baby syndrome risk).'
                  : 'Within safe limit. No severe fertilizer or sewage run-off detected.'}
              </p>
            </div>

            {/* Arsenic status */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Arsenic (As)</span>
                <span
                  className={`font-extrabold ${
                    metrics.arsenic > 0.01 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {metrics.arsenic.toFixed(3)} mg/L
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                {metrics.arsenic > 0.01
                  ? 'CRITICAL: Exceeds 0.01 mg/L (10 ppb) BIS limit. Do not drink raw water!'
                  : 'Safe: Below detection or standard permissible threshold.'}
              </p>
            </div>

            {/* Hardness status */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-800 dark:text-slate-200">Total Hardness</span>
                <span
                  className={`font-extrabold ${
                    metrics.hardness > 600
                      ? 'text-rose-600'
                      : metrics.hardness > 300
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {metrics.hardness} mg/L
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                {metrics.hardness > 600
                  ? 'Severe scaling on plumbing, water heaters, and dry hair/skin.'
                  : 'Moderate to desirable hardness. Good calcium intake.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
