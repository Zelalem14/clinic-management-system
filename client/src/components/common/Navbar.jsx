import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  LogOut, 
  User, 
  Menu, 
  X, 
  ShieldCheck, 
  Stethoscope, 
  TestTubes, 
  ClipboardList
} from 'lucide-react';

export const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrator', icon: ShieldCheck, color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'doctor':
        return { label: 'Medical Doctor', icon: Stethoscope, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'lab_tech':
        return { label: 'Lab Technician', icon: TestTubes, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'receptionist':
      default:
        return { label: 'Receptionist', icon: ClipboardList, color: 'bg-sky-50 text-sky-700 border-sky-200' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  St. Jude Clinic
                </h1>
                <span className="text-xs text-slate-500 hidden sm:inline-block">
                  Integrated Medical & Diagnostic Center
                </span>
              </div>
            </div>
          </div>

          {/* Right: User Information & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                  <div className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-slate-100 text-brand-700 border border-slate-200 flex items-center justify-center font-bold text-sm shadow-inner">
                  {user.name.charAt(0)}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all"
                  title="Sign out of system"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
