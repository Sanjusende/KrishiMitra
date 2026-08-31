import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import adminApi from '../services/adminApi';
import toast from 'react-hot-toast';
import { Settings, Lock, Users, Plus, ShieldCheck, Key, ToggleLeft, ToggleRight, Trash2, Edit2, Check } from 'lucide-react';

const SettingsPage = () => {
  const { admin } = useAdminAuth();
  
  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Administrative Accounts State (Super Admin only)
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);

  // Create User Form State
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN',
  });

  const fetchAdminUsers = async () => {
    if (admin?.role !== 'SUPER_ADMIN') return;
    setUsersLoading(true);
    try {
      const res = await adminApi.get('/settings/users');
      if (res.data?.success) {
        setAdminUsers(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, [admin]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setPasswordLoading(true);
    const toastId = toast.loading('Updating security password...');
    try {
      const res = await adminApi.post('/settings/change-password', {
        oldPassword,
        newPassword,
      });
      if (res.data?.success) {
        toast.success('Password updated successfully', { id: toastId });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed', { id: toastId });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddUserLoading(true);
    const toastId = toast.loading('Registering administrative agent...');
    try {
      const res = await adminApi.post('/settings/users', newUserData);
      if (res.data?.success) {
        toast.success('Administrative user created successfully', { id: toastId });
        setShowAddUserModal(false);
        setNewUserData({ name: '', email: '', password: '', role: 'ADMIN' });
        fetchAdminUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'User registration failed', { id: toastId });
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const toastId = toast.loading('Toggling user active state...');
    try {
      const res = await adminApi.patch(`/settings/users/${user._id}/toggle-status`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Status updated', { id: toastId });
        fetchAdminUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed', { id: toastId });
    }
  };

  const handleRoleChange = async (user, newRole) => {
    const toastId = toast.loading('Updating user role...');
    try {
      const res = await adminApi.patch(`/settings/users/${user._id}/role`, { role: newRole });
      if (res.data?.success) {
        toast.success('Role updated successfully', { id: toastId });
        fetchAdminUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed', { id: toastId });
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete admin account for ${user.name}?`)) return;
    const toastId = toast.loading('De-registering admin account...');
    try {
      const res = await adminApi.delete(`/settings/users/${user._id}`);
      if (res.data?.success) {
        toast.success('Admin user deleted successfully', { id: toastId });
        fetchAdminUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage security credentials and team administrative roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Change Password */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm self-start space-y-6">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 shrink-0">
            <Lock size={18} className="text-emerald-650" />
            Security & Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-455 uppercase tracking-wider block">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-455 uppercase tracking-wider block">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-455 uppercase tracking-wider block">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype new password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10 active:scale-98 transition-transform disabled:opacity-50"
            >
              <Key size={14} />
              <span>Update Password</span>
            </button>
          </form>
        </div>

        {/* Right Side: Administrative Users Management (Super Admin only) */}
        {admin?.role === 'SUPER_ADMIN' && (
          <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 shrink-0">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-emerald-650" />
                Administrative Accounts Management
              </h2>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow shadow-emerald-950/10"
              >
                <Plus size={14} />
                Create Admin Account
              </button>
            </div>

            {usersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Querying administrative users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-200">
                      <th className="p-3">User Details</th>
                      <th className="p-3">Role Permissions</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {adminUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-slate-800">{user.name}</p>
                            <p className="text-slate-450 text-[10px] font-medium">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            disabled={user._id === admin?.id}
                            value={user.role}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded bg-slate-50 text-[11px] font-bold focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                          >
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="ADMIN">Admin</option>
                            <option value="AGRI_EXPERT">Agri Expert</option>
                            <option value="SUPPORT_EXEC">Support Exec</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            disabled={user._id === admin?.id}
                            onClick={() => handleToggleStatus(user)}
                            className="focus:outline-none disabled:opacity-40 cursor-pointer"
                          >
                            {user.active ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100 shadow-xs">Active</span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full font-bold border border-red-100 shadow-xs">Deactivated</span>
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            disabled={user._id === admin?.id}
                            onClick={() => handleDeleteUser(user)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 disabled:opacity-40 focus:outline-none cursor-pointer"
                            title="Delete Admin Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 max-w-sm w-full rounded-2xl shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-800">Register Admin Account</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-655 font-bold text-lg cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="ramesh@krishimitra.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-455 uppercase tracking-wider block">Role Assignment</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-805 focus:outline-none"
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="AGRI_EXPERT">Agri Expert</option>
                  <option value="SUPPORT_EXEC">Support Executive</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow shadow-emerald-950/10 cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
