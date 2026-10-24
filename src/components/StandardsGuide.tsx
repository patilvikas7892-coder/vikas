import React, { useState } from 'react';
import { BIS_STANDARDS } from '../data/groundwaterData';
import { BookOpen, ShieldCheck, AlertTriangle, Layers, Award, Droplets, ChevronDown, ChevronUp } from 'lucide-react';

export const StandardsGuide: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Why should I NOT use Reverse Osmosis (RO) if my TDS is below 300-400 ppm?',
      a: 'RO works on semi-permeable membranes that remove 90-95% of all dissolved minerals. When your water already has a healthy, balanced TDS (under 400 ppm), an RO unit strips away vital calcium and magnesium essential for cardiac and bone health, leaving behind demineralized acidic water. Furthermore, traditional domestic RO systems waste 2 to 3 liters of clean groundwater for every 1 liter of purified water produced!',
    },
    {
      q: 'What is the difference between Pre-Monsoon and Post-Monsoon water table depth?',
      a: 'Pre-Monsoon (typically May-June in India) measures the water table at its seasonal lowest point, after summer evaporation and agricultural pumping. Post-Monsoon (October-November) reflects the recharge from rainfall. A healthy aquifer shows a significant water rise post-monsoon (often 3 to 8 meters). If the post-monsoon recovery is minimal, it signifies that extraction exceeds annual replenishment.',
    },
    {
      q: 'How does high Fluoride affect the human body?',
      a: 'Fluoride in modest amounts (0.5 - 1.0 mg/L) strengthens dental enamel. However, continuous ingestion above 1.5 mg/L causes Dental Fluorosis (irreversible yellow/brown mottling of teeth in children) and crippling Skeletal Fluorosis in adults (severe joint stiffness, calcification of ligaments, and curvature of the spine). It cannot be removed by boiling; only Activated Alumina or specialized RO membranes can remove it.',
    },
    {
      q: 'Why does boiling NOT remove Nitrate or Arsenic?',
      a: 'Boiling kills bacteria, viruses, and parasites. However, chemical contaminants like Nitrates, Arsenic, Fluoride, and Heavy Metals do not evaporate. In fact, boiling water causes evaporation of pure water vapor, which INCREASES the concentration of nitrates and arsenic in the remaining water!',
    },
    {
      q: 'What are the Central Ground Water Board (CGWB) categorization thresholds?',
      a: 'CGWB assesses groundwater assessment units (blocks/taluks) into four stages: Safe (<70% extraction of annual extractable resources), Semi-Critical (70% - 90%), Critical (90% - 100%), and Over-Exploited (>100%, where annual withdrawal exceeds annual recharge, leading to long-term water table decline).',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
            <BookOpen className="w-5 h-5" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Groundwater Science, BIS Standards & Conservation Framework
          </h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          Scientific benchmarks established by the Bureau of Indian Standards (BIS IS 10500:2012), Central Ground Water Board (CGWB), and the Ministry of Jal Shakti.
        </p>
      </div>

      {/* BIS IS 10500:2012 Standards Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              BIS IS 10500:2012 Drinking Water Quality Specifications
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold border border-emerald-200">
            Official National Benchmark
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Parameter</th>
                <th className="p-3">Acceptable Limit</th>
                <th className="p-3">Permissible Limit (in absence of alternate source)</th>
                <th className="p-3">Physiological / Health Impact</th>
                <th className="p-3">Scientific Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {Object.entries(BIS_STANDARDS).map(([key, item]) => (
                <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {item.name}
                  </td>
                  <td className="p-3 font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {item.desirableLimit} {item.unit}
                  </td>
                  <td className="p-3 font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                    {item.permissibleLimit} {item.unit}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 min-w-[200px]">
                    {item.healthImpact}
                  </td>
                  <td className="p-3 text-sky-800 dark:text-sky-300 min-w-[200px] font-medium">
                    {item.treatmentMethod}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Hydrogeology Diagram / Cross Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aquifer Cross Section Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Aquifer Cross-Section & Over-Pumping Dynamics
            </h3>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Groundwater resides inside rock fissures and sand pores. Excessive pumping causes localized <strong>cones of depression</strong>, drying out neighbor shallow wells and drawing in deeper mineral contaminants like fluoride or arsenic.
          </p>

          {/* SVG Diagram of Aquifers */}
          <div className="w-full bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex justify-center">
            <svg
              viewBox="0 0 500 240"
              className="w-full h-auto max-h-56 select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Sky / Clouds */}
              <rect x="0" y="0" width="500" height="40" fill="#e0f2fe" opacity="0.6" />
              <text x="20" y="25" fill="#0369a1" fontSize="11" fontWeight="bold">
                Precipitation / Rainwater Catchment
              </text>

              {/* Surface Soil Layer */}
              <rect x="0" y="40" width="500" height="25" fill="#a3e635" opacity="0.4" />
              <text x="20" y="56" fill="#365314" fontSize="10" fontWeight="bold">
                Ground Surface / Topsoil (Recharge Infiltration)
              </text>

              {/* Unconfined Shallow Aquifer */}
              <rect x="0" y="65" width="500" height="60" fill="#bae6fd" opacity="0.5" />
              {/* Water Table Line */}
              <line
                x1="0"
                y1="75"
                x2="180"
                y2="75"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <path
                d="M 180 75 Q 250 115 320 75 L 500 75"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <text x="330" y="72" fill="#0369a1" fontSize="9" fontWeight="bold">
                Water Table Level
              </text>
              <text x="200" y="105" fill="#b91c1c" fontSize="9" fontWeight="bold">
                ▼ Cone of Depression
              </text>

              {/* Impermeable Clay / Bedrock Confining Layer */}
              <rect x="0" y="125" width="500" height="25" fill="#64748b" opacity="0.6" />
              <text x="20" y="141" fill="#0f172a" fontSize="10" fontWeight="bold">
                Impermeable Aquitard / Hard Bedrock
              </text>

              {/* Confined Deep Fractured Aquifer */}
              <rect x="0" y="150" width="500" height="90" fill="#38bdf8" opacity="0.3" />
              <text x="20" y="180" fill="#075985" fontSize="10" fontWeight="bold">
                Deep Confined Aquifer (Slow fossil recharge; 500 - 1,200 ft)
              </text>

              {/* Borewell Pipe Illustration */}
              <line x1="250" y1="40" x2="250" y2="210" stroke="#1e293b" strokeWidth="4" />
              <circle cx="250" cy="40" r="5" fill="#0284c7" />
              <text x="260" y="50" fill="#0f172a" fontSize="10" fontWeight="bold">
                Over-pumped Borewell
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <strong className="block text-slate-800 dark:text-slate-200">Shallow Aquifer:</strong>
              Replenished seasonally by rains; prone to surface biological and nitrate run-off.
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <strong className="block text-slate-800 dark:text-slate-200">Deep Fractures:</strong>
              Takes centuries to recharge; prone to deep geogenic Fluoride and Arsenic.
            </div>
          </div>
        </div>

        {/* National Missions & Conservation Programs */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              National Groundwater Initiatives & Subsidies
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200">
              <h4 className="font-bold text-teal-800 dark:text-teal-300">
                1. Atal Bhujal Yojana (ATAL JAL)
              </h4>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                World Bank assisted ₹6,000 Crore scheme incentivizing community-led water security plans and demand-side management in priority water-stressed gram panchayats across Gujarat, Haryana, Karnataka, MP, Maharashtra, Rajasthan, and UP.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-200">
              <h4 className="font-bold text-sky-800 dark:text-sky-300">
                2. Jal Jeevan Mission (Har Ghar Jal)
              </h4>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Providing safe piped potable tap water to every rural household with mandatory source sustainability measures (greywater recycling, source augmentation, and village water testing kits).
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200">
              <h4 className="font-bold text-indigo-800 dark:text-indigo-300">
                3. Mission Amrit Sarovar
              </h4>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                Rejuvenation and construction of at least 75 water bodies (Amrit Sarovars) in every district of India to dramatically boost natural percolation and groundwater recharge.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
          Frequently Asked Questions on Groundwater & Water Safety
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-4 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 transition-colors"
              >
                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                  {faq.q}
                </span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {openFaq === idx && (
                <div className="p-4 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
