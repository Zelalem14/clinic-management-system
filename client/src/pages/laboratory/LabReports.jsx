import React, { useState, useEffect } from 'react';
import { 
  TestTubes, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  RefreshCw, 
  Activity, 
  Layers, 
  FileCheck2, 
  Download, 
  Filter, 
  Search, 
  DollarSign, 
  TrendingUp, 
  Percent,
  User,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

export const LabReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  // Filters State
  const [period, setPeriod] = useState('week'); // 'today' | 'week' | 'month' | 'year' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('');

  const fetchLabReport = async (overridePeriod = period, customStart = startDate, customEnd = endDate) => {
    setLoading(true);
    setError('');
    try {
      let query = `?period=${overridePeriod}`;
      if (overridePeriod === 'custom' && customStart && customEnd) {
        query += `&start_date=${customStart}&end_date=${customEnd}`;
      }
      const res = await api.get(`/reports/laboratory-analytics${query}`);
      setReportData(res.data.report);

      // Pre-fill date inputs from response if available
      if (res.data.report?.range) {
        setStartDate(res.data.report.range.start_date);
        setEndDate(res.data.report.range.end_date);
      }
    } catch (err) {
      console.error('Failed to load lab analytics:', err);
      setError('Unable to load laboratory report from database. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabReport(period);
  }, [period]);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Please select both start date and end date.');
      return;
    }
    setPeriod('custom');
    fetchLabReport('custom', startDate, endDate);
  };

  const handlePrint = () => {
    window.print();
  };

  /**
   * Export real database records to CSV (compatible with Excel)
   */
  const handleExportCSV = () => {
    if (!reportData || !reportData.records || !reportData.records.length) {
      alert('No laboratory records available to export for this date range.');
      return;
    }

    const headers = [
      'Request Number',
      'Date Requested',
      'Patient Name',
      'Card Number',
      'Age',
      'Sex',
      'Tests Ordered',
      'Priority',
      'Status',
      'Attending Doctor',
      'Technologist',
      'Clinical Reason',
      'Total Cost (ETB)',
      'Completed At'
    ];

    const rows = reportData.records.map(r => [
      `"${r.request_number || ''}"`,
      `"${r.requested_at ? new Date(r.requested_at).toLocaleDateString() : ''}"`,
      `"${(r.patient_name || '').replace(/"/g, '""')}"`,
      `"${r.card_number || ''}"`,
      `"${r.age || ''}"`,
      `"${r.sex || ''}"`,
      `"${(r.tests || '').replace(/"/g, '""')}"`,
      `"${r.priority || ''}"`,
      `"${r.status || ''}"`,
      `"${(r.doctor_name || '').replace(/"/g, '""')}"`,
      `"${(r.technician_name || '').replace(/"/g, '""')}"`,
      `"${(r.clinical_reason || '').replace(/"/g, '""')}"`,
      `"${r.total_cost || 0}"`,
      `"${r.completed_at ? new Date(r.completed_at).toLocaleString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tena_Clinic_Laboratory_Report_${reportData.range.start_date}_to_${reportData.range.end_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = reportData?.summary || {
    total_requests: 0,
    completed: 0,
    in_progress: 0,
    ready_to_start: 0,
    awaiting_payment: 0,
    cancelled: 0,
    urgent: 0,
    routine: 0,
    completion_rate: 0,
    total_revenue: 0
  };

  const dailyStats = reportData?.daily_stats || [];
  const topTests = reportData?.top_tests || [];
  const technicians = reportData?.technicians || [];
  const records = reportData?.records || [];

  // Filter detailed records table
  const filteredRecords = records.filter(r => {
    const matchesStatus = !tableStatusFilter || r.status === tableStatusFilter;
    if (!matchesStatus) return false;
    if (!tableSearch.trim()) return true;

    const q = tableSearch.toLowerCase();
    return (
      r.patient_name?.toLowerCase().includes(q) ||
      r.card_number?.toLowerCase().includes(q) ||
      r.tests?.toLowerCase().includes(q) ||
      r.doctor_name?.toLowerCase().includes(q) ||
      r.technician_name?.toLowerCase().includes(q) ||
      r.request_number?.toLowerCase().includes(q)
    );
  });

  const maxDailyVolume = Math.max(...dailyStats.map(d => d.total), 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Department of Pathology & Medical Laboratory
            </span>
            <span className="text-xs text-slate-400">Audit & Diagnostic Reporting</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <TestTubes className="w-7 h-7 text-purple-600 shrink-0" />
            <span>Laboratory Workflow & Test Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real database audit reports, turnaround metrics, diagnostic volume, and revenue analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchLabReport(period)}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            title="Export real data to Excel / CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {/* Date Range & Preset Filter Bar (Hidden on print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            <span className="text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Period:</span>
            </span>
            <button
              type="button"
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'today' ? 'bg-purple-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'week' ? 'bg-purple-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Past 7 Days (Weekly)
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'month' ? 'bg-purple-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Past 30 Days (Monthly)
            </button>
            <button
              type="button"
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'year' ? 'bg-purple-700 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Past 365 Days
            </button>
          </div>

          {/* Custom Date Form */}
          <form onSubmit={handleApplyCustomDates} className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Custom:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 bg-white"
              required
            />
            <span className="text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 bg-white"
              required
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Apply Dates
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Calculating laboratory analytics from database..." />
        </div>
      ) : reportData ? (
        <div className="printable-card space-y-6">
          {/* Printable Official Header (Shown during print) */}
          <div className="print-only hidden text-center border-b-2 border-slate-900 pb-4 mb-4">
            <h1 className="text-2xl font-black text-slate-900">TENA SPECIALTY CLINIC & DIAGNOSTIC CENTER</h1>
            <p className="text-xs font-bold text-purple-800 uppercase tracking-wider">
              Department of Pathology & Medical Laboratory • Executive Analytics Report
            </p>
            <p className="text-xs text-slate-600">
              Period: {reportData.range.start_date} to {reportData.range.end_date} • Generated: {new Date().toLocaleString()}
            </p>
          </div>

          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-purple-700 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Audited Period: {reportData.range.start_date} to {reportData.range.end_date}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {summary.total_requests} Diagnostic Orders Processed
              </h2>
              <p className="text-xs text-purple-100 max-w-lg leading-relaxed">
                Total diagnostic test investigations registered and managed through the laboratory workspace during this interval.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-xl sm:text-2xl font-black text-emerald-300">{summary.completed}</div>
                <div className="text-[10px] text-purple-100 font-semibold uppercase">Completed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-xl sm:text-2xl font-black text-blue-300">{summary.in_progress}</div>
                <div className="text-[10px] text-purple-100 font-semibold uppercase">In Progress</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-xl sm:text-2xl font-black text-amber-300">{summary.ready_to_start}</div>
                <div className="text-[10px] text-purple-100 font-semibold uppercase">Paid & Ready</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 text-center">
                <div className="text-xl sm:text-2xl font-black text-rose-300">{summary.awaiting_payment}</div>
                <div className="text-[10px] text-purple-100 font-semibold uppercase">Pending Pay</div>
              </div>
            </div>
          </div>

          {/* KPI Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Diagnostic Completion Rate</span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700">{summary.completion_rate}%</div>
              <p className="text-[11px] text-slate-500 font-medium">{summary.completed} of {summary.total_requests} finalized</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Laboratory Revenue (ETB)</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700">{summary.total_revenue.toFixed(2)} ETB</div>
              <p className="text-[11px] text-slate-500 font-medium">Billed & cleared test revenue</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">STAT / Urgent Ratio</span>
              <div className="text-2xl sm:text-3xl font-black text-rose-700">{summary.urgent}</div>
              <p className="text-[11px] text-slate-500 font-medium">{summary.routine} routine investigations</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Laboratory Queue</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-700">{summary.ready_to_start + summary.in_progress}</div>
              <p className="text-[11px] text-slate-500 font-medium">Awaiting analysis & completion</p>
            </div>
          </div>

          {/* Graphical Volume Breakdown (SVG Chart) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Daily Test Volume & Completion Distribution</span>
                </h3>
                <p className="text-xs text-slate-500">Day-by-day requested vs completed tests across this period</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-200" /> Total</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-600" /> Completed</span>
              </div>
            </div>

            {dailyStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 italic">No daily distribution data for this interval.</div>
            ) : (
              <div className="pt-2">
                <div className="h-44 flex items-end justify-between gap-2 overflow-x-auto px-2 border-b border-slate-200">
                  {dailyStats.map((col, idx) => {
                    const totalH = Math.max(8, Math.round((col.total / maxDailyVolume) * 140));
                    const completedH = Math.max(4, Math.round((col.completed / maxDailyVolume) * 140));

                    return (
                      <div key={idx} className="flex-1 min-w-[38px] flex flex-col items-center gap-1 group relative">
                        <div className="w-full flex items-end justify-center gap-1">
                          <div style={{ height: `${totalH}px` }} className="w-1/2 bg-purple-200 rounded-t-sm" />
                          <div style={{ height: `${completedH}px` }} className="w-1/2 bg-purple-600 rounded-t-sm" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">{col.day}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{col.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Most Frequently Requested Tests */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Most Frequently Requested Diagnostic Tests</span>
            </h3>

            {topTests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No laboratory tests recorded in this period.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {topTests.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{t.test_name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black shrink-0">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 pt-1 border-t border-slate-200/60">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Ordered:</span>
                        <span className="font-bold text-slate-900">{t.request_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Completed:</span>
                        <span className="font-semibold text-emerald-600">{t.completed_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Revenue (ETB):</span>
                        <span className="font-mono font-bold text-purple-700">{t.revenue.toFixed(2)} ETB</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Audit Records Table with Search & Status Filter */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-3">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Detailed Laboratory Audit Log</h3>
                <p className="text-xs text-slate-500">Individual test orders, patient cards, clinical status, and billed fees</p>
              </div>

              {/* Table search & status filter (Hidden on print) */}
              <div className="no-print flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search logs..."
                    className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-900 bg-white"
                  />
                </div>

                <select
                  value={tableStatusFilter}
                  onChange={(e) => setTableStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="results_ready">Results Ready</option>
                  <option value="sent_to_doctor">Sent to Doctor</option>
                  <option value="in_progress">In Progress</option>
                  <option value="payment_approved">Payment Approved</option>
                  <option value="awaiting_payment">Awaiting Payment</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Req # / Priority</th>
                    <th className="py-3 px-4">Patient Details</th>
                    <th className="py-3 px-4">Test Description</th>
                    <th className="py-3 px-4">Attending Doctor</th>
                    <th className="py-3 px-4">Technologist</th>
                    <th className="py-3 px-4">Workflow Status</th>
                    <th className="py-3 px-4 text-right">Fee (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                        No laboratory records matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{r.request_number}</span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            r.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'text-slate-400'
                          }`}>
                            {r.priority}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{r.patient_name}</span>
                          <span className="font-mono text-purple-700 text-[11px]">{r.card_number}</span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <span className="line-clamp-2 font-medium text-slate-800">{r.tests}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{r.clinical_reason}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {r.doctor_name}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {r.technician_name}
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={r.status} />
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {r.total_cost.toFixed(2)} ETB
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LabReports;
