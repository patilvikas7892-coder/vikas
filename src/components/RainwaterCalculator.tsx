import React, { useState } from 'react';
import { calculateRWH } from '../data/groundwaterData';
import { exportRainwaterPDF } from '../utils/pdfGenerator';
import { CloudRain, Droplets, Layers, Calculator, ShieldCheck, ArrowRight, MessageSquare, Sparkles, Building2, HelpCircle, FileDown, Check } from 'lucide-react';
import { DistrictGroundwaterInfo, UserProfile } from '../types';

interface RainwaterCalculatorProps {
  initialDistrict?: DistrictGroundwaterInfo | null;
  onConsultAIWithRWH: (rwhSummary: string) => void;
  currentUser?: UserProfile | null;
  selectedDistrictName?: string;
}

const CITY_RAINFALL = [
  { name: 'Bengaluru', rainfall: 920, state: 'Karnataka' },
  { name: 'Jaipur', rainfall: 520, state: 'Rajasthan' },
  { name: 'Mumbai', rainfall: 2400, state: 'Maharashtra' },
  { name: 'Delhi NCR', rainfall: 610, state: 'Delhi' },
  { name: 'Chennai', rainfall: 1380, state: 'Tamil Nadu' },
  { name: 'Hyderabad', rainfall: 810, state: 'Telangana' },
  { name: 'Kolkata', rainfall: 1650, state: 'West Bengal' },
  { name: 'Pune', rainfall: 720, state: 'Maharashtra' },
  { name: 'Guwahati', rainfall: 1720, state: 'Assam' },
  { name: 'Kochi', rainfall: 3100, state: 'Kerala' },
];

const ROOF_TYPES = [
  { name: 'Flat Concrete RCC Slab', coeff: 0.85, desc: 'Standard residential terrace with good smooth runoff' },
  { name: 'Sloped Metal / Corrugated Sheet', coeff: 0.90, desc: 'Highest runoff efficiency, minimal water absorption' },
  { name: 'Terracotta / Mangalore Tiles', coeff: 0.75, desc: 'Traditional sloped roofs, slight porosity absorption' },
  { name: 'Paved Interlocking Pavers', coeff: 0.65, desc: 'Ground courtyard and parking runoff' },
];

