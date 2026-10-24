import React, { useState } from 'react';
import { DistrictGroundwaterInfo, CgwbCategory } from '../types';
import { DISTRICT_DATABASE } from '../data/groundwaterData';
import { Search, MapPin, AlertTriangle, ShieldCheck, ArrowUpRight, MessageSquare, CloudRain, Droplets, Compass, BarChart3, X } from 'lucide-react';

interface RegionalInspectorProps {
  onSelectDistrictForChat: (district: DistrictGroundwaterInfo) => void;
  onSelectDistrictForRWH: (district: DistrictGroundwaterInfo) => void;
}

export const RegionalInspector: React.FC<RegionalInspectorProps> = ({
  onSelectDistrictForChat,
  onSelectDistrictForRWH,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [activeModalDistrict, setActiveModalDistrict] = useState<DistrictGroundwaterInfo | null>(null);

  const categories: (CgwbCategory | 'All')[] = ['All', 'Over-Exploited', 'Critical', 'Semi-Critical', 'Safe'];
  const zones = ['All', 'North', 'South', 'East', 'West', 'Central', 'North-East'];

  const filteredDistricts = DISTRICT_DATABASE.filter((item) => {
    const matchesSearch =
      item.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyContaminants.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.primaryAquiferType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.cgwbCategory === selectedCategory;
    const matchesZone = selectedZone === 'All' || item.zone === selectedZone;

    return matchesSearch && matchesCategory && matchesZone;
  });

  const getCategoryBadgeClass = (category: CgwbCategory) => {
    switch (category) {
      case 'Over-Exploited':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'Critical':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Semi-Critical':
        return 'bg-yellow-100 dark:bg-yellow-950/80 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800';
      case 'Safe':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getWqiColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title & Introduction */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Regional Groundwater Levels & Aquifer Health
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Real-time hydrogeological records based on Central Ground Water Board (CGWB) Dynamic Assessment and Jal Jeevan Mission field monitoring. Check stage of extraction, water table depths, and critical chemical contamination.
          </p>
        </div>

        {/* Overview Stats Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-500">Over-Exploited:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {DISTRICT_DATABASE.filter((d) => d.cgwbCategory === 'Over-Exploited').length}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-500">Critical / Semi:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {DISTRICT_DATABASE.filter((d) => d.cgwbCategory === 'Critical' || d.cgwbCategory === 'Semi-Critical').length}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-500">Safe:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {DISTRICT_DATABASE.filter((d) => d.cgwbCategory === 'Safe').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by district, state, contaminant (e.g. Fluoride, Arsenic), or rock type..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  Zone: {zone}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 font-medium mr-1">Extraction Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* District Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDistricts.map((district) => {
          return (
            <div
              key={district.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-600 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Name, State, Category */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {district.district}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {district.state} • {district.zone} Region
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getCategoryBadgeClass(
                      district.cgwbCategory
                    )}`}
                  >
                    {district.cgwbCategory}
                  </span>
                </div>

                {/* Extraction Stage Gauge & Water Table Depth */}
                <div className="space-y-3 mb-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Groundwater Extraction:
                      </span>
                      <span
                        className={`font-extrabold ${
                          district.stageOfExtraction > 100
                            ? 'text-rose-600 dark:text-rose-400'
                            : district.stageOfExtraction > 70
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {district.stageOfExtraction}%
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          district.stageOfExtraction > 100
                            ? 'bg-rose-500'
                            : district.stageOfExtraction > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (district.stageOfExtraction / 200) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                      <span>0%</span>
                      <span>Safe (70%)</span>
                      <span>Overdraft (&gt;100%)</span>
                    </div>
                  </div>

                  {/* Depth to water table */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Pre-Monsoon Depth
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {district.waterLevelPreMonsoon} m BGL
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Post-Monsoon Depth
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {district.waterLevelPostMonsoon} m BGL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Quality Metrics Badges */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Water Quality Index:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-xs border ${getWqiColor(district.wqiScore)}`}>
                      WQI {district.wqiScore}/100
                    </span>
                  </div>

                  {/* Contaminants Tags */}
                  <div className="flex flex-wrap gap-1">
                    {district.keyContaminants.map((cont, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        {cont}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveModalDistrict(district)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 flex items-center gap-1"
                >
                  <span>Detailed Specs</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectDistrictForRWH(district)}
                    className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Calculate Rainwater Harvesting for this district"
                  >
                    <CloudRain className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectDistrictForChat(district)}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                    title="Open in Jal-Doot AI"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask Jal-Doot</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDistricts.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-slate-900 dark:text-white">No matching districts found</h3>
          <p className="text-sm text-slate-500 mt-1">
            Try adjusting your search terms or clearing the filter categories.
          </p>
        </div>
      )}

      {/* Detailed Spec Modal */}
      {activeModalDistrict && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveModalDistrict(null)}
              className="absolute right-4 top-4 p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeModalDistrict.district}, {activeModalDistrict.state}
                </h2>
                <p className="text-xs text-slate-500">
                  Aquifer Classification: {activeModalDistrict.primaryAquiferType}
                </p>
              </div>
            </div>

            {/* Status overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Category</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeModalDistrict.cgwbCategory}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Overdraft</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeModalDistrict.stageOfExtraction}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Rainfall</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeModalDistrict.annualRainfallMm} mm/yr
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase text-slate-400 block font-semibold">Recharge Need</span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {activeModalDistrict.rechargePriority}
                </span>
              </div>
            </div>

            {/* Chemical Lab Parameters Table */}
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Water Quality Parameters vs BIS IS 10500:2012 Safe Limits
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5">Recorded Value</th>
                      <th className="p-2.5">BIS Limit</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    <tr>
                      <td className="p-2.5 font-medium">TDS (Total Dissolved Solids)</td>
                      <td className="p-2.5 font-bold">{activeModalDistrict.waterQuality.tds} ppm</td>
                      <td className="p-2.5 text-slate-500">&lt; 500 (Max 2,000)</td>
                      <td className="p-2.5">
                        {activeModalDistrict.waterQuality.tds > 2000 ? (
                          <span className="text-rose-600 font-bold">Unsafe</span>
                        ) : activeModalDistrict.waterQuality.tds > 500 ? (
                          <span className="text-amber-600 font-semibold">Elevated</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Desirable</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Fluoride (F)</td>
                      <td className="p-2.5 font-bold">{activeModalDistrict.waterQuality.fluoride} mg/L</td>
                      <td className="p-2.5 text-slate-500">Max 1.0 (Permissible 1.5)</td>
                      <td className="p-2.5">
                        {activeModalDistrict.waterQuality.fluoride > 1.5 ? (
                          <span className="text-rose-600 font-bold">Hazardous</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Safe</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Nitrate (NO3)</td>
                      <td className="p-2.5 font-bold">{activeModalDistrict.waterQuality.nitrate} mg/L</td>
                      <td className="p-2.5 text-slate-500">Max 45 mg/L</td>
                      <td className="p-2.5">
                        {activeModalDistrict.waterQuality.nitrate > 45 ? (
                          <span className="text-rose-600 font-bold">Excessive</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Normal</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Arsenic (As)</td>
                      <td className="p-2.5 font-bold">{activeModalDistrict.waterQuality.arsenic} mg/L</td>
                      <td className="p-2.5 text-slate-500">Max 0.01 mg/L (10 ppb)</td>
                      <td className="p-2.5">
                        {activeModalDistrict.waterQuality.arsenic > 0.01 ? (
                          <span className="text-rose-600 font-extrabold animate-pulse">
                            Carcinogen Risk
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Within limit</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Total Hardness</td>
                      <td className="p-2.5 font-bold">{activeModalDistrict.waterQuality.hardness} mg/L</td>
                      <td className="p-2.5 text-slate-500">Desirable 200, Max 600</td>
                      <td className="p-2.5">
                        {activeModalDistrict.waterQuality.hardness > 600 ? (
                          <span className="text-rose-600 font-bold">Very Hard</span>
                        ) : activeModalDistrict.waterQuality.hardness > 300 ? (
                          <span className="text-amber-600 font-semibold">Hard</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Moderate</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advisory and Recharge Recommendation */}
            <div className="space-y-3 mb-6 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-1">Official Advisory Note:</span>
                <p>{activeModalDistrict.advisoryNote}</p>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200">
                <span className="font-bold block mb-1">Recommended Aquifer Recharge Technique:</span>
                <p>{activeModalDistrict.recommendedRecharge}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  onSelectDistrictForRWH(activeModalDistrict);
                  setActiveModalDistrict(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5"
              >
                <CloudRain className="w-4 h-4 text-teal-600" />
                <span>RWH Calculator</span>
              </button>
              <button
                onClick={() => {
                  onSelectDistrictForChat(activeModalDistrict);
                  setActiveModalDistrict(null);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ask Jal-Doot about {activeModalDistrict.district}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
