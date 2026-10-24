import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Stethoscope, 
  Search, 
  Clock, 
  AlertTriangle, 
  FileCheck2, 
  User, 
  Activity,
  ArrowRight
} from 'lucide-react';

export const DoctorQueue = () => {
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/consultations/queue');
      setQueue(res.data.queue || []);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const filtered = queue.filter(v => {
    const matchesFilter = filter ? v.status === filter : true;
    const matchesSearch = search
      ? v.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        v.patient?.card_number?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-brand-600" />
            <span>Consultation Waiting Queue</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time queue of patients whose consultation fees have been confirmed by Reception.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === '' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All In Queue ({queue.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('results_ready')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'results_ready' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Results Ready
          </button>
          <button
            type="button"
            onClick={() => setFilter('waiting_consultation')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'waiting_consultation' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Waiting Doctor
          </button>
          <button
            type="button"
            onClick={() => setFilter('in_consultation')}
            className={`px-3 py-1.5 rounded-lg transition-all ${filter === 'in_consultation' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            In Progress
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter queue by patient name or card #..."
          className="w-full bg-white rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Checking queue status..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Card #</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Reason for Visit</th>
                  <th className="px-6 py-3.5">Allergies</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Consultation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No patients currently matching this filter in the waiting queue.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-brand-700">
                        {v.patient?.card_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{v.patient?.full_name}</div>
                        <div className="text-xs text-slate-400 capitalize">{v.patient?.sex}, {v.patient?.age} yrs</div>
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs text-slate-700">
                        {v.notes || 'Outpatient Consultation'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {v.patient?.allergies ? (
                          <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {v.patient.allergies}
                          </span>
                        ) : (
                          <span className="text-slate-400">NKDA</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={v.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/doctor/consultation/${v.id}${v.status === 'results_ready' ? '?tab=results' : ''}`}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                            v.status === 'results_ready'
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-brand-600 hover:bg-brand-700 text-white'
                          }`}
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>{v.status === 'results_ready' ? 'Review Lab Results' : v.status === 'in_consultation' ? 'Resume Exam' : 'Consult Now'}</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorQueue;
