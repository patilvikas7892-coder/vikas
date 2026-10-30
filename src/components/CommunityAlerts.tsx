import React, { useState, useEffect } from 'react';
import { CommunityAlert, AlertCategory, AlertSeverity, AlertStatus, UserProfile } from '../types';
import { DISTRICT_DATABASE } from '../data/groundwaterData';
import { INITIAL_COMMUNITY_ALERTS } from '../data/communityAlertsData';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  ThumbsUp,
  MessageSquare,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Building,
  User,
  FlaskConical,
  X,
  Share2,
  Check,
  FileDown,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CommunityAlertsProps {
  currentUser?: UserProfile | null;
  onConsultAIWithAlert: (alertContext: string) => void;
  onNavigateToLogin: () => void;
}

const CATEGORIES: (AlertCategory | 'All')[] = [
  'All',
  'Chemical Contamination',
  'Groundwater Depletion',
  'Pipeline & Supply Failure',
  'Borewell Failure',
  'Turbidity & Odor',
  'Biological / Sewage Contamination',
];

const SEVERITIES: (AlertSeverity | 'All')[] = ['All', 'Critical', 'Warning', 'Informational', 'Resolved'];

export const CommunityAlerts: React.FC<CommunityAlertsProps> = ({
  currentUser = null,
  onConsultAIWithAlert,
  onNavigateToLogin,
}) => {
  const [alerts, setAlerts] = useState<CommunityAlert[]>(INITIAL_COMMUNITY_ALERTS);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmittingModalOpen, setIsSubmittingModalOpen] = useState<boolean>(false);
  const [copiedAlertId, setCopiedAlertId] = useState<string | null>(null);

  // Form states for reporting an issue
  const [formTitle, setFormTitle] = useState('');
  const [formDistrict, setFormDistrict] = useState(currentUser?.district || 'Bengaluru Urban');
  const [formLocality, setFormLocality] = useState('');
  const [formCategory, setFormCategory] = useState<AlertCategory>('Chemical Contamination');
  const [formSeverity, setFormSeverity] = useState<AlertSeverity>('Warning');
  const [formDescription, setFormDescription] = useState('');
  const [formTds, setFormTds] = useState('');
  const [formFluoride, setFormFluoride] = useState('');
  const [formNitrate, setFormNitrate] = useState('');
  const [formArsenic, setFormArsenic] = useState('');
  const [formActionAdvised, setFormActionAdvised] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch alerts from API on mount
  useEffect(() => {
    fetch('/api/alerts')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.alerts && data.alerts.length > 0) {
          setAlerts(data.alerts);
        }
      })
      .catch((err) => {
        console.warn('Using local community alerts cache:', err);
      });
  }, []);

  // Sync default form district with user's district
  useEffect(() => {
    if (currentUser?.district) {
      setFormDistrict(currentUser.district);
    }
  }, [currentUser]);

  // Filter alerts
  const filteredAlerts = alerts.filter((item) => {
    const matchesDistrict =
      selectedDistrict === 'All' || item.district.toLowerCase() === selectedDistrict.toLowerCase();
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'All' || item.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    const matchesQuery =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.district.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDistrict && matchesCategory && matchesSeverity && matchesStatus && matchesQuery;
  });

  // Upvote an alert
  const handleUpvote = async (alertId: string) => {
    const userIdentifier = currentUser ? currentUser.id : 'guest-session';

    // Optimistic UI update
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id === alertId) {
          const alreadyUpvoted = a.upvotedBy.includes(userIdentifier);
          return {
            ...a,
            upvotes: alreadyUpvoted ? Math.max(0, a.upvotes - 1) : a.upvotes + 1,
            upvotedBy: alreadyUpvoted
              ? a.upvotedBy.filter((u) => u !== userIdentifier)
              : [...a.upvotedBy, userIdentifier],
          };
        }
        return a;
      })
    );

    try {
      await fetch(`/api/alerts/${alertId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userIdentifier }),
      });
    } catch (e) {
      console.error('Failed to register upvote on server:', e);
    }
  };

  // Submit new alert
  const handleSubmitAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim() || !formLocality.trim() || !formDescription.trim()) {
      setFormError('Please fill in title, specific locality, and incident description.');
      return;
    }

    setIsSubmitting(true);

    const targetDistrictObj = DISTRICT_DATABASE.find(
      (d) => d.district.toLowerCase() === formDistrict.toLowerCase()
    );

    const metricsObj: Record<string, number> = {};
    if (formTds) metricsObj.tds = parseFloat(formTds);
    if (formFluoride) metricsObj.fluoride = parseFloat(formFluoride);
    if (formNitrate) metricsObj.nitrate = parseFloat(formNitrate);
    if (formArsenic) metricsObj.arsenic = parseFloat(formArsenic);

    const payload = {
      title: formTitle.trim(),
      category: formCategory,
      severity: formSeverity,
      district: formDistrict,
      state: targetDistrictObj ? targetDistrictObj.state : currentUser?.state || 'India',
      locality: formLocality.trim(),
      description: formDescription.trim(),
      reportedBy: currentUser ? currentUser.name : 'Concerned Citizen',
      authorRole: currentUser ? currentUser.role : 'citizen',
      authorOrganization: currentUser?.organization,
      metrics: metricsObj,
      actionAdvised: formActionAdvised.trim() || undefined,
    };

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdAlert = await res.json();
        setAlerts((prev) => [createdAlert, ...prev]);
        setIsSubmittingModalOpen(false);
        // Reset form
        setFormTitle('');
        setFormLocality('');
        setFormDescription('');
        setFormTds('');
        setFormFluoride('');
        setFormNitrate('');
        setFormArsenic('');
        setFormActionAdvised('');
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Failed to post alert.');
      }
    } catch (err) {
      console.error('Error posting alert:', err);
      // Fallback local addition
      const fallbackAlert: CommunityAlert = {
        id: `alert-${Date.now()}`,
        ...payload,
        status: 'Open',
        timestamp: 'Just now',
        createdAt: new Date().toISOString(),
        upvotes: 1,
        upvotedBy: [payload.reportedBy],
        verifiedByOfficial: payload.authorRole === 'officer' || payload.authorRole === 'technician',
      };
      setAlerts((prev) => [fallbackAlert, ...prev]);
      setIsSubmittingModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ask AI about this community alert
  const handleAskJalDoot = (alertItem: CommunityAlert) => {
    let context = `I am reviewing a verified community water alert in ${alertItem.district}, ${alertItem.state}:
- Incident: ${alertItem.title}
- Locality: ${alertItem.locality}
- Category: ${alertItem.category} (Severity: ${alertItem.severity})
- Description: ${alertItem.description}`;

    if (alertItem.metrics && Object.keys(alertItem.metrics).length > 0) {
      context += `\n- Reported Lab Metrics: ${JSON.stringify(alertItem.metrics)}`;
    }
    context += `\nWhat immediate health risks exist for residents here, what domestic purification is needed, and what long-term aquifer conservation or government escalation steps should the community take?`;

    onConsultAIWithAlert(context);
  };

  // Export official Incident PDF
  const handleExportAlertPDF = (alertItem: CommunityAlert) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = margin;

    // Header Banner
    doc.setFillColor(185, 28, 28); // Crimson / Alert Red
    doc.rect(0, 0, pageWidth, 28, 'F');
    doc.setFillColor(251, 191, 36); // Amber Stripe
    doc.rect(0, 28, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('JAL-JEEVAN COMMUNITY WATER QUALITY BULLETIN', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('OFFICIAL FIELD INCIDENT & HAZARD NOTIFICATION', margin, 18);
    doc.text('Issued for Local Panchayat, RWAs & Groundwater Authorities', margin, 23);

    y = 38;
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('INCIDENT ID:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(alertItem.id.toUpperCase(), margin + 30, y);

    doc.setFont('helvetica', 'bold');
    doc.text('DATE FILED:', pageWidth - 70, y);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(alertItem.createdAt).toLocaleDateString('en-IN'), pageWidth - 45, y);

    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRICT / STATE:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${alertItem.district}, ${alertItem.state}`, margin + 30, y);

    doc.setFont('helvetica', 'bold');
    doc.text('SPECIFIC LOCALITY:', margin, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(alertItem.locality, margin + 30, y + 5);

    // Boxed Alert Title
    y += 14;
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(153, 27, 27);
    doc.text(`[${alertItem.severity.toUpperCase()}] ${alertItem.title}`, margin + 4, y + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Category: ${alertItem.category} • Status: ${alertItem.status.toUpperCase()} • Confirmed by ${alertItem.upvotes} Citizens`,
      margin + 4,
      y + 15
    );

    // Description Section
    y += 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 76, 129);
    doc.text('FIELD OBSERVATION & COMMUNITY IMPACT REPORT', margin, y);

    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const splitDesc = doc.splitTextToSize(alertItem.description, pageWidth - margin * 2);
    doc.text(splitDesc, margin, y + 2);

    y += splitDesc.length * 4.5 + 6;

    // Lab readings table if present
    if (alertItem.metrics && Object.keys(alertItem.metrics).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 76, 129);
      doc.text('REPORTED WATER QUALITY TEST METRICS', margin, y);

      y += 4;
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('PARAMETER', margin + 3, y + 4.5);
      doc.text('REPORTED VALUE', margin + 60, y + 4.5);
      doc.text('BIS IS 10500:2012 SAFE LIMIT', margin + 110, y + 4.5);

      y += 6;
      Object.entries(alertItem.metrics).forEach(([k, val]) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        const paramUpper = k.toUpperCase();
        doc.text(paramUpper, margin + 3, y + 4.5);
        doc.setFont('helvetica', 'bold');
        doc.text(`${val} ${k === 'ph' ? '' : 'mg/L (ppm)'}`, margin + 60, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(
          k === 'fluoride'
            ? '1.0 mg/L'
            : k === 'arsenic'
            ? '0.01 mg/L'
            : k === 'nitrate'
            ? '45 mg/L'
            : k === 'tds'
            ? '500 mg/L'
            : 'Standard',
          margin + 110,
          y + 4.5
        );
        y += 6;
      });
      y += 4;
    }

    // Official Note & Mitigation
    if (alertItem.officialNote || alertItem.actionAdvised) {
      y += 2;
      doc.setFillColor(240, 253, 250);
      doc.setDrawColor(45, 212, 191);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 118, 110);
      doc.text('OFFICIAL ADVISORY & MITIGATION DIRECTIVE:', margin + 4, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      const directive = alertItem.actionAdvised || alertItem.officialNote || '';
      doc.text(doc.splitTextToSize(directive, pageWidth - margin * 2 - 8), margin + 4, y + 11);

      y += 24;
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 16;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Jal-Jeevan Community Water Network • Reported under Jal Shakti Citizen Watch • Every Drop Counts',
      margin,
      footerY + 2
    );
    doc.text(`Official Notice • Page 1 of 1`, pageWidth - margin - 35, footerY + 2);

    doc.save(`Community_Water_Alert_${alertItem.id}.pdf`);
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
      case 'Warning':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      default:
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300';
    }
  };

  const uniqueDistricts = ['All', ...Array.from(new Set(DISTRICT_DATABASE.map((d) => d.district)))].sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Title & Post Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Community Water Quality & Aquifer Alerts
            </h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Location-based water hazard notifications posted by citizens, lab analysts, and groundwater officers in your area. Report contamination, pipe bursts, and borewell dry-ups in real time.
          </p>
        </div>

        {/* Post Alert CTA button */}
        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-400">Reporting as:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                ({currentUser.district})
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsSubmittingModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Local Alert</span>
          </button>
        </div>
      </div>

      {/* Filter and Location Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by locality, contaminant, or symptom..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* District Selector */}
          <div className="sm:col-span-3">
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="All">All Districts across India</option>
              {currentUser?.district && (
                <option value={currentUser.district}>📍 My District: {currentUser.district}</option>
              )}
              {uniqueDistricts
                .filter((d) => d !== 'All')
                .map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  Severity: {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick shortcut tags for user */}
        {currentUser && (
          <div className="flex items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400">Quick view:</span>
            <button
              type="button"
              onClick={() => setSelectedDistrict(currentUser.district)}
              className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                selectedDistrict.toLowerCase() === currentUser.district.toLowerCase()
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              📍 Alerts in {currentUser.district}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDistrict('All')}
              className={`px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                selectedDistrict === 'All'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              National Feed ({alerts.length})
            </button>
          </div>
        )}
      </div>

      {/* Alerts Feed List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              No Active Alerts in this Selection
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No recent hazard reports found matching your filters. You can post a new report if you notice water quality deterioration.
            </p>
          </div>
        ) : (
          filteredAlerts.map((item) => {
            const hasUserUpvoted = currentUser
              ? item.upvotedBy.includes(currentUser.id)
              : item.upvotedBy.includes('guest-session');

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-rose-300 dark:hover:border-rose-800 transition-all space-y-4"
              >
                {/* Header: Title, Category & Severity badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${getSeverityBadge(
                          item.severity
                        )}`}
                      >
                        {item.severity}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {item.category}
                      </span>
                      {item.verifiedByOfficial && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Official Verified</span>
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'Investigating'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        ● {item.status}
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h2>

                    {/* Location detail */}
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {item.locality} • <strong>{item.district}</strong>, {item.state}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1 self-start whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                {/* Test Metrics Pills if available */}
                {item.metrics && Object.keys(item.metrics).length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      Reported Lab Reading:
                    </span>
                    {item.metrics.fluoride !== undefined && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600">
                        Fluoride: <strong className="text-rose-600">{item.metrics.fluoride} mg/L</strong> (Limit: 1.0)
                      </span>
                    )}
                    {item.metrics.arsenic !== undefined && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600">
                        Arsenic: <strong className="text-rose-600">{item.metrics.arsenic} mg/L</strong> (Limit: 0.01)
                      </span>
                    )}
                    {item.metrics.nitrate !== undefined && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600">
                        Nitrate: <strong className="text-rose-600">{item.metrics.nitrate} mg/L</strong> (Limit: 45)
                      </span>
                    )}
                    {item.metrics.tds !== undefined && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-600">
                        TDS: <strong>{item.metrics.tds} ppm</strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Official Note or Advisory Box */}
                {(item.officialNote || item.actionAdvised) && (
                  <div className="p-3.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-950 dark:text-teal-200 space-y-1">
                    {item.officialNote && (
                      <div>
                        <span className="font-bold text-teal-800 dark:text-teal-300">
                          🛡️ Official Response:
                        </span>{' '}
                        <span>{item.officialNote}</span>
                      </div>
                    )}
                    {item.actionAdvised && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        <strong>Citizen Action:</strong> {item.actionAdvised}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Bar: Reporter info, Upvote Button, Ask Jal-Doot, and Export PDF */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Reported by <strong>{item.reportedBy}</strong>{' '}
                      {item.authorOrganization && `(${item.authorOrganization})`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Upvote button */}
                    <button
                      type="button"
                      onClick={() => handleUpvote(item.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs border ${
                        hasUserUpvoted
                          ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600'
                      }`}
                      title="Verify or confirm you experience this issue too"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${hasUserUpvoted ? 'fill-current' : ''}`} />
                      <span>{item.upvotes} Confirmed</span>
                    </button>

                    {/* PDF Export of Bulletin */}
                    <button
                      type="button"
                      onClick={() => handleExportAlertPDF(item)}
                      className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-1 text-xs transition-colors"
                      title="Export printable community incident PDF for Panchayat / Authority"
                    >
                      <FileDown className="w-3.5 h-3.5 text-rose-600" />
                      <span className="hidden sm:inline">Notice PDF</span>
                    </button>

                    {/* Ask Jal-Doot AI */}
                    <button
                      type="button"
                      onClick={() => handleAskJalDoot(item)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-xs"
                      title="Consult Jal-Doot AI for health impact and mitigation"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ask Jal-Doot</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Post New Community Alert */}
      {isSubmittingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsSubmittingModalOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Report Water Quality or Groundwater Issue
                </h2>
                <p className="text-xs text-slate-500">
                  Visible to neighbors, panchayats, and water engineers across your district.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAlert} className="space-y-4 text-xs">
              {/* Alert Title */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Incident Title / Headline *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Yellowish tap water with sulfur odor / Borewell yield halved"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* District & Locality Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    District *
                  </label>
                  <select
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    {DISTRICT_DATABASE.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district} ({d.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Specific Neighborhood / Ward / Village *
                  </label>
                  <input
                    type="text"
                    value={formLocality}
                    onChange={(e) => setFormLocality(e.target.value)}
                    placeholder="e.g. Sector 14 / Near Panchayat Well #3"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Category & Severity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Incident Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AlertCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Severity Level
                  </label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as AlertSeverity)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  >
                    <option value="Critical">Critical (Immediate Health Threat / Unpotable)</option>
                    <option value="Warning">Warning (Significant Degradation / Overdraft)</option>
                    <option value="Informational">Informational (Observation / Maintenance)</option>
                    <option value="Resolved">Resolved (Issue Mitigated)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Detailed Description & Symptoms *
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe color, taste, odor, number of affected households, pump depth, or date when the issue started..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                />
              </div>

              {/* Optional Test Lab Metrics */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
                  <span>Optional: Water Test Readings (if available)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">TDS (ppm)</span>
                    <input
                      type="number"
                      value={formTds}
                      onChange={(e) => setFormTds(e.target.value)}
                      placeholder="e.g. 1200"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Fluoride (mg/L)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formFluoride}
                      onChange={(e) => setFormFluoride(e.target.value)}
                      placeholder="e.g. 2.1"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Nitrate (mg/L)</span>
                    <input
                      type="number"
                      value={formNitrate}
                      onChange={(e) => setFormNitrate(e.target.value)}
                      placeholder="e.g. 65"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Arsenic (mg/L)</span>
                    <input
                      type="number"
                      step="0.005"
                      value={formArsenic}
                      onChange={(e) => setFormArsenic(e.target.value)}
                      placeholder="e.g. 0.045"
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Recommended Action / Precaution */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Citizen Safety Precaution / Recommended Action
                </label>
                <input
                  type="text"
                  value={formActionAdvised}
                  onChange={(e) => setFormActionAdvised(e.target.value)}
                  placeholder="e.g. Boil water for 20 mins / Avoid drinking from handpump #3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsSubmittingModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Posting Alert...' : 'Publish Community Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
