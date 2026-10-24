import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  TestTubes, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  Stethoscope, 
  Pill, 
  ArrowRight,
  FileText
} from 'lucide-react';

export const DoctorLabResults = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLabResults = async () => {
    try {
      setLoading(true);
      // Fetch all laboratory requests that have results
      const res = await api.get('/laboratory/requests?category=laboratory');
      const allRequests = res.data.requests || [];
      // Keep requests that have results or are completed/sent_to_doctor
      const completedRequests = allRequests.filter(r => 
        (r.results && r.results.length > 0) || 
        r.status === 'sent_to_doctor' || 
        r.status === 'results_ready' || 
        r.status === 'completed'
      );
      setRequests(completedRequests);
    } catch (err) {
      console.error('Failed to load lab results for doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabResults();
  }, []);

  const filteredRequests = requests.filter(r => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.patient?.full_name?.toLowerCase().includes(term) ||
      r.patient?.card_number?.toLowerCase().includes(term) ||
      r.results?.some(res => res.test_name?.toLowerCase().includes(term) || res.findings?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TestTubes className="w-7 h-7 text-purple-600" />
            <span>Completed Laboratory Results</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review test findings submitted by Laboratory Technician Assefa Zegeye and prescribe patient medications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/doctor/queue"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Waiting Patients Queue</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient name, card number, or test..."
          className="w-full bg-white rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {/* Results List */}
      {loading ? (
        <LoadingSpinner message="Loading finalized lab results..." />
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
          <Clock className="w-12 h-12 mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">No Finalized Lab Results Found</p>
          <p className="text-xs text-slate-500">
            When Assefa Zegeye completes tests in the laboratory workspace, results will automatically show here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              {/* Patient and Request Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{req.patient?.full_name}</span>
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {req.patient?.card_number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 capitalize">
                      {req.patient?.sex}, {req.patient?.age} yrs • Reason: {req.clinical_reason || 'Routine lab test'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={req.status} />
                  <Link
                    to={`/doctor/consultation/${req.visit_id}?tab=results`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <span>Open Consultation & Prescribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Test Results Cards */}
              <div className="space-y-3">
                {req.results && req.results.length > 0 ? (
                  req.results.map((res) => (
                    <div key={res.id} className="p-4 rounded-xl bg-purple-50/30 border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-sm text-purple-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{res.test_name}</span>
                        </span>
                        <span className="text-slate-500 font-mono">
                          Completed: {new Date(res.completed_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-3.5 bg-white rounded-xl border border-purple-100 space-y-1">
                        <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                          Lab Findings & Measured Values:
                        </span>
                        <p className="text-xs font-mono font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">
                          {res.findings}
                        </p>
                      </div>

                      {res.observations && (
                        <div className="text-xs text-slate-600 px-1">
                          <span className="font-bold text-slate-800">Technician Observations:</span> {res.observations}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500">
                    Results submitted. Click "Open Consultation" above to view full encounter.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorLabResults;
