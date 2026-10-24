import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Stethoscope, 
  Users, 
  Clock, 
  FileCheck2, 
  Calendar, 
  ArrowRight, 
  AlertTriangle, 
  Activity,
  CheckCircle2,
  TestTubes
} from 'lucide-react';

export const DoctorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, queueRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/consultations/queue')
      ]);

      setStats(statsRes.data.stats.doctor);
      setQueue(queueRes.data.queue || []);
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading Doctor Dashboard..." />;

  // Filter queue into: 1. Results Ready to review, 2. Waiting for Initial Consultation
  const resultsReadyPatients = queue.filter(v => v.status === 'results_ready');
  const waitingPatients = queue.filter(v => v.status === 'waiting_consultation' || v.status === 'in_consultation');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-brand-600" />
            <span>Doctor Clinical Dashboard</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Consultations, fee-cleared patient queue, laboratory test orders, and prescriptions.
          </p>
        </div>
        <Link
          to="/doctor/queue"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-600/20 transition-all"
        >
          <span>Open Full Patient Queue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Waiting Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting for Doctor</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.waiting_patients || 0}</span>
            <span className="text-xs text-emerald-600 font-semibold ml-2">Fee Cleared</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-500" /> In waiting room
          </p>
        </div>

        {/* Results Awaiting Review */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lab Results Ready</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-purple-700">{stats?.results_ready || 0}</span>
          </div>
          <p className="text-xs text-purple-600 font-semibold mt-2 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Tests completed by Lab Tech
          </p>
        </div>

        {/* Active Consultations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Consultation</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-blue-700">{stats?.in_consultation || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Active medical exams</p>
        </div>

        {/* Follow-up Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointments Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-700">{stats?.appointments_today || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Scheduled follow-ups
          </p>
        </div>
      </div>

      {/* Priority Section: Lab Results Ready for Review */}
      {resultsReadyPatients.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 p-6 rounded-2xl border border-purple-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-purple-950">
                  Completed Diagnostic Results Awaiting Your Review ({resultsReadyPatients.length})
                </h2>
                <p className="text-xs text-purple-700">The laboratory has submitted finalized findings for these patients.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {resultsReadyPatients.map((visit) => (
              <div key={visit.id} className="p-4 rounded-xl bg-white border border-purple-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-brand-700">{visit.patient?.card_number}</span>
                  <StatusBadge status="results_ready" size="xs" />
                </div>
                <div className="font-bold text-slate-900">{visit.patient?.full_name}</div>
                <div className="text-xs text-slate-500">
                  {visit.procedure_requests?.map(pr => pr.category).join(', ')} tests ready
                </div>
                <Link
                  to={`/doctor/consultation/${visit.id}?tab=results`}
                  className="mt-2 block w-full text-center py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  Review Results & Prescribe &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Patients Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Current Doctor Consultation Queue</h2>
            <p className="text-xs text-slate-500">Patients whose consultation fees have been confirmed by Reception</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {queue.length} in queue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Card #</th>
                <th className="px-6 py-3.5">Patient Name</th>
                <th className="px-6 py-3.5">Sex / Age</th>
                <th className="px-6 py-3.5">Allergies</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Consultation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No patients currently waiting in consultation queue.
                  </td>
                </tr>
              ) : (
                queue.map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand-700 text-xs">
                      {visit.patient?.card_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{visit.patient?.full_name}</div>
                      <div className="text-xs text-slate-400">{visit.notes || 'General Consultation'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs capitalize">
                      {visit.patient?.sex}, {visit.patient?.age} yrs
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {visit.patient?.allergies ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          {visit.patient.allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400">NKDA</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={visit.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/doctor/consultation/${visit.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{visit.status === 'in_consultation' ? 'Resume Exam' : 'Start Consultation'}</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
