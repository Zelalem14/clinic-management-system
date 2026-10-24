import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { 
  Stethoscope, 
  User, 
  AlertTriangle, 
  FileText, 
  TestTubes, 
  Pill, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Building2,
  Activity
} from 'lucide-react';

export const ConsultationView = () => {
  const { visitId } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [patient, setPatient] = useState(null);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clinical'); // 'clinical' | 'tests' | 'results' | 'prescription' | 'history'

  // Consultation Clinical Notes
  const [clinicalForm, setClinicalForm] = useState({
    symptoms: '',
    examination_findings: '',
    diagnosis: '',
    treatment_plan: '',
    clinical_notes: ''
  });
  const [consultationId, setConsultationId] = useState(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  // Available Services for Ordering
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [procReason, setProcReason] = useState('');
  const [procCategory, setProcCategory] = useState('laboratory');
  const [procPriority, setProcPriority] = useState('routine');
  const [isOrderingProc, setIsOrderingProc] = useState(false);
  const [procMessage, setProcMessage] = useState({ text: '', type: '' });

  // Prescription Items Builder
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medication_name: '', dosage: '500mg', frequency: 'TDS (3x daily)', duration: '5 days', route: 'Oral', instructions: 'Take after meals', quantity: 15 }
  ]);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('Review recovery progress in clinic.');

  // Completion State
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const loadConsultationData = async () => {
    try {
      setLoading(true);
      const visitRes = await api.get(`/visits/${visitId}`);
      const visitData = visitRes.data.visit;
      setVisit(visitData);
      setPatient(visitData.patient);

      // Load patient complete medical history
      const histRes = await api.get(`/patients/${visitData.patient_id}/medical-history`);
      setMedicalHistory(histRes.data);

      // If consultation already exists for this visit, populate form
      if (visitData.consultations && visitData.consultations.length > 0) {
        const consult = visitData.consultations[0];
        setConsultationId(consult.id);
        setClinicalForm({
          symptoms: consult.symptoms || '',
          examination_findings: consult.examination_findings || '',
          diagnosis: consult.diagnosis || '',
          treatment_plan: consult.treatment_plan || '',
          clinical_notes: consult.clinical_notes || ''
        });
      }

      // Load active services catalog
      const srvRes = await api.get('/services?active_only=true');
      setAvailableServices(srvRes.data.services || []);

      // If URL specifies tab or visit has completed lab results awaiting review, default to 'results'
      const params = new URLSearchParams(window.location.search);
      const hasCompletedResults = visitData.procedure_requests?.some(r => r.results && r.results.length > 0);
      if (params.get('tab') === 'results' || visitData.status === 'results_ready' || (hasCompletedResults && !visitData.consultations?.length)) {
        setActiveTab('results');
      } else if (params.get('tab')) {
        setActiveTab(params.get('tab'));
      }
    } catch (err) {
      console.error('Failed to load consultation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultationData();
  }, [visitId]);

  // Save / Start Consultation Draft
  const handleSaveDraft = async () => {
    setIsSavingNotes(true);
    setNotesSuccess(false);
    try {
      const res = await api.post('/consultations', {
        visit_id: visitId,
        patient_id: patient.id,
        ...clinicalForm
      });
      setConsultationId(res.data.consultation.id);
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 2500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save clinical notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Toggle Service selection for procedure request
  const toggleServiceSelect = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Submit Procedure / Test Request
  const handleOrderProcedures = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      setProcMessage({ text: 'Please select at least one test or procedure.', type: 'error' });
      return;
    }

    setIsOrderingProc(true);
    setProcMessage({ text: '', type: '' });

    try {
      const res = await api.post('/procedure-requests', {
        visit_id: visitId,
        patient_id: patient.id,
        category: procCategory,
        clinical_reason: procReason || clinicalForm.diagnosis || 'Clinical evaluation',
        priority: procPriority,
        service_ids: selectedServices
      });

      setProcMessage({
        text: `Request created for ${res.data.payment_required.toFixed(2)} ETB. Sent to Meron Alemu at Reception payment queue for fee verification.`,
        type: 'success'
      });

      // Clear selection
      setSelectedServices([]);
      setProcReason('');

      // Reload visit data to show real-time procedure tracker
      loadConsultationData();
    } catch (err) {
      setProcMessage({
        text: err.response?.data?.message || 'Failed to submit procedure request.',
        type: 'error'
      });
    } finally {
      setIsOrderingProc(false);
    }
  };

  // Prescription builder helpers
  const handleAddMedication = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medication_name: '', dosage: '', frequency: 'TDS (3x daily)', duration: '5 days', route: 'Oral', instructions: '', quantity: 1 }
    ]);
  };

  const handleRemoveMedication = (index) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...prescriptionItems];
    updated[index][field] = value;
    setPrescriptionItems(updated);
  };

  // Finalize Consultation
  const handleCompleteConsultation = async () => {
    if (!clinicalForm.diagnosis) {
      alert('Please enter a clinical diagnosis before finalizing the consultation.');
      setActiveTab('clinical');
      return;
    }

    setIsCompleting(true);
    try {
      // First ensure draft is saved
      let currentId = consultationId;
      if (!currentId) {
        const initRes = await api.post('/consultations', {
          visit_id: visitId,
          patient_id: patient.id,
          ...clinicalForm
        });
        currentId = initRes.data.consultation.id;
        setConsultationId(currentId);
      }

      // Filter valid prescriptions
      const validPrescriptions = prescriptionItems.filter(p => p.medication_name.trim());

      await api.post(`/consultations/${currentId}/complete`, {
        final_diagnosis: clinicalForm.diagnosis,
        treatment_plan: clinicalForm.treatment_plan,
        clinical_notes: clinicalForm.clinical_notes,
        prescriptions: validPrescriptions,
        follow_up_date: followUpDate || null,
        follow_up_notes: followUpNotes
      });

      // Show summary modal
      setShowSummaryModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to finalize consultation.');
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Opening patient consultation file..." />;
  if (!patient || !visit) return <div>Record not found</div>;

  // Calculate procedure orders for this visit
  const existingRequests = visit.procedure_requests || [];

  return (
    <div className="space-y-6">
      
      {/* Top Patient Demographics Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Return to queue"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-500/20">
              {patient.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {patient.card_number}
                </span>
                <StatusBadge status={visit.status} size="sm" />
              </div>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="capitalize font-medium">{patient.sex}, {patient.age} yrs</span>
                <span>•</span>
                <span>Phone: {patient.phone}</span>
                <span>•</span>
                <span>Visit #{visit.id} ({new Date(visit.visit_date).toLocaleDateString()})</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingNotes}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {isSavingNotes ? 'Saving...' : notesSuccess ? '✓ Saved!' : 'Save Progress Draft'}
            </button>
            <button
              type="button"
              onClick={handleCompleteConsultation}
              disabled={isCompleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleting ? 'Finalizing...' : 'Finalize Consultation'}</span>
            </button>
          </div>
        </div>

        {/* Allergy & Pre-existing Warning Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          {patient.allergies ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-lg animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>DRUG ALLERGIES: {patient.allergies}</span>
            </div>
          ) : (
            <span className="text-slate-400">Allergies: No known drug allergies (NKDA)</span>
          )}

          {patient.medical_history && (
            <div className="text-slate-600">
              <span className="font-semibold text-slate-700">Past History:</span> {patient.medical_history}
            </div>
          )}

          {patient.current_medications && (
            <div className="text-slate-600">
              <span className="font-semibold text-slate-700">Current Meds:</span> {patient.current_medications}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('clinical')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'clinical'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>1. Doctor Exam & Notes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'tests'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TestTubes className="w-4 h-4" />
          <span>2. Order Lab Tests ({existingRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'results'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>3. Lab Test Results</span>
          {existingRequests.some(r => r.status === 'results_ready' || r.status === 'sent_to_doctor') && (
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prescription')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'prescription'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>4. Prescribe Medicines</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Past Medical History</span>
        </button>
      </div>

      {/* Tab 1: Clinical Notes & Examination */}
      {activeTab === 'clinical' && (
        <div className="bg-white p-6 rounded-b-2xl border border-slate-200/80 shadow-xs space-y-5">
          {existingRequests.some(r => r.results && r.results.length > 0) && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-purple-950 font-bold text-sm">
                <TestTubes className="w-5 h-5 text-purple-600 shrink-0" />
                <span>Laboratory Results are ready for this patient!</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                View Lab Results &rarr;
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Patient Symptoms (What does the patient feel?)
              </label>
              <textarea
                rows="4"
                value={clinicalForm.symptoms}
                onChange={(e) => setClinicalForm({ ...clinicalForm, symptoms: e.target.value })}
                placeholder="Chief complaints, pain location, fever, duration, what makes it worse/better..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Doctor Examination Findings (BP, Pulse, Temp, Physical Exam)
              </label>
              <textarea
                rows="4"
                value={clinicalForm.examination_findings}
                onChange={(e) => setClinicalForm({ ...clinicalForm, examination_findings: e.target.value })}
                placeholder="Blood Pressure (e.g. 120/80), Pulse, Temperature (37°C), Chest, Abdomen findings..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Diagnosis (Illness / Condition) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                value={clinicalForm.diagnosis}
                onChange={(e) => setClinicalForm({ ...clinicalForm, diagnosis: e.target.value })}
                placeholder="e.g. Typhoid Fever, Hypertension, Gastroenteritis, Upper Respiratory Infection..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm font-semibold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Doctor Advice & Instructions
              </label>
              <textarea
                rows="3"
                value={clinicalForm.treatment_plan}
                onChange={(e) => setClinicalForm({ ...clinicalForm, treatment_plan: e.target.value })}
                placeholder="Diet advice, rest, drink plenty of fluids, when to return to clinic..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('tests')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <span>Order Lab Tests (Optional)</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Order Laboratory Tests */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          {/* Active Orders Tracker */}
          {existingRequests.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Lab Tests Ordered for this Visit
              </h3>
              <div className="space-y-3">
                {existingRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700">Lab Request #{req.id}</span>
                        {req.priority === 'urgent' && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">URGENT</span>
                        )}
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Reason:</span> {req.clinical_reason || 'Routine Lab Test'}
                    </div>

                    {req.status === 'awaiting_payment' ? (
                      <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        🔒 Waiting for Reception Fee Approval — The lab cannot begin until Receptionist Meron Alemu approves payment.
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        ✅ Fee Approved — Test is unlocked and in Assefa Zegeye's Laboratory Queue.
                      </div>
                    )}

                    {req.items && (
                      <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-2 text-xs">
                        {req.items.map(it => (
                          <span key={it.id} className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-800">
                            {it.service?.service_name} ({parseFloat(it.unit_price).toFixed(2)} ETB)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Order Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Order Laboratory Tests
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click on the tests needed below. Prices in Ethiopian Birr (ETB). The patient pays at reception before the lab runs the test.
              </p>
            </div>

            {procMessage.text && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                procMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {procMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{procMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleOrderProcedures} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Reason for Lab Test / Symptoms
                  </label>
                  <input
                    type="text"
                    value={procReason}
                    onChange={(e) => setProcReason(e.target.value)}
                    placeholder="e.g. Fever workup, rule out typhoid or malaria"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={procPriority}
                    onChange={(e) => setProcPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent / Stat</option>
                  </select>
                </div>
              </div>

              {/* Service Cards Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Lab Tests to Perform:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {availableServices
                    .filter(s => s.category === 'laboratory')
                    .map((service) => {
                      const isSelected = selectedServices.includes(service.id);
                      return (
                        <div
                          key={service.id}
                          onClick={() => toggleServiceSelect(service.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'bg-brand-50 border-brand-500 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 leading-tight">
                              {service.service_name}
                            </span>
                            <span className="text-xs font-extrabold text-brand-700 font-mono">
                              {parseFloat(service.price).toFixed(2)} ETB
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono mt-1">
                            {service.service_code}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Order Action */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-600 font-semibold">
                  {selectedServices.length} test(s) selected
                </div>
                <button
                  type="submit"
                  disabled={isOrderingProc || selectedServices.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <TestTubes className="w-4 h-4" />
                  <span>{isOrderingProc ? 'Submitting...' : 'Send Test Order to Lab & Reception'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Diagnostic Results Viewer */}
      {activeTab === 'results' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Completed Laboratory Results
          </h3>

          {existingRequests.every(r => !r.results || r.results.length === 0) ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Finalized Results Yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Once Laboratory Technician Assefa Zegeye completes tests, the findings will instantly appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {existingRequests.map(req => (
                req.results && req.results.map(res => (
                  <div key={res.id} className="p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-2">
                      <div>
                        <span className="font-bold text-base text-purple-950 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{res.test_name}</span>
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Tested by: <span className="font-semibold text-slate-800">{res.technician?.name || 'Assefa Zegeye (Lab Tech)'}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-purple-700 bg-purple-100 px-3 py-1 rounded-full font-semibold">
                        Completed: {new Date(res.completed_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-purple-200 space-y-1">
                      <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                        Laboratory Findings & Test Values:
                      </span>
                      <p className="text-sm font-mono font-semibold text-slate-900 whitespace-pre-wrap leading-relaxed">
                        {res.findings}
                      </p>
                    </div>

                    {res.observations && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Lab Technician Observations: </span>
                        <span>{res.observations}</span>
                      </div>
                    )}
                  </div>
                ))
              ))}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('prescription')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer"
                >
                  <Pill className="w-4 h-4" />
                  <span>Proceed to Prescribe Medicines &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Prescription Builder & Follow-up */}
      {activeTab === 'prescription' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Prescription Items & Follow-up Plan
              </h3>
              <p className="text-xs text-slate-500">Add medications with specific dosage, frequency, and instructions.</p>
            </div>
            <button
              type="button"
              onClick={handleAddMedication}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medication</span>
            </button>
          </div>

          {/* Medication Rows */}
          <div className="space-y-3">
            {prescriptionItems.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Medication #{idx + 1}</span>
                  {prescriptionItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(idx)}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">Medication Name</label>
                    <input
                      type="text"
                      value={item.medication_name}
                      onChange={(e) => handleMedicationChange(idx, 'medication_name', e.target.value)}
                      placeholder="e.g. Amoxicillin / Clavulanate"
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Dosage</label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Frequency</label>
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                      placeholder="e.g. TDS (3x daily)"
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Duration</label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                      placeholder="e.g. 5 days"
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleMedicationChange(idx, 'quantity', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">Instructions</label>
                    <input
                      type="text"
                      value={item.instructions}
                      onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                      placeholder="e.g. Take immediately after meals"
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Follow-up Appointment Scheduler */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Schedule Follow-up Appointment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Review Instructions</label>
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              onClick={handleCompleteConsultation}
              disabled={isCompleting}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleting ? 'Finalizing...' : 'Finalize & Complete Consultation'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Patient Historical Records */}
      {activeTab === 'history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
            Historical Clinical Encounters
          </h3>
          {medicalHistory?.consultations?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No previous recorded consultations on file.</p>
          ) : (
            <div className="space-y-3">
              {medicalHistory?.consultations?.map((c) => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Consultation on {new Date(c.consultation_date).toLocaleDateString()}</span>
                    <span className="text-slate-500">Doctor: {c.doctor?.name}</span>
                  </div>
                  <div><span className="font-semibold text-slate-700">Diagnosis:</span> {c.diagnosis || 'None'}</div>
                  <div><span className="font-semibold text-slate-700">Symptoms:</span> {c.symptoms || 'N/A'}</div>
                  <div><span className="font-semibold text-slate-700">Treatment Plan:</span> {c.treatment_plan || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completion & Printable Summary Modal */}
      {showSummaryModal && (
        <Modal
          isOpen={showSummaryModal}
          onClose={() => {
            setShowSummaryModal(false);
            navigate('/doctor');
          }}
          title="Consultation Finalized & Completed"
          subtitle={`Patient: ${patient.full_name} (${patient.card_number})`}
        >
          <div className="space-y-4 printable-card text-xs text-slate-800">
            <div className="text-center border-b border-slate-200 pb-3">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white mb-1">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Tena Specialty Clinic</h3>
              <p className="text-[11px] text-slate-500">Consultation Summary & Prescription Slip (Addis Ababa)</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-b border-slate-100">
              <div><span className="text-slate-400">Date:</span> <span className="font-semibold">{new Date().toLocaleDateString()}</span></div>
              <div><span className="text-slate-400">Patient:</span> <span className="font-semibold">{patient.full_name}</span></div>
              <div><span className="text-slate-400">Card #:</span> <span className="font-mono font-semibold">{patient.card_number}</span></div>
              <div><span className="text-slate-400">Age/Sex:</span> <span className="font-semibold capitalize">{patient.age} yrs, {patient.sex}</span></div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="font-bold text-slate-900 block">Final Diagnosis:</span>
                <p className="p-2 rounded bg-slate-50 font-medium">{clinicalForm.diagnosis}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block">Treatment & Advice:</span>
                <p className="p-2 rounded bg-slate-50">{clinicalForm.treatment_plan || 'Take medications as directed.'}</p>
              </div>

              {prescriptionItems.filter(p => p.medication_name).length > 0 && (
                <div>
                  <span className="font-bold text-slate-900 block">Prescription:</span>
                  <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg p-2">
                    {prescriptionItems.filter(p => p.medication_name).map((p, idx) => (
                      <li key={idx} className="py-1">
                        <span className="font-bold text-slate-900">{p.medication_name}</span> - {p.dosage}, {p.frequency} x {p.duration} ({p.instructions})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {followUpDate && (
                <div className="p-2 rounded bg-sky-50 border border-sky-200 text-sky-800">
                  <span className="font-bold">Scheduled Follow-up:</span> {followUpDate} ({followUpNotes})
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Medical Slip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSummaryModal(false);
                  navigate('/doctor');
                }}
                className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold"
              >
                Return to Doctor Queue
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default ConsultationView;
