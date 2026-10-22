import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Tag, Search } from 'lucide-react';

export const ClinicPriceList = () => {
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        let query = `?active_only=true&search=${encodeURIComponent(search)}`;
        if (category) query += `&category=${category}`;
        const res = await api.get(`/services${query}`);
        setServices(res.data.services || []);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchServices();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-600" />
            <span>Clinic Procedure & Service Price Reference</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official tariff and fees schedule for patient inquiries and invoice billing.
          </p>
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none"
        >
          <option value="">All Service Departments</option>
          <option value="card_registration">Card & Registration</option>
          <option value="consultation">Consultation Fees</option>
          <option value="laboratory">Laboratory Tests</option>
          <option value="ultrasound">Ultrasound Sonography</option>
          <option value="x_ray">Digital X-Ray</option>
          <option value="procedure">Minor Clinical Procedures</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading price guide..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Service Name</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Clinical Scope</th>
                  <th className="px-6 py-3.5 text-right">Configured Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-brand-700">
                      {s.service_code}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {s.service_name}
                    </td>
                    <td className="px-6 py-4 text-xs uppercase font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {s.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-sm">
                      {s.description || 'Standard clinic procedure'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                      ${parseFloat(s.price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicPriceList;
