import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  CreditCard,
  Tag,
  Stethoscope,
  TestTubes,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Calendar,
  Activity,
  Layers,
  FileCheck2,
  Radiation
} from 'lucide-react';

export const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Build role-based navigation sections
  const getNavSections = () => {
    const sections = [];

    // Receptionist Navigation
    if (role === 'receptionist' || role === 'admin') {
      sections.push({
        title: 'Reception & Billing',
        items: [
          { to: '/reception', label: 'Reception Dashboard', icon: LayoutDashboard },
          { to: '/reception/register', label: 'Register Patient', icon: UserPlus },
          { to: '/reception/patients', label: 'Patient Directory', icon: Users },
          { to: '/reception/payments', label: 'Payment Approvals', icon: CreditCard },
          { to: '/reception/services', label: 'Clinic Price List', icon: Tag }
        ]
      });
    }

    // Doctor Navigation
    if (role === 'doctor' || role === 'admin') {
      sections.push({
        title: 'Clinical Consultations',
        items: [
          { to: '/doctor', label: 'Doctor Dashboard', icon: LayoutDashboard },
          { to: '/doctor/queue', label: 'Waiting Patients Queue', icon: Stethoscope },
          { to: '/doctor/patients', label: 'Patient Medical Records', icon: Users },
          { to: '/doctor/results', label: 'Lab & Procedure Results', icon: FileCheck2 },
          { to: '/doctor/appointments', label: 'Follow-up Appointments', icon: Calendar }
        ]
      });
    }

    // Laboratory Navigation
    if (role === 'lab_tech' || role === 'admin') {
      sections.push({
        title: 'Laboratory Diagnostic',
        items: [
          { to: '/laboratory', label: 'Laboratory Dashboard', icon: LayoutDashboard },
          { to: '/laboratory/requests', label: 'Test Requests Queue', icon: TestTubes }
        ]
      });
    }

    // Radiology & Diagnostic Procedures (Ultrasound / X-ray)
    sections.push({
      title: 'Procedures & Imaging',
      items: [
        { to: '/procedures', label: 'Ultrasound & X-Ray Queue', icon: Radiation }
      ]
    });

    // Administrator Navigation
    if (role === 'admin') {
      sections.push({
        title: 'Administration & Governance',
        items: [
          { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
          { to: '/admin/reports', label: 'Revenue & Audit Reports', icon: FileSpreadsheet },
          { to: '/admin/services', label: 'Service & Pricing Rules', icon: Tag },
          { to: '/admin/users', label: 'Staff Accounts & Roles', icon: ShieldCheck },
          { to: '/admin/settings', label: 'Clinic Information', icon: Settings }
        ]
      });
    }

    return sections;
  };

  const navSections = getNavSections();

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="py-4 px-3 space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {section.title}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/reception' || item.to === '/doctor' || item.to === '/laboratory' || item.to === '/admin'}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 ${
                              isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          <span>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span>St. Jude CMS v1.0</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
