import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/common/Modal';
import PatientMedicalFileModal from '../../components/common/PatientMedicalFileModal';
import { 
  UserPlus, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  ArrowRight, 
  Calendar, 
  Phone, 
  User, 
  HeartPulse,
  Search,
  CalendarPlus,
  ShieldCheck,
  Clock,
  Eye,
  Edit3,
  Pill,
  FileText,
  AlertTriangle
} from 'lucide-react';

export const PatientRegistration = () => {
  const navigate = useNavigate();

  // Pricing configs retrieved from database in Ethiopian Birr
  const [fees, setFees] = useState({ cardFee: 150.00, consultFee: 350.00 });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [doctors, setDoctors] = useState([]);

  // Returning Patient Quick Search
  const [lookupQuery, setLookupQuery] = useState('');
  const [isSearchingLookup, setIsSearchingLookup] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    age: '',
    sex: 'male',
    phone: '',
    address: '',
    emergency_contact: '',
    doctor_id: '',
    consultation_type: 'General Consultation',
    payment_method: 'cash',
    transaction_reference: '',
    approve_payment_now: true,
    allergies: '',
    medical_history: '',
    current_medications: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingPatientAlert, setExistingPatientAlert] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Return Visit Modal for Existing Patient
  const [showReturnVisitModal, setShowReturnVisitModal] = useState(false);
  const [selectedReturningPatient, setSelectedReturningPatient] = useState(null);
  const [returningCardFeeStatus, setReturningCardFeeStatus] = useState(null);
  const [returnVisitForm, setReturnVisitForm] = useState({
    consultation_type: 'Follow-up Consultation',
    payment_method: 'cash',
    approve_payment_now: true,
    transaction_reference: '',
    notes: ''
  });
  const [isSubmittingReturnVisit, setIsSubmittingReturnVisit] = useState(false);
  const [returnVisitSuccess, setReturnVisitSuccess] = useState('');

  // Medical File Modal state for viewing & editing history in-place
  const [showMedicalFileModal, setShowMedicalFileModal] = useState(false);
  const [selectedMedicalFilePatient, setSelectedMedicalFilePatient] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, doctorsRes] = await Promise.all([
          api.get('/services?active_only=true'),
          api.get('/users?role=doctor&is_active=true')
        ]);

        const services = servicesRes.data.services || [];
        const cardSrv = services.find(s => s.category === 'card_registration');
        const consultSrv = services.find(s => s.category === 'consultation');

        setFees({
          cardFee: cardSrv ? parseFloat(cardSrv.price) : 150.00,
          consultFee: consultSrv ? parseFloat(consultSrv.price) : 350.00
        });

        const activeDoctors = doctorsRes.data.users || [];
        setDoctors(activeDoctors);
        if (activeDoctors.length > 0) {
          setFormData(prev => ({
            ...prev,
            doctor_id: prev.doctor_id || activeDoctors[0].id,
            consultation_type: prev.consultation_type || activeDoctors[0].name
          }));
        }
      } catch (err) {
        console.error('Failed to load pricing or doctors:', err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchData();
  }, []);

  const totalFee = fees.cardFee + fees.consultFee;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'dob' && value) {
      const birthYear = new Date(value).getFullYear();
      const currentYear = new Date().getFullYear();
      const calcAge = Math.max(0, currentYear - birthYear);
      setFormData(prev => ({ ...prev, age: calcAge }));
    }
  };

  // Lookup Returning Patient
  const handleLookupPatient = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setIsSearchingLookup(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await api.get(`/patients?search=${encodeURIComponent(lookupQuery.trim())}`);
      const list = res.data.patients || [];
      if (list.length > 0) {
        const patient = list[0];
        // Fetch card fee status
        const statusRes = await api.get(`/patients/${patient.id}/card-fee-status`);
        setLookupResult({
          patient,
          cardFeeStatus: statusRes.data.cardFeeStatus
        });
      } else {
        setLookupError(`No existing patient found matching "${lookupQuery}". You can register them below as a new patient.`);
      }
    } catch (err) {
      console.error('Failed to lookup patient:', err);
      setLookupError('Could not connect to database to search patient records.');
    } finally {
      setIsSearchingLookup(false);
    }
  };

  const openReturnVisit = (patient, cardFeeStatus) => {
    setSelectedReturningPatient(patient);
    setReturningCardFeeStatus(cardFeeStatus);
    setReturnVisitSuccess('');
    setShowReturnVisitModal(true);
  };

  const handleCreateReturnVisit = async (e) => {
    e.preventDefault();
    if (!selectedReturningPatient) return;

    setIsSubmittingReturnVisit(true);
    try {
      const res = await api.post('/visits', {
        patient_id: selectedReturningPatient.id,
        ...returnVisitForm
      });

      setReturnVisitSuccess(`Return visit created successfully! Routed to ${res.data.visit.status === 'waiting_consultation' ? 'Doctor Queue' : 'Payment Queue'}.`);
      setTimeout(() => {
        setShowReturnVisitModal(false);
        navigate('/reception');
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initiate return visit.');
    } finally {
      setIsSubmittingReturnVisit(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.sex) {
      setError('Please provide full name, sex, and phone number.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setExistingPatientAlert(null);

    try {
      const response = await api.post('/patients', formData);
      if (!response.data?.patient?.id || !response.data?.patient?.card_number) {
        throw new Error('Database did not return confirmation for patient record insertion.');
      }
      setSuccessData(response.data);
      setShowSuccessModal(true);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.patient) {
        setExistingPatientAlert({
          patient: err.response.data.patient,
          cardFeeStatus: err.response.data.cardFeeStatus,
          message: err.response.data.message
        });
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to permanently save patient record to database. Please verify connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-brand-600" />
            <span>Patient Intake & Registration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enroll a new patient or look up previous registered patients for follow-up visits.
          </p>
        </div>
        <div className="bg-brand-50 border border-brand-200 px-4 py-2 rounded-xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">New Patient Package</span>
          <div className="text-lg font-extrabold text-brand-900">{totalFee.toFixed(2)} ETB</div>
        </div>
      </div>

      {/* Quick Lookup for Returning / Previously Registered Patients */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-600" />
            <span>Check if Patient is Already Registered (Returning Patient)</span>
          </h2>
          <span className="text-[11px] text-slate-400">Card #, Full Name, or Phone</span>
        </div>

        <form onSubmit={handleLookupPatient} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="e.g. CLN-2026-0001, Dawit Tadesse, or 0912345678"
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingLookup}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            {isSearchingLookup ? 'Searching...' : 'Find Patient'}
          </button>
        </form>

        {lookupError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{lookupError}</span>
          </div>
        )}

        {lookupResult && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Patient Found in Permanent Database
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {lookupResult.patient.full_name} ({lookupResult.patient.card_number})
                </h3>
                <p className="text-xs text-slate-600">
                  Phone: {lookupResult.patient.phone} &bull; Registered: {lookupResult.patient.registration_date || 'Permanent File'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openReturnVisit(lookupResult.patient, lookupResult.cardFeeStatus)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Start Return Visit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMedicalFilePatient(lookupResult.patient);
                    setShowMedicalFileModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 text-brand-700 border border-brand-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-brand-600" />
                  <span>Medical File / History</span>
                </button>
              </div>
            </div>

            {/* Permanent Medical History Summary Strip */}
            <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>Recorded Patient Medical History (Permanent DB)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="font-semibold text-rose-700">Allergies: </span>
                  <span className="text-slate-800">{lookupResult.patient.allergies || 'No known drug allergies (NKDA)'}</span>
                </div>
                <div>
                  <span className="font-semibold text-blue-700">Past History: </span>
                  <span className="text-slate-800">{lookupResult.patient.medical_history || 'None recorded'}</span>
                </div>
                <div>
                  <span className="font-semibold text-amber-700">Current Meds: </span>
                  <span className="text-slate-800">{lookupResult.patient.current_medications || 'None recorded'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Intake Notes: </span>
                  <span className="text-slate-800">{lookupResult.patient.notes || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Card Fee Status Notice */}
            {lookupResult.cardFeeStatus && (
              <div className="text-xs p-2.5 bg-white/80 rounded-lg border border-emerald-200 text-slate-700 flex items-center justify-between">
                <span>Card Validity: <strong>{lookupResult.cardFeeStatus.statusText}</strong></span>
                <span className="font-bold text-brand-700">Fee Due: {lookupResult.cardFeeStatus.feeToCharge.toFixed(2)} ETB</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Existing Patient Alert Banner (Shown if user tries to submit an already registered patient) */}
      {existingPatientAlert && (
        <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Patient Already Recorded in Permanent Database!
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {existingPatientAlert.message}
              </p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-sky-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div>
              <span className="font-bold text-slate-900 block">{existingPatientAlert.patient.full_name}</span>
              <span className="text-slate-500 font-mono">Card: {existingPatientAlert.patient.card_number} | Phone: {existingPatientAlert.patient.phone}</span>
            </div>
            {existingPatientAlert.cardFeeStatus && (
              <span className={`px-2 py-1 rounded-lg font-bold text-[11px] ${
                existingPatientAlert.cardFeeStatus.isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {existingPatientAlert.cardFeeStatus.statusBadge}: {existingPatientAlert.cardFeeStatus.statusText}
              </span>
            )}
          </div>

          {/* Quick Medical History Preview */}
          <div className="p-3 bg-white/90 rounded-xl border border-sky-200 text-xs space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
              <span>Current Medical History On File</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="font-semibold text-rose-700">Allergies: </span>
                <span className="text-slate-800">{existingPatientAlert.patient.allergies || 'None recorded'}</span>
              </div>
              <div>
                <span className="font-semibold text-blue-700">Past History: </span>
                <span className="text-slate-800">{existingPatientAlert.patient.medical_history || 'None recorded'}</span>
              </div>
              <div>
                <span className="font-semibold text-amber-700">Current Meds: </span>
                <span className="text-slate-800">{existingPatientAlert.patient.current_medications || 'None recorded'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => openReturnVisit(existingPatientAlert.patient, existingPatientAlert.cardFeeStatus)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Initiate Return Visit for this Patient</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedMedicalFilePatient(existingPatientAlert.patient);
                setShowMedicalFileModal(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 text-brand-700 border border-brand-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <HeartPulse className="w-3.5 h-3.5 text-brand-600" />
              <span>Medical File / Edit History</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* New Patient Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Demographics */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" />
            <span>1. New Patient Demographics</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Dawit Tadesse or Almaz Bekele"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sex <span className="text-rose-500">*</span>
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Age
              </label>
              <input
                type="number"
                name="age"
                min="0"
                max="130"
                value={formData.age}
                onChange={handleChange}
                placeholder="Years"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (Primary) <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +251 91 100 0000"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Residential Address / Sub-City
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. Bole Sub-City, Woreda 03, Addis Ababa"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="Name and Phone number"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Encounter Details */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>2. Clinical Intake Details</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Medical Doctor
              </label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none bg-white"
              >
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} (General Practitioner)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consultation Service Category
              </label>
              <select
                name="consultation_type"
                value={formData.consultation_type}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none bg-white"
              >
                <option value="General Consultation">General Medical Consultation</option>
                <option value="Specialist Physician">Specialist Physician Consultation</option>
                <option value="Emergency Walk-in">Emergency Walk-in / Triage</option>
                <option value="Pediatric Consultation">Pediatric Consultation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-700 uppercase tracking-wider mb-1">
                Known Drug Allergies
              </label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g. Penicillin, Sulfa, Aspirin (or leave blank if None)"
                className="w-full rounded-xl border border-rose-300 px-3 py-2 text-sm text-rose-900 placeholder:text-rose-300 focus:border-rose-500 focus:outline-none bg-rose-50/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Chronic Medical Conditions
              </label>
              <input
                type="text"
                name="medical_history"
                value={formData.medical_history}
                onChange={handleChange}
                placeholder="e.g. Hypertension, Diabetes, Asthma"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Current Regular Medications
              </label>
              <input
                type="text"
                name="current_medications"
                value={formData.current_medications}
                onChange={handleChange}
                placeholder="e.g. Metformin 500mg, Enalapril 10mg, Ventolin inhaler"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Presenting Symptoms / Reception Notes
              </label>
              <textarea
                name="notes"
                rows="2"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Describe chief complaint or reason for visit..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Billing & Immediate Payment Verification */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>3. Ethiopian Birr (ETB) Registration Fee Schedule</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-500 block">Digital Card Registration Fee</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">{fees.cardFee.toFixed(2)} ETB</span>
              <span className="text-[10px] text-emerald-700 font-medium">Valid for 10 days of free follow-ups</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-500 block">Doctor Consultation Fee</span>
              <span className="text-base font-bold text-slate-900 mt-0.5 block">{fees.consultFee.toFixed(2)} ETB</span>
              <span className="text-[10px] text-slate-400">General Physician Clinical Encounter</span>
            </div>

            <div className="p-3 rounded-xl border border-brand-200 bg-brand-50/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 block">Total Due</span>
              <span className="text-xl font-extrabold text-brand-900 mt-0.5 block">{totalFee.toFixed(2)} ETB</span>
              <span className="text-[10px] text-brand-600 font-semibold">Includes Official Receipt & Card</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Channel
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none bg-white"
              >
                <option value="cash">Cash (Direct Counter)</option>
                <option value="telebirr">Telebirr Digital</option>
                <option value="bank_transfer">Commercial Bank of Ethiopia (CBE)</option>
                <option value="card">Point of Sale (POS Card)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Transaction Reference / Slip #
              </label>
              <input
                type="text"
                name="transaction_reference"
                value={formData.transaction_reference}
                onChange={handleChange}
                placeholder="e.g. Telebirr SMS TXN ID or Bank Ref (optional)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Verification Checkbox */}
          <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/50 flex items-start gap-3">
            <input
              type="checkbox"
              id="approve_payment_now"
              name="approve_payment_now"
              checked={formData.approve_payment_now}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="approve_payment_now" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
              <span className="font-bold text-slate-900 block">Confirm Receipt & Approve Payment Immediately</span>
              Check this box if the {totalFee.toFixed(2)} ETB fee has been received. 
              Once approved, the patient will immediately appear in the Doctor's Waiting Queue.
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/reception')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-60 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Registering Patient...' : 'Complete Patient Registration'}</span>
          </button>
        </div>

      </form>

      {/* Return Visit Modal (When returning patient is selected) */}
      {showReturnVisitModal && selectedReturningPatient && (
        <Modal
          isOpen={showReturnVisitModal}
          onClose={() => setShowReturnVisitModal(false)}
          title={`Initiate Return Visit: ${selectedReturningPatient.full_name}`}
          subtitle={`Permanent Card Number: ${selectedReturningPatient.card_number}`}
        >
          <form onSubmit={handleCreateReturnVisit} className="space-y-4 text-sm">
            {returnVisitSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{returnVisitSuccess}</span>
              </div>
            )}

            {/* 10-Day Fee Breakdown */}
            {returningCardFeeStatus && (
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                returningCardFeeStatus.isFree ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Card Fee Status (10-Day Policy):</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    returningCardFeeStatus.isFree ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200/80 text-amber-900'
                  }`}>
                    {returningCardFeeStatus.statusBadge}
                  </span>
                </div>
                <div className="text-[11px] font-medium">
                  {returningCardFeeStatus.statusText}
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between font-bold text-slate-900">
                  <span>Total Due for Return Visit:</span>
                  <span className="text-sm font-extrabold text-brand-700">
                    {(350.00 + returningCardFeeStatus.feeToCharge).toFixed(2)} ETB
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consultation Type
              </label>
              <select
                value={returnVisitForm.consultation_type}
                onChange={(e) => setReturnVisitForm({ ...returnVisitForm, consultation_type: e.target.value })}
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
                Payment Channel
              </label>
              <select
                value={returnVisitForm.payment_method}
                onChange={(e) => setReturnVisitForm({ ...returnVisitForm, payment_method: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="cash">Cash (Direct Counter)</option>
                <option value="telebirr">Telebirr Digital</option>
                <option value="bank_transfer">Commercial Bank of Ethiopia (CBE)</option>
                <option value="card">Point of Sale (Card)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Chief Complaint / Visit Notes
              </label>
              <textarea
                rows="2"
                value={returnVisitForm.notes}
                onChange={(e) => setReturnVisitForm({ ...returnVisitForm, notes: e.target.value })}
                placeholder="Reason for returning visit..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="p-3 rounded-xl border border-brand-200 bg-brand-50/50 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="approve_return_now"
                checked={returnVisitForm.approve_payment_now}
                onChange={(e) => setReturnVisitForm({ ...returnVisitForm, approve_payment_now: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="approve_return_now" className="text-xs text-slate-700 cursor-pointer">
                <span className="font-bold text-slate-900 block">Approve Payment Immediately</span>
                Route patient directly to Doctor's Waiting Queue.
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReturnVisitModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReturnVisit}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>{isSubmittingReturnVisit ? 'Saving...' : 'Register Return Visit'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <Modal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/reception');
          }}
          title="Patient Registered Successfully"
          subtitle="Official patient file and permanent card generated"
        >
          <div className="space-y-4 printable-card">
            <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-emerald-950">Registration Complete</h3>
              <p className="text-xs text-emerald-800 mt-1">
                Patient recorded permanently at Tena Specialty Clinic, Addis Ababa.
              </p>
              
              <div className="mt-4 inline-block bg-white px-6 py-3 rounded-xl border-2 border-brand-500 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Permanent Card Number</div>
                <div className="text-2xl font-mono font-extrabold text-brand-700">
                  {successData.patient.card_number}
                </div>
              </div>
            </div>

            {/* Receipt Details Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-semibold text-slate-900">{successData.patient.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-semibold text-slate-900 font-mono">{successData.patient.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-semibold text-slate-900">{successData.payment.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Paid:</span>
                <span className="font-bold text-brand-700">{parseFloat(successData.payment.total_amount).toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className={`font-bold capitalize ${successData.payment.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {successData.payment.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Queue Routing:</span>
                <span className="font-bold text-brand-700">
                  {successData.visit.status === 'waiting_consultation' ? "Doctor Waiting Queue (Ready)" : "Reception Payment Queue (Pending)"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Card & Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/reception');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <span>Return to Reception</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Patient Medical File Modal for Quick Review & History Updates */}
      <PatientMedicalFileModal
        isOpen={showMedicalFileModal}
        onClose={() => setShowMedicalFileModal(false)}
        patient={selectedMedicalFilePatient}
        onPatientUpdated={(updated) => {
          setSelectedMedicalFilePatient(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
          if (lookupResult && lookupResult.patient?.id === updated.id) {
            setLookupResult(prev => ({
              ...prev,
              patient: { ...prev.patient, ...updated }
            }));
          }
          if (existingPatientAlert && existingPatientAlert.patient?.id === updated.id) {
            setExistingPatientAlert(prev => ({
              ...prev,
              patient: { ...prev.patient, ...updated }
            }));
          }
        }}
        canEdit={true}
      />

    </div>
  );
};

export default PatientRegistration;
