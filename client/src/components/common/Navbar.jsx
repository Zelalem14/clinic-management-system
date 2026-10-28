import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Stethoscope, 
  TestTubes, 
  ClipboardList,
  KeyRound
} from 'lucide-react';

export const Navbar = ({ sidebarOpen, setSidebarOpen, onOpenPasswordModal }) => {
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="px-3 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {sidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-tight truncate">
                  <span className="hidden sm:inline">Tena Specialty Clinic</span>
                  <span className="sm:hidden">Tena Clinic</span>
                </h1>
                <span className="text-[11px] sm:text-xs text-slate-500 hidden sm:inline-block truncate">
                  Addis Ababa Healthcare Center
                </span>
              </div>
            </div>
          </div>

          {/* Right: User Information, Password & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user && (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* User Name & Role Pill (Hidden on mobile phones, shown on tablet/desktop) */}
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-semibold text-slate-900">{user.name}</span>
                  <div className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label}
                  </div>
                </div>

                {/* Avatar Badge */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs shrink-0">
                  {user.name?.charAt(0) || 'U'}
                </div>

                {/* Change Password Button */}
                <button
                  type="button"
                  onClick={onOpenPasswordModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:text-brand-600 hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Change your account password"
                >
                  <KeyRound className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="hidden sm:inline">Password</span>
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Sign out of system"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="hidden sm:inline">Logout</span>
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
