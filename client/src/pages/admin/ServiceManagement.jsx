import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2,
  DollarSign
} from 'lucide-react';

export const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    service_code: '',
    service_name: '',
    category: 'laboratory',
    description: '',
    price: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchServices = async () => {
    try {
      setLoading(true);
      let query = `?search=${encodeURIComponent(search)}`;
      if (categoryFilter) query += `&category=${categoryFilter}`;

      const res = await api.get(`/services${query}`);
      setServices(res.data.services || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [categoryFilter]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setFormData({
      service_code: '',
      service_name: '',
      category: 'laboratory',
      description: '',
      price: '',
      is_active: true
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setFormData({
      service_code: service.service_code,
      service_name: service.service_name,
      category: service.category,
      description: service.description || '',
      price: service.price,
      is_active: service.is_active
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.service_name || formData.price === '') {
      setFormError('Service name and price are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingService) {
        // Update existing service & price
        await api.put(`/services/${editingService.id}`, formData);
      } else {
        // Create new service
        await api.post('/services', formData);
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (service) => {
    try {
      await api.put(`/services/${service.id}`, { is_active: !service.is_active });
      fetchServices();
    } catch (err) {
      alert('Failed to update service status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-600" />
            <span>Clinic Services & Fee Configuration</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Centrally manage medical procedure fees, laboratory test prices, consultations, and card fees.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchServices()}
            placeholder="Search service name, code, or description..."
            className="w-full bg-white rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="card_registration">Patient Card & Registration</option>
          <option value="consultation">Doctor Consultations</option>
          <option value="laboratory">Laboratory Tests</option>
          <option value="ultrasound">Ultrasound Scans</option>
          <option value="x_ray">Digital X-Ray</option>
          <option value="procedure">Minor Clinical Procedures</option>
        </select>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading clinic services..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Service Code</th>
                  <th className="px-6 py-3.5">Service Name & Description</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No services found.
                    </td>
                  </tr>
                ) : (
                  services.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-brand-700">
                        {s.service_code}
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <div className="font-semibold text-slate-900">{s.service_name}</div>
                        <div className="text-xs text-slate-400 line-clamp-1">{s.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {s.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-extrabold text-slate-900 text-sm">
                        ${parseFloat(s.price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(s)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                            s.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {s.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Price</span>
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

      {/* Add / Edit Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingService ? `Edit Service Price: ${editingService.service_code}` : 'Add New Clinic Service'}
          subtitle="Configure medical pricing rules and active status"
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Service Code
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingService)}
                  value={formData.service_code}
                  onChange={(e) => setFormData({ ...formData, service_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. LAB-CBC-02"
                  className="w-full rounded-xl border border-slate-300 p-2 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs bg-white"
                >
                  <option value="card_registration">Card & Registration</option>
                  <option value="consultation">Doctor Consultation</option>
                  <option value="laboratory">Laboratory Test</option>
                  <option value="ultrasound">Ultrasound Sonography</option>
                  <option value="x_ray">Digital X-Ray</option>
                  <option value="procedure">Minor Clinical Procedure</option>
                  <option value="other">Other Service</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Name
              </label>
              <input
                type="text"
                required
                value={formData.service_name}
                onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                placeholder="e.g. Complete Blood Count (CBC)"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Standard Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g. 25.00"
                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-bold font-mono text-brand-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Clinical Description
              </label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Medical scope, equipment used, turnaround..."
                className="w-full rounded-xl border border-slate-300 p-2 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded text-brand-600 border-slate-300"
              />
              <label htmlFor="is_active" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Active in Clinic Service Catalog
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};

export default ServiceManagement;
