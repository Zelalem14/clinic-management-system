import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { 
  Radiation, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  Lock, 
  Play, 
  Send,
  Building2
} from 'lucide-react';

export const ProcedureDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(''); // 'ultrasound', 'x_ray', 'procedure'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Findings Entry Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showFindingsModal, setShowFindingsModal] = useState(false);
  const [findingsForm, setFindingsForm] = useState({
    findings: '',
    observations: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Report Modal
  const [reportData, setReportData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchProcedureRequests = async () => {
    try {
      setLoading(true);
      let query = `?search=${encodeURIComponent(search)}`;
      if (categoryFilter) query += `&category=${categoryFilter}`;

      const res = await api.get(`/procedure-requests${query}`);
      // Filter out laboratory (keep ultrasound, x_ray, procedure, other)
      const nonLab = (res.data.requests || []).filter(r => r.category !== 'laboratory');
      setRequests(nonLab);
    } catch (err) {
      console.error('Failed to load procedure requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedureRequests();
  }, [categoryFilter]);

  const handleStartProcedure = async (req) => {
    if (req.status === 'awaiting_payment') {
      alert('Procedure fee must be verified and approved by Reception before commencing.');
      return;
    }

    try {
      await api.put(`/procedure-requests/${req.id}/status`, { status: 'in_progress' });
      fetchProcedureRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update procedure status.');
    }
  };

  const handleOpenFindingsModal = (req) => {
    setSelectedRequest(req);
    setFindingsForm({ findings: '', observations: '' });
    setErrorMsg('');
    setShowFindingsModal(true);
  };

  const handleSubmitFindings = async (e) => {
    e.preventDefault();
    if (!findingsForm.findings) {
      setErrorMsg('Please input examination and procedure findings.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const serviceName = selectedRequest.items?.map(i => i.service?.service_name).join(', ') || `${selectedRequest.category.toUpperCase()} Examination`;
      
      const res = await api.post('/laboratory/results', {
        request_id: selectedRequest.id,
        test_name: serviceName,
        findings: findingsForm.findings,
        observations: findingsForm.observations,
        mark_sent_to_doctor: true
      });

      setShowFindingsModal(false);
      setReportData(res.data.result);
      setShowReportModal(true);
      fetchProcedureRequests();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit findings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Radiation className="w-6 h-6 text-brand-600" />
            <span>Ultrasound, X-Ray & Clinical Procedures</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Diagnostic imaging queues, billable payment verifications, and radiological findings reports.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-lg transition-all ${categoryFilter === '' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Modalities
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('ultrasound')}
            className={`px-3 py-1.5 rounded-lg transition-all ${categoryFilter === 'ultrasound' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Ultrasound Scans
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('x_ray')}
            className={`px-3 py-1.5 rounded-lg transition-all ${categoryFilter === 'x_ray' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Digital X-Ray
          </button>
          <button
            type="button"
            onClick={() => setCategoryFilter('procedure')}
            className={`px-3 py-1.5 rounded-lg transition-all ${categoryFilter === 'procedure' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Minor Procedures / ECG
          </button>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading procedure queue..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Req # / Modality</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Procedure Services</th>
                  <th className="px-6 py-3.5">Clinical Indication</th>
                  <th className="px-6 py-3.5">Payment Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No procedure or imaging requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const isPaid = r.status !== 'awaiting_payment';
                    const isInProgress = r.status === 'in_progress';
                    const isDone = r.status === 'results_ready' || r.status === 'sent_to_doctor' || r.status === 'completed';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-xs text-slate-800">PRC-{r.id}</div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {r.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{r.patient?.full_name}</div>
                          <div className="font-mono text-xs text-brand-700">{r.patient?.card_number}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {r.items?.map(it => (
                              <div key={it.id} className="text-xs font-semibold text-slate-800">
                                {it.service?.service_name} (${parseFloat(it.unit_price).toFixed(2)})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                          {r.clinical_reason || 'Doctor requested investigation'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                          {!isPaid && (
                            <div className="text-[10px] font-bold text-amber-700 mt-1 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Fee required (${parseFloat(r.total_cost).toFixed(2)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {!isPaid ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Awaiting Payment</span>
                            </button>
                          ) : r.status === 'payment_approved' ? (
                            <button
                              type="button"
                              onClick={() => handleStartProcedure(r)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Begin Exam</span>
                            </button>
                          ) : isInProgress ? (
                            <button
                              type="button"
                              onClick={() => handleOpenFindingsModal(r)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Record Findings</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (r.results && r.results.length > 0) {
                                  setReportData({ ...r.results[0], patient: r.patient });
                                  setShowReportModal(true);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>View Report</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Findings Modal */}
      {showFindingsModal && selectedRequest && (
        <Modal
          isOpen={showFindingsModal}
          onClose={() => setShowFindingsModal(false)}
          title={`Record ${selectedRequest.category.toUpperCase()} Examination Findings`}
          subtitle={`Patient: ${selectedRequest.patient?.full_name} (${selectedRequest.patient?.card_number})`}
        >
          <form onSubmit={handleSubmitFindings} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Imaging / Diagnostic Findings
              </label>
              <textarea
                rows="5"
                required
                value={findingsForm.findings}
                onChange={(e) => setFindingsForm({ ...findingsForm, findings: e.target.value })}
                placeholder="Enter sonographic / radiographic observations, measurements, impression..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Technologist / Radiographer Observations
              </label>
              <textarea
                rows="2"
                value={findingsForm.observations}
                onChange={(e) => setFindingsForm({ ...findingsForm, observations: e.target.value })}
                placeholder="Image quality, probe used, views captured..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowFindingsModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Submit Report to Doctor'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Report Modal */}
      {showReportModal && reportData && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title="Diagnostic Imaging & Procedure Report"
          subtitle={`Patient: ${reportData.patient?.full_name}`}
        >
          <div className="space-y-4 printable-card text-xs text-slate-800">
            <div className="text-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">St. Jude Community Clinic</h3>
              <p className="text-[11px] text-slate-500">Diagnostic Imaging & Medical Examination Report</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] p-3 bg-slate-50 rounded-xl">
              <div><span className="text-slate-400">Patient:</span> <span className="font-bold">{reportData.patient?.full_name}</span></div>
              <div><span className="text-slate-400">Card #:</span> <span className="font-mono font-bold">{reportData.patient?.card_number}</span></div>
              <div><span className="text-slate-400">Date:</span> <span>{new Date(reportData.completed_at || Date.now()).toLocaleDateString()}</span></div>
              <div><span className="text-slate-400">Modality:</span> <span className="font-bold">{reportData.test_name}</span></div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">Radiological Findings & Impression:</span>
              <p className="whitespace-pre-line text-slate-800 font-mono text-xs">{reportData.findings}</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Report</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default ProcedureDashboard;
