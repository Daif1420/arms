/**
 * ARMS - Users & Permissions Management Page
 * Streamlined directory table with sortable columns, inline Role & Status controls,
 * quick action icons (Edit Name/Info, Change Password, Reset to P@ssw0rd, Delete Account),
 * and focused dialogs matching the clean ARMS light & true-black dark design.
 */

import React, { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  KeyRound,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Search,
  ShieldAlert,
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { User, UserRole } from '../../types';
import { ActiveTab } from '../navigation/TopNav';

interface UsersManagementViewProps {
  onNavigate: (tab: ActiveTab, param?: string) => void;
}

type SortKey = 'name' | 'username' | 'role' | 'active' | 'lastLogin';
type SortDir = 'asc' | 'desc';

type ActiveDialog =
  | { type: 'add' }
  | { type: 'edit'; user: User }
  | { type: 'password'; user: User }
  | { type: 'reset'; user: User }
  | { type: 'delete'; user: User }
  | null;

const DEFAULT_USER_PASSWORD = 'P@ssw0rd';

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({ onNavigate }) => {
  const { users, currentUser, addUser, updateUser, toggleUserStatus, deleteUser, language, showToast } = useArchive();
  const isAr = language === 'ar';

  // Search, Filters & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Focused Dialog state
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Data Entry');
  const [newPassword, setNewPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);

  // Edit User Form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Data Entry');

  // Change Password Form state
  const [customPassword, setCustomPassword] = useState('');
  const [confirmCustomPassword, setConfirmCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);

  const filteredAndSortedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.active) return false;
      if (statusFilter === 'disabled' && u.active) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });

    const mult = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === 'active') {
        return (Number(b.active) - Number(a.active)) * mult;
      }
      if (sortKey === 'lastLogin') {
        const ta = a.lastLogin && a.lastLogin !== 'Never' ? new Date(a.lastLogin).getTime() || 0 : 0;
        const tb = b.lastLogin && b.lastLogin !== 'Never' ? new Date(b.lastLogin).getTime() || 0 : 0;
        return (ta - tb) * mult;
      }
      return String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''), isAr ? 'ar' : 'en') * mult;
    });
  }, [users, searchQuery, roleFilter, statusFilter, sortKey, sortDir, isAr]);

  if (currentUser.role !== 'System Admin') {
    return (
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto mt-8">
        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E52225] dark:text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {isAr ? 'الصلاحية مقصورة على مدير النظام' : 'System Admin Access Required'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          {isAr
            ? 'إدارة حسابات المستخدمين وكلمات المرور والصلاحيات متاحة لحسابات System Admin فقط.'
            : 'Managing user accounts, passwords, and permissions is restricted to System Admin accounts.'}
        </p>
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{isAr ? 'العودة إلى الرئيسية' : 'Back to Dashboard'}</span>
        </button>
      </div>
    );
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 opacity-50 shrink-0" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#0B56A8] dark:text-blue-400 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#0B56A8] dark:text-blue-400 shrink-0" />
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const openAddDialog = () => {
    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setNewRole('Data Entry');
    setNewPassword('');
    setShowAddPassword(false);
    setDialog({ type: 'add' });
  };

  const openEditDialog = (user: User) => {
    setEditName(user.name);
    setEditEmail(user.email || '');
    setEditRole(user.role);
    setDialog({ type: 'edit', user });
  };

  const openPasswordDialog = (user: User) => {
    setCustomPassword('');
    setConfirmCustomPassword('');
    setShowCustomPassword(false);
    setDialog({ type: 'password', user });
  };

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
      showToast(isAr ? 'تم إضافة المستخدم بنجاح.' : 'User created successfully.', 'success');
      setDialog(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : isAr ? 'تعذر إنشاء المستخدم.' : 'Unable to create user.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.type !== 'edit') return;
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showToast(isAr ? 'يرجى إدخال الاسم الكامل.' : 'Please enter full name.', 'error');
      return;
    }

    const payload: Partial<User> = {};
    if (trimmedName !== dialog.user.name) payload.name = trimmedName;
    if (editEmail.trim() !== (dialog.user.email || '')) payload.email = editEmail.trim();
    if (editRole !== dialog.user.role) payload.role = editRole;

    if (Object.keys(payload).length === 0) {
      setDialog(null);
      return;
    }

    setSubmitting(true);
    try {
      await updateUser(dialog.user.id, payload);
      showToast(isAr ? `تم تحديث بيانات ${trimmedName} بنجاح.` : `Updated ${trimmedName}.`, 'success');
      setDialog(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : isAr ? 'تعذر حفظ التعديلات.' : 'Unable to save changes.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dialog?.type !== 'password') return;
    if (!customPassword) {
      showToast(isAr ? 'يرجى إدخال كلمة المرور الجديدة.' : 'Please enter a new password.', 'error');
      return;
    }
    if (customPassword !== confirmCustomPassword) {
      showToast(isAr ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await updateUser(dialog.user.id, { password: customPassword });
      showToast(
        isAr ? `تم تغيير كلمة مرور ${dialog.user.name} بنجاح.` : `Password updated for ${dialog.user.name}.`,
        'success'
      );
      setDialog(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : isAr ? 'تعذر تغيير كلمة المرور.' : 'Unable to change password.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmResetDefault = async () => {
    if (dialog?.type !== 'reset') return;
    setSubmitting(true);
    try {
      await updateUser(dialog.user.id, { resetPassword: true });
      showToast(
        isAr
          ? `تمت إعادة كلمة مرور ${dialog.user.name} إلى ${DEFAULT_USER_PASSWORD}.`
          : `Password for ${dialog.user.name} reset to ${DEFAULT_USER_PASSWORD}.`,
        'success'
      );
      setDialog(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : isAr ? 'تعذر إعادة تعيين كلمة المرور.' : 'Unable to reset password.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (dialog?.type !== 'delete') return;
    setSubmitting(true);
    try {
      await deleteUser(dialog.user.id);
      showToast(
        isAr ? `تمت إزالة حساب ${dialog.user.name} بنجاح.` : `Account ${dialog.user.name} deleted.`,
        'success'
      );
      setDialog(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : isAr ? 'تعذر إزالة الحساب.' : 'Unable to delete account.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatLastLogin = (val: string) => {
    if (!val || val === 'Never') return isAr ? 'لم يسجل بعد' : 'Never';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return val;
    return d.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || roleFilter !== 'all' || statusFilter !== 'all');

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#0B56A8] dark:text-blue-400 mb-0.5">
            {isAr ? 'إدارة الحسابات' : 'Account Administration'}
          </div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>{isAr ? 'إدارة المستخدمين' : 'Users Management'}</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500 tabular-nums">
              ({filteredAndSortedUsers.length})
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1">
            {isAr
              ? 'عرض كل المستخدمين، تعديل الاسم والصلاحيات، تغيير أو إعادة تعيين كلمة المرور، أو إزالة الحساب.'
              : 'View all users, edit names and roles, change or reset passwords, or remove accounts.'}
          </p>
        </div>

        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة مستخدم' : 'Add User'}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Search Input */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1.5">
              {isAr ? 'البحث' : 'Search'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث بالاسم، اسم المستخدم، أو البريد...' : 'Search by name, username, or email...'}
                className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B56A8]"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1.5">
              {isAr ? 'الصلاحية' : 'Role'}
            </label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as 'all' | UserRole)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
            >
              <option value="all">{isAr ? 'الكل' : 'All'}</option>
              <option value="System Admin">System Admin</option>
              <option value="Archive Manager">Archive Manager</option>
              <option value="Data Entry">Data Entry</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1.5">
              {isAr ? 'الحالة' : 'Status'}
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'disabled')}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
            >
              <option value="all">{isAr ? 'الكل' : 'All'}</option>
              <option value="active">{isAr ? 'نشط' : 'Active'}</option>
              <option value="disabled">{isAr ? 'معطل' : 'Disabled'}</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="md:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              title={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              aria-label={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              className="w-full md:w-9 h-9 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-[#0B56A8] dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 text-[11px] font-semibold border-b border-slate-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>{isAr ? 'الاسم' : 'Name'}</span>
                    {renderSortIcon('name')}
                  </button>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort('username')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>{isAr ? 'اسم المستخدم' : 'Username'}</span>
                    {renderSortIcon('username')}
                  </button>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort('role')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>{isAr ? 'الصلاحية' : 'Role'}</span>
                    {renderSortIcon('role')}
                  </button>
                </th>
                <th className="px-4 py-3 whitespace-nowrap text-center">
                  <button
                    type="button"
                    onClick={() => toggleSort('active')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>{isAr ? 'الحالة' : 'Status'}</span>
                    {renderSortIcon('active')}
                  </button>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort('lastLogin')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <span>{isAr ? 'آخر دخول' : 'Last Login'}</span>
                    {renderSortIcon('lastLogin')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center whitespace-nowrap">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-neutral-400">
                    {isAr ? 'لا يوجد مستخدمون مطابقون لنتائج البحث.' : 'No users match the selected filters.'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map(u => {
                  const isSelf = u.id === currentUser.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/40 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-[13px]">{u.name}</span>
                          {isSelf && (
                            <span className="text-[11px] font-bold text-[#0B56A8] dark:text-blue-400">
                              ({isAr ? 'أنت' : 'You'})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-neutral-300 whitespace-nowrap" dir="ltr">
                        @{u.username}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-slate-500 dark:text-neutral-400 whitespace-nowrap" dir="ltr">
                        {u.email || '—'}
                      </td>

                      {/* Role Dropdown */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          title={
                            isSelf
                              ? isAr
                                ? 'لا يمكنك خفض صلاحية حسابك الحالي'
                                : 'Cannot lower your own admin role'
                              : isAr
                              ? 'تغيير الصلاحية'
                              : 'Change role'
                          }
                          onChange={e =>
                            updateUser(u.id, { role: e.target.value as UserRole })
                              .then(() => showToast(isAr ? 'تم تحديث الصلاحية.' : 'Role updated.', 'success'))
                              .catch(error => showToast(error.message, 'error'))
                          }
                          className="px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg font-semibold text-slate-800 dark:text-neutral-100 focus:outline-none focus:border-[#0B56A8] disabled:opacity-60"
                        >
                          <option value="System Admin">System Admin</option>
                          <option value="Archive Manager">Archive Manager</option>
                          <option value="Data Entry">Data Entry</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      </td>

                      {/* Clickable Status Toggle */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? isAr
                                ? 'لا يمكنك تعطيل حسابك الحالي'
                                : 'Cannot disable your own account'
                              : u.active
                              ? isAr
                                ? 'اضغط لتعطيل الحساب'
                                : 'Click to disable'
                              : isAr
                              ? 'اضغط لتفعيل الحساب'
                              : 'Click to activate'
                          }
                          onClick={() =>
                            toggleUserStatus(u.id)
                              .then(() => showToast(isAr ? 'تم تحديث حالة الحساب.' : 'Account status updated.', 'success'))
                              .catch(error => showToast(error.message, 'error'))
                          }
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                            u.active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950'
                              : 'bg-red-50 text-[#E52225] hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-950'
                          }`}
                        >
                          {u.active ? (isAr ? 'نشط' : 'Active') : isAr ? 'معطل' : 'Disabled'}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3 text-slate-500 dark:text-neutral-400 tabular-nums whitespace-nowrap text-[11px]">
                        {formatLastLogin(u.lastLogin)}
                      </td>

                      {/* Crisp Icon Action Strip */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditDialog(u)}
                            title={isAr ? 'تعديل الاسم والبيانات' : 'Edit name & details'}
                            aria-label={isAr ? 'تعديل الاسم والبيانات' : 'Edit name & details'}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:text-[#0B56A8] dark:hover:text-blue-400 hover:border-[#0B56A8]/40 dark:hover:border-blue-500/40 flex items-center justify-center transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openPasswordDialog(u)}
                            title={isAr ? 'تغيير كلمة المرور' : 'Change password'}
                            aria-label={isAr ? 'تغيير كلمة المرور' : 'Change password'}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:text-[#0B56A8] dark:hover:text-blue-400 hover:border-[#0B56A8]/40 dark:hover:border-blue-500/40 flex items-center justify-center transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDialog({ type: 'reset', user: u })}
                            title={
                              isAr
                                ? `إعادة تعيين كلمة المرور للافتراضية (${DEFAULT_USER_PASSWORD})`
                                : `Reset password to ${DEFAULT_USER_PASSWORD}`
                            }
                            aria-label={
                              isAr
                                ? `إعادة تعيين كلمة المرور للافتراضية (${DEFAULT_USER_PASSWORD})`
                                : `Reset password to ${DEFAULT_USER_PASSWORD}`
                            }
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700 flex items-center justify-center transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDialog({ type: 'delete', user: u })}
                            title={
                              isSelf
                                ? isAr
                                  ? 'لا يمكنك إزالة حسابك الحالي'
                                  : 'Cannot remove your own account'
                                : isAr
                                ? 'إزالة الحساب نهائياً'
                                : 'Remove account'
                            }
                            aria-label={isAr ? 'إزالة الحساب نهائياً' : 'Remove account'}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-300 hover:text-[#E52225] dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 flex items-center justify-center transition-colors disabled:opacity-35 disabled:pointer-events-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Focused Modal Dialogs */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          {/* 1. Add New User */}
          {dialog.type === 'add' && (
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0B56A8] dark:text-blue-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إضافة مستخدم جديد' : 'Add New User'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    {isAr ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder={isAr ? 'أحمد محمود' : 'Ahmed Mahmoud'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    {isAr ? 'اسم المستخدم' : 'Username'}
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="amahmoud"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="user@intercom.local"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    {isAr ? 'الصلاحية' : 'Role'}
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                  >
                    <option value="System Admin">System Admin</option>
                    <option value="Archive Manager">Archive Manager</option>
                    <option value="Data Entry">Data Entry</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                      {isAr ? 'كلمة المرور' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(DEFAULT_USER_PASSWORD)}
                      className="text-[11px] font-semibold text-[#0B56A8] dark:text-blue-400 hover:underline"
                    >
                      {isAr ? `استخدام ${DEFAULT_USER_PASSWORD}` : `Use ${DEFAULT_USER_PASSWORD}`}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      minLength={1}
                      maxLength={256}
                      dir="ltr"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder={DEFAULT_USER_PASSWORD}
                      className="w-full px-3 py-2 pe-9 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(v => !v)}
                      aria-label={showAddPassword ? 'Hide password' : 'Show password'}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B56A8]"
                    >
                      {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="px-3 py-2 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors disabled:opacity-60"
                  >
                    {submitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'إنشاء الحساب' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. Edit Name / Email / Role */}
          {dialog.type === 'edit' && (
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تعديل بيانات المستخدم' : 'Edit User Account'}
                  </h2>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400" dir="ltr">
                    @{dialog.user.username}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    {isAr ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="user@intercom.local"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    {isAr ? 'الصلاحية' : 'Role'}
                  </label>
                  <select
                    value={editRole}
                    disabled={dialog.user.id === currentUser.id}
                    onChange={e => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8] disabled:opacity-60"
                  >
                    <option value="System Admin">System Admin</option>
                    <option value="Archive Manager">Archive Manager</option>
                    <option value="Data Entry">Data Entry</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="px-3 py-2 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors disabled:opacity-60"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{submitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Change User Password */}
          {dialog.type === 'password' && (
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                  </h2>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                    {dialog.user.name} (<span dir="ltr">@{dialog.user.username}</span>)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangeUserPassword} className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                      {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPassword(DEFAULT_USER_PASSWORD);
                        setConfirmCustomPassword(DEFAULT_USER_PASSWORD);
                      }}
                      className="text-[11px] font-semibold text-[#0B56A8] dark:text-blue-400 hover:underline"
                    >
                      {isAr ? `تعبئة ${DEFAULT_USER_PASSWORD}` : `Use ${DEFAULT_USER_PASSWORD}`}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showCustomPassword ? 'text' : 'password'}
                      required
                      minLength={1}
                      maxLength={256}
                      dir="ltr"
                      value={customPassword}
                      onChange={e => setCustomPassword(e.target.value)}
                      className="w-full px-3 py-2 pe-9 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomPassword(v => !v)}
                      aria-label={showCustomPassword ? 'Hide password' : 'Show password'}
                      className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B56A8]"
                    >
                      {showCustomPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-neutral-300 mb-1">
                    {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <input
                    type={showCustomPassword ? 'text' : 'password'}
                    required
                    minLength={1}
                    maxLength={256}
                    dir="ltr"
                    value={confirmCustomPassword}
                    onChange={e => setConfirmCustomPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDialog(null)}
                    className="px-3 py-2 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors disabled:opacity-60"
                  >
                    {submitting ? (isAr ? 'جاري التحديث...' : 'Updating...') : isAr ? 'حفظ كلمة المرور' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. Confirm Reset Password to P@ssw0rd */}
          {dialog.type === 'reset' && (
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إعادة تعيين كلمة المرور للافتراضية' : 'Reset Password to Default'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {isAr
                      ? `سيتم تعيين كلمة مرور الحساب "${dialog.user.name}" إلى `
                      : `Password for "${dialog.user.name}" will be reset to `}
                    <strong className="font-mono text-slate-900 dark:text-white" dir="ltr">
                      {DEFAULT_USER_PASSWORD}
                    </strong>
                    {isAr ? '.' : '.'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="px-3 py-2 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleConfirmResetDefault()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {submitting ? (isAr ? 'جاري التنفيذ...' : 'Resetting...') : isAr ? 'تأكيد إعادة التعيين' : 'Confirm Reset'}
                </button>
              </div>
            </div>
          )}

          {/* 5. Confirm Delete Account */}
          {dialog.type === 'delete' && (
            <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E52225] dark:text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'إزالة حساب المستخدم' : 'Remove User Account'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                    {isAr
                      ? `هل أنت متأكد من حذف حساب "${dialog.user.name}" (@${dialog.user.username}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
                      : `Are you sure you want to permanently remove "${dialog.user.name}" (@${dialog.user.username})? This action cannot be undone.`}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="px-3 py-2 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleConfirmDelete()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#E52225] hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60"
                >
                  {submitting ? (isAr ? 'جاري الحذف...' : 'Removing...') : isAr ? 'حذف الحساب نهائياً' : 'Delete Account'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
