import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CreditCard, 
  Stethoscope, 
  TestTubes, 
  ShieldCheck
} from 'lucide-react';
import DoctorReports from '../doctor/DoctorReports';
import ReceptionReports from '../reception/ReceptionReports';
import LabReports from '../laboratory/LabReports';

export const AdminReports = () => {
  const [activeReportTab, setActiveReportTab] = useState('reception'); // 'reception' | 'doctor' | 'laboratory'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 shrink-0" />
            <span>Clinic Executive Reporting & Analytics Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Consolidated cross-department reporting: Reception financial audits, clinical disease cohorts, and laboratory throughput.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveReportTab('reception')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeReportTab === 'reception'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Reception & Revenue</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('doctor')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeReportTab === 'doctor'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Doctor & Diseases</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReportTab('laboratory')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeReportTab === 'laboratory'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TestTubes className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Laboratory</span>
          </button>
        </div>
      </div>

      {/* Embedded View based on Tab */}
      <div className="pt-2">
        {activeReportTab === 'reception' && <ReceptionReports />}
        {activeReportTab === 'doctor' && <DoctorReports />}
        {activeReportTab === 'laboratory' && <LabReports />}
      </div>
    </div>
  );
};

export default AdminReports;
