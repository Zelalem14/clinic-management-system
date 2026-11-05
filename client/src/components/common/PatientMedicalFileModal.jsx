import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import { 
  User, 
  Phone, 
  MapPin, 
  AlertTriangle, 
  HeartPulse, 
  Clock, 
  Pill, 
  Stethoscope, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  FileText, 
  Calendar,
  AlertCircle,
  FileCheck2,
  CalendarPlus
} from 'lucide-react';

export const PatientMedicalFileModal = ({
  isOpen,
  onClose,
  patient,
  patientId,
  onPatientUpdated,
  canEdit = true
}) => {
  const [patientData, setPatientData] = useState(patient || null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'encounters' | 'prescriptions'

  // Edit Form State
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    sex: 'male',
    age: '',
    dob: '',
    address: '',
    emergency_contact: '',
    allergies: '',
    medical_history: '',
    current_medications: '',
    notes: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Fetch complete patient record if patientId is provided or to reload fresh data
  const loadPatientRecord = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/patients/${id}`);
      const fullPatient = res.data.patient;
      setPatientData(fullPatient);
      initEditForm(fullPatient);
    } catch (err) {
      console.error('Failed to load full patient medical record:', err);
    } finally {
      setLoading(false);
    }
  };

  const initEditForm = (p) => {
    if (!p) return;
    setEditForm({
      full_name: p.full_name || '',
      phone: p.phone || '',
      sex: p.sex || 'male',
      age: p.age !== undefined && p.age !== null ? String(p.age) : '',
      dob: p.dob || '',
      address: p.address || '',
      emergency_contact: p.emergency_contact || '',
      allergies: p.allergies || '',
      medical_history: p.medical_history || '',
      current_medications: p.current_medications || '',
      notes: p.notes || ''
    });
  };

  useEffect(() => {
    if (isOpen) {
      const targetId = patientId || patient?.id;
      if (targetId) {
        loadPatientRecord(targetId);
      } else if (patient) {
        setPatientData(patient);
        initEditForm(patient);
      }
      setIsEditing(false);
      setSaveSuccess('');
      setSaveError('');
    }
  }, [isOpen, patientId, patient]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMedicalHistory = async (e) => {
    e.preventDefault();
    if (!editForm.full_name.trim() || !editForm.phone.trim()) {
      setSaveError('Full Name and Phone Number are required.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await api.put(`/patients/${patientData.id}`, editForm);
      const updated = res.data.patient;
      
      // Merge with nested associations if present
      setPatientData(prev => ({
        ...prev,
        ...updated
      }));

      setSaveSuccess('Patient medical history and profile updated permanently in the database!');
      setIsEditing(false);

      if (onPatientUpdated) {
        onPatientUpdated(updated);
      }

      setTimeout(() => {
        setSaveSuccess('');
      }, 4000);
    } catch (err) {
      console.error('Failed to update patient history:', err);
      setSaveError(err.response?.data?.message || 'Failed to update patient medical history.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={patientData ? `Patient File: ${patientData.full_name}` : 'Patient Medical File'}
      subtitle={patientData ? `Card Number: ${patientData.card_number} (Permanent Record)` : 'Loading...'}
    >
      <div className="space-y-4 text-xs sm:text-sm text-slate-700">
        
        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccess}</span>
          </div>
        )}

        {/* Error Alert */}
        {saveError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
        )}

        {/* View / Edit Mode Toggle & Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('summary'); }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'summary' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Medical Summary & Intake
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('encounters'); }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'encounters' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visits & Doctor Encounters ({patientData?.visits?.length || 0})
            </button>
          </div>

          {canEdit && (
            <div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    initEditForm(patientData);
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Medical History</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel Editing</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* EDIT MODE: Form allowing Receptionist / Admin to update history & contact */}
        {isEditing ? (
          <form onSubmit={handleSaveMedicalHistory} className="space-y-4">
            <div className="p-4 bg-brand-50/40 rounded-2xl border border-brand-200 space-y-3">
              <span className="text-xs font-bold text-brand-900 uppercase tracking-wider block">
                Editing Patient Record & Permanent Medical History
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sex</label>
                  <select
                    name="sex"
                    value={editForm.sex}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-xs"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="125"
                    name="age"
                    value={editForm.age}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Residential Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    placeholder="e.g. Bole Sub-City, Addis Ababa"
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={editForm.emergency_contact}
                    onChange={handleEditChange}
                    placeholder="e.g. Almaz Bekele (Sister) - 0911223344"
                    className="w-full rounded-xl border border-slate-300 p-2 bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Medical History Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Clinical & Medical History Details</span>
              </span>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-rose-700 block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Known Drug Allergies (Critical)</span>
                  </label>
                  <input
                    type="text"
                    name="allergies"
                    value={editForm.allergies}
                    onChange={handleEditChange}
                    placeholder="e.g. Penicillin, Sulfa drugs, Aspirin (or leave blank if None)"
                    className="w-full rounded-xl border border-rose-300 p-2.5 bg-white text-rose-900 font-medium focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Chronic Medical Conditions / Past Medical History
                  </label>
                  <textarea
                    rows="2"
                    name="medical_history"
                    value={editForm.medical_history}
                    onChange={handleEditChange}
                    placeholder="e.g. Hypertension (5 yrs on meds), Type 2 Diabetes, Bronchial Asthma, Peptic Ulcer Disease"
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Current Regular Medications
                  </label>
                  <input
                    type="text"
                    name="current_medications"
                    value={editForm.current_medications}
                    onChange={handleEditChange}
                    placeholder="e.g. Metformin 500mg BD, Amlodipine 5mg daily, Ventolin inhaler PRN"
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    Reception Intake Notes / Presenting Symptoms
                  </label>
                  <textarea
                    rows="2"
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    placeholder="Chief complaints, remarks by receptionist, special patient requirements..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving to Database...' : 'Save Changes Permanently'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* VIEW MODE: Full Patient Medical History Record */
          <>
            {activeTab === 'summary' && (
              <div className="space-y-4">
                {/* Demographics Card */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sex & Age</span>
                      <span className="font-semibold text-slate-900 capitalize">{patientData?.sex || 'N/A'}, {patientData?.age !== undefined ? `${patientData.age} yrs` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Phone Number</span>
                      <span className="font-semibold text-slate-900 font-mono">{patientData?.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Registration Date</span>
                      <span className="font-semibold text-slate-900">{patientData?.registration_date || 'Permanent File'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">Active</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Address</span>
                      <span className="font-medium text-slate-800">{patientData?.address || 'Addis Ababa, Ethiopia'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Emergency Contact</span>
                      <span className="font-medium text-slate-800">{patientData?.emergency_contact || 'None listed'}</span>
                    </div>
                  </div>
                </div>

                {/* Permanent Medical History & Clinical Profile Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <span>Permanent Medical History & Clinical Profile</span>
                  </h3>

                  {/* Drug Allergies Alert Banner */}
                  <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                    patientData?.allergies 
                      ? 'bg-rose-50 border-rose-200 text-rose-900' 
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  }`}>
                    {patientData?.allergies ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-xs uppercase tracking-wider block">
                        {patientData?.allergies ? 'KNOWN DRUG ALLERGIES (CRITICAL)' : 'DRUG ALLERGIES'}
                      </span>
                      <p className="text-xs mt-0.5 font-medium">
                        {patientData?.allergies || 'No known drug allergies (NKDA) recorded.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Chronic Medical Conditions */}
                    <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 block flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                        <span>Chronic Conditions & Past History</span>
                      </span>
                      <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {patientData?.medical_history || 'No pre-existing chronic conditions recorded on file.'}
                      </p>
                    </div>

                    {/* Current Regular Medications */}
                    <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-amber-600" />
                        <span>Current Regular Medications</span>
                      </span>
                      <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                        {patientData?.current_medications || 'No ongoing regular medications recorded on file.'}
                      </p>
                    </div>

                    {/* Intake Notes / Presenting Symptoms */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2 space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Receptionist Intake Notes & Presenting Complaints</span>
                      </span>
                      <p className="text-xs text-slate-800 leading-relaxed">
                        {patientData?.notes || 'Initial registration outpatient intake.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Past Visits & Clinical Encounters */}
            {activeTab === 'encounters' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>Clinical Visits & Doctor Diagnoses</span>
                </h3>

                {(!patientData?.visits || patientData.visits.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No previous visits recorded</p>
                    <p className="text-slate-400 mt-0.5">This patient has no recorded clinical visits in the database yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {patientData.visits.map((v) => {
                      const consult = v.consultations && v.consultations.length > 0 ? v.consultations[0] : null;
                      return (
                        <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                Visit #{v.id} &bull; {new Date(v.visit_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <StatusBadge status={v.status} size="sm" />
                            </div>
                            <span className="text-slate-500 font-medium">
                              Doctor: {v.doctor?.name || 'Assigned in Queue'}
                            </span>
                          </div>

                          <div className="text-slate-600">
                            <span className="font-semibold text-slate-700">Intake Reason:</span> {v.notes || 'Outpatient Consultation'}
                          </div>

                          {consult && (
                            <div className="mt-2 p-2.5 bg-white rounded-lg border border-brand-100 space-y-1">
                              <div className="font-bold text-brand-900 flex items-center gap-1">
                                <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
                                <span>Clinical Diagnosis: {consult.diagnosis || 'Pending / In Progress'}</span>
                              </div>
                              {consult.examination_findings && (
                                <div className="text-[11px] text-slate-700">
                                  <span className="font-semibold">Doctor Exam:</span> {consult.examination_findings}
                                </div>
                              )}
                              {consult.treatment_plan && (
                                <div className="text-[11px] text-emerald-800">
                                  <span className="font-semibold">Advice:</span> {consult.treatment_plan}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Permanent Card #{patientData?.card_number}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close File
              </button>
            </div>
          </>
        )}

      </div>
    </Modal>
  );
};

export default PatientMedicalFileModal;