export const RainwaterCalculator: React.FC<RainwaterCalculatorProps> = ({
  initialDistrict,
  onConsultAIWithRWH,
  currentUser = null,
  selectedDistrictName,
}) => {
  const [areaSqFt, setAreaSqFt] = useState<number>(1200);
  const [annualRainfallMm, setAnnualRainfallMm] = useState<number>(
    initialDistrict ? initialDistrict.annualRainfallMm : 920
  );
  const [selectedRoofIndex, setSelectedRoofIndex] = useState<number>(0);
  const [rechargeTarget, setRechargeTarget] = useState<'borewell' | 'sump'>('borewell');
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  const selectedRoof = ROOF_TYPES[selectedRoofIndex];
  const rwhResults = calculateRWH(areaSqFt, annualRainfallMm, selectedRoof.coeff);

  const handleExportPDF = () => {
    try {
      exportRainwaterPDF(
        areaSqFt,
        annualRainfallMm,
        selectedRoof.name,
        selectedRoof.coeff,
        rwhResults,
        rechargeTarget,
        currentUser,
        selectedDistrictName || (initialDistrict ? `${initialDistrict.district}, ${initialDistrict.state}` : undefined)
      );
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to generate RWH PDF:', err);
      window.print();
    }
  };

  // Financial calculation: ₹800 per 5,000L water tanker
  const tankerEquivalents = Math.round(rwhResults.harvestableLitres / 5000);
  const estimatedSavingsInr = tankerEquivalents * 850;

  const handleSendToAI = () => {
    const summary = `I calculated Rooftop Rainwater Harvesting for my building:
- Terrace Area: ${areaSqFt} sq ft (${Math.round(areaSqFt * 0.0929)} m²)
- Roof Type: ${selectedRoof.name} (Runoff coefficient ${selectedRoof.coeff})
- Annual Rainfall: ${annualRainfallMm} mm/year
- Harvestable Volume: ${rwhResults.harvestableLitres.toLocaleString()} Litres/year (~${tankerEquivalents} water tankers)
- Target: ${rechargeTarget === 'borewell' ? 'Artificial Borewell Aquifer Recharge' : 'Domestic Storage Sump'}
Can you provide the detailed civil design, filter media layers (sand, gravel, charcoal), maintenance schedule, and government subsidies (like Jal Shakti Abhiyan / Atal Bhujal)?`;

    onConsultAIWithRWH(summary);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
            <CloudRain className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Rooftop Rainwater Harvesting & Recharge Calculator
          </h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          Calculate the exact annual rainwater volume your rooftop can capture. Size your percolation pit, filter media layers, or storage sump to replenish depleting local groundwater aquifers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <h2 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
            <span>Harvesting Specifications</span>
            <Calculator className="w-4 h-4 text-slate-400" />
          </h2>

          {/* Roof Area Input */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Rooftop / Catchment Area:
              </label>
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
                {areaSqFt.toLocaleString()} sq. ft{' '}
                <span className="text-slate-400 text-xs font-normal">
                  ({Math.round(areaSqFt * 0.0929)} m²)
                </span>
              </span>
            </div>
            <input
              type="range"
              min="300"
              max="10000"
              step="50"
              value={areaSqFt}
              onChange={(e) => setAreaSqFt(parseInt(e.target.value, 10))}
              className="w-full accent-teal-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex gap-2 mt-2">
              {[600, 1200, 2400, 5000].map((size) => (
                <button
                  key={size}
                  onClick={() => setAreaSqFt(size)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    areaSqFt === size
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {size} sq ft
                </button>
              ))}
            </div>
          </div>

          {/* Annual Rainfall Input */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Annual Rainfall (mm/year):
              </label>
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
                {annualRainfallMm} mm
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="4000"
              step="50"
              value={annualRainfallMm}
              onChange={(e) => setAnnualRainfallMm(parseInt(e.target.value, 10))}
              className="w-full accent-teal-600 h-2 bg-slate-100 dark:bg-slate-700 rounded-lg cursor-pointer"
            />

            {/* City Preset Chips */}
            <div className="mt-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
                Regional Rainfall Presets:
              </span>
              <div className="flex flex-wrap gap-1">
                {CITY_RAINFALL.slice(0, 6).map((city) => (
                  <button
                    key={city.name}
                    onClick={() => setAnnualRainfallMm(city.rainfall)}
                    className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${
                      annualRainfallMm === city.rainfall
                        ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-400'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {city.name} ({city.rainfall} mm)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Roof Surface Material */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs block mb-1.5">
              Catchment Surface Type & Efficiency:
            </label>
            <div className="space-y-1.5">
              {ROOF_TYPES.map((roof, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedRoofIndex(idx)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedRoofIndex === idx
                      ? 'bg-teal-50/80 dark:bg-teal-950/60 border-teal-500 text-teal-950 dark:text-teal-200'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <span className="font-bold block">{roof.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {roof.desc}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400 ml-2">
                    {Math.round(roof.coeff * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Utilization */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs block mb-1.5">
              Recharge Destination:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setRechargeTarget('borewell')}
                className={`p-2.5 rounded-xl border font-semibold flex flex-col items-center gap-1 transition-all ${
                  rechargeTarget === 'borewell'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Borewell Aquifer Recharge</span>
                <span className="text-[10px] font-normal opacity-90">Replenish ground table</span>
              </button>
              <button
                onClick={() => setRechargeTarget('sump')}
                className={`p-2.5 rounded-xl border font-semibold flex flex-col items-center gap-1 transition-all ${
                  rechargeTarget === 'sump'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Domestic Storage Sump</span>
                <span className="text-[10px] font-normal opacity-90">Direct usage for home</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results & Civil Design Specifications */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Harvest Output Card */}
          <div className="bg-gradient-to-br from-teal-500/10 via-sky-500/10 to-emerald-500/10 dark:from-teal-950/40 dark:to-sky-950/40 rounded-3xl p-6 border border-teal-200 dark:border-teal-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  Total Annual Harvestable Volume
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                    {rwhResults.harvestableLitres.toLocaleString()}
                  </span>
                  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                    Litres / Year
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    pdfDownloaded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700'
                  }`}
                  title="Export official RWH Engineering Blueprint PDF"
                >
                  {pdfDownloaded ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Saved PDF!</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>Export as PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendToAI}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 active:scale-95 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Get Step-by-Step Plan</span>
                </button>
              </div>
            </div>

            {/* Impact Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-teal-200/60 dark:border-teal-800/60">
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-teal-100 dark:border-teal-900">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Family Water Days
                </span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                  {rwhResults.householdDays} Days
                </span>
                <span className="text-[10px] text-slate-500 block">
                  drinking & cooking for 4
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-teal-100 dark:border-teal-900">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Water Tankers Saved
                </span>
                <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
                  ~{tankerEquivalents} Tankers
                </span>
                <span className="text-[10px] text-slate-500 block">5,000L capacity each</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-teal-100 dark:border-teal-900 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Estimated Savings
                </span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{estimatedSavingsInr.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">per monsoon season</span>
              </div>
            </div>
          </div>

          {/* Recommended Filter & Recharge Pit Specifications */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Recommended Multi-Layer Filter Bed Architecture</span>
            </div>

            <p className="text-slate-600 dark:text-slate-400">
              For a <strong>{areaSqFt} sq. ft</strong> roof, build a filtration pit of approx{' '}
              <strong>
                1.5m (L) × 1.5m (W) × 2.0m (Depth) = {rwhResults.volumeCubicMeters} m³
              </strong>{' '}
              filled with standard graded media:
            </p>

            {/* Filter Layers Illustration */}
            <div className="space-y-1.5 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-slate-50 dark:bg-slate-900">
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 flex justify-between items-center font-medium">
                <span>Top Layer (First-Flush Diverter + Mesh)</span>
                <span className="text-[10px] uppercase font-bold text-sky-700">Traps Leaves & Silt</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 flex justify-between items-center font-medium">
                <span>Coarse River Sand Layer (400 mm thickness)</span>
                <span className="text-[10px] uppercase font-bold text-amber-700">Fine Particulate Filtration</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex justify-between items-center font-medium">
                <span>Activated Charcoal / Carbon Layer (150 mm)</span>
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Odor & Organic Adsorption</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 flex justify-between items-center font-medium">
                <span>Gravel / Jelly Aggregate (20mm - 40mm)</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700">Structural Flow Bed</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 flex justify-between items-center font-medium">
                <span>Base Boulder Bed (50mm - 100mm)</span>
                <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-300">Aquifer Injection Chamber</span>
              </div>
            </div>

            {/* Borewell safety advisory */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs">
              <span className="font-bold block mb-1">⚠️ Crucial Borewell Recharge Rule:</span>
              Never inject raw rooftop runoff directly down the casing pipe without the multi-layer sand-gravel filter pit and a first-flush drain! Unfiltered runoff will silt the aquifer fractures and permanently ruin your borewell.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
