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
  FileCheck2,
  KeyRound,
  LogOut,
  X
} from 'lucide-react';

export const Sidebar = ({ sidebarOpen, setSidebarOpen, onOpenPasswordModal }) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Build role-based navigation sections
  const getNavSections = () => {
    const sections = [];

    // Receptionist Navigation
    if (role === 'receptionist' || role === 'admin') {
      sections.push({
        title: 'Reception',
        items: [
          { to: '/reception', label: 'Reception Home', icon: LayoutDashboard },
          { to: '/reception/register', label: 'Register Patient', icon: UserPlus },
          { to: '/reception/patients', label: 'Patients List', icon: Users },
          { to: '/reception/payments', label: 'Collect Payments', icon: CreditCard },
          { to: '/reception/services', label: 'Service Prices', icon: Tag },
          { to: '/reception/reports', label: 'Revenue & Reports', icon: FileSpreadsheet }
        ]
      });
    }

    // Doctor Navigation
    if (role === 'doctor' || role === 'admin') {
      sections.push({
        title: 'Doctor',
        items: [
          { to: '/doctor', label: 'Doctor Home', icon: LayoutDashboard },
          { to: '/doctor/queue', label: 'Waiting Patients', icon: Stethoscope },
          { to: '/doctor/patients', label: 'Patient Records', icon: Users },
          { to: '/doctor/results', label: 'Lab Test Results', icon: FileCheck2 },
          { to: '/doctor/appointments', label: 'Follow-up Visits', icon: Calendar },
          { to: '/doctor/reports', label: 'Clinical Reports', icon: FileSpreadsheet }
        ]
      });
    }

    // Laboratory Navigation
    if (role === 'lab_tech' || role === 'admin') {
      sections.push({
        title: 'Laboratory',
        items: [
          { to: '/laboratory', label: 'Laboratory Home', icon: LayoutDashboard },
          { to: '/laboratory/requests', label: 'Lab Tests Queue', icon: TestTubes },
          { to: '/laboratory/reports', label: 'Lab Analytics', icon: FileSpreadsheet }
        ]
      });
    }

    // Administrator Navigation
    if (role === 'admin') {
      sections.push({
        title: 'Clinic Administration',
        items: [
          { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
          { to: '/admin/users', label: 'Staff Members', icon: ShieldCheck },
          { to: '/admin/services', label: 'Service Prices', icon: Tag },
          { to: '/admin/reports', label: 'Executive Reports', icon: FileSpreadsheet },
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 sm:w-72 lg:w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="py-4 px-3 space-y-6">
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex items-center justify-between px-3 pb-2 border-b border-slate-100 lg:hidden">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
                        `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-brand-600' : 'text-slate-400'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Account & Actions Box in Sidebar (Visible especially on mobile) */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/80 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-xs shrink-0">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
              <div className="text-[10px] text-slate-500 capitalize truncate">{user.role?.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenPasswordModal}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-semibold text-slate-700 bg-white hover:text-brand-600 hover:bg-brand-50 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Change your password"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-600 shrink-0" />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSidebarOpen(false);
                logout();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 text-[11px] font-semibold text-slate-700 bg-white hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Sign out of system"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Tena CMS v1.0</span>
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
