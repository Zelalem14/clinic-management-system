import React, { useState, useEffect } from 'react';
import { 
  TestTubes, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  RefreshCw, 
  TrendingUp, 
  Activity,
  Layers,
  FileCheck2
} from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const LabReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  const fetchLabReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/laboratory-analytics');
      setReportData(res.data.report);
    } catch (err) {
      console.error('Failed to load lab analytics:', err);
      setError('Unable to load laboratory report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <TestTubes className="w-7 h-7 text-purple-600" />
            <span>Laboratory Workflow & Test Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Weekly summary of tests processed, status distribution, and most requested diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLabReport}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
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
          <LoadingSpinner />
        </div>
      ) : reportData ? (
        <>
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Period: {reportData.range.start_date} to {reportData.range.end_date}</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                {reportData.summary.total_requests} Laboratory Orders
              </h2>
              <p className="text-xs text-purple-100 mt-1">
                Total diagnostic test orders managed and processed during this period.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3.5 py-2.5 border border-white/20 text-center">
                <div className="text-xl font-black text-emerald-300">{reportData.summary.completed}</div>
                <div className="text-[10px] text-purple-100 font-semibold uppercase">Completed</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3.5 py-2.5 border border-white/20 text-center">
                <div className="text-xl font-black text-amber-300">{reportData.summary.in_progress}</div>
                <div className="text-[10px] text-purple-100 font-semibold uppercase">In Progress</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3.5 py-2.5 border border-white/20 text-center">
                <div className="text-xl font-black text-sky-300">{reportData.summary.ready_to_start}</div>
                <div className="text-[10px] text-purple-100 font-semibold uppercase">Paid & Ready</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3.5 py-2.5 border border-white/20 text-center">
                <div className="text-xl font-black text-rose-300">{reportData.summary.awaiting_payment}</div>
                <div className="text-[10px] text-purple-100 font-semibold uppercase">Pending Pay</div>
              </div>
            </div>
          </div>

          {/* Top Requested Tests */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <span>Most Frequently Ordered Laboratory Tests</span>
            </h3>

            {reportData.top_tests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No laboratory tests recorded in this period.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {reportData.top_tests.map((t, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>TEST #{idx + 1}</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">{t.count} orders</span>
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">
                      {t.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders Log Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Laboratory Orders</h3>
                <p className="text-xs text-slate-500">Real-time status of diagnostic procedures</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Card #</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Tech</th>
                    <th className="py-3 px-4">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reportData.recent_requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.request_number}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.patient_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{r.card_number}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{r.technician}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default LabReports;
