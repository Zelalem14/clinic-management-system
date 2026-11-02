import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { 
  TestTubes, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  FileText, 
  Layers, 
  FlaskConical, 
  Activity,
  ChevronRight,
  Info
} from 'lucide-react';

export const LabTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Edit / Details Modal State
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // Create Template Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    template_code: '',
    template_name: '',
    department: 'Clinical Chemistry',
    specimen_type: 'Serum / Whole Blood',
    default_observations: '',
    parameters: [
      {
        id: 'result_value',
        name: 'Result',
        type: 'numeric',
        unit: 'mg/dL',
        ref_min: 70,
        ref_max: 100,
        ref_range_text: '70 - 100 mg/dL'
      }
    ]
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/laboratory/templates');
      setTemplates(res.data.templates || []);
    } catch (err) {
      console.error('Failed to load lab templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const departments = [
    'ALL',
    'Hematology',
    'Parasitology',
    'Clinical Chemistry',
    'Serology / Immunology',
    'Urinalysis'
  ];

  const filteredTemplates = templates.filter(t => {
    const matchesDept = selectedDept === 'ALL' || 
      (t.department && t.department.toLowerCase().includes(selectedDept.toLowerCase().split(' ')[0]));
    
    if (!matchesDept) return false;
    if (!search.trim()) return true;

    const query = search.toLowerCase();
    return (
      t.template_name?.toLowerCase().includes(query) ||
      t.template_code?.toLowerCase().includes(query) ||
      t.specimen_type?.toLowerCase().includes(query) ||
      t.department?.toLowerCase().includes(query)
    );
  });

  const handleOpenEdit = (tmpl) => {
    // Deep clone template to avoid direct mutations
    setEditingTemplate(JSON.parse(JSON.stringify(tmpl)));
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
    setIsEditModalOpen(true);
  };

  const handleUpdateParameter = (paramIdx, field, val) => {
    if (!editingTemplate) return;
    const updated = { ...editingTemplate };
    const params = [...updated.parameters];
    params[paramIdx] = {
      ...params[paramIdx],
      [field]: val
    };
    updated.parameters = params;
    setEditingTemplate(updated);
  };

  const handleAddParameterToEditing = () => {
    if (!editingTemplate) return;
    const newParam = {
      id: `param_${Date.now()}`,
      name: 'New Test Parameter',
      type: 'numeric',
      unit: '',
      ref_min: 0,
      ref_max: 100,
      ref_range_text: '0 - 100'
    };
    setEditingTemplate({
      ...editingTemplate,
      parameters: [...(editingTemplate.parameters || []), newParam]
    });
  };

  const handleRemoveParameterFromEditing = (paramIdx) => {
    if (!editingTemplate) return;
    const updated = { ...editingTemplate };
    const params = [...updated.parameters];
    params.splice(paramIdx, 1);
    updated.parameters = params;
    setEditingTemplate(updated);
  };

  const handleSaveEditingTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      await api.put(`/laboratory/templates/${editingTemplate.id}`, {
        template_name: editingTemplate.template_name,
        department: editingTemplate.department,
        specimen_type: editingTemplate.specimen_type,
        default_observations: editingTemplate.default_observations,
        parameters: editingTemplate.parameters,
        is_active: editingTemplate.is_active
      });

      setSaveSuccessMsg('Template and reference ranges saved successfully!');
      fetchTemplates();
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to update template:', err);
      setSaveErrorMsg(err.response?.data?.message || 'Failed to update laboratory template.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');

    try {
      await api.post('/laboratory/templates', {
        template_code: createForm.template_code,
        template_name: createForm.template_name,
        department: createForm.department,
        specimen_type: createForm.specimen_type,
        default_observations: createForm.default_observations,
        parameters: createForm.parameters
      });

      setIsCreateModalOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error('Failed to create template:', err);
      setSaveErrorMsg(err.response?.data?.message || 'Failed to create template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-purple-600" />
            <span>Predefined Laboratory Test Templates</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standard clinical investigation templates with biological reference intervals, qualitative result options, and sex/age-dependent ranges.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSaveErrorMsg('');
            setSaveSuccessMsg('');
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Template</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          {departments.map(dept => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedDept === dept
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates (e.g. CBC, Malaria, Urine)..."
            className="w-full bg-white rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <LoadingSpinner message="Loading laboratory templates..." />
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <TestTubes className="w-12 h-12 mx-auto text-slate-300" />
          <p className="font-bold text-slate-700">No laboratory test templates found.</p>
          <p className="text-xs text-slate-500">Try adjusting your department filter or search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(tmpl => {
            const params = tmpl.parameters || [];
            const numericCount = params.filter(p => p.type === 'numeric').length;
            const optionsCount = params.filter(p => p.type === 'options').length;

            return (
              <div 
                key={tmpl.id} 
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {tmpl.template_code}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {tmpl.department}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1">
                    {tmpl.template_name}
                  </h3>

                  <div className="text-xs text-slate-500 space-y-1 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Specimen:</span>
                      <span className="font-medium text-slate-700">{tmpl.specimen_type || 'Serum / Whole Blood'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Parameters:</span>
                      <span className="font-semibold text-purple-700">
                        {params.length} {params.length === 1 ? 'analyte' : 'analytes'} 
                        ({numericCount > 0 ? `${numericCount} numeric` : ''}{numericCount > 0 && optionsCount > 0 ? ', ' : ''}{optionsCount > 0 ? `${optionsCount} qualitative` : ''})
                      </span>
                    </div>
                  </div>

                  {/* Parameter preview tags */}
                  <div className="mt-3 flex flex-wrap gap-1 max-h-16 overflow-hidden">
                    {params.slice(0, 4).map(p => (
                      <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
                        {p.name}
                      </span>
                    ))}
                    {params.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                        +{params.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    tmpl.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tmpl.is_active ? 'Active' : 'Inactive'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tmpl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configure Ranges</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Template & Ranges Modal */}
      {isEditModalOpen && editingTemplate && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Configure Template: ${editingTemplate.template_name}`}
          subtitle={`Code: ${editingTemplate.template_code} • Department: ${editingTemplate.department}`}
        >
          <form onSubmit={handleSaveEditingTemplate} className="space-y-5 text-xs">
            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {saveErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            {/* General Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Name</label>
                <input
                  type="text"
                  value={editingTemplate.template_name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, template_name: e.target.value })}
                  className="w-full bg-white rounded-lg border border-slate-300 p-2 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editingTemplate.department}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, department: e.target.value })}
                  className="w-full bg-white rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specimen Required</label>
                <input
                  type="text"
                  value={editingTemplate.specimen_type}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, specimen_type: e.target.value })}
                  className="w-full bg-white rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Methodology / Remarks</label>
                <input
                  type="text"
                  value={editingTemplate.default_observations || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, default_observations: e.target.value })}
                  placeholder="e.g. Standard immuno-chromatographic assay..."
                  className="w-full bg-white rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>

            {/* Parameters & Reference Intervals Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Parameters & Biological Reference Ranges</h4>
                  <p className="text-[11px] text-slate-500">Configure adult, sex-specific (male/female), or qualitative choices for each analyte.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddParameterToEditing}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Parameter</span>
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {(editingTemplate.parameters || []).map((p, idx) => (
                  <div key={p.id || idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-mono text-[10px] text-slate-400 w-5">{idx + 1}.</span>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => handleUpdateParameter(idx, 'name', e.target.value)}
                          placeholder="Parameter Name"
                          className="flex-1 font-bold text-slate-900 rounded border border-slate-200 px-2 py-1 text-xs"
                        />
                      </div>

                      <select
                        value={p.type}
                        onChange={(e) => handleUpdateParameter(idx, 'type', e.target.value)}
                        className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
                      >
                        <option value="numeric">Numeric (Range)</option>
                        <option value="options">Options (Qualitative)</option>
                        <option value="text">Free Text</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveParameterFromEditing(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        title="Remove Parameter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Numeric Range Fields */}
                    {p.type === 'numeric' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-100">
                        <div>
                          <label className="text-slate-400 block text-[10px]">Unit</label>
                          <input
                            type="text"
                            value={p.unit || ''}
                            onChange={(e) => handleUpdateParameter(idx, 'unit', e.target.value)}
                            placeholder="e.g. g/dL, mg/dL"
                            className="w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block text-[10px]">Ref Interval Display</label>
                          <input
                            type="text"
                            value={p.ref_range_text || ''}
                            onChange={(e) => handleUpdateParameter(idx, 'ref_range_text', e.target.value)}
                            placeholder="e.g. 70 - 100 mg/dL"
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block text-[10px]">Normal Min</label>
                          <input
                            type="number"
                            step="any"
                            value={p.ref_min !== undefined ? p.ref_min : ''}
                            onChange={(e) => handleUpdateParameter(idx, 'ref_min', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block text-[10px]">Normal Max</label>
                          <input
                            type="number"
                            step="any"
                            value={p.ref_max !== undefined ? p.ref_max : ''}
                            onChange={(e) => handleUpdateParameter(idx, 'ref_max', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
                          />
                        </div>

                        {/* Sex-Specific Row if applicable */}
                        <div className="col-span-2 sm:col-span-4 bg-slate-50 p-2 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-slate-500 block text-[10px]">Male Min/Max</label>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                step="any"
                                placeholder="Min"
                                value={p.male_min !== undefined ? p.male_min : ''}
                                onChange={(e) => handleUpdateParameter(idx, 'male_min', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-1/2 rounded border border-slate-200 px-1.5 py-0.5 text-xs font-mono"
                              />
                              <input
                                type="number"
                                step="any"
                                placeholder="Max"
                                value={p.male_max !== undefined ? p.male_max : ''}
                                onChange={(e) => handleUpdateParameter(idx, 'male_max', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-1/2 rounded border border-slate-200 px-1.5 py-0.5 text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-slate-500 block text-[10px]">Female Min/Max</label>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                step="any"
                                placeholder="Min"
                                value={p.female_min !== undefined ? p.female_min : ''}
                                onChange={(e) => handleUpdateParameter(idx, 'female_min', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-1/2 rounded border border-slate-200 px-1.5 py-0.5 text-xs font-mono"
                              />
                              <input
                                type="number"
                                step="any"
                                placeholder="Max"
                                value={p.female_max !== undefined ? p.female_max : ''}
                                onChange={(e) => handleUpdateParameter(idx, 'female_max', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-1/2 rounded border border-slate-200 px-1.5 py-0.5 text-xs font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-slate-500 block text-[10px]">Critical Low Threshold</label>
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g. 50"
                              value={p.critical_low !== undefined ? p.critical_low : ''}
                              onChange={(e) => handleUpdateParameter(idx, 'critical_low', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full rounded border border-slate-200 px-1.5 py-0.5 text-xs font-mono text-rose-700 font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-slate-500 block text-[10px]">Critical High Threshold</label>
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g. 450"
                              value={p.critical_high !== undefined ? p.critical_high : ''}
                              onChange={(e) => handleUpdateParameter(idx, 'critical_high', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-full rounded border border-slate-200 px-1.5 py-0.5 text-xs font-mono text-rose-700 font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Qualitative Options Fields */}
                    {p.type === 'options' && (
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div>
                          <label className="text-slate-500 block text-[10px]">Selectable Options (comma-separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(p.options) ? p.options.join(', ') : (p.options || '')}
                            onChange={(e) => {
                              const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              handleUpdateParameter(idx, 'options', opts);
                            }}
                            placeholder="e.g. Positive, Negative, Invalid"
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-slate-500 block text-[10px]">Abnormal / Reactive Triggers (comma-separated)</label>
                          <input
                            type="text"
                            value={Array.isArray(p.abnormal_options) ? p.abnormal_options.join(', ') : (p.abnormal_options || '')}
                            onChange={(e) => {
                              const abns = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              handleUpdateParameter(idx, 'abnormal_options', abns);
                            }}
                            placeholder="e.g. Positive, Reactive, Invalid"
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-rose-700 font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingTemplate.is_active}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span className="font-semibold text-slate-700">Template is Active for Testing</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving Changes...' : 'Save Template'}</span>
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Create New Custom Template Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Laboratory Test Template"
          subtitle="Add a new standardized test template to your clinic's diagnostic library."
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {saveErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Template Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TMPL-CRP, TMPL-PSA"
                  value={createForm.template_code}
                  onChange={(e) => setCreateForm({ ...createForm, template_code: e.target.value.toUpperCase() })}
                  className="w-full bg-white rounded-lg border border-slate-300 p-2 font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Test Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C-Reactive Protein (CRP)"
                  value={createForm.template_name}
                  onChange={(e) => setCreateForm({ ...createForm, template_name: e.target.value })}
                  className="w-full bg-white rounded-lg border border-slate-300 p-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="w-full bg-white rounded-lg border border-slate-300 p-2 text-xs font-semibold"
                >
                  <option value="Clinical Chemistry">Clinical Chemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Parasitology">Parasitology</option>
                  <option value="Serology / Immunology">Serology / Immunology</option>
                  <option value="Urinalysis">Urinalysis</option>
                  <option value="Microbiology">Microbiology</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Specimen Required</label>
                <input
                  type="text"
                  value={createForm.specimen_type}
                  onChange={(e) => setCreateForm({ ...createForm, specimen_type: e.target.value })}
                  placeholder="e.g. Venous Blood (EDTA), Serum"
                  className="w-full bg-white rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Observations / Methodology</label>
              <textarea
                rows="2"
                value={createForm.default_observations}
                onChange={(e) => setCreateForm({ ...createForm, default_observations: e.target.value })}
                placeholder="e.g. Immunoturbidimetric test performed on automated clinical chemistry analyzer..."
                className="w-full bg-white rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>

            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-xs">
              <span className="font-bold block">Note:</span>
              Once created, you can customize detailed parameters, reference intervals, and qualitative triggers in the template manager anytime.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? 'Creating...' : 'Create Template'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LabTemplates;
