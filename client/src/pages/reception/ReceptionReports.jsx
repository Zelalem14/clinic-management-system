import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Calendar, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  RefreshCw, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const ReceptionReports = () => {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'weekly'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState(null);

  const fetchReceptionReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/reports/reception-analytics?date=${selectedDate}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load reception analytics:', err);
      setError('Unable to load reception analytics. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionReport();
  }, [selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  const changeDateByDays = (delta) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + delta);
    setSelectedDate(cur.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-sky-600 shrink-0" />
            <span>Reception Revenue & Visit Reports</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Dedicated daily revenue tracking in Ethiopian Birr (ETB) and weekly patient visit performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Daily Date Selector */}
          {activeTab === 'daily' && (
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => changeDateByDays(-1)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold px-2 text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => changeDateByDays(1)}
                disabled={selectedDate >= new Date().toISOString().slice(0, 10)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={fetchReceptionReport}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'daily'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Daily Revenue Tracker (ETB)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('weekly')}
          className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'weekly'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span>Weekly Visits & Revenue Summary</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : reportData ? (
        activeTab === 'daily' ? (
          /* TAB 1: DEDICATED DAILY REVENUE TRACKER */
          <div className="space-y-6">
            {/* Daily KPI Highlight Banner */}
            <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date: {reportData.daily_report.date}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {reportData.daily_report.total_revenue_etb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                </h2>
                <p className="text-xs text-sky-100 mt-1 max-w-lg">
                  Total revenue collected & verified for {reportData.daily_report.date} across all payment channels.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/20 text-center">
                  <div className="text-lg sm:text-2xl font-black">{reportData.daily_report.receipts_count}</div>
                  <div className="text-[10px] sm:text-[11px] text-sky-100 font-semibold uppercase tracking-wider">Receipts</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/20 text-center">
                  <div className="text-lg sm:text-2xl font-black">{reportData.daily_report.visits_count}</div>
                  <div className="text-[10px] sm:text-[11px] text-sky-100 font-semibold uppercase tracking-wider">Visits</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/20 text-center">
                  <div className="text-lg sm:text-2xl font-black">{reportData.daily_report.patients_registered}</div>
                  <div className="text-[10px] sm:text-[11px] text-sky-100 font-semibold uppercase tracking-wider">New Reg.</div>
                </div>
              </div>
            </div>

            {/* Payment Method Breakdown (Cash, Telebirr, Bank) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash Collections</span>
                  <span className="text-xl">💵</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-2">
                  {reportData.daily_report.payment_methods.cash.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  {reportData.daily_report.payment_methods.cash.count} transactions processed
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Telebirr Digital</span>
                  <span className="text-xl">📱</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-sky-600 mt-2">
                  {reportData.daily_report.payment_methods.telebirr.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  {reportData.daily_report.payment_methods.telebirr.count} transactions processed
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Transfer</span>
                  <span className="text-xl">🏦</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-purple-600 mt-2">
                  {reportData.daily_report.payment_methods.bank.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} ETB
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  {reportData.daily_report.payment_methods.bank.count} transactions processed
                </div>
              </div>
            </div>

            {/* Allocations Breakdown */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Daily Revenue by Fee Allocation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Card Fees (10-Day Rule)</div>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {reportData.daily_report.fee_allocations.card_fee.toFixed(2)} ETB
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Doctor Consultation Fees</div>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {reportData.daily_report.fee_allocations.consultation_fee.toFixed(2)} ETB
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Laboratory & Procedure Fees</div>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {reportData.daily_report.fee_allocations.procedure_fee.toFixed(2)} ETB
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Other Miscellaneous Fees</div>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {reportData.daily_report.fee_allocations.other.toFixed(2)} ETB
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Transactions Audit Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Daily Approved Payment Receipts</h3>
                  <p className="text-xs text-slate-500">Every approved transaction logged for {reportData.daily_report.date}</p>
                </div>
                <span className="inline-block self-start sm:self-auto text-xs px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-700">
                  {reportData.daily_report.transactions.length} Total Receipts
                </span>
              </div>

              {reportData.daily_report.transactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm italic">
                  No payments approved on {reportData.daily_report.date}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[620px]">
                    <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Receipt #</th>
                        <th className="py-3 px-4">Patient Name</th>
                        <th className="py-3 px-4">Card #</th>
                        <th className="py-3 px-4">Payment Method</th>
                        <th className="py-3 px-4 text-right">Amount (ETB)</th>
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Approved By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {reportData.daily_report.transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.receipt_number}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{t.patient_name}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{t.card_number}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 font-medium">
                              {t.payment_method.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900">
                            {t.amount.toFixed(2)} ETB
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {t.approved_at ? new Date(t.approved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{t.approver}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TAB 2: WEEKLY VISITS & REVENUE SUMMARY */
          <div className="space-y-6">
            {/* Weekly KPI Banner */}
            <div className="bg-gradient-to-r from-teal-600 to-sky-700 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Week Range: {reportData.weekly_report.start_date} to {reportData.weekly_report.end_date}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {reportData.weekly_report.total_revenue_etb.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                </h2>
                <p className="text-xs text-teal-100 mt-1 max-w-lg">
                  Overall revenue collected this week across {reportData.weekly_report.total_visits} patient visits.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/20 text-center">
                  <div className="text-lg sm:text-2xl font-black">{reportData.weekly_report.total_visits}</div>
                  <div className="text-[10px] sm:text-[11px] text-teal-100 font-semibold uppercase tracking-wider">Visits</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/20 text-center">
                  <div className="text-lg sm:text-2xl font-black">{reportData.weekly_report.new_patient_visits}</div>
                  <div className="text-[10px] sm:text-[11px] text-teal-100 font-semibold uppercase tracking-wider">New</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/20 text-center">
                  <div className="text-lg sm:text-2xl font-black">{reportData.weekly_report.return_patient_visits}</div>
                  <div className="text-[10px] sm:text-[11px] text-teal-100 font-semibold uppercase tracking-wider">Return</div>
                </div>
              </div>
            </div>

            {/* Day by Day Weekly Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Weekly Daily Performance Breakdown (Monday – Sunday)</h3>
                <p className="text-xs text-slate-500">Day-by-day tally of patient intake visits and total revenue in ETB</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Day of Week</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Patient Visits</th>
                      <th className="py-3 px-4 text-right">Revenue (ETB)</th>
                      <th className="py-3 px-4 text-right">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reportData.weekly_report.daily_breakdown.map((row, idx) => {
                      const share = reportData.weekly_report.total_revenue_etb > 0
                        ? ((row.revenue_etb / reportData.weekly_report.total_revenue_etb) * 100).toFixed(1)
                        : '0';

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{row.day}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">{row.date}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 font-bold text-slate-900">
                              {row.visits_count} visits
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900">
                            {row.revenue_etb.toFixed(2)} ETB
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-semibold text-slate-600">{share}%</span>
                              <div className="w-14 sm:w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-teal-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, parseFloat(share))}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
};

export default ReceptionReports;
