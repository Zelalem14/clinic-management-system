import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  CreditCard, 
  CheckCircle2, 
  Search, 
  Printer, 
  AlertCircle, 
  Building2,
  TestTubes,
  Lock,
  Unlock
} from 'lucide-react';

export const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Approve Modal State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveForm, setApproveForm] = useState({
    payment_method: 'cash',
    amount_paid: '',
    transaction_reference: '',
    notes: ''
  });
  const [isApproving, setIsApproving] = useState(false);
  const [approvalError, setApprovalError] = useState('');

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let query = `?search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const res = await api.get(`/payments${query}`);
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleOpenApproveModal = (payment) => {
    setSelectedPayment(payment);
    setApproveForm({
      payment_method: payment.payment_method || 'cash',
      amount_paid: payment.total_amount,
      transaction_reference: payment.transaction_reference || '',
      notes: ''
    });
    setApprovalError('');
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setIsApproving(true);
    setApprovalError('');

    try {
      const res = await api.post(`/payments/${selectedPayment.id}/approve`, approveForm);
      setShowApproveModal(false);

      setReceiptData(res.data.payment);
      setShowReceiptModal(true);

      fetchPayments();
    } catch (err) {
      setApprovalError(err.response?.data?.message || 'Failed to approve payment.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenReceipt = async (payment) => {
    try {
      const res = await api.get(`/payments/${payment.id}`);
      setReceiptData(res.data.payment);
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-600" />
            <span>Payments & Counter Approvals (Ethiopian Birr - ETB)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verify counter, Telebirr, and Bank payments for consultations, lab tests, and procedures.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Verification
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved History
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === ''
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Transactions
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by receipt number, patient name, or card number..."
            className="w-full bg-white rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl"
        >
          Search
        </button>
      </form>

      {/* Payment Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading payments queue..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Receipt #</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Item Description</th>
                  <th className="px-6 py-3.5">Amount (ETB)</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No payment records found matching the current filter.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isLab = p.notes?.toLowerCase().includes('laboratory') || p.allocations?.some(a => a.allocation_type?.includes('laboratory') || a.procedure_request_id);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">
                          {p.receipt_number}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {new Date(p.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{p.patient?.full_name}</div>
                          <div className="font-mono text-xs text-brand-700">{p.patient?.card_number}</div>
                        </td>
                        <td className="px-6 py-4 text-xs max-w-xs">
                          <div className="font-semibold text-slate-900 line-clamp-1">{p.notes || 'Service Fee'}</div>
                          {isLab && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                <TestTubes className="w-3 h-3 text-purple-600" />
                                <span>Lab Fee (Needs Reception Approval for Lab Tech)</span>
                              </span>
                            </div>
                          )}
                          {p.allocations && p.allocations.length > 0 && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {p.allocations.map(a => `${a.service?.service_name || a.allocation_type} (${parseFloat(a.amount).toFixed(2)} ETB)`).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 font-mono">
                          {parseFloat(p.total_amount).toFixed(2)} <span className="text-xs text-slate-500 font-normal">ETB</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
                            {p.payment_method === 'telebirr' ? '📱 Telebirr' : p.payment_method === 'bank_transfer' || p.payment_method === 'cbe_birr' ? '🏦 Bank' : '💵 Cash'}
                          </span>
                          {p.transaction_reference && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {p.transaction_reference}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {p.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(p)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Payment</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenReceipt(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Receipt</span>
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

      {/* Verify & Approve Payment Modal */}
      {showApproveModal && selectedPayment && (
        <Modal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          title="Verify & Approve Payment"
          subtitle={`Receipt: ${selectedPayment.receipt_number}`}
        >
          <form onSubmit={handleApproveSubmit} className="space-y-4 text-sm">
            {approvalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{approvalError}</span>
              </div>
            )}

            {/* Patient & Service Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{selectedPayment.patient?.full_name} ({selectedPayment.patient?.card_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Services Requested:</span>
                <span className="font-medium text-slate-900">{selectedPayment.notes}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Configured Required Fee:</span>
                <span className="text-brand-700">{parseFloat(selectedPayment.total_amount).toFixed(2)} ETB</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Amount Received (ETB)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={approveForm.amount_paid}
                onChange={(e) => setApproveForm({ ...approveForm, amount_paid: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Paid By: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setApproveForm({ ...approveForm, payment_method: 'cash' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    approveForm.payment_method === 'cash'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xl mb-1">💵</div>
                  <div>Cash</div>
                </button>

                <button
                  type="button"
                  onClick={() => setApproveForm({ ...approveForm, payment_method: 'telebirr' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    approveForm.payment_method === 'telebirr'
                      ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-sm ring-2 ring-sky-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xl mb-1">📱</div>
                  <div>Telebirr</div>
                </button>

                <button
                  type="button"
                  onClick={() => setApproveForm({ ...approveForm, payment_method: 'bank_transfer' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    approveForm.payment_method === 'bank_transfer'
                      ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm ring-2 ring-purple-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xl mb-1">🏦</div>
                  <div>Bank</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Write Note / Reference (Optional)
              </label>
              <input
                type="text"
                value={approveForm.transaction_reference}
                onChange={(e) => setApproveForm({ ...approveForm, transaction_reference: e.target.value })}
                placeholder="e.g. Telebirr SMS ref, Bank transfer #, or Cash handed at counter"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            {selectedPayment.notes?.toLowerCase().includes('laboratory') || selectedPayment.allocations?.some(a => a.allocation_type?.includes('laboratory') || a.procedure_request_id) ? (
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-950">
                  <TestTubes className="w-4 h-4 text-purple-600" />
                  <span>Laboratory Test Payment Approval:</span>
                </div>
                <p>
                  Lab Technician <strong>Assefa Zegeye</strong> CANNOT run this test until you approve this payment.
                  Approving immediately unlocks this test in the Laboratory Workspace.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Consultation Fee Approval:</span>
                </div>
                <p>
                  Approving sends the patient directly to <strong>Dr. Abebe Kebede's Waiting Queue</strong>.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isApproving}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                {isApproving ? 'Verifying & Approving...' : 'Confirm Receipt & Approve'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Printable Receipt Modal */}
      {showReceiptModal && receiptData && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Official Clinic Receipt"
          subtitle={`Receipt Number: ${receiptData.receipt_number}`}
        >
          <div className="space-y-4 printable-card text-xs text-slate-800">
            
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-3">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-brand-600 text-white mb-1">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Tena Specialty Clinic</h3>
              <p className="text-[11px] text-slate-500">Bole Sub-City, Africa Avenue, Addis Ababa, Ethiopia | Tel: +251 11 661 2345</p>
              <div className="mt-1 font-mono font-bold text-xs text-brand-700">OFFICIAL PAYMENT RECEIPT (ETB)</div>
            </div>

            {/* Receipt Metadata */}
            <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-b border-slate-100">
              <div><span className="text-slate-400">Date/Time:</span> <span className="font-semibold">{new Date(receiptData.approved_at || receiptData.created_at).toLocaleString()}</span></div>
              <div><span className="text-slate-400">Receipt #:</span> <span className="font-mono font-semibold">{receiptData.receipt_number}</span></div>
              <div><span className="text-slate-400">Patient:</span> <span className="font-semibold">{receiptData.patient?.full_name}</span></div>
              <div><span className="text-slate-400">Card #:</span> <span className="font-mono font-semibold">{receiptData.patient?.card_number}</span></div>
              <div><span className="text-slate-400">Channel:</span> <span className="font-semibold uppercase">{receiptData.payment_method}</span></div>
              <div><span className="text-slate-400">Transaction Ref:</span> <span className="font-semibold font-mono">{receiptData.transaction_reference || 'COUNTER-CASH'}</span></div>
            </div>

            {/* Breakdown */}
            <div className="py-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-1">Description</th>
                    <th className="py-1 text-right">Amount (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receiptData.allocations && receiptData.allocations.length > 0 ? (
                    receiptData.allocations.map((a, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5">{a.service?.service_name || a.allocation_type.replace(/_/g, ' ')}</td>
                        <td className="py-1.5 text-right font-semibold font-mono">{parseFloat(a.amount).toFixed(2)} ETB</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-1.5">{receiptData.notes || 'Medical Service Fee'}</td>
                      <td className="py-1.5 text-right font-semibold font-mono">{parseFloat(receiptData.total_amount).toFixed(2)} ETB</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-3 pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-extrabold text-slate-900">
                <span>TOTAL AMOUNT PAID:</span>
                <span className="text-brand-700 font-mono">{parseFloat(receiptData.amount_paid || receiptData.total_amount).toFixed(2)} ETB</span>
              </div>
            </div>

            {/* Status Stamp */}
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center text-emerald-800 font-bold text-xs uppercase tracking-wider">
              PAID & VERIFIED (Processed by Meron Alemu / Cashier #{receiptData.approved_by || 'Staff'})
            </div>

            <p className="text-[10px] text-center text-slate-400 pt-1">
              እናመሰግናለን! Thank you for choosing Tena Specialty Clinic. Wishing you swift recovery!
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
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

export default PaymentManagement;
