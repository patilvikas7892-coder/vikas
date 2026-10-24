import { jsPDF } from 'jspdf';
import { WaterQualityMetrics, UserProfile, DailyWaterLog } from '../types';

export function exportWaterQualityPDF(
  metrics: WaterQualityMetrics,
  analysis: { score: number; status: string; potability: string },
  user: UserProfile | null,
  districtName?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Header Banner Background
  doc.setFillColor(15, 76, 129); // Deep Hydro Blue
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Cyan Stripe
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('JAL-JEEVAN GROUNDWATER INTELLIGENCE PORTAL', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('NATIONAL GROUNDWATER QUALITY ASSESSMENT & POTABILITY REPORT', margin, 18);
  doc.text('Compliant with Bureau of Indian Standards (BIS IS 10500:2012)', margin, 23);

  // Reference & Date Info
  y = 38;
  const reportRef = `JJ-WQI-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORT REFERENCE:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(reportRef, margin + 35, y);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE GENERATED:', pageWidth - 80, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, pageWidth - 45, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('TEST OWNER:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(user ? `${user.name} (${user.roleTitle})` : 'Registered Citizen / Borewell Owner', margin + 35, y);

  doc.setFont('helvetica', 'bold');
  doc.text('LOCATION / DISTRICT:', pageWidth - 80, y);
  doc.setFont('helvetica', 'normal');
  doc.text(districtName || (user ? `${user.district}, ${user.state}` : 'Local Domestic Source'), pageWidth - 45, y);

  // Summary Banner Box
  y += 10;
  const isSafe = analysis.score >= 70;
  const isModerate = analysis.score >= 50 && analysis.score < 70;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 3, 3, 'FD');

  // WQI Score circle/box
  if (isSafe) {
    doc.setFillColor(220, 252, 231); // Light Green
    doc.setDrawColor(34, 197, 94);
  } else if (isModerate) {
    doc.setFillColor(254, 243, 199); // Light Amber
    doc.setDrawColor(245, 158, 11);
  } else {
    doc.setFillColor(254, 226, 226); // Light Rose
    doc.setDrawColor(239, 68, 68);
  }
  doc.roundedRect(margin + 4, y + 3, 36, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(isSafe ? 22 : isModerate ? 180 : 220, isSafe ? 101 : isModerate ? 83 : 38, isSafe ? 52 : isModerate ? 9 : 38);
  doc.text(`${analysis.score}/100`, margin + 11, y + 12);

  doc.setFontSize(7.5);
  doc.text(`WQI: ${analysis.status.toUpperCase()}`, margin + 8, y + 17);

  // Verdict text
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('POTABILITY VERDICT & DRINKING SAFETY:', margin + 45, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const splitPotability = doc.splitTextToSize(analysis.potability, pageWidth - margin * 2 - 50);
  doc.text(splitPotability, margin + 45, y + 15);

  // Parameters Table Section
  y += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 76, 129);
  doc.text('1. LABORATORY PARAMETER EVALUATION AGAINST BIS IS 10500:2012', margin, y);

  y += 4;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 7, pageWidth - margin, y + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('PARAMETER', margin + 3, y + 5);
  doc.text('TEST VALUE', margin + 55, y + 5);
  doc.text('BIS DESIRABLE', margin + 85, y + 5);
  doc.text('BIS PERMISSIBLE', margin + 120, y + 5);
  doc.text('STATUS & HEALTH REMARKS', margin + 150, y + 5);

  y += 7;

  // Table rows
  const rows = [
    {
      param: 'Total Dissolved Solids (TDS)',
      value: `${metrics.tds} mg/L`,
      desirable: '< 500 mg/L',
      permissible: '2,000 mg/L',
      status: metrics.tds > 2000 ? 'EXCEEDED' : metrics.tds > 500 ? 'ELEVATED' : 'SAFE',
      note: metrics.tds > 2000 ? 'Saline, GI distress' : metrics.tds < 300 ? 'Naturally balanced (No RO)' : 'Acceptable',
    },
    {
      param: 'pH (Acidity / Alkalinity)',
      value: metrics.ph.toFixed(1),
      desirable: '6.5 - 8.5',
      permissible: 'No Relaxation',
      status: metrics.ph < 6.5 || metrics.ph > 8.5 ? 'EXCEEDED' : 'SAFE',
      note: metrics.ph < 6.5 ? 'Acidic/Corrosive' : metrics.ph > 8.5 ? 'Alkaline/Bitter' : 'Neutral Range',
    },
    {
      param: 'Fluoride (F)',
      value: `${metrics.fluoride.toFixed(2)} mg/L`,
      desirable: '1.0 mg/L',
      permissible: '1.5 mg/L',
      status: metrics.fluoride > 1.5 ? 'HAZARDOUS' : metrics.fluoride > 1.0 ? 'PERMISSIBLE' : 'SAFE',
      note: metrics.fluoride > 1.5 ? 'Fluorosis Risk (Bones/Teeth)' : 'Enamel Safe',
    },
    {
      param: 'Nitrate (NO3)',
      value: `${metrics.nitrate} mg/L`,
      desirable: '45 mg/L',
      permissible: 'No Relaxation',
      status: metrics.nitrate > 45 ? 'HAZARDOUS' : 'SAFE',
      note: metrics.nitrate > 45 ? 'Methemoglobinemia risk (Infants)' : 'Safe agricultural level',
    },
    {
      param: 'Arsenic (As)',
      value: `${metrics.arsenic.toFixed(3)} mg/L`,
      desirable: '0.01 mg/L (10 ppb)',
      permissible: 'No Relaxation',
      status: metrics.arsenic > 0.01 ? 'CRITICAL DANGER' : 'SAFE',
      note: metrics.arsenic > 0.01 ? 'Class 1 Carcinogen Alert' : 'Within toxicological limit',
    },
    {
      param: 'Total Hardness (CaCO3)',
      value: `${metrics.hardness} mg/L`,
      desirable: '200 mg/L',
      permissible: '600 mg/L',
      status: metrics.hardness > 600 ? 'VERY HARD' : metrics.hardness > 300 ? 'MODERATE' : 'OPTIMAL',
      note: metrics.hardness > 600 ? 'Severe limescale & hair dryness' : 'Mineral beneficial',
    },
    {
      param: 'Dissolved Iron (Fe)',
      value: `${metrics.iron.toFixed(1)} mg/L`,
      desirable: '1.0 mg/L',
      permissible: 'No Relaxation',
      status: metrics.iron > 1.0 ? 'ELEVATED' : 'SAFE',
      note: metrics.iron > 1.0 ? 'Reddish staining & metallic taste' : 'Acceptable',
    },
  ];

  rows.forEach((r, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(r.param, margin + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(r.value, margin + 55, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(r.desirable, margin + 85, y + 5);
    doc.text(r.permissible, margin + 120, y + 5);

    if (r.status.includes('HAZARDOUS') || r.status.includes('DANGER') || r.status.includes('EXCEEDED')) {
      doc.setTextColor(190, 18, 60);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(`${r.status}: ${r.note}`, margin + 150, y + 5, { maxWidth: 38 });

    y += 7.5;
  });

  // Section 2: RO Reality Check & Purification Prescription
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 76, 129);
  doc.text('2. TREATMENT & PURIFICATION DIRECTIVE (THE RO REALITY CHECK)', margin, y);

  y += 4;
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(12, 74, 110);
  doc.setFont('helvetica', 'bold');

  if (metrics.tds <= 350 && metrics.arsenic <= 0.01 && metrics.fluoride <= 1.0) {
    doc.text('RECOMMENDATION: DO NOT INSTALL A TRADITIONAL REVERSE OSMOSIS (RO) SYSTEM', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const roAdvice =
      'Your water TDS is ' +
      metrics.tds +
      ' mg/L (well below 350 mg/L) and toxic heavy metals are absent. An RO filter will unnecessarily strip out healthy dietary Calcium & Magnesium, leaving behind mineral-deficient acidic water while wasting 65-70% of groundwater. Use a multi-stage gravity carbon filter or UV/UF purifier.';
    doc.text(doc.splitTextToSize(roAdvice, pageWidth - margin * 2 - 8), margin + 4, y + 10);
  } else if (metrics.arsenic > 0.01 || metrics.fluoride > 1.5 || metrics.tds > 1000) {
    doc.text('RECOMMENDATION: ACTIVE REVERSE OSMOSIS OR SPECIALIZED REMOVAL MANDATORY', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const roAdvice =
      'Your water contains parameters exceeding safe biological thresholds. For Fluoride > 1.5 mg/L, employ Activated Alumina defluoridation. For Arsenic > 0.01 mg/L, install certified Arsenic Removal Plants (ARP). For high TDS, use an RO system with remineralization cartridge and recycle the reject water for flushing or gardening.';
    doc.text(doc.splitTextToSize(roAdvice, pageWidth - margin * 2 - 8), margin + 4, y + 10);
  } else {
    doc.text('RECOMMENDATION: MODERATE MINERAL FILTRATION OR WATER SOFTENING', margin + 4, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const roAdvice =
      'Parameters are within BIS permissible bounds. If scaling is noticed on boilers and faucets, consider an ion-exchange resin water softener. A micro-filtration or TDS-controlled RO system is suitable.';
    doc.text(doc.splitTextToSize(roAdvice, pageWidth - margin * 2 - 8), margin + 4, y + 10);
  }

  // Section 3: Recharge & Conservation Recommendation
  y += 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 76, 129);
  doc.text('3. SOURCE SUSTAINABILITY & AQUIFER RECHARGE MANDATE', margin, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const rechargeText =
    'Pumping groundwater without artificial recharge causes progressive drawdown and worsens mineral leaching. Implement Rooftop Rainwater Harvesting (RWH) with a dual-chamber sand-gravel filter pit to inject clean rainwater directly into your unconfined aquifer during the monsoon.';
  doc.text(doc.splitTextToSize(rechargeText, pageWidth - margin * 2), margin, y);

  // Footer & Disclaimer
  const footerY = pageHeight - 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Disclaimer: This analysis report is generated for advisory guidance based on user-entered test metrics and BIS IS 10500:2012 benchmarks.',
    margin,
    footerY + 2
  );
  doc.text(
    'Jal-Jeevan Mission • Ministry of Jal Shakti • Central Ground Water Board (CGWB) • Every Drop Counts',
    margin,
    footerY + 6
  );
  doc.text(`Page 1 of 1`, pageWidth - margin - 15, footerY + 6);

  // Download PDF
  const filename = `Water_Quality_Report_${reportRef}.pdf`;
  doc.save(filename);
}

export function exportRainwaterPDF(
  areaSqFt: number,
  annualRainfallMm: number,
  roofTypeName: string,
  roofCoeff: number,
  results: {
    harvestableLitres: number;
    householdDays: number;
    volumeCubicMeters: number;
    co2EquivalentOffsetKg: number;
  },
  rechargeTarget: 'borewell' | 'sump',
  user: UserProfile | null,
  districtName?: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Header Banner Background
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Cyan Stripe
  doc.setFillColor(56, 189, 248);
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('JAL-JEEVAN GROUNDWATER CONSERVATION INITIATIVE', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('ROOFTOP RAINWATER HARVESTING & ARTIFICIAL RECHARGE PLAN', margin, 18);
  doc.text('Aligned with Atal Bhujal Yojana & Jal Shakti Abhiyan Guidelines', margin, 23);

  // Metadata
  y = 38;
  const projectRef = `RWH-PRJ-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PLAN REFERENCE:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(projectRef, margin + 35, y);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE GENERATED:', pageWidth - 80, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, pageWidth - 45, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICANT / OWNER:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(user ? `${user.name} (${user.roleTitle})` : 'Property Owner / Community Group', margin + 35, y);

  doc.setFont('helvetica', 'bold');
  doc.text('LOCATION / DISTRICT:', pageWidth - 80, y);
  doc.setFont('helvetica', 'normal');
  doc.text(districtName || (user ? `${user.district}, ${user.state}` : 'Local Catchment Area'), pageWidth - 45, y);

  // Big Impact Banner Box
  y += 10;
  doc.setFillColor(240, 253, 250); // Light Teal
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(13, 148, 136);
  doc.text('ESTIMATED ANNUAL HARVESTABLE POTENTIAL:', margin + 6, y + 8);

  doc.setFontSize(22);
  doc.setTextColor(15, 118, 110);
  doc.text(`${results.harvestableLitres.toLocaleString()} LITRES / YEAR`, margin + 6, y + 18);

  const tankersSaved = Math.round(results.harvestableLitres / 5000);
  const financialSavings = tankersSaved * 850;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Equivalent to ~${tankersSaved} Water Tankers (5,000L each) • Saves approx ₹${financialSavings.toLocaleString()} per monsoon`,
    margin + 6,
    y + 24
  );

  // Section 1: Catchment Engineering Specifications
  y += 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 148, 136);
  doc.text('1. CATCHMENT & PRECIPITATION SPECIFICATIONS', margin, y);

  y += 4;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - margin * 2, 26, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 26, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Terrace Catchment Area:', margin + 5, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`${areaSqFt.toLocaleString()} sq. ft (${Math.round(areaSqFt * 0.0929)} sq. meters)`, margin + 55, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Average Annual Rainfall:', margin + 5, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${annualRainfallMm} mm per annum`, margin + 55, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Roof Material & Runoff Coeff:', margin + 5, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`${roofTypeName} (Efficiency: ${Math.round(roofCoeff * 100)}%)`, margin + 55, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('Primary Recharge Destination:', margin + 5, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(
    rechargeTarget === 'borewell'
      ? 'Direct Borewell Fracture Recharge (Groundwater Aquifer Injection)'
      : 'Domestic Storage Sump for Direct Use',
    margin + 55,
    y + 24
  );

  // Section 2: Civil Filter Bed Design
  y += 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 148, 136);
  doc.text('2. CIVIL PERCOLATION PIT & MULTI-LAYER FILTER BED DESIGN', margin, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Recommended Pit Dimensions for your roof: 1.5m Length × 1.5m Width × 2.0m Depth (Volume: ${results.volumeCubicMeters} m³).`,
    margin,
    y + 2
  );

  y += 7;
  const layers = [
    { layer: '1. Inlet Chamber & First-Flush Diverter', desc: 'Diverts the first 15-20 mins of rainfall containing accumulated roof dust and bird droppings.' },
    { layer: '2. Fine Sand Layer (350-400 mm)', desc: 'Coarse graded river sand to trap colloidal suspended silt and particulate matter.' },
    { layer: '3. Activated Carbon / Charcoal (150 mm)', desc: 'Adsorbs dissolved organic impurities, eliminates odor, and inhibits microbial growth.' },
    { layer: '4. Gravel / Aggregate Layer (20-40 mm)', desc: 'Structural stone jelly bed facilitating high velocity filtration and preventing sand compaction.' },
    { layer: '5. Boulder Foundation Bed (60-100 mm)', desc: 'Bottom injection chamber surrounding slotted PVC casing pipe leading to the unconfined aquifer.' },
  ];

  layers.forEach((l) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 7.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 118, 110);
    doc.text(l.layer, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(l.desc, margin + 65, y + 5, { maxWidth: pageWidth - margin * 2 - 70 });

    y += 9;
  });

  // Section 3: Technical Borewell Advisory
  y += 4;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 83, 9);
  doc.text('CRUCIAL BOREWELL INJECTION SAFETY WARNING:', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(69, 26, 3);
  const warn =
    'NEVER connect rooftop drain pipes directly to an operating borewell without the filtration bed and first-flush diverter! Direct unfiltered injection will clog deep aquifer fractures with mud and permanently destroy your borewell casing.';
  doc.text(doc.splitTextToSize(warn, pageWidth - margin * 2 - 8), margin + 4, y + 10);

  // Footer & Disclaimer
  const footerY = pageHeight - 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Jal-Jeevan Mission • Atal Bhujal Yojana • Central Ground Water Board (CGWB) • Catch the Rain Initiative',
    margin,
    footerY + 2
  );
  doc.text(`Official Conservation Engineering Blueprint • Reference: ${projectRef}`, margin, footerY + 6);
  doc.text(`Page 1 of 1`, pageWidth - margin - 15, footerY + 6);

  // Save PDF
  const filename = `Rainwater_Harvesting_Plan_${projectRef}.pdf`;
  doc.save(filename);
}

export function exportFootprintPDF(
  dailyLog: DailyWaterLog,
  weeklyAverageLPCD: number,
  user: UserProfile | null,
  statusLabel: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  // Header Banner Background: Indigo / Deep Blue
  doc.setFillColor(30, 58, 138); // Indigo 900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Cyan Stripe
  doc.setFillColor(6, 182, 212); // Cyan 500
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('JAL-JEEVAN CITIZEN WATER FOOTPRINT AUDIT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('HOUSEHOLD CONSUMPTION, TRENDS & CONSERVATION TARGETS', margin, 18);
  doc.text('Benchmarked against CPHEEO (135 LPCD) & Jal Jeevan Mission (55 LPCD)', margin, 23);

  // Metadata
  y = 38;
  const auditRef = `WFP-${Date.now().toString().slice(-6)}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('AUDIT ID:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(auditRef, margin + 25, y);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE:', pageWidth - 70, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, pageWidth - 45, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('CITIZEN:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(user ? `${user.name} (${user.roleTitle})` : 'Conscious Citizen / Domestic Consumer', margin + 25, y);

  doc.setFont('helvetica', 'bold');
  doc.text('HOUSEHOLD SIZE:', pageWidth - 70, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${dailyLog.householdSize} Member(s)`, pageWidth - 45, y);

  // Big Impact Banner Box
  y += 10;
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(14, 116, 144);
  doc.text('RECORDED CONSUMPTION METRICS:', margin + 6, y + 8);

  doc.setFontSize(20);
  doc.setTextColor(12, 74, 110);
  doc.text(`${dailyLog.perCapitaLitres} LPCD`, margin + 6, y + 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total Household Today: ${dailyLog.totalLitres} Litres • 7-Day Rolling Average: ${weeklyAverageLPCD} Litres/person/day`,
    margin + 6,
    y + 24
  );

  // Status badge on right side of banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  if (dailyLog.perCapitaLitres <= 90) {
    doc.setTextColor(22, 101, 52); // Green
  } else if (dailyLog.perCapitaLitres <= 140) {
    doc.setTextColor(30, 64, 175); // Blue
  } else {
    doc.setTextColor(185, 28, 28); // Red
  }
  doc.text(`Rating: ${statusLabel.toUpperCase()}`, pageWidth - margin - 60, y + 14);

  // Section 1: Detailed Daily Activity Breakdown
  y += 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('1. DAILY ACTIVITY-WISE WATER CONSUMPTION BREAKDOWN', margin, y);

  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 7, pageWidth - margin, y + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ACTIVITY', margin + 3, y + 5);
  doc.text('TOTAL LITRES', margin + 70, y + 5);
  doc.text('SHARE %', margin + 105, y + 5);
  doc.text('ECO-EFFICIENCY BENCHMARK & SAVINGS TIP', margin + 130, y + 5);

  y += 7;

  const acts = [
    { name: 'Bathing & Showering', litres: dailyLog.activities.bathing, tip: 'Bucket bath uses 20L vs 75L for 8-min shower.' },
    { name: 'Toilet Flushing', litres: dailyLog.activities.flushing, tip: 'Dual-flush toilets save 6-8L per single flush.' },
    { name: 'Kitchen, Cooking & Drinking', litres: dailyLog.activities.cookingDrinking, tip: 'Wash vegetables in a bowl rather than running tap.' },
    { name: 'Dishwashing', litres: dailyLog.activities.dishwashing, tip: 'Turn off tap while soaping dishes saves 25L/meal.' },
    { name: 'Laundry / Clothes Washing', litres: dailyLog.activities.laundry, tip: 'Run front-load washing machines with full loads.' },
    { name: 'House Mopping & Cleaning', litres: dailyLog.activities.cleaning, tip: 'Use recycled RO reject water for floor mopping.' },
    { name: 'Gardening & Vehicle Washing', litres: dailyLog.activities.gardeningCar, tip: 'Drip irrigation for plants & bucket wash for cars.' },
    { name: 'RO Filter Reject Waste', litres: dailyLog.activities.roRejectLoss, tip: 'Capture RO reject stream into a bucket for domestic chores.' },
  ];

  acts.forEach((a, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');
    }

    const share = dailyLog.totalLitres > 0 ? Math.round((a.litres / dailyLog.totalLitres) * 100) : 0;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(a.name, margin + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.text(`${a.litres} L`, margin + 70, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${share}%`, margin + 105, y + 5);

    doc.text(a.tip, margin + 130, y + 5, { maxWidth: pageWidth - margin * 2 - 132 });

    y += 7.5;
  });

  // Section 2: National Standards Comparison
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('2. NATIONAL PER-CAPITA CONSUMPTION BENCHMARKS', margin, y);

  y += 4;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text('• Jal Jeevan Mission (Rural Service Benchmark):', margin + 5, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.text('55 Litres Per Capita per Day (LPCD)', margin + 85, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.text('• CPHEEO / MoHUA (Indian Urban Standard):', margin + 5, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.text('135 Litres Per Capita per Day (LPCD)', margin + 85, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.text('• Your Current Household Standing:', margin + 5, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(dailyLog.perCapitaLitres <= 135 ? 22 : 185, dailyLog.perCapitaLitres <= 135 ? 101 : 28, dailyLog.perCapitaLitres <= 135 ? 52 : 28);
  doc.text(
    `${dailyLog.perCapitaLitres} LPCD (${
      dailyLog.perCapitaLitres <= 135
        ? `${135 - dailyLog.perCapitaLitres} LPCD BELOW Urban Ceiling - Water Efficient!`
        : `${dailyLog.perCapitaLitres - 135} LPCD ABOVE Urban Ceiling - Conservation Potential Available`
    })`,
    margin + 85,
    y + 17
  );

  // Footer & Disclaimer
  const footerY = pageHeight - 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Jal-Jeevan Citizen Water Audit • Catch the Rain Initiative • Central Ground Water Board (CGWB) • Every Drop Counts',
    margin,
    footerY + 2
  );
  doc.text(`Official Water Footprint Audit • Reference: ${auditRef}`, margin, footerY + 6);
  doc.text(`Page 1 of 1`, pageWidth - margin - 15, footerY + 6);

  // Save PDF
  const filename = `Water_Footprint_Audit_${auditRef}.pdf`;
  doc.save(filename);
}
