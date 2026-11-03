import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PrintableLabReportModal from '../../components/laboratory/PrintableLabReportModal';
import { 
  TestTubes, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Lock, 
  Activity, 
  Calendar, 
  ArrowRight, 
  Printer, 
  RefreshCw, 
  FileSpreadsheet, 
  Sliders, 
  FileText,
  User,
  ShieldCheck,
  TrendingUp,
  Percent,
  Layers
} from 'lucide-react';

export const LabHome = () => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [error, setError] = useState('');

  // Printable Report Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchLabSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/reports/laboratory-summary');
      setSummaryData(res.data);
    } catch (err) {
      console.error('Failed to load lab summary:', err);
      setError('Unable to load laboratory overview. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabSummary();
  }, []);

  const handleOpenReport = (resultItem) => {
    setSelectedReport(resultItem);
    setShowReportModal(true);
  };

  if (loading && !summaryData) {
    return <LoadingSpinner message="Loading laboratory dashboard overview..." />;
  }

  const summary = summaryData?.summary || {
    today_orders: 0,
    today_completed: 0,
    awaiting_payment: 0,
    ready_to_test: 0,
    in_progress: 0,
    overall_completed: 0,
    total_requests: 0,
    urgent_active: 0,
    completion_rate: 0
  };

  const weeklyTrend = summaryData?.weekly_trend || [];
  const urgentRequests = summaryData?.urgent_requests || [];
  const recentResults = summaryData?.recent_results || [];

  // Calculate highest count for trend chart scaling
  const maxVolume = Math.max(...weeklyTrend.map(d => d.total), 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Department of Pathology & Medical Laboratory
            </span>
            <span className="text-xs font-mono text-slate-400">Tena Specialty Clinic</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <TestTubes className="w-7 h-7 text-purple-600 shrink-0" />
            <span>Laboratory Management Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time activity overview, daily workload volume, urgent clinical orders, and diagnostic test metrics.
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchLabSummary}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            to="/laboratory/requests"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <TestTubes className="w-4 h-4" />
            <span>Go to Lab Queue &rarr;</span>
          </Link>

          <Link
            to="/laboratory/templates"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Templates</span>
          </Link>

          <Link
            to="/laboratory/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Analytics</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STAT / Urgent Alert Banner if any urgent active */}
      {summary.urgent_active > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-rose-900">
                {summary.urgent_active} STAT / Urgent Test Order{summary.urgent_active === 1 ? '' : 's'} Requiring Immediate Attention!
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Doctors have flagged emergency patient diagnostic tests. Prioritize processing these specimens in the laboratory queue.
              </p>
            </div>
          </div>

          <Link
            to="/laboratory/requests"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
          >
            <span>Process Urgent Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Today Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Tests</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{summary.today_orders}</div>
          <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1">
            <span>{summary.today_completed} completed today</span>
          </div>
        </div>

        {/* Card 2: Ready to Test */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ready to Test</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">{summary.ready_to_test}</div>
          <div className="text-[11px] text-emerald-800 font-semibold">Paid & fee cleared</div>
        </div>

        {/* Card 3: In Progress / Drafts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700">{summary.in_progress}</div>
          <div className="text-[11px] text-blue-800 font-semibold">Under active analysis</div>
        </div>

        {/* Card 4: Awaiting Payment */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Pay</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">{summary.awaiting_payment}</div>
          <div className="text-[11px] text-amber-800 font-semibold">Locked at reception</div>
        </div>

        {/* Card 5: Urgent Active */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">STAT / Urgent</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${summary.urgent_active > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {summary.urgent_active}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold">High priority orders</div>
        </div>

        {/* Card 6: Completion Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completion</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700">{summary.completion_rate}%</div>
          <div className="text-[11px] text-slate-500 font-medium">{summary.overall_completed} total completed</div>
        </div>
      </div>

      {/* Visual Activity & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Diagnostic Test Trend Chart (SVG) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>7-Day Laboratory Test Volume Trend</span>
              </h2>
              <p className="text-xs text-slate-500">Daily diagnostic orders requested and completed over the past week</p>
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              Live Real-Time Data
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="pt-2">
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-200">
              {weeklyTrend.map((col, idx) => {
                const totalHeight = Math.max(8, Math.round((col.total / maxVolume) * 160));
                const completedHeight = Math.max(4, Math.round((col.completed / maxVolume) * 160));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-md">
                      {col.day} ({col.date}): {col.total} Total, {col.completed} Done
                    </div>

                    <div className="w-full max-w-[40px] flex items-end justify-center gap-1">
                      {/* Total Bar */}
                      <div 
                        style={{ height: `${totalHeight}px` }} 
                        className="w-1/2 bg-purple-200 hover:bg-purple-300 rounded-t-md transition-all relative"
                      >
                        {col.total > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-600">
                            {col.total}
                          </span>
                        )}
                      </div>
                      {/* Completed Bar */}
                      <div 
                        style={{ height: `${completedHeight}px` }} 
                        className="w-1/2 bg-purple-600 hover:bg-purple-700 rounded-t-md transition-all relative"
                      />
                    </div>

                    <span className="text-[11px] font-bold text-slate-700 mt-2">{col.day}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{col.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-200" />
                <span className="text-slate-600 font-medium">Total Test Requests</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-600" />
                <span className="text-slate-600 font-bold">Completed & Certified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workload Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Queue Status Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Current operational stage of all diagnostic requests</p>

            <div className="space-y-4 mt-5 text-xs">
              {/* Completed */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed / Transmitted</span>
                  </span>
                  <span className="font-bold text-slate-900">{summary.overall_completed}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${summary.completion_rate}%` }}
                  />
                </div>
              </div>

              {/* In Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>In Progress / Drafts</span>
                  </span>
                  <span className="font-bold text-slate-900">{summary.in_progress}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${summary.total_requests > 0 ? (summary.in_progress / summary.total_requests) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Ready to Test */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-purple-700 flex items-center gap-1.5">
                    <Play className="w-3.5 h-3.5" />
                    <span>Ready for Specimen (Paid)</span>
                  </span>
                  <span className="font-bold text-slate-900">{summary.ready_to_test}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${summary.total_requests > 0 ? (summary.ready_to_test / summary.total_requests) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Awaiting Payment */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-amber-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Waiting for Reception Payment</span>
                  </span>
                  <span className="font-bold text-slate-900">{summary.awaiting_payment}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${summary.total_requests > 0 ? (summary.awaiting_payment / summary.total_requests) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Link
              to="/laboratory/requests"
              className="w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-purple-200"
            >
              <span>Manage Tests in Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Completed Laboratory Results Feed */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recent Completed Laboratory Diagnostics</span>
            </h2>
            <p className="text-xs text-slate-500">Verified clinical results transmitted to attending doctors</p>
          </div>

          <Link
            to="/laboratory/reports"
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            <span>View Full Analytics & Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentResults.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No completed diagnostic laboratory results recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentResults.map((res) => (
              <div 
                key={res.id} 
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-2xs transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{res.test_name}</span>
                      <span className="text-xs text-purple-700 font-semibold">
                        Patient: {res.patient?.full_name} ({res.patient?.card_number})
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Final
                    </span>
                  </div>

                  <div className="mt-2 p-2.5 bg-white rounded-lg border border-slate-200/80 font-mono text-xs text-slate-800 line-clamp-2">
                    {res.findings}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Verified: {res.completed_at ? new Date(res.completed_at).toLocaleDateString() : 'Today'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenReport(res)}
                    className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable Report Modal */}
      {showReportModal && selectedReport && (
        <PrintableLabReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportData={selectedReport}
        />
      )}
    </div>
  );
};

export default LabHome;
