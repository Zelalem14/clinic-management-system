import React from 'react';
import { 
  Printer, 
  X, 
  TestTubes, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  User, 
  Stethoscope, 
  Building2, 
  FileText,
  ShieldCheck
} from 'lucide-react';

export const PrintableLabReportModal = ({ isOpen, onClose, reportData }) => {
  if (!isOpen || !reportData) return null;

  const result = reportData;
  const request = result.request || {};
  const patient = result.patient || request.patient || result.results_data?.patient_summary || {};
  const doctor = request.doctor || {};
  const technician = result.technician || {};
  const resultsData = result.results_data || {};
  const parameters = resultsData.parameters || [];
  const hasStructuredParams = Array.isArray(parameters) && parameters.length > 0;

  const handlePrint = () => {
    window.print();
  };

  const getFlagStyle = (flag) => {
    switch (flag) {
      case 'POSITIVE':
      case 'ABNORMAL':
      case 'CRITICAL_HIGH':
      case 'HIGH':
        return {
          badge: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold',
          text: 'text-rose-700 font-bold'
        };
      case 'CRITICAL_LOW':
      case 'LOW':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          text: 'text-amber-800 font-bold'
        };
      case 'INVALID':
        return {
          badge: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
          text: 'text-purple-800 font-bold'
        };
      case 'NORMAL':
      default:
        return {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
          text: 'text-slate-800 font-medium'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="relative bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <TestTubes className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-sm">Diagnostic Laboratory Investigation Report</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
              result.status === 'draft' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              {result.status === 'draft' ? 'Preliminary Draft' : 'Official Final Report'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-6 sm:p-10 space-y-6 printable-card bg-white text-slate-800">
          {/* Header Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center text-white shadow-md">
                  <TestTubes className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    TENA SPECIALTY CLINIC & DIAGNOSTIC CENTER
                  </h1>
                  <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    Department of Clinical Pathology & Medical Laboratory
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Bole Medhanialem Road, Addis Ababa, Ethiopia • Tel: +251 11 661 0000 / +251 91 123 4567
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right text-[11px] font-mono text-slate-600 bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                <div className="font-bold text-slate-900">MOH License: MOH/AA/2024/981</div>
                <div>Lab Ref #: <span className="font-bold font-mono text-purple-700">LAB-RES-{result.id}</span></div>
                <div>Order Req #: <span className="font-mono">REQ-{result.request_id || request.id}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-center">
              <span className="inline-block px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-slate-900 text-white">
                {result.status === 'draft' ? 'LABORATORY REPORT (PRELIMINARY DRAFT)' : 'CERTIFIED LABORATORY INVESTIGATION REPORT'}
              </span>
            </div>
          </div>

          {/* Patient Demographics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Patient Full Name</span>
              <span className="font-bold text-slate-900 text-sm block mt-0.5">{patient.full_name || 'Patient'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Medical Card Number</span>
              <span className="font-mono font-bold text-purple-700 text-sm block mt-0.5">{patient.card_number || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Age / Biological Sex</span>
              <span className="font-semibold text-slate-800 capitalize block mt-0.5">
                {patient.age !== undefined ? `${patient.age} yrs` : 'N/A'} • {patient.sex || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Attending Physician</span>
              <span className="font-semibold text-slate-800 block mt-0.5">{doctor.name || 'Assigned Physician'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Investigation / Test</span>
              <span className="font-bold text-slate-900 block mt-0.5">{result.test_name || resultsData.template_name || 'Laboratory Test'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Specimen Type</span>
              <span className="font-semibold text-slate-800 block mt-0.5">{resultsData.specimen_type || 'Whole Blood / Serum'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Date Requested</span>
              <span className="font-mono text-slate-700 block mt-0.5">
                {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Report Issued Date</span>
              <span className="font-mono font-semibold text-slate-900 block mt-0.5">
                {result.completed_at ? new Date(result.completed_at).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
          </div>

          {/* Test Results Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Diagnostic Findings & Parameter Values</span>
              </h3>
              {resultsData.department && (
                <span className="text-xs font-semibold text-slate-500 capitalize">
                  Department: <strong className="text-slate-800">{resultsData.department}</strong>
                </span>
              )}
            </div>

            {hasStructuredParams ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Parameter / Test Analyte</th>
                      <th className="px-4 py-2.5">Result / Finding</th>
                      <th className="px-4 py-2.5">Unit</th>
                      <th className="px-4 py-2.5">Reference Interval</th>
                      <th className="px-4 py-2.5 text-center">Clinical Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parameters.map((param, index) => {
                      const flagStyle = getFlagStyle(param.flag);
                      const isAbnormal = param.flag && param.flag !== 'NORMAL';

                      return (
                        <tr 
                          key={param.id || index}
                          className={isAbnormal ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'}
                        >
                          <td className="px-4 py-2.5 font-semibold text-slate-900">
                            {param.name}
                          </td>
                          <td className={`px-4 py-2.5 font-mono text-sm ${flagStyle.text}`}>
                            {param.value !== undefined && param.value !== '' ? String(param.value) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 font-mono">
                            {param.unit || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 font-mono">
                            {param.ref_range_text || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {param.flag ? (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${flagStyle.badge}`}>
                                {param.flag}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Fallback to unstructured / legacy findings */
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs whitespace-pre-wrap text-slate-900 leading-relaxed">
                <span className="font-bold font-sans text-slate-700 block mb-2 uppercase text-[11px] tracking-wider">
                  Test Findings:
                </span>
                {result.findings}
              </div>
            )}
          </div>

          {/* Observations & Methodology */}
          {result.observations && (
            <div className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-200 text-xs">
              <span className="font-bold text-purple-950 block mb-1 uppercase tracking-wider text-[11px]">
                Laboratory Technologist Observations & Methodology Notes:
              </span>
              <p className="text-slate-700 leading-relaxed">{result.observations}</p>
            </div>
          )}

          {/* Attending Doctor Clinical Review / Notes */}
          {result.doctor_comments ? (
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-blue-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
                  <span>Attending Doctor's Clinical Review & Plan:</span>
                </span>
                {result.doctor_reviewed_at && (
                  <span className="text-[10px] font-mono text-blue-700">
                    Reviewed: {new Date(result.doctor_reviewed_at).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">{result.doctor_comments}</p>
            </div>
          ) : null}

          {/* Legal / Medical Verification Footer */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Laboratory Technologist
              </span>
              <div className="mt-4 border-b border-dashed border-slate-300 pb-1 flex items-center justify-between">
                <span className="font-bold text-slate-900">{technician.name || 'Assefa Zegeye, B.Sc. MLS'}</span>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>VERIFIED</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Department of Clinical Pathology • Licensed Medical Laboratory Technologist
              </p>
            </div>

            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Attending Physician / Clinical Sign-off
              </span>
              <div className="mt-4 border-b border-dashed border-slate-300 pb-1 flex items-center justify-between">
                <span className="font-bold text-slate-900">{doctor.name || 'Attending Physician'}</span>
                <span className="text-[10px] text-purple-700 font-semibold font-mono">
                  {result.doctor_reviewed_at ? 'REVIEWED' : 'PENDING REVIEW'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Medical Officer / Clinical Director Sign-off
              </p>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            This laboratory report is an authentic diagnostic document issued by Tena Specialty Clinic. Results relate strictly to the specimen analyzed. Contact the laboratory desk for verification.
          </div>
        </div>

        {/* Modal Footer Controls (Hidden on Print) */}
        <div className="no-print bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report (Ctrl+P)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintableLabReportModal;
