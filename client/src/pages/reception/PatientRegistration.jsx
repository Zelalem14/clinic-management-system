import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Modal from '../../components/common/Modal';
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
  HeartPulse
} from 'lucide-react';

export const PatientRegistration = () => {
  const navigate = useNavigate();

  // Pricing configs retrieved from database in Ethiopian Birr
  const [fees, setFees] = useState({ cardFee: 150.00, consultFee: 350.00 });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form Fields
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    age: '',
    sex: 'male',
    phone: '',
    address: '',
    emergency_contact: '',
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
  const [successData, setSuccessData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services?active_only=true');
        const services = res.data.services || [];
        const cardSrv = services.find(s => s.category === 'card_registration');
        const consultSrv = services.find(s => s.category === 'consultation');

        setFees({
          cardFee: cardSrv ? parseFloat(cardSrv.price) : 150.00,
          consultFee: consultSrv ? parseFloat(consultSrv.price) : 350.00
        });
      } catch (err) {
        console.error('Failed to load pricing:', err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchServices();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.phone || !formData.sex) {
      setError('Please provide full name, sex, and phone number.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await api.post('/patients', formData);
      setSuccessData(response.data);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register patient. Please verify details.');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-brand-600" />
            <span>New Patient Registration</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enroll a new patient, auto-generate unique card number, and record registration fees in Ethiopian Birr (ETB).
          </p>
        </div>
        <div className="bg-brand-50 border border-brand-200 px-4 py-2 rounded-xl text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Registration Package</span>
          <div className="text-lg font-extrabold text-brand-900">{totalFee.toFixed(2)} ETB</div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Demographics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-600" />
            <span>1. Patient Demographics</span>
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                name="age"
                min="0"
                max="130"
                value={formData.age}
                onChange={handleChange}
                placeholder="Calculated or manual"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+251 91 000 0000"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
                placeholder="Name, Relationship & Phone"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-brand-600" />
            <span>2. Initial Clinical Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Consultation Type
              </label>
              <select
                name="consultation_type"
                value={formData.consultation_type}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-white"
              >
                <option value="General Consultation">General Consultation (Dr. Abebe Kebede)</option>
                <option value="Pediatric Consultation">Pediatric Consultation</option>
                <option value="Specialist Physician">Specialist Physician</option>
                <option value="Antenatal Care (ANC)">Antenatal Care (ANC)</option>
                <option value="Follow-up Review">Follow-up Review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Known Drug Allergies
              </label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                placeholder="e.g. Penicillin, Sulfa, None"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Presenting Symptoms / Notes
              </label>
              <textarea
                name="notes"
                rows="2"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Brief reason for visit recorded by Meron Alemu at reception..."
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Fees & Payment Approval in ETB */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-600" />
            <span>3. Fee Breakdown & Payment Approval (Ethiopian Birr - ETB)</span>
          </h2>

          {/* Pricing Summary Table */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Patient Digital File & Card Registration Fee:</span>
              <span className="font-semibold text-slate-900">{fees.cardFee.toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Doctor Consultation Fee ({formData.consultation_type}):</span>
              <span className="font-semibold text-slate-900">{fees.consultFee.toFixed(2)} ETB</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
              <span>Total Registration Amount Due:</span>
              <span className="text-brand-700">{totalFee.toFixed(2)} ETB</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Paid By: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: 'cash' }))}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    formData.payment_method === 'cash'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xl mb-1">💵</div>
                  <div>Cash</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: 'telebirr' }))}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    formData.payment_method === 'telebirr'
                      ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-sm ring-2 ring-sky-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xl mb-1">📱</div>
                  <div>Telebirr</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_method: 'bank_transfer' }))}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    formData.payment_method === 'bank_transfer'
                      ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm ring-2 ring-purple-500/20'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xl mb-1">🏦</div>
                  <div>Bank (CBE)</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Writing / Note (e.g. Telebirr code, CBE slip number, or cash handed at counter)
              </label>
              <input
                type="text"
                name="transaction_reference"
                value={formData.transaction_reference}
                onChange={handleChange}
                placeholder="Optional payment reference or note..."
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
              className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
            />
            <label htmlFor="approve_payment_now" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
              <span className="font-bold text-slate-900 block">Confirm Receipt & Approve Payment Immediately</span>
              Check this box only if the {totalFee.toFixed(2)} ETB fee has been physically received or bank-verified. 
              Once approved, the patient will immediately appear in Dr. Abebe Kebede's Waiting Queue.
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/reception')}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
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

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <Modal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            navigate('/reception');
          }}
          title="Patient Registered Successfully"
          subtitle="Official patient file and card generated"
        >
          <div className="space-y-4 printable-card">
            <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-emerald-950">Registration Complete</h3>
              <p className="text-xs text-emerald-800 mt-1">
                Patient recorded at Tena Specialty Clinic, Addis Ababa.
              </p>
              
              <div className="mt-4 inline-block bg-white px-6 py-3 rounded-xl border-2 border-brand-500 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patient Card Number</div>
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
                <span className="font-semibold text-slate-900">{successData.patient.phone}</span>
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
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-all"
              >
                <span>Return to Reception</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default PatientRegistration;
