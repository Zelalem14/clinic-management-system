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
  FileText,
  Clock,
  ShieldCheck,
  Calendar
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

  // Card Fee status for return visit
  const [cardFeeStatus, setCardFeeStatus] = useState(null);
  const [loadingCardStatus, setLoadingCardStatus] = useState(false);

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

  const handleOpenNewVisit = async (patient) => {
    setSelectedPatient(patient);
    setVisitMessage({ text: '', type: '' });
    setShowNewVisitModal(true);
    setLoadingCardStatus(true);

    try {
      const res = await api.get(`/patients/${patient.id}/card-fee-status`);
      setCardFeeStatus(res.data.cardFeeStatus);
    } catch (err) {
      console.error('Failed to check card fee status:', err);
      setCardFeeStatus(null);
    } finally {
      setLoadingCardStatus(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Permanent Patient Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search all registered patient records by unique card number, full name, or phone.
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
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap"
          >
            Search
          </button>
        </form>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Searching permanent patient directory..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[650px]">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Card Number</th>
                  <th className="px-6 py-3.5">Patient Name</th>
                  <th className="px-6 py-3.5">Sex & Age</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">Registered Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
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
                            <AlertTriangle className="w-3 h-3 shrink-0" /> Allergy: {p.allergies}
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
                        {p.registration_date || 'Permanent'}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenNewVisit(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Return Visit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewPatientDetails(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
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

      {/* New Return Visit Modal with 10-day rule preview */}
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

            {/* 10-Day Card Fee Rule Indicator */}
            {loadingCardStatus ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 animate-pulse">
                Checking 10-day card fee validity...
              </div>
            ) : cardFeeStatus ? (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                cardFeeStatus.isFree 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    {cardFeeStatus.isFree ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>Card Fee Status (10-Day Rule):</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    cardFeeStatus.isFree ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200/80 text-amber-900'
                  }`}>
                    {cardFeeStatus.statusBadge}
                  </span>
                </div>
                <div className="text-[11px] font-medium pl-5.5">
                  {cardFeeStatus.statusText}
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between font-bold text-slate-900">
                  <span>Total Due Today:</span>
                  <span className="text-sm font-extrabold text-brand-700">
                    {(350.00 + cardFeeStatus.feeToCharge).toFixed(2)} ETB
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between font-semibold">
                <span>Doctor Consultation Fee:</span>
                <span className="font-bold text-slate-900">350.00 ETB</span>
              </div>
            )}

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
                <option value="telebirr">Telebirr Digital</option>
                <option value="bank_transfer">Commercial Bank of Ethiopia (CBE)</option>
                <option value="card">Debit / Credit Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Visit Notes / Chief Complaint
              </label>
              <textarea
                rows="2"
                value={visitForm.notes}
                onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                placeholder="Symptoms or reason for return visit..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="p-3 rounded-xl border border-brand-200 bg-brand-50/50 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="approve_visit_now"
                checked={visitForm.approve_payment_now}
                onChange={(e) => setVisitForm({ ...visitForm, approve_payment_now: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="approve_visit_now" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-bold text-slate-900 block">Approve Payment Immediately</span>
                Check if payment has been received so patient is routed straight to the Doctor's Queue.
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewVisitModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingVisit}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{isSubmittingVisit ? 'Initiating Visit...' : 'Register Return Visit'}</span>
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
          title={`Patient Medical File: ${selectedPatient.full_name}`}
          subtitle={`Permanent Card Number: ${selectedPatient.card_number}`}
        >
          <div className="space-y-4 text-xs sm:text-sm text-slate-700">
            {/* Demographics Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Sex & Age</span>
                  <span className="font-semibold text-slate-900 capitalize">{selectedPatient.sex}, {selectedPatient.age || 'N/A'} yrs</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-900 font-mono">{selectedPatient.phone}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Registration Date</span>
                  <span className="font-semibold text-slate-900">{selectedPatient.registration_date || 'Permanent Record'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Address</span>
                  <span className="font-medium text-slate-800">{selectedPatient.address || 'Addis Ababa, Ethiopia'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Emergency Contact</span>
                  <span className="font-medium text-slate-800">{selectedPatient.emergency_contact || 'None listed'}</span>
                </div>
              </div>

              {selectedPatient.allergies && (
                <div className="pt-2 border-t border-slate-200/60 text-xs text-rose-700 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Allergies: {selectedPatient.allergies}</span>
                </div>
              )}
            </div>

            {/* Visit History */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-600" />
                <span>Recorded Patient Encounters & Visits</span>
              </h3>
              {(!selectedPatient.visits || selectedPatient.visits.length === 0) ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No previous visits recorded for this patient.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {selectedPatient.visits.map((v) => (
                    <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                          <span>Visit #{v.id}</span>
                          <span className="text-slate-400">&bull;</span>
                          <span>{new Date(v.visit_date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{v.notes || 'Outpatient encounter'}</div>
                      </div>
                      <StatusBadge status={v.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default PatientList;
