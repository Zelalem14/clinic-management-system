import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SmartResultEntryModal from '../../components/laboratory/SmartResultEntryModal';
import PrintableLabReportModal from '../../components/laboratory/PrintableLabReportModal';
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
  Activity,
  FlaskConical,
  FileEdit,
  Eye,
  Sliders,
  Filter,
  RefreshCw,
  XCircle,
  LayoutDashboard
} from 'lucide-react';

export const LabQueue = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Smart Result Entry Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Printable Report Modal State
  const [reportData, setReportData] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchLabRequests = async (overrideSearch = search) => {
    try {
      setLoading(true);
      let query = `?category=laboratory&search=${encodeURIComponent((overrideSearch || '').trim())}`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (priorityFilter) query += `&priority=${priorityFilter}`;

      const res = await api.get(`/laboratory/requests${query}`);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to load lab queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabRequests(search);
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLabRequests(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchLabRequests('');
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
    setShowResultModal(true);
  };

  const handleResultSaved = (savedResult, submissionStatus) => {
    fetchLabRequests();
    if (submissionStatus === 'final') {
      setReportData({
        ...savedResult,
        request: selectedRequest,
        patient: selectedRequest?.patient
      });
      setShowReportModal(true);
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
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
              Operational Workspace
            </span>
            <span className="text-xs text-slate-400">Manage & Process Clinical Requests</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TestTubes className="w-6 h-6 text-purple-600" />
            <span>Laboratory Tests Operational Queue</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Accept specimens, verify payment clearance, record qualitative and quantitative findings, and transmit results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/laboratory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            <span>Dashboard Overview</span>
          </Link>

          <Link
            to="/laboratory/templates"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition-all"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Test Templates</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Workflow Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === '' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('awaiting_payment')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'awaiting_payment' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🔒 Waiting Payment
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('payment_approved')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'payment_approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ✅ Ready to Test (Paid)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'in_progress' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress / Drafts
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('sent_to_doctor')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'sent_to_doctor' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed & Sent to Doctor
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="urgent">STAT / Urgent Only</option>
            <option value="routine">Routine Only</option>
          </select>

          <button
            type="button"
            onClick={() => fetchLabRequests()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reception Approval Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs leading-relaxed">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-amber-950">Reception Payment Gate:</span>
          Under clinic financial protocol, billable laboratory investigations cannot commence until reception verifies and clears patient payment.
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value === '') {
                fetchLabRequests('');
              }
            }}
            placeholder="Search by patient name (e.g. Almaz, Dawit) or card number (e.g. CLN-2026-0001)..."
            className="w-full bg-white rounded-xl border border-slate-300 pl-9 pr-9 py-2 text-sm text-slate-900 focus:border-purple-500 focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-xl cursor-pointer shadow-xs transition-colors"
        >
          Search
        </button>
      </form>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading laboratory operational queue..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Req # / Priority</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Requested Tests</th>
                  <th className="px-6 py-3.5">Clinical Reason & Doctor</th>
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
                    const hasDraft = r.results && r.results.length > 0 && r.results[0].status === 'draft';

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
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(r.created_at).toLocaleDateString()}
                          </div>
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
                                <span>{it.service?.service_name}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                          <p className="line-clamp-2">{r.clinical_reason || 'Doctor routine workup'}</p>
                          <div className="text-[10px] text-slate-400 mt-1">Attending: <strong>{r.doctor?.name}</strong></div>
                          <div className="text-[11px] font-semibold text-purple-700 mt-1 flex items-center gap-1">
                            <span>🔬 Tech:</span>
                            <span className="bg-purple-50 text-purple-900 px-1.5 py-0.5 rounded border border-purple-200">
                              {r.technician?.name || r.results?.[0]?.technician?.name || 'Unassigned'}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge status={r.status} />

                          {hasDraft && (
                            <div className="mt-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <span>📝 Draft Saved</span>
                              </span>
                            </div>
                          )}

                          {!isPaid ? (
                            <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 mt-1.5 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Waiting Payment ({parseFloat(r.total_cost).toFixed(2)} ETB)</span>
                            </div>
                          ) : (
                            <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 mt-1.5 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Payment Approved</span>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right space-x-1.5">
                          {!isPaid ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed border border-slate-200"
                              title="Receptionist must approve payment before you can start this test"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
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
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenResultModal(r)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer ${
                                  hasDraft ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                              >
                                {hasDraft ? <FileEdit className="w-3.5 h-3.5" /> : <FileCheck className="w-3.5 h-3.5" />}
                                <span>{hasDraft ? 'Resume Draft' : 'Record Results'}</span>
                              </button>
                              {hasDraft && (
                                <button
                                  type="button"
                                  onClick={() => handleViewReport(r)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                                  title="Preview Draft Report"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleViewReport(r)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Official Report</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenResultModal(r)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                                title="Edit / Re-submit Results"
                              >
                                <FileEdit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            </div>
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

      {/* Smart Result Entry Modal */}
      {showResultModal && selectedRequest && (
        <SmartResultEntryModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          request={selectedRequest}
          onSuccess={handleResultSaved}
        />
      )}

      {/* Certified Diagnostic Printable Report Modal */}
      {showReportModal && reportData && (
        <PrintableLabReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportData={reportData}
        />
      )}
    </div>
  );
};

export default LabQueue;
