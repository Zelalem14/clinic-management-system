import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import PrintableLabReportModal from '../../components/laboratory/PrintableLabReportModal';
import { 
  TestTubes, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  Stethoscope, 
  Pill, 
  ArrowRight,
  FileText,
  Printer,
  MessageSquare,
  Save,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export const DoctorLabResults = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Printable Report Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Doctor Comment Editing State: { [resultId]: { text, saving, saved } }
  const [commentForms, setCommentForms] = useState({});

  const fetchLabResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/laboratory/requests?category=laboratory');
      const allRequests = res.data.requests || [];
      const completedRequests = allRequests.filter(r => 
        (r.results && r.results.length > 0) || 
        r.status === 'sent_to_doctor' || 
        r.status === 'results_ready' || 
        r.status === 'completed'
      );
      setRequests(completedRequests);

      // Initialize comment state
      const initialComments = {};
      completedRequests.forEach(req => {
        (req.results || []).forEach(res => {
          initialComments[res.id] = {
            text: res.doctor_comments || '',
            saving: false,
            saved: false,
            isEditing: !res.doctor_comments
          };
        });
      });
      setCommentForms(initialComments);
    } catch (err) {
      console.error('Failed to load lab results for doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabResults();
  }, []);

  const handleSaveDoctorComment = async (resultId) => {
    const current = commentForms[resultId];
    if (!current) return;

    setCommentForms(prev => ({
      ...prev,
      [resultId]: { ...prev[resultId], saving: true, saved: false }
    }));

    try {
      await api.post(`/laboratory/results/${resultId}/review`, {
        doctor_comments: current.text
      });

      setCommentForms(prev => ({
        ...prev,
        [resultId]: { ...prev[resultId], saving: false, saved: true, isEditing: false }
      }));

      // Update in local requests state
      setRequests(prev => prev.map(req => ({
        ...req,
        results: (req.results || []).map(r => r.id === resultId ? {
          ...r,
          doctor_comments: current.text,
          doctor_reviewed_at: new Date()
        } : r)
      })));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save doctor comments.');
      setCommentForms(prev => ({
        ...prev,
        [resultId]: { ...prev[resultId], saving: false }
      }));
    }
  };

  const handleOpenReport = (req, res) => {
    setSelectedReport({
      ...res,
      request: req,
      patient: req.patient
    });
    setShowReportModal(true);
  };

  const filteredRequests = requests.filter(r => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      r.patient?.full_name?.toLowerCase().includes(term) ||
      r.patient?.card_number?.toLowerCase().includes(term) ||
      r.results?.some(res => res.test_name?.toLowerCase().includes(term) || res.findings?.toLowerCase().includes(term))
    );
  });

  const getFlagBadge = (flag) => {
    switch (flag) {
      case 'POSITIVE':
      case 'ABNORMAL':
      case 'CRITICAL_HIGH':
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">High / Positive</span>;
      case 'CRITICAL_LOW':
      case 'LOW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">Low</span>;
      case 'INVALID':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">Invalid</span>;
      case 'NORMAL':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Normal</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TestTubes className="w-7 h-7 text-purple-600" />
            <span>Completed Diagnostic Laboratory Results</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review structured parameter values, biological reference intervals, and record clinical review notes.
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
            When tests are completed in the laboratory, findings will automatically display here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredRequests.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
              {/* Patient and Request Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{req.patient?.full_name}</span>
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {req.patient?.card_number}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 capitalize">
                      {req.patient?.sex}, {req.patient?.age} yrs • Clinical Reason: <span className="text-slate-600 font-medium">{req.clinical_reason || 'Routine lab test'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={req.status} />
                  <Link
                    to={`/doctor/consultation/${req.visit_id}?tab=results`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <span>Open Consultation & Prescribe</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Test Results Cards */}
              <div className="space-y-4">
                {req.results && req.results.length > 0 ? (
                  req.results.map((res) => {
                    const structuredParams = res.results_data?.parameters;
                    const hasStructured = Array.isArray(structuredParams) && structuredParams.length > 0;
                    const commentState = commentForms[res.id] || { text: '', saving: false, saved: false, isEditing: true };

                    return (
                      <div key={res.id} className="p-5 rounded-2xl bg-purple-50/20 border border-purple-200 space-y-4">
                        {/* Test Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-bold text-base text-purple-950">{res.test_name}</span>
                              <span className="text-xs text-slate-500 ml-2">
                                Tested by: <strong className="text-slate-700">{res.technician?.name || 'Assefa Zegeye (Lab Tech)'}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500">
                              Completed: {new Date(res.completed_at || Date.now()).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenReport(req, res)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 transition-colors shadow-2xs cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Official Report</span>
                            </button>
                          </div>
                        </div>

                        {/* Structured Parameters Table or Fallback */}
                        {hasStructured ? (
                          <div className="overflow-x-auto rounded-xl border border-purple-100 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-purple-50/60 text-purple-950 uppercase tracking-wider text-[11px] font-bold border-b border-purple-100">
                                <tr>
                                  <th className="px-4 py-2.5">Parameter / Test Analyte</th>
                                  <th className="px-4 py-2.5">Measured Finding</th>
                                  <th className="px-4 py-2.5">Unit</th>
                                  <th className="px-4 py-2.5">Reference Interval</th>
                                  <th className="px-4 py-2.5 text-center">Status Flag</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {structuredParams.map((p, idx) => {
                                  const isAbnormal = p.flag && p.flag !== 'NORMAL';
                                  return (
                                    <tr key={p.id || idx} className={isAbnormal ? 'bg-rose-50/40' : 'hover:bg-slate-50/80'}>
                                      <td className="px-4 py-2.5 font-bold text-slate-900">{p.name}</td>
                                      <td className="px-4 py-2.5 font-mono text-sm font-bold text-slate-900">
                                        {p.value !== undefined && p.value !== '' ? String(p.value) : '—'}
                                      </td>
                                      <td className="px-4 py-2.5 text-slate-500 font-mono">{p.unit || '—'}</td>
                                      <td className="px-4 py-2.5 text-slate-500 font-mono">{p.ref_range_text || '—'}</td>
                                      <td className="px-4 py-2.5 text-center">{getFlagBadge(p.flag)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-3.5 bg-white rounded-xl border border-purple-100 space-y-1">
                            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                              Lab Findings & Measured Values:
                            </span>
                            <p className="text-xs font-mono font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">
                              {res.findings}
                            </p>
                          </div>
                        )}

                        {/* Observations */}
                        {res.observations && (
                          <div className="p-3 bg-white/80 rounded-xl border border-purple-100 text-xs text-slate-700">
                            <span className="font-bold text-slate-900">Technician Observations: </span>
                            <span>{res.observations}</span>
                          </div>
                        )}

                        {/* Doctor's Clinical Review & Notes Section */}
                        <div className="pt-3 border-t border-purple-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <MessageSquare className="w-4 h-4 text-brand-600" />
                              <span>Attending Doctor's Clinical Review & Comments</span>
                              {res.doctor_reviewed_at && (
                                <span className="text-[10px] font-normal text-slate-400">
                                  (Reviewed: {new Date(res.doctor_reviewed_at).toLocaleString()})
                                </span>
                              )}
                            </div>

                            {!commentState.isEditing && res.doctor_comments && (
                              <button
                                type="button"
                                onClick={() => setCommentForms(prev => ({
                                  ...prev,
                                  [res.id]: { ...prev[res.id], isEditing: true }
                                }))}
                                className="text-xs font-semibold text-brand-700 hover:text-brand-900 cursor-pointer"
                              >
                                Edit Comments
                              </button>
                            )}
                          </div>

                          {commentState.isEditing ? (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={commentState.text}
                                onChange={(e) => setCommentForms(prev => ({
                                  ...prev,
                                  [res.id]: { ...prev[res.id], text: e.target.value }
                                }))}
                                placeholder="Enter clinical assessment, diagnostic impression, or prescription notes..."
                                className="flex-1 bg-white rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveDoctorComment(res.id)}
                                disabled={commentState.saving}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{commentState.saving ? 'Saving...' : 'Save Notes'}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-brand-50/50 rounded-xl border border-brand-200 text-xs text-slate-800 leading-relaxed font-medium">
                              {res.doctor_comments || 'No clinical remarks recorded yet.'}
                            </div>
                          )}

                          {commentState.saved && (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Clinical comments saved to patient record!</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
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

export default DoctorLabResults;
