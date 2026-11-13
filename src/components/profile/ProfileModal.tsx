/**
 * ARMS - Profile & Authentication Modal (Section 3)
 * Handles My Profile view, password change with show/hide password, and session metadata.
 */

import React, { useState } from 'react';
import { User, X, Eye, EyeOff, Check } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, language, changePassword, showToast } = useArchive();

  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    if (!newPassword.trim()) {
      setErrorNotice(language === 'ar' ? 'يرجى إدخال كلمة المرور الجديدة.' : 'Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorNotice(language === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      const msg = language === 'ar' ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!';
      setSuccessNotice(msg);
      showToast(msg, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.setTimeout(() => setSuccessNotice(null), 3000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : (language === 'ar' ? 'تعذر تحديث كلمة المرور.' : 'Password update failed.');
      setErrorNotice(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#0B56A8] dark:text-blue-400" />
            <h2 className="text-base font-bold text-[#3F4144] dark:text-white">
              {language === 'ar' ? 'الملف الشخصي والحساب' : 'Account & Security'}
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

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setErrorNotice(null);
            }}
            className={`py-1.5 rounded-md transition-colors ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-[#0B56A8] dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'ar' ? 'بيانات الحساب' : 'Profile'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('password');
              setErrorNotice(null);
            }}
            className={`py-1.5 rounded-md transition-colors ${
              activeTab === 'password'
                ? 'bg-white dark:bg-slate-900 text-[#0B56A8] dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
          </button>
        </div>

        {errorNotice && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[#E52225] dark:text-red-300 rounded-lg text-xs font-semibold">
            {errorNotice}
          </div>
        )}

        {successNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Tab 1: Profile View */}
        {activeTab === 'profile' && (
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-[#EAF2FB]/70 dark:bg-slate-800/60 border border-[#0B56A8]/15 dark:border-slate-700 rounded-xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#0B56A8] text-white flex items-center justify-center text-lg font-bold shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#3F4144] dark:text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{currentUser.email}</div>
                <div className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#0B56A8]/10 text-[#0B56A8] dark:bg-blue-900/40 dark:text-blue-300">
                  {currentUser.role}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'اسم المستخدم:' : 'Username:'}</span>
                <span className="font-bold text-[#3F4144] dark:text-white" dir="ltr">
                  @{currentUser.username}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'الصلاحية في النظام:' : 'System Permission:'}</span>
                <span className="font-semibold text-[#3F4144] dark:text-white">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'آخر نشاط / تسجيل دخول:' : 'Last Login:'}</span>
                <span className="text-slate-600 dark:text-slate-400 tabular-nums" dir="ltr">
                  {currentUser.lastLogin}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 dark:text-slate-400">{language === 'ar' ? 'حالة الحساب:' : 'Account Status:'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {currentUser.active ? (language === 'ar' ? 'نشط ومفعل' : 'Active & Verified') : (language === 'ar' ? 'معطل' : 'Inactive')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pe-9 focus:outline-none focus:border-[#0B56A8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute end-2.5 top-2.5 text-slate-400 hover:text-[#0B56A8]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={1}
                maxLength={256}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={language === 'ar' ? 'أي أرقام أو أحرف (مثال: 1234)' : 'Any numbers or characters'}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8]"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={1}
                maxLength={256}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8]"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors disabled:opacity-60"
              >
                {saving
                  ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                  : (language === 'ar' ? 'حفظ كلمة المرور' : 'Update Password')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
