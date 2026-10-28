import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';

// Reception Pages
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import PatientRegistration from './pages/reception/PatientRegistration';
import PatientList from './pages/reception/PatientList';
import PaymentManagement from './pages/reception/PaymentManagement';
import ClinicPriceList from './pages/reception/ClinicPriceList';
import ReceptionReports from './pages/reception/ReceptionReports';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorQueue from './pages/doctor/DoctorQueue';
import ConsultationView from './pages/doctor/ConsultationView';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorLabResults from './pages/doctor/DoctorLabResults';
import DoctorReports from './pages/doctor/DoctorReports';

// Lab Pages
import LabDashboard from './pages/laboratory/LabDashboard';
import LabReports from './pages/laboratory/LabReports';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import ServiceManagement from './pages/admin/ServiceManagement';
import UserManagement from './pages/admin/UserManagement';
import ClinicSettings from './pages/admin/ClinicSettings';
import AuditLogs from './pages/admin/AuditLogs';

// App Layout with Navbar & Sidebar
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

// Root Redirect component based on role
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'doctor':
      return <Navigate to="/doctor" replace />;
    case 'lab_tech':
      return <Navigate to="/laboratory" replace />;
    case 'receptionist':
    default:
      return <Navigate to="/reception" replace />;
  }
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Main Layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Receptionist Routes */}
            <Route
              path="/reception"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                  <ReceptionDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/register"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                  <PatientRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/patients"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'admin', 'doctor']}>
                  <PatientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/payments"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                  <PaymentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/services"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'admin', 'doctor', 'lab_tech']}>
                  <ClinicPriceList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reception/reports"
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                  <ReceptionReports />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/queue"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin', 'receptionist']}>
                  <DoctorQueue />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/consultation/:visitId"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <ConsultationView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <PatientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/results"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorLabResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin', 'receptionist']}>
                  <DoctorAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/reports"
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorReports />
                </ProtectedRoute>
              }
            />

            {/* Laboratory Routes */}
            <Route
              path="/laboratory"
              element={
                <ProtectedRoute allowedRoles={['lab_tech', 'admin', 'doctor']}>
                  <LabDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/laboratory/requests"
              element={
                <ProtectedRoute allowedRoles={['lab_tech', 'admin', 'doctor']}>
                  <LabDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/laboratory/reports"
              element={
                <ProtectedRoute allowedRoles={['lab_tech', 'admin', 'doctor']}>
                  <LabReports />
                </ProtectedRoute>
              }
            />

            {/* Administrator Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/services"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ServiceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ClinicSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
