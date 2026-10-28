import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Stethoscope, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  RefreshCw, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  HeartPulse
} from 'lucide-react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const DoctorReports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week
  const [reportData, setReportData] = useState(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');

  const fetchDoctorReport = async () => {
    setLoading(true);
    setError('');
    try {
      // Calculate start and end date based on weekOffset
      const now = new Date();
      now.setDate(now.getDate() + (weekOffset * 7));
      const dayOfWeek = now.getDay();
      const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const start = new Date(now);
      start.setDate(now.getDate() + diffToMon);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const startStr = start.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      const res = await api.get(`/reports/doctor-weekly?start_date=${startStr}&end_date=${endStr}`);
      setReportData(res.data.report);
    } catch (err) {
      console.error('Failed to load doctor report:', err);
      setError('Unable to load clinical report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorReport();
  }, [weekOffset]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600 shrink-0" />
            <span>Doctor Weekly Clinical Report</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Weekly patient consultation volume and disease breakdown categorized by patient age groups
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Week Navigation */}
          <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 sm:px-2.5 text-slate-700 min-w-24 sm:min-w-28 text-center">
              {weekOffset === 0 ? 'Current Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} wks ago`}
            </span>
            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev + 1)}
              disabled={weekOffset >= 0}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={fetchDoctorReport}
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
          {/* Week Banner & Doctor Identification */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-semibold mb-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Week: {reportData.week.start_date} to {reportData.week.end_date}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold">
                Clinical Activity Summary: {reportData.doctor?.name || 'Assigned Physician'}
              </h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-lg">
                Official report generated for medical auditing, patient age-demographic mapping, and disease prevalence.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-4 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border border-white/20 text-center">
                <div className="text-lg sm:text-2xl font-black">{reportData.summary.total_patients_seen}</div>
                <div className="text-[10px] sm:text-[11px] text-emerald-100 font-medium uppercase tracking-wider">Patients</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border border-white/20 text-center">
                <div className="text-lg sm:text-2xl font-black">{reportData.summary.total_consultations}</div>
                <div className="text-[10px] sm:text-[11px] text-emerald-100 font-medium uppercase tracking-wider">Consults</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 border border-white/20 text-center">
                <div className="text-lg sm:text-2xl font-black">{reportData.summary.total_diagnoses_recorded}</div>
                <div className="text-[10px] sm:text-[11px] text-emerald-100 font-medium uppercase tracking-wider">Diagnoses</div>
              </div>
            </div>
          </div>

          {/* Daily Patients Seen Trend (Monday - Sunday) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Patients Seen by Day of Week (Weekly Trend)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-2.5">
              {reportData.daily_trend.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 sm:p-3 rounded-xl border text-center transition-all ${
                    day.patients_count > 0 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                      : 'bg-slate-50 border-slate-200/80 text-slate-500'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-600">{day.day}</div>
                  <div className="text-[10px] text-slate-400 mb-1">{day.date.slice(5)}</div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{day.patients_count}</div>
                  <div className="text-[10px] font-semibold text-slate-500">
                    {day.consultations_count} consult{day.consultations_count === 1 ? '' : 's'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disease Breakdown Categorized by Patient Age Groups */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Disease Breakdown Categorized by Patient Age Groups</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed distribution of diagnosed conditions across Pediatric, Youth, Adult, and Senior age cohorts
                </p>
              </div>

              {/* Age Filter Selector */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSelectedAgeGroup('all')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedAgeGroup === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Groups
                </button>
                {reportData.age_group_breakdown.map(grp => (
                  <button
                    key={grp.key}
                    type="button"
                    onClick={() => setSelectedAgeGroup(grp.key)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      selectedAgeGroup === grp.key ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {grp.label} ({grp.total_patients})
                  </button>
                ))}
              </div>
            </div>

            {/* Age Cohorts Display Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.age_group_breakdown
                .filter(grp => selectedAgeGroup === 'all' || selectedAgeGroup === grp.key)
                .map((cohort) => (
                  <div key={cohort.key} className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <div>
                        <div className="text-xs font-bold text-brand-600 uppercase tracking-wider">{cohort.age_range}</div>
                        <h4 className="text-base font-black text-slate-900">{cohort.label} Cohort</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-black text-slate-900">{cohort.total_patients}</span>
                        <span className="text-xs text-slate-500 block">patients seen</span>
                      </div>
                    </div>

                    {cohort.diseases.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 italic">
                        No recorded diagnoses for this age cohort this week.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Prevalent Diagnoses
                        </div>
                        <div className="space-y-2">
                          {cohort.diseases.map((dis, dIdx) => (
                            <div key={dIdx} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800">{dis.disease_name}</span>
                                <span className="font-black text-slate-900">{dis.case_count} cases ({dis.percentage}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${Math.min(100, parseFloat(dis.percentage))}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default DoctorReports;
