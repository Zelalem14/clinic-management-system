import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Stethoscope, 
  TestTubes, 
  ClipboardList, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail
} from 'lucide-react';

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'doctor' | 'receptionist' | 'lab_tech' | 'admin'

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor',
    phone: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState({ text: '', type: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = (defaultRole = 'doctor') => {
    setEditingUser(null);
    setFormData({
      name: defaultRole === 'doctor' ? 'Dr. ' : '',
      email: '',
      password: '',
      role: defaultRole,
      phone: '',
      is_active: true
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingUser(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '', // Leave blank unless resetting
      role: staff.role,
      phone: staff.phone || '',
      is_active: staff.is_active
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || (!editingUser && !formData.password)) {
      setFormError('Please fill in Name, Email, and Password.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        setNotice({ text: `${formData.name} was successfully updated.`, type: 'success' });
      } else {
        await api.post('/users', formData);
        setNotice({ text: `New staff member "${formData.name}" added successfully.`, type: 'success' });
      }
      setModalOpen(false);
      fetchUsers();
      setTimeout(() => setNotice({ text: '', type: '' }), 4000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (staff) => {
    if (staff.id === currentUser?.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    setUserToDelete(staff);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    try {
      const res = await api.delete(`/users/${userToDelete.id}`);
      setDeleteModalOpen(false);
      setNotice({ text: res.data.message || 'Staff member removed successfully.', type: 'success' });
      fetchUsers();
      setTimeout(() => setNotice({ text: '', type: '' }), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleDetails = (role) => {
    switch (role) {
      case 'doctor':
        return { label: 'Doctor', icon: Stethoscope, badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'receptionist':
        return { label: 'Receptionist', icon: ClipboardList, badge: 'bg-sky-100 text-sky-800 border-sky-300' };
      case 'lab_tech':
        return { label: 'Lab Technician', icon: TestTubes, badge: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'admin':
      default:
        return { label: 'Administrator', icon: ShieldCheck, badge: 'bg-rose-100 text-rose-800 border-rose-300' };
    }
  };

  const filteredUsers = users.filter(u => {
    if (activeTab === 'all') return true;
    return u.role === activeTab;
  });

  const doctorsCount = users.filter(u => u.role === 'doctor').length;
  const receptionCount = users.filter(u => u.role === 'receptionist').length;
  const labCount = users.filter(u => u.role === 'lab_tech').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            <span>Clinic Staff Members</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your clinic team: Add new doctors, delete existing doctors, or change receptionists and laboratory technicians.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleOpenAdd('doctor')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>+ Add Doctor</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd('receptionist')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>+ Add Receptionist</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd('lab_tech')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <TestTubes className="w-4 h-4" />
            <span>+ Add Lab Tech</span>
          </button>
        </div>
      </div>

      {/* Success / Info Alert */}
      {notice.text && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
          notice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {notice.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />}
          <span className="font-semibold">{notice.text}</span>
        </div>
      )}

      {/* Role Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Staff ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doctor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'doctor'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Doctors ({doctorsCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receptionist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'receptionist'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Receptionists ({receptionCount})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lab_tech')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'lab_tech'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Lab Technicians ({labCount})
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading staff accounts..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Staff Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">Login Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No staff members found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const roleInfo = getRoleDetails(u.role);
                    const RoleIcon = roleInfo.icon;
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                          {isSelf && (
                            <span className="text-[11px] font-bold text-brand-600">(Your Account)</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badge}`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          {u.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{u.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Not set</span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          {/* Change / Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Change or update staff details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Change / Edit</span>
                          </button>

                          {/* Delete Button */}
                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(u)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                              title="Delete this staff account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingUser ? `Change Staff: ${editingUser.name}` : 'Add New Clinic Staff Member'}
          subtitle="Enter details below. Doctor, Receptionist, or Lab Technician."
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Abebe Kebede, Meron Alemu, or Assefa Zegeye"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Staff Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm bg-white font-semibold"
                >
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="lab_tech">Laboratory Technician</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0911234567 or +251 91 123 4567"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address (Login Username) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="doctor@clinic.com"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {editingUser ? 'Reset Password (leave empty to keep current password)' : 'Password *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Enter new password only if changing...' : 'At least 6 characters'}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="staff_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 rounded text-brand-600 border-slate-300"
              />
              <label htmlFor="staff_is_active" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Staff member is Active & Allowed to Log in
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && userToDelete && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete Staff Member"
          subtitle={`Are you sure you want to delete ${userToDelete.name}?`}
        >
          <div className="space-y-4 text-sm text-slate-700">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Confirm Deletion</p>
                <p className="mt-1 text-xs">
                  You are deleting <strong>{userToDelete.name}</strong> ({userToDelete.role.toUpperCase()}).
                  This person will no longer be able to log into the system.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Staff Member'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
