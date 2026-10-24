import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { 
  TestTubes, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Send, 
  Printer, 
  Lock, 
  Play, 
  Building2,
  Calendar,
  Activity
} from 'lucide-react';

export const LabDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Result Entry Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({
    test_name: '',
    findings: '',
    results_data: '',
    observations: ''
  });
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [resultError, setResultError] = useState('');

  // Printable Report Modal State
  const [reportData, setReportData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchLabRequests = async () => {
    try {
      setLoading(true);
      let query = `?category=laboratory&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const res = await api.get(`/laboratory/requests${query}`);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load lab requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabRequests();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLabRequests();
  };

  const handleStartTest = async (req) => {
    if (req.status === 'awaiting_payment') {
      alert('Cannot start test: The required fee has not been approved by Reception yet.');
      return;
    }

    try {
      await api.post(`/laboratory/start/${req.id}`);
      fetchLabRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start test.');
    }
  };

  const handleOpenResultModal = (req) => {
    setSelectedRequest(req);
    const testNames = req.items?.map(it => it.service?.service_name).join(', ') || 'Laboratory Examination';
    setResultForm({
      test_name: testNames,
      findings: '',
      results_data: '',
      observations: ''
    });
    setResultError('');
    setShowResultModal(true);
  };

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!resultForm.findings) {
      setResultError('Please enter clinical findings / test parameter values.');
      return;
    }

    setIsSubmittingResult(true);
    setResultError('');

    try {
      const res = await api.post('/laboratory/results', {
        request_id: selectedRequest.id,
        test_name: resultForm.test_name,
        findings: resultForm.findings,
        results_data: resultForm.results_data || resultForm.findings,
        observations: resultForm.observations,
        mark_sent_to_doctor: true
      });

      setShowResultModal(false);
      setReportData(res.data.result);
      setShowReportModal(true);

      fetchLabRequests();
    } catch (err) {
      setResultError(err.response?.data?.message || 'Failed to submit test results.');
    } finally {
      setIsSubmittingResult(false);
    }
  };

  const handleViewReport = (req) => {
    if (req.results && req.results.length > 0) {
      setReportData({
        ...req.results[0],
        request: req,
        patient: req.patient
      });
      setShowReportModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TestTubes className="w-6 h-6 text-purple-600" />
            <span>Laboratory Diagnostics Workspace</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track test orders, verify payment approvals before testing, record findings, and transmit results to doctors.
          </p>
        </div>

        {/* Workflow Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === '' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tests
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('awaiting_payment')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'awaiting_payment' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔒 Waiting for Reception Payment
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('payment_approved')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'payment_approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✅ Ready to Test (Paid)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'in_progress' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Progress
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('sent_to_doctor')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'sent_to_doctor' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Results Sent to Doctor
          </button>
        </div>
      </div>

      {/* Reception Approval Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block text-amber-950">Reception Payment Approval Rule:</span>
          The laboratory technician can only start billable tests after payment is verified and approved by the Receptionist. Tests awaiting payment are locked.
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by card number or patient name..."
            className="w-full bg-white rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl"
        >
          Search
        </button>
      </form>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading laboratory queue..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Req # / Priority</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Tests Requested</th>
                  <th className="px-6 py-3.5">Clinical Reason</th>
                  <th className="px-6 py-3.5">Payment & Workflow</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No laboratory test requests found for this filter.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const isPaid = r.status !== 'awaiting_payment';
                    const isInProgress = r.status === 'in_progress';
                    const isCompleted = r.status === 'results_ready' || r.status === 'sent_to_doctor' || r.status === 'completed';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono font-bold text-xs text-slate-800">REQ-{r.id}</div>
                          {r.priority === 'urgent' ? (
                            <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                              STAT / URGENT
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Routine</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{r.patient?.full_name}</div>
                          <div className="font-mono text-xs text-brand-700">{r.patient?.card_number}</div>
                          <div className="text-[11px] text-slate-400 capitalize">{r.patient?.sex}, {r.patient?.age} yrs</div>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          <div className="space-y-1">
                            {r.items?.map(it => (
                              <div key={it.id} className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                {it.service?.service_name}
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                          <p className="line-clamp-2">{r.clinical_reason || 'Doctor routine workup'}</p>
                          <div className="text-[10px] text-slate-400 mt-1">Doctor: {r.doctor?.name}</div>
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />
                          {!isPaid ? (
                            <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 mt-1.5 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Waiting for Reception Payment ({parseFloat(r.total_cost).toFixed(2)} ETB)</span>
                            </div>
                          ) : (
                            <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 mt-1.5 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Payment Approved (Fee Cleared)</span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          {!isPaid ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed border border-slate-200"
                              title="Receptionist Meron Alemu must approve payment before you can start this test"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked (Needs Reception Approval)</span>
                            </button>
                          ) : r.status === 'payment_approved' ? (
                            <button
                              type="button"
                              onClick={() => handleStartTest(r)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Start Test</span>
                            </button>
                          ) : isInProgress ? (
                            <button
                              type="button"
                              onClick={() => handleOpenResultModal(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>Record Results</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleViewReport(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Report</span>
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

      {/* Record Results Modal */}
      {showResultModal && selectedRequest && (
        <Modal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          title="Record Laboratory Findings & Test Results"
          subtitle={`Patient: ${selectedRequest.patient?.full_name} (${selectedRequest.patient?.card_number})`}
        >
          <form onSubmit={handleSubmitResult} className="space-y-4 text-xs">
            {resultError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{resultError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Test Description
              </label>
              <input
                type="text"
                value={resultForm.test_name}
                onChange={(e) => setResultForm({ ...resultForm, test_name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Test Findings / Parameter Values <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="4"
                required
                value={resultForm.findings}
                onChange={(e) => setResultForm({ ...resultForm, findings: e.target.value })}
                placeholder="Enter quantitative or qualitative results (e.g. Hemoglobin 13.5 g/dL, Parasitemia: Negative, Blood Glucose: 95 mg/dL)..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Technician Observations / Methodology Notes
              </label>
              <textarea
                rows="2"
                value={resultForm.observations}
                onChange={(e) => setResultForm({ ...resultForm, observations: e.target.value })}
                placeholder="Microscopic sediment, sample quality, test strip lot #, control status..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
              />
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
              <span className="font-bold block">Transmission to Doctor:</span>
              Submitting finalized results will instantly update the patient's record in the Doctor's Waiting Queue.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingResult}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingResult ? 'Transmitting...' : 'Submit Results to Doctor'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Laboratory Report Modal */}
      {showReportModal && reportData && (
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title="Official Diagnostic Laboratory Report"
          subtitle={`Report Date: ${new Date(reportData.completed_at || Date.now()).toLocaleDateString()}`}
        >
          <div className="space-y-4 printable-card text-xs text-slate-800">
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-3">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600 text-white mb-1">
                <TestTubes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Tena Specialty Diagnostic Center</h3>
              <p className="text-[11px] text-slate-500">Department of Pathology & Medical Laboratory (Addis Ababa)</p>
              <div className="mt-1 font-mono font-bold text-xs text-purple-800">FINAL LABORATORY INVESTIGATION REPORT</div>
            </div>

            {/* Patient Header */}
            <div className="grid grid-cols-2 gap-2 text-[11px] p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div><span className="text-slate-400">Patient:</span> <span className="font-bold text-slate-900">{reportData.patient?.full_name}</span></div>
              <div><span className="text-slate-400">Card #:</span> <span className="font-mono font-bold">{reportData.patient?.card_number}</span></div>
              <div><span className="text-slate-400">Age & Sex:</span> <span className="capitalize">{reportData.patient?.age} yrs, {reportData.patient?.sex}</span></div>
              <div><span className="text-slate-400">Date Completed:</span> <span>{new Date(reportData.completed_at || Date.now()).toLocaleString()}</span></div>
            </div>

            {/* Test Results Table */}
            <div className="space-y-3">
              <div className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-1">
                Test: {reportData.test_name}
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white font-mono text-xs whitespace-pre-line text-slate-900">
                <span className="font-bold font-sans text-slate-700 block mb-1">Findings & Values:</span>
                {reportData.findings}
              </div>

              {reportData.observations && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                  <span className="font-bold block">Observations:</span>
                  {reportData.observations}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500">
              <span>Technician Verification: Verified and Signed</span>
              <span className="font-bold text-emerald-700 uppercase">STATUS: FINAL REPORT</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Diagnostic Report</span>
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

export default LabDashboard;
