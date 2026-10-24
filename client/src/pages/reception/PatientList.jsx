import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { 
  Users, 
  Search, 
  UserPlus, 
  CalendarPlus, 
  Eye, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2,
  FileText
} from 'lucide-react';

export const PatientList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);

  // New Visit Form State
  const [visitForm, setVisitForm] = useState({
    consultation_type: 'Follow-up Consultation',
    payment_method: 'cash',
    approve_payment_now: true,
    transaction_reference: '',
    notes: ''
  });
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);
  const [visitMessage, setVisitMessage] = useState({ text: '', type: '' });

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/patients?search=${encodeURIComponent(query)}`);
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(initialSearch);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(search ? { search } : {});
    fetchPatients(search);
  };

  const handleOpenNewVisit = (patient) => {
    setSelectedPatient(patient);
    setVisitMessage({ text: '', type: '' });
    setShowNewVisitModal(true);
  };

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setIsSubmittingVisit(true);
    setVisitMessage({ text: '', type: '' });

    try {
      const res = await api.post('/visits', {
        patient_id: selectedPatient.id,
        ...visitForm
      });

      setVisitMessage({
        text: `Visit registered successfully! Patient routed to ${res.data.visit.status === 'waiting_consultation' ? 'Doctor Waiting Queue' : 'Payment Queue'}.`,
        type: 'success'
      });

      setTimeout(() => {
        setShowNewVisitModal(false);
        fetchPatients(search);
      }, 1500);
    } catch (err) {
      setVisitMessage({
        text: err.response?.data?.message || 'Failed to initiate new visit.',
        type: 'error'
      });
    } finally {
      setIsSubmittingVisit(false);
    }
  };

  const handleViewPatientDetails = async (patient) => {
    try {
      const res = await api.get(`/patients/${patient.id}`);
      setSelectedPatient(res.data.patient);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Failed to fetch patient details:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Patient Directory</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search patient medical records by unique card number, name, or phone.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search card #, name, or phone..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Searching patients..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Card Number</th>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Sex & Age</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">Registration Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No patients found matching your search.
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-brand-700 text-xs">
                        {p.card_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{p.full_name}</div>
                        {p.allergies && (
                          <div className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Allergy: {p.allergies}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs capitalize">
                        {p.sex}, {p.age ? `${p.age} yrs` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {p.phone}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {p.registration_date}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenNewVisit(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>New Visit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewPatientDetails(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Visit Modal */}
      {showNewVisitModal && selectedPatient && (
        <Modal
          isOpen={showNewVisitModal}
          onClose={() => setShowNewVisitModal(false)}
          title={`Initiate Return Visit: ${selectedPatient.full_name}`}
          subtitle={`Card Number: ${selectedPatient.card_number}`}
        >
          <form onSubmit={handleCreateVisit} className="space-y-4 text-sm">
            {visitMessage.text && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                visitMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {visitMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{visitMessage.text}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Card Registration:</span>
                <span className="text-emerald-700">Already Paid (Card Active)</span>
              </div>
              <div className="flex justify-between">
                <span>Consultation Fee:</span>
                <span className="font-bold text-slate-900">350.00 ETB</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consultation Type
              </label>
              <select
                value={visitForm.consultation_type}
                onChange={(e) => setVisitForm({ ...visitForm, consultation_type: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="Follow-up Consultation">Follow-up Consultation</option>
                <option value="General Doctor Consultation">General Doctor Consultation</option>
                <option value="Specialist Physician">Specialist Physician</option>
                <option value="Emergency Walk-in">Emergency Walk-in</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={visitForm.payment_method}
                onChange={(e) => setVisitForm({ ...visitForm, payment_method: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="cash">Cash (Direct Counter)</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Debit / Credit Card</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visit Notes / Reason
              </label>
              <textarea
                rows="2"
                value={visitForm.notes}
                onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                placeholder="Reason for return visit..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="p-3 rounded-xl border border-brand-200 bg-brand-50/50 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="approve_visit_now"
                checked={visitForm.approve_payment_now}
                onChange={(e) => setVisitForm({ ...visitForm, approve_payment_now: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded text-brand-600 border-slate-300"
              />
              <label htmlFor="approve_visit_now" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-bold text-slate-900 block">Approve 350.00 ETB Consultation Fee Immediately</span>
                Check to send patient directly to Dr. Abebe Kebede's Waiting Queue.
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewVisitModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingVisit}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                {isSubmittingVisit ? 'Checking in...' : 'Check In Patient'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Patient Detail Profile Modal */}
      {showDetailModal && selectedPatient && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Patient File: ${selectedPatient.full_name}`}
          subtitle={`Card: ${selectedPatient.card_number}`}
        >
          <div className="space-y-4 text-xs text-slate-700">
            {/* Demographic Summary */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div><span className="text-slate-400">Sex & Age:</span> <span className="font-semibold text-slate-900 capitalize">{selectedPatient.sex}, {selectedPatient.age} yrs</span></div>
              <div><span className="text-slate-400">Phone:</span> <span className="font-semibold text-slate-900">{selectedPatient.phone}</span></div>
              <div><span className="text-slate-400">Address:</span> <span className="font-semibold text-slate-900">{selectedPatient.address || 'N/A'}</span></div>
              <div><span className="text-slate-400">Emergency:</span> <span className="font-semibold text-slate-900">{selectedPatient.emergency_contact || 'None'}</span></div>
              {selectedPatient.allergies && (
                <div className="col-span-2 text-rose-700 font-semibold">
                  Allergies: {selectedPatient.allergies}
                </div>
              )}
            </div>

            {/* Past Visits History */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Visit History ({selectedPatient.visits?.length || 0})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedPatient.visits?.map((v) => (
                  <div key={v.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{v.notes || 'Outpatient Consultation'}</div>
                      <div className="text-[11px] text-slate-400">{new Date(v.visit_date).toLocaleString()}</div>
                    </div>
                    <StatusBadge status={v.status} size="xs" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold"
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

export default PatientList;
