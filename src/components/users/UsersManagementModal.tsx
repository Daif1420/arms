/**
 * ARMS - Users & Permissions Management (Section 10)
 * Admin panel for adding, editing, activating, and role assigning across the 4 roles.
 */

import React, { useState } from 'react';
import { X, Plus, Shield } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { UserRole } from '../../types';

interface UsersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsersManagementModal: React.FC<UsersManagementModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, addUser, updateUser, toggleUserStatus, language, showToast } = useArchive();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Data Entry');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) return;

    setSubmitting(true);
    try {
      await addUser(
        {
          username: newUsername.trim(),
          name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
          active: true,
        },
        newPassword
      );
      showToast(language === 'ar' ? 'تم إضافة المستخدم بنجاح.' : 'User created successfully.', 'success');
      setShowAddForm(false);
      setNewUsername('');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : (language === 'ar' ? 'تعذر إنشاء المستخدم.' : 'Unable to create user.'),
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0B56A8] dark:text-blue-400" />
            <h2 className="text-base font-bold text-[#3F4144] dark:text-white">
              {language === 'ar' ? 'إدارة المستخدمين والصلاحيات (RBAC)' : 'User Management & Permissions'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#3F4144] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles Table Explanation */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 dark:text-slate-400">
          <div>
            <strong className="text-[#0B56A8] dark:text-blue-400 block">System Admin:</strong>
            {language === 'ar' ? 'كل الصلاحيات + الإغلاق الإداري' : 'Full Access + Force Close'}
          </div>
          <div>
            <strong className="text-[#3F4144] dark:text-white block">Archive Manager:</strong>
            {language === 'ar' ? 'إدارة الأرشيف والتقارير' : 'Archive & Reports'}
          </div>
          <div>
            <strong className="text-[#3F4144] dark:text-white block">Data Entry:</strong>
            {language === 'ar' ? 'استعراض البيانات فقط حالياً' : 'Read-only for now'}
          </div>
          <div>
            <strong className="text-[#3F4144] dark:text-white block">Viewer:</strong>
            {language === 'ar' ? 'مشاهدة وطباعة فقط' : 'Read-only / Audit'}
          </div>
        </div>

        {/* Users List & Add Button */}
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {language === 'ar' ? `المستخدمين المسجلين (${users.length})` : `Registered Users (${users.length})`}
            </span>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إضافة مستخدم' : 'Add User'}</span>
            </button>
          </div>

          {/* Add User Form */}
          {showAddForm && (
            <form onSubmit={handleAddUser} className="p-4 bg-[#EAF2FB]/50 dark:bg-slate-800/80 rounded-xl space-y-3 border border-[#0B56A8]/20 dark:border-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ahmed Mahmoud"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="amahmoud"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="user@intercom-arms.com"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'كلمة المرور الأولية (أي أرقام أو أحرف)' : 'Initial password (any digits or characters)'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={1}
                    maxLength={256}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: 1234' : 'e.g. 1234'}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ar' ? 'الدور والصلاحية' : 'User Role'}
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium focus:outline-none focus:border-[#0B56A8]"
                  >
                    <option value="System Admin">System Admin</option>
                    <option value="Archive Manager">Archive Manager</option>
                    <option value="Data Entry">Data Entry</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors disabled:opacity-60"
                >
                  {submitting ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ المستخدم' : 'Save User')}
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-3 py-2.5">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="px-3 py-2.5">{language === 'ar' ? 'الصلاحية (الدور)' : 'Role'}</th>
                  <th className="px-3 py-2.5">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-3 py-2.5 text-center">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-[#3F4144] dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-slate-400" dir="ltr">@{u.username} · {u.email}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={u.role}
                        disabled={currentUser.role !== 'System Admin'}
                        onChange={e =>
                          updateUser(u.id, { role: e.target.value as UserRole })
                            .then(() => showToast(language === 'ar' ? 'تم تحديث الصلاحية.' : 'Role updated.', 'success'))
                            .catch(error => showToast(error.message, 'error'))
                        }
                        className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold focus:outline-none focus:border-[#0B56A8]"
                      >
                        <option value="System Admin">System Admin</option>
                        <option value="Archive Manager">Archive Manager</option>
                        <option value="Data Entry">Data Entry</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-red-50 text-[#E52225] dark:bg-red-950/40 dark:text-red-300'
                        }`}
                      >
                        {u.active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'معطل' : 'Disabled')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          toggleUserStatus(u.id)
                            .then(() => showToast(language === 'ar' ? 'تم تحديث حالة المستخدم.' : 'User status updated.', 'success'))
                            .catch(error => showToast(error.message, 'error'))
                        }
                        className={`px-2 py-1 rounded transition-colors text-xs font-semibold ${
                          u.active
                            ? 'text-[#E52225] hover:bg-red-50 dark:hover:bg-red-950/30'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                      >
                        {u.active ? (language === 'ar' ? 'تعطيل' : 'Disable') : (language === 'ar' ? 'تفعيل' : 'Activate')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
