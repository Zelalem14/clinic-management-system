import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PatientMedicalFileModal from '../../components/common/PatientMedicalFileModal';
import { 
  Users, 
  Clock, 
  CreditCard, 
  DollarSign, 
  UserPlus, 
  CheckCircle2, 
  ArrowRight, 
  Activity,
  AlertCircle,
  AlertTriangle,
  Search,
  Calendar,
  FileText,
  CalendarPlus,
  ShieldCheck,
  HeartPulse,
  Eye
} from 'lucide-react';

export const ReceptionDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickSearch, setQuickSearch] = useState('');
  const [activeTableTab, setActiveTableTab] = useState('visits'); // 'visits' | 'patients'

  // Patient Medical File Modal state
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, visitsRes, patientsRes, paymentsRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/visits?limit=10'),
        api.get('/patients?limit=10'),
        api.get('/payments?status=pending&limit=5')
      ]);

      setStats(statsRes.data.stats.reception);
      setRecentVisits(visitsRes.data.visits || []);
      setRecentPatients(patientsRes.data.patients || []);
      setPendingPayments(paymentsRes.data.payments || []);
    } catch (err) {
      console.error('Failed to load reception dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleQuickSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/reception/patients?search=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/reception/patients');
    }
  };

  if (loading) return <LoadingSpinner message="Loading Reception Dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Reception Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Patient registration, permanent records, card fee renewal (ETB), and doctor queue dispatch.
          </p>
        </div>

        {/* Quick Search & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <form onSubmit={handleQuickSearchSubmit} className="relative min-w-[240px] sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search previous patient..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 bg-slate-50/50"
            />
          </form>

          <div className="flex items-center gap-2">
            <Link
              to="/reception/register"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Patient</span>
            </Link>
            <Link
              to="/reception/payments"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap"
            >
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Payments ({stats?.pending_payments_count || 0})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Permanent Registered Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Permanent Patients</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.total_patients || 0}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +{stats?.today_patients || 0} today
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Permanent records stored in database</span>
          </p>
        </div>

        {/* Patients Waiting for Doctor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Doctor Queue</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.waiting_for_doctor || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Consultation fees verified
          </p>
        </div>

        {/* Pending Fee Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-600">{stats?.pending_payments_count || 0}</span>
            <span className="text-xs text-slate-400 ml-2">({parseFloat(stats?.pending_payments_amount || 0).toFixed(2)} ETB)</span>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Requires receptionist verification
          </p>
        </div>

        {/* Today's Revenue Collected in ETB */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-600">
              {parseFloat(stats?.today_revenue || 0).toFixed(2)} <span className="text-sm font-bold text-slate-500">ETB</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Total {stats?.approved_payments_count || 0} approved
          </p>
        </div>
      </div>

      {/* Grid: Main Table & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Visits & Patients Directory Tabs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 gap-3">
            {/* Table Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTableTab('visits')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTableTab === 'visits' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today's Patient Visits ({recentVisits.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTableTab('patients')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTableTab === 'patients' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Registered Patients ({stats?.total_patients || recentPatients.length})
              </button>
            </div>

            <Link to="/reception/patients" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto">
              <span>Full Patient Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            {activeTableTab === 'visits' ? (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Card #</th>
                    <th className="px-5 py-3">Patient Name</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {recentVisits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium text-slate-600">No visits recorded today yet.</p>
                        <p className="text-xs text-slate-400 mt-0.5">Click "All Registered Patients" tab to view permanent patient files or register a returning visit.</p>
                      </td>
                    </tr>
                  ) : (
                    recentVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-brand-700">
                          {visit.patient?.card_number}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900">{visit.patient?.full_name}</div>
                          <div className="text-[11px] text-slate-400 capitalize">{visit.patient?.sex}, {visit.patient?.age} yrs</div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600 font-mono">
                          {visit.patient?.phone}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={visit.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatientForModal(visit.patient);
                              setShowPatientModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Medical File</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Card Number</th>
                    <th className="px-5 py-3">Full Name & Clinical History</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Registered Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {recentPatients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                        No patients registered yet.
                      </td>
                    </tr>
                  ) : (
                    recentPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-brand-700">
                          {p.card_number}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900">{p.full_name}</div>
                          <div className="text-[11px] text-slate-400 capitalize">{p.sex}, {p.age ? `${p.age} yrs` : 'N/A'}</div>
                          {p.allergies && (
                            <div className="text-[10px] text-rose-700 font-medium flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3 shrink-0 text-rose-600" /> Allergy: {p.allergies}
                            </div>
                          )}
                          {p.medical_history && (
                            <div className="text-[10px] text-blue-700 font-medium flex items-center gap-1 mt-0.5">
                              <HeartPulse className="w-3 h-3 shrink-0 text-blue-600" /> History: {p.medical_history}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600 font-mono">
                          {p.phone}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {p.registration_date || 'Permanent'}
                        </td>
                        <td className="px-5 py-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatientForModal(p);
                              setShowPatientModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>File</span>
                          </button>
                          <Link
                            to={`/reception/patients?search=${encodeURIComponent(p.card_number)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Return Visit</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right 1 Col: Urgent Pending Approvals */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Payments to Approve</h2>
              <p className="text-xs text-slate-500">Fees awaiting receipt verification</p>
            </div>
            <Link to="/reception/payments" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Manage All
            </Link>
          </div>

          <div className="p-4 flex-1 space-y-3 overflow-y-auto">
            {pendingPayments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700">All Payments Cleared</p>
                <p className="text-xs text-slate-400 mt-1">There are no pending fees awaiting reception approval.</p>
              </div>
            ) : (
              pendingPayments.map((payment) => (
                <div key={payment.id} className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-700">{payment.receipt_number}</span>
                    <span className="text-sm font-bold text-amber-700">{parseFloat(payment.total_amount).toFixed(2)} ETB</span>
                  </div>
                  <div className="text-xs font-medium text-slate-900">
                    {payment.patient?.full_name} ({payment.patient?.card_number})
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {payment.notes}
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-amber-100">
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      {payment.payment_method}
                    </span>
                    <Link
                      to="/reception/payments"
                      className="text-xs font-bold text-brand-600 hover:text-brand-700"
                    >
                      Approve &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Patient Medical File & Complete History Modal */}
      <PatientMedicalFileModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        patient={selectedPatientForModal}
        onPatientUpdated={(updated) => {
          setRecentPatients(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
          setRecentVisits(prev => prev.map(v => v.patient?.id === updated.id ? { ...v, patient: { ...v.patient, ...updated } } : v));
          setSelectedPatientForModal(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
        }}
        canEdit={true}
      />
    </div>
  );
};

export default ReceptionDashboard;
