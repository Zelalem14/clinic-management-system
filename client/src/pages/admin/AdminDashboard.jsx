import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  DollarSign, 
  Users, 
  Stethoscope, 
  CreditCard, 
  TrendingUp, 
  PieChart, 
  ShieldCheck, 
  Settings, 
  Tag, 
  FileSpreadsheet,
  Calendar,
  Building2
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Loading Executive Dashboard..." />;

  const admin = stats?.admin || {};
  const paymentsByMethod = admin.payments_by_method || [];
  const revenueByCategory = admin.revenue_by_category || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-600" />
            <span>Administrator Executive Dashboard</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Clinic performance, consolidated revenue analysis, department queues, and system governance.
          </p>
        </div>

        {/* Quick Nav */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/services"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Tag className="w-4 h-4" />
            <span>Pricing Config</span>
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
          >
            <Users className="w-4 h-4" />
            <span>Staff Accounts</span>
          </Link>
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Audit & Reports</span>
          </Link>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Today</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-600">
              ${parseFloat(admin.today_revenue || 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Cleared verified counter fees
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-blue-700">
              ${parseFloat(admin.month_revenue || 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Current billing month</p>
        </div>

        {/* Outstanding Pending Fees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-600">
              ${parseFloat(admin.outstanding_pending_amount || 0).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-amber-600 font-medium mt-2">Awaiting reception confirmation</p>
        </div>

        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Patients</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">{admin.total_patients || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Active medical records</p>
        </div>
      </div>

      {/* Revenue Breakdown: By Method & By Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Revenue by Payment Method */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>Revenue by Payment Method</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">Approved Payments</span>
          </div>

          <div className="space-y-3">
            {paymentsByMethod.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No payment data recorded yet.</p>
            ) : (
              paymentsByMethod.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {item.payment_method.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.count} transactions</div>
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 font-mono">
                    ${parseFloat(item.total || 0).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue by Service Department */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span>Revenue by Service Category</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">Department Allocations</span>
          </div>

          <div className="space-y-3">
            {revenueByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No service allocation data recorded yet.</p>
            ) : (
              revenueByCategory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {item.allocation_type.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-purple-900 font-mono">
                    ${parseFloat(item.total || 0).toFixed(2)}
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

export default AdminDashboard;
