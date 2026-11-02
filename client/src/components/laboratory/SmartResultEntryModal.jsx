import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  TestTubes, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  X, 
  Save, 
  Send, 
  Eye, 
  FileEdit,
  Clock, 
  User, 
  FileText,
  Activity,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const SmartResultEntryModal = ({ isOpen, onClose, request, onSuccess }) => {
  if (!isOpen || !request) return null;

  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [allTemplates, setAllTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Parameter state: { [paramId]: value }
  const [parameterValues, setParameterValues] = useState({});
  const [observations, setObservations] = useState('');
  const [findingsSummary, setFindingsSummary] = useState('');
  
  // Submission & UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Compute primary test title
  const primaryTestName = request.items?.map(it => it.service?.service_name).join(', ') || 'Laboratory Examination';
  const patient = request.patient || {};

  // Fetch templates & auto-match
  useEffect(() => {
    const initTemplates = async () => {
      try {
        setLoadingTemplate(true);
        setSubmitError('');

        // 1. Fetch all templates for selector
        const listRes = await api.get('/laboratory/templates?active_only=true');
        const templates = listRes.data.templates || [];
        setAllTemplates(templates);

        // 2. Check if this request already has existing result (draft or final)
        const existingResult = request.results && request.results.length > 0 ? request.results[0] : null;

        if (existingResult && existingResult.results_data?.parameters) {
          // Pre-populate from existing draft
          const existingData = existingResult.results_data;
          const matched = templates.find(t => t.template_code === existingData.template_code) || templates[0];
          setSelectedTemplate(matched);

          const initialVals = {};
          existingData.parameters.forEach(p => {
            initialVals[p.id] = p.value !== undefined ? p.value : '';
          });
          setParameterValues(initialVals);
          setObservations(existingResult.observations || matched?.default_observations || '');
          setFindingsSummary(existingResult.findings || '');
        } else {
          // 3. Auto-match matching template
          const matchRes = await api.get(`/laboratory/template-for-test?test_name=${encodeURIComponent(primaryTestName)}`);
          const matched = matchRes.data.template || templates[0];
          setSelectedTemplate(matched);
          loadTemplateDefaults(matched);
        }
      } catch (err) {
        console.error('Failed to initialize laboratory templates:', err);
        setSubmitError('Failed to load laboratory template. Please try selecting one manually.');
      } finally {
        setLoadingTemplate(false);
      }
    };

    initTemplates();
  }, [request.id]);

  const loadTemplateDefaults = (template) => {
    if (!template) return;
    const initialVals = {};
    const params = template.parameters || [];
    params.forEach(p => {
      if (p.default_value !== undefined) {
        initialVals[p.id] = p.default_value;
      } else {
        initialVals[p.id] = '';
      }
    });
    setParameterValues(initialVals);
    setObservations(template.default_observations || '');
  };

  const handleTemplateChange = (templateCode) => {
    const tmpl = allTemplates.find(t => t.template_code === templateCode);
    if (tmpl) {
      setSelectedTemplate(tmpl);
      loadTemplateDefaults(tmpl);
    }
  };

  const handleParamChange = (paramId, value) => {
    setParameterValues(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  /**
   * Evaluates abnormal flag for current parameter and patient
   */
  const evaluateFlag = (param, value) => {
    if (value === undefined || value === null || value === '') return 'NORMAL';
    const strVal = String(value).trim();

    if (param.type === 'options') {
      if (param.abnormal_options && Array.isArray(param.abnormal_options)) {
        const isAbn = param.abnormal_options.some(abn => strVal.toLowerCase().includes(abn.toLowerCase()));
        if (isAbn) {
          if (strVal.toLowerCase().includes('invalid')) return 'INVALID';
          if (strVal.toLowerCase().includes('positive') || strVal.toLowerCase().includes('reactive')) return 'POSITIVE';
          return 'ABNORMAL';
        }
      }
      if (strVal.toLowerCase().includes('positive') || strVal.toLowerCase().includes('reactive')) return 'POSITIVE';
      if (strVal.toLowerCase().includes('invalid')) return 'INVALID';
      return 'NORMAL';
    }

    if (param.type === 'numeric') {
      const num = parseFloat(strVal);
      if (isNaN(num)) return 'NORMAL';

      let min = param.ref_min;
      let max = param.ref_max;

      if (patient.sex?.toLowerCase() === 'female' && param.female_min !== undefined) {
        min = param.female_min;
        max = param.female_max;
      } else if (patient.sex?.toLowerCase() === 'male' && param.male_min !== undefined) {
        min = param.male_min;
        max = param.male_max;
      } else if (patient.age !== null && patient.age < 15 && param.pediatric_min !== undefined) {
        min = param.pediatric_min;
        max = param.pediatric_max;
      }

      if (param.critical_low !== undefined && num < param.critical_low) return 'CRITICAL_LOW';
      if (param.critical_high !== undefined && num > param.critical_high) return 'CRITICAL_HIGH';

      if (min !== undefined && num < min) return 'LOW';
      if (max !== undefined && num > max) return 'HIGH';
      return 'NORMAL';
    }

    return 'NORMAL';
  };

  const getFlagBadge = (flag) => {
    switch (flag) {
      case 'POSITIVE':
      case 'ABNORMAL':
      case 'CRITICAL_HIGH':
      case 'HIGH':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">High / Positive</span>;
      case 'CRITICAL_LOW':
      case 'LOW':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">Low</span>;
      case 'INVALID':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">Invalid</span>;
      case 'NORMAL':
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Normal</span>;
    }
  };

  // Build structured payload for submission
  const buildPayload = (submissionStatus) => {
    const paramsList = selectedTemplate?.parameters || [];
    const structuredParams = paramsList.map(p => {
      const val = parameterValues[p.id] !== undefined ? parameterValues[p.id] : '';
      const flag = evaluateFlag(p, val);
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        value: val,
        unit: p.unit || '',
        ref_range_text: p.ref_range_text || (p.ref_min !== undefined ? `${p.ref_min} - ${p.ref_max}` : 'Negative'),
        flag
      };
    });

    const summary = structuredParams
      .filter(p => p.value !== '')
      .map(p => `${p.name}: ${p.value} ${p.unit || ''} [${p.flag}]`)
      .join('; ');

    return {
      request_id: request.id,
      test_name: selectedTemplate?.template_name || primaryTestName,
      status: submissionStatus, // 'draft' | 'final'
      findings: summary || 'Structured examination recorded.',
      observations: observations,
      mark_sent_to_doctor: submissionStatus === 'final',
      results_data: {
        template_code: selectedTemplate?.template_code,
        template_name: selectedTemplate?.template_name,
        specimen_type: selectedTemplate?.specimen_type,
        department: selectedTemplate?.department,
        parameters: structuredParams,
        observations: observations,
        patient_summary: {
          full_name: patient.full_name,
          card_number: patient.card_number,
          age: patient.age,
          sex: patient.sex
        }
      }
    };
  };

  const handleSave = async (submissionStatus) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = buildPayload(submissionStatus);
      const res = await api.post('/laboratory/results', payload);

      if (onSuccess) {
        onSuccess(res.data.result, submissionStatus);
      }
      onClose();
    } catch (err) {
      console.error('Failed to submit results:', err);
      setSubmitError(err.response?.data?.message || 'Failed to save test findings. Please review input.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const templateParams = selectedTemplate?.parameters || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200 shrink-0">
              <TestTubes className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Structured Laboratory Result Entry
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  Ready-Made Template
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Patient: <span className="font-semibold text-slate-800">{patient.full_name}</span> ({patient.card_number}) &bull; {patient.sex}, {patient.age ? `${patient.age} yrs` : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              {showPreview ? <FileEdit className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPreview ? 'Edit Form' : 'Preview Report'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clinical Info & Template Selector Bar */}
        <div className="px-5 sm:px-6 py-3 bg-purple-50/50 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-purple-900 shrink-0">Requested Tests:</span>
            <span className="font-semibold text-slate-800 truncate">{primaryTestName}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label className="font-semibold text-purple-900">Result Template:</label>
            <select
              value={selectedTemplate?.template_code || ''}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="bg-white border border-purple-200 rounded-xl px-2.5 py-1 text-xs font-bold text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {allTemplates.map(t => (
                <option key={t.id} value={t.template_code}>
                  {t.template_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          {loadingTemplate ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading structured template and reference ranges...
            </div>
          ) : showPreview ? (
            /* PREVIEW REPORT MODE */
            <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 text-xs">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="font-black text-sm text-slate-900">{selectedTemplate?.template_name}</h4>
                  <p className="text-[11px] text-slate-500">Specimen: {selectedTemplate?.specimen_type || 'Venous Blood'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
                  Laboratory Diagnostic Preview
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Parameter Investigation</th>
                      <th className="py-2.5 px-3">Observed Result</th>
                      <th className="py-2.5 px-3">Diagnostic Flag</th>
                      <th className="py-2.5 px-3">Units</th>
                      <th className="py-2.5 px-3">Biological Reference Interval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {templateParams.map(p => {
                      const val = parameterValues[p.id];
                      const flag = evaluateFlag(p, val);
                      return (
                        <tr key={p.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-2.5 px-3 font-bold font-mono text-slate-950">
                            {val !== undefined && val !== '' ? String(val) : <span className="text-slate-300 italic">Unrecorded</span>}
                          </td>
                          <td className="py-2.5 px-3">{getFlagBadge(flag)}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{p.unit || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                            {p.ref_range_text || (p.ref_min !== undefined ? `${p.ref_min} - ${p.ref_max}` : 'Negative')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {observations && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold block text-slate-900 mb-0.5">Technician Observations:</span>
                  <span>{observations}</span>
                </div>
              )}
            </div>
          ) : (
            /* INTERACTIVE STRUCTURED ENTRY FORM */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-700 uppercase tracking-wider">
                  {selectedTemplate?.template_name} ({templateParams.length} Parameters)
                </span>
                <span>Specimen: <strong>{selectedTemplate?.specimen_type}</strong></span>
              </div>

              {/* Parameters Grid */}
              <div className="space-y-3">
                {templateParams.map((param, idx) => {
                  const currentValue = parameterValues[param.id] !== undefined ? parameterValues[param.id] : '';
                  const flag = evaluateFlag(param, currentValue);

                  return (
                    <div 
                      key={param.id} 
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 bg-white transition-all space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900">{param.name}</span>
                        </div>

                        {/* Reference Range Notice & Computed Flag Badge */}
                        <div className="flex items-center gap-2.5 self-start sm:self-auto">
                          <span className="text-[11px] text-slate-500 font-mono">
                            Ref: <strong>{param.ref_range_text || (param.ref_min !== undefined ? `${param.ref_min} - ${param.ref_max} ${param.unit || ''}` : 'Negative')}</strong>
                          </span>
                          {currentValue !== '' && getFlagBadge(flag)}
                        </div>
                      </div>

                      {/* Input based on type */}
                      {param.type === 'options' ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {param.options.map(opt => {
                            const isSelected = currentValue === opt;
                            const isAbnormalOption = param.abnormal_options?.includes(opt) || opt.toLowerCase().includes('positive') || opt.toLowerCase().includes('invalid');

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleParamChange(param.id, opt)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                                  isSelected
                                    ? isAbnormalOption
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                      : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : param.type === 'numeric' ? (
                        <div className="flex items-center gap-3 pt-1">
                          <div className="relative max-w-xs w-full">
                            <input
                              type="number"
                              step="0.01"
                              value={currentValue}
                              onChange={(e) => handleParamChange(param.id, e.target.value)}
                              placeholder={`Enter value (${param.unit || ''})`}
                              className={`w-full rounded-xl border px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 ${
                                flag === 'HIGH' || flag === 'CRITICAL_HIGH'
                                  ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-rose-500/20'
                                  : flag === 'LOW' || flag === 'CRITICAL_LOW'
                                  ? 'border-amber-400 bg-amber-50/40 text-amber-900 focus:ring-amber-500/20'
                                  : 'border-slate-300 bg-white text-slate-900 focus:border-purple-500 focus:ring-purple-500/20'
                              }`}
                            />
                            {param.unit && (
                              <span className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400 pointer-events-none">
                                {param.unit}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-500">
                            {flag === 'HIGH' && <span className="text-rose-600 font-bold">Above Normal Range</span>}
                            {flag === 'LOW' && <span className="text-amber-600 font-bold">Below Normal Range</span>}
                            {flag === 'NORMAL' && currentValue !== '' && <span className="text-emerald-600 font-medium">Within Normal Limits</span>}
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => handleParamChange(param.id, e.target.value)}
                          placeholder="Enter observed findings..."
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Technician Remarks & Methodology Notes */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Technician Clinical Observations & Methodology Remarks
                </label>
                <textarea
                  rows="2"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Sample quality, equipment calibration, microscopic sediment, test strip lot number..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Strict Human Verification Enforced &bull; Never AI Interpreted</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            {/* Save Draft Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('draft')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer disabled:opacity-60"
              title="Save draft findings without sending to doctor"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{isSubmitting ? 'Saving...' : 'Save Draft'}</span>
            </button>

            {/* Finalize & Submit Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave('final')}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Finalize & Send to Doctor'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SmartResultEntryModal;
