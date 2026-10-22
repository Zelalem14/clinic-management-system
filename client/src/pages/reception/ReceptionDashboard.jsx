import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Users, 
  Clock, 
  CreditCard, 
  DollarSign, 
  UserPlus, 
  CheckCircle2, 
  ArrowRight, 
  Search,
  Activity,
  AlertCircle
} from 'lucide-react';

export const ReceptionDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, visitsRes, paymentsRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/visits?limit=10'),
        api.get('/payments?status=pending&limit=5')
      ]);

      setStats(statsRes.data.stats.reception);
      setRecentVisits(visitsRes.data.visits);
      setPendingPayments(paymentsRes.data.payments);
    } catch (err) {
      console.error('Failed to load reception dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading Reception Dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Reception Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Patient registration, card numbers, fee recording, and department routing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/reception/register"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </Link>
          <Link
            to="/reception/payments"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-sm font-semibold rounded-xl transition-all"
          >
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>Approve Payments ({stats?.pending_payments_count || 0})</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Registrations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patients Today</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{stats?.today_patients || 0}</span>
            <span className="text-xs text-slate-400 ml-2">Total: {stats?.total_patients || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-blue-500" /> Registered today
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
            <span className="text-3xl font-extrabold text-amber-600">{stats?.pending_payments_count || 0}</span>
            <span className="text-xs text-slate-400 ml-2">(${parseFloat(stats?.pending_payments_amount || 0).toFixed(2)})</span>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Requires receptionist verification
          </p>
        </div>

        {/* Today's Revenue Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-600">
              ${parseFloat(stats?.today_revenue || 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Total {stats?.approved_payments_count || 0} approved
          </p>
        </div>
      </div>

      {/* Grid: Pending Payments Queue & Recent Patient Visits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Patient Visits */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Patient Visits</h2>
              <p className="text-xs text-slate-500">Live patient flow and stage progression</p>
            </div>
            <Link to="/reception/patients" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>View All Patients</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Card #</th>
                  <th className="px-6 py-3">Patient Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentVisits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">
                      No visits recorded today yet.
                    </td>
                  </tr>
                ) : (
                  recentVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-brand-700">
                        {visit.patient?.card_number}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-slate-900">{visit.patient?.full_name}</div>
                        <div className="text-xs text-slate-400 capitalize">{visit.patient?.sex}, {visit.patient?.age} yrs</div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-600">
                        {visit.patient?.phone}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={visit.status} />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          to={`/reception/patients?search=${encodeURIComponent(visit.patient?.card_number || '')}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          View File
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
                    <span className="text-sm font-bold text-amber-700">${parseFloat(payment.total_amount).toFixed(2)}</span>
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
                      Approve & Send &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReceptionDashboard;
