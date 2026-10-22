import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Calendar, Clock, CheckCircle2, User, Phone } from 'lucide-react';

export const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleMarkCompleted = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'completed' });
      fetchAppointments();
    } catch (err) {
      alert('Failed to update appointment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-600" />
          <span>Scheduled Follow-up Appointments</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review returning patients scheduled for clinical review and post-treatment assessment.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading appointment book..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Appointment Date</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Appointment Type</th>
                  <th className="px-6 py-3.5">Clinical Review Notes</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No follow-up appointments currently scheduled.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                        {a.appointment_date}
                        <div className="text-[10px] text-slate-400 font-normal">{a.appointment_time || 'Morning Session'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{a.patient?.full_name}</div>
                        <div className="text-xs text-brand-700 font-mono">{a.patient?.card_number}</div>
                      </td>
                      <td className="px-6 py-4 text-xs capitalize">
                        {a.type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-xs max-w-xs text-slate-700">
                        {a.notes || 'Routine follow-up'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          a.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-sky-50 text-sky-700 border border-sky-200'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {a.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleMarkCompleted(a.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Mark Seen</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
