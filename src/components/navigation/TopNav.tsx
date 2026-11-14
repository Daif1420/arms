/**
 * ARMS - Horizontal Top Navigation
 * Brand-aligned top navigation with Archive & Profile dropdowns.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  FolderArchive,
  Archive,
  FileText,
  FileBarChart,
  Printer,
  FileSpreadsheet,
  ScrollText,
  Bell,
  User,
  Users,
  ChevronDown,
  LogOut,
  Shield,
  KeyRound,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { IntercomLogo } from '../common/IntercomLogo';
import { ArmsLogo } from '../common/ArmsLogo';

export type ActiveTab =
  | 'dashboard'
  | 'boxes'
  | 'box-detail'
  | 'dossiers'
  | 'dossier-detail'
  | 'projects'
  | 'reports'
  | 'labels'
  | 'import'
  | 'audit'
  | 'users'
  | 'settings';

interface TopNavProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab, param?: string) => void;
  onOpenNotifications: () => void;
  onOpenProfile: (tab?: 'profile' | 'password') => void;
  breadcrumbs?: { label: string; tab?: ActiveTab; param?: string }[];
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onNavigate,
  onOpenNotifications,
  onOpenProfile,
  breadcrumbs = [],
}) => {
  const { currentUser, notifications, language, setLanguage, logout } = useArchive();

  const [archiveDropdownOpen, setArchiveDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('arms_theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
    localStorage.setItem('arms_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const archiveRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (archiveRef.current && !archiveRef.current.contains(event.target as Node)) {
        setArchiveDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isArchiveActive =
    activeTab === 'boxes' ||
    activeTab === 'box-detail' ||
    activeTab === 'dossiers' ||
    activeTab === 'dossier-detail' ||
    activeTab === 'projects';

  const activeNavClass =
    'text-[#0B56A8] dark:text-blue-300 bg-[#EAF2FB] dark:bg-[#0B56A8]/20 font-bold';
  const inactiveNavClass =
    'text-slate-600 dark:text-neutral-300 hover:text-[#0B56A8] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-neutral-900/60';

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111111] border-b border-slate-200 dark:border-neutral-800">
      {/* Intercom Brand Tri-Color Top Hairline */}
      <div className="h-[2px] w-full flex" aria-hidden="true">
        <div className="flex-1 bg-[#0B56A8]" />
        <div className="w-28 bg-[#F5A614]" />
        <div className="w-20 bg-[#E52225]" />
      </div>

      <div className="max-w-[1640px] mx-auto px-3 sm:px-6 lg:px-10">
        <div dir="ltr" className="flex items-center justify-between h-[68px] gap-2 sm:gap-4 lg:gap-6">
          {/* Physical Left Zone: Intercom Logo + Locale & Theme Preferences */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center focus:outline-none hover:opacity-90 transition-opacity"
              aria-label="Intercom ARMS Home"
            >
              <IntercomLogo size="md" className="[&_img]:h-5 sm:[&_img]:h-6 lg:[&_img]:h-7 [&_img]:w-auto" />
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block mx-0.5" />

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
                className="px-2 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:text-[#0B56A8] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors flex items-center gap-1.5"
              >
                <Globe className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-bold hidden sm:inline">
                  {language === 'ar' ? 'EN' : 'عربي'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDarkMode(value => !value)}
                title={
                  language === 'ar'
                    ? darkMode
                      ? 'الوضع الفاتح'
                      : 'الوضع الداكن'
                    : darkMode
                    ? 'Light mode'
                    : 'Dark mode'
                }
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-1.5 sm:p-2 text-slate-600 dark:text-neutral-300 hover:text-[#0B56A8] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Center Zone: Balanced Single-Line Navigation */}
          <nav
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            className="hidden lg:flex items-center justify-center gap-0.5 xl:gap-1.5 flex-1 min-w-0 px-2"
          >
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard' ? activeNavClass : inactiveNavClass
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>{language === 'ar' ? 'الرئيسية' : 'Dashboard'}</span>
            </button>

            <div className="relative" ref={archiveRef}>
              <button
                type="button"
                onClick={() => setArchiveDropdownOpen(!archiveDropdownOpen)}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isArchiveActive || archiveDropdownOpen ? activeNavClass : inactiveNavClass
                }`}
              >
                <FolderArchive className="w-4 h-4 shrink-0" />
                <span>{language === 'ar' ? 'الأرشيف' : 'Archive'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${archiveDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {archiveDropdownOpen && (
                <div className="absolute top-full start-0 mt-1.5 w-60 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400">
                    {language === 'ar' ? 'أقسام الأرشيف' : 'Archive Sections'}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('boxes');
                      setArchiveDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-start transition-colors ${
                      activeTab === 'boxes' || activeTab === 'box-detail'
                        ? 'bg-[#EAF2FB] dark:bg-[#0B56A8]/20 text-[#0B56A8] dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#EAF2FB] dark:bg-[#0B56A8]/25 text-[#0B56A8] dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Archive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">{language === 'ar' ? 'البوكسات (Boxes)' : 'Boxes'}</div>
                      <div className="text-[10px] text-slate-400">
                        {language === 'ar' ? '6 دوسيهات · 300 مشروع' : '6 Dossiers · 300 Projects'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('dossiers');
                      setArchiveDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-start transition-colors ${
                      activeTab === 'dossiers' || activeTab === 'dossier-detail'
                        ? 'bg-[#EAF2FB] dark:bg-[#0B56A8]/20 text-[#0B56A8] dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#B45309] dark:text-amber-400 flex items-center justify-center shrink-0">
                      <FolderArchive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">{language === 'ar' ? 'الدوسيهات (Dossiers)' : 'Dossiers'}</div>
                      <div className="text-[10px] text-slate-400">
                        {language === 'ar' ? '50 مشروع لكل دوسيه' : '50 Projects per Dossier'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('projects');
                      setArchiveDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-start transition-colors ${
                      activeTab === 'projects'
                        ? 'bg-[#EAF2FB] dark:bg-[#0B56A8]/20 text-[#0B56A8] dark:text-blue-300 font-bold'
                        : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-900 text-[#3F4144] dark:text-neutral-300 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold">{language === 'ar' ? 'المشاريع (Projects)' : 'Projects Directory'}</div>
                      <div className="text-[10px] text-slate-400">Job ID & Date Approved</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reports' ? activeNavClass : inactiveNavClass
              }`}
            >
              <FileBarChart className="w-4 h-4 shrink-0" />
              <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('labels')}
              className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'labels' ? activeNavClass : inactiveNavClass
              }`}
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>{language === 'ar' ? 'طباعة الليبلات' : 'Labels'}</span>
            </button>

            {['System Admin', 'Archive Manager'].includes(currentUser.role) && (
              <button
                type="button"
                onClick={() => onNavigate('import')}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'import' ? activeNavClass : inactiveNavClass
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>{language === 'ar' ? 'استيراد البيانات' : 'Import Data'}</span>
              </button>
            )}

            {currentUser.role === 'System Admin' && (
              <button
                type="button"
                onClick={() => onNavigate('audit')}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'audit' ? activeNavClass : inactiveNavClass
                }`}
              >
                <ScrollText className="w-4 h-4 shrink-0" />
                <span>{language === 'ar' ? 'سجل العمليات' : 'Audit Log'}</span>
              </button>
            )}

            {currentUser.role === 'System Admin' && (
              <button
                type="button"
                onClick={() => onNavigate('users')}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'users' ? activeNavClass : inactiveNavClass
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
              </button>
            )}
          </nav>

          {/* Physical Right Zone: Notifications + User Account + ARMS PNG Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative p-1.5 sm:p-2 text-slate-600 dark:text-neutral-300 hover:text-[#0B56A8] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-900 transition-colors"
                title={language === 'ar' ? 'الإشعارات' : 'Notifications'}
                aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#E52225] text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className={`flex items-center gap-2 px-1.5 sm:px-2 py-1 rounded-lg border transition-colors ${
                    profileDropdownOpen
                      ? 'border-[#0B56A8] bg-[#EAF2FB]/50 dark:bg-neutral-900'
                      : 'border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-[#0B56A8] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-start hidden 2xl:block" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 leading-tight">{currentUser.role}</div>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${
                      profileDropdownOpen ? 'rotate-180 text-[#0B56A8]' : ''
                    }`}
                  />
                </button>

                {profileDropdownOpen && (
                  <div
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xl py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-neutral-800">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400" dir="ltr">
                        @{currentUser.username} {currentUser.email ? `· ${currentUser.email}` : ''}
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-[#0B56A8] dark:text-blue-400">{currentUser.role}</div>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          onOpenProfile('profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 text-start font-medium"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>{language === 'ar' ? 'الملف الشخصي' : 'My Profile'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenProfile('password');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 text-start font-medium"
                      >
                        <KeyRound className="w-4 h-4 text-slate-500" />
                        <span>{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</span>
                      </button>

                      {currentUser.role === 'System Admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('users');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 text-start font-medium"
                        >
                          <Shield className="w-4 h-4 text-[#0B56A8]" />
                          <span>{language === 'ar' ? 'إدارة المستخدمين والصلاحيات' : 'User Management'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#E52225] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-start font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-neutral-800 hidden sm:block mx-0.5" />

            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center focus:outline-none hover:opacity-90 transition-opacity"
              aria-label="ARMS Archive Report Management System"
            >
              <ArmsLogo size="md" className="[&_img]:h-6 sm:[&_img]:h-7 lg:[&_img]:h-8 [&_img]:w-auto" />
            </button>
          </div>
        </div>

        {/* Tablet & Mobile Navigation Strip */}
        <div className="lg:hidden border-t border-slate-100 dark:border-neutral-800 py-2">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-[#0B56A8] text-white'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الرئيسية' : 'Dashboard'}</span>
            </button>

            <button
              onClick={() => onNavigate('boxes')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeTab === 'boxes' || activeTab === 'box-detail'
                  ? 'bg-[#0B56A8] text-white'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'البوكسات' : 'Boxes'}</span>
            </button>

            <button
              onClick={() => onNavigate('dossiers')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeTab === 'dossiers' || activeTab === 'dossier-detail'
                  ? 'bg-[#0B56A8] text-white'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الدوسيهات' : 'Dossiers'}</span>
            </button>

            <button
              onClick={() => onNavigate('projects')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeTab === 'projects'
                  ? 'bg-[#0B56A8] text-white'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'المشاريع' : 'Projects'}</span>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeTab === 'reports'
                  ? 'bg-[#0B56A8] text-white'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
              }`}
            >
              <FileBarChart className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'التقارير' : 'Reports'}</span>
            </button>

            <button
              onClick={() => onNavigate('labels')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                activeTab === 'labels'
                  ? 'bg-[#0B56A8] text-white'
                  : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'الليبلات' : 'Labels'}</span>
            </button>

            {['System Admin', 'Archive Manager'].includes(currentUser.role) && (
              <button
                onClick={() => onNavigate('import')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                  activeTab === 'import'
                    ? 'bg-[#0B56A8] text-white'
                    : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'استيراد' : 'Import'}</span>
              </button>
            )}

            {currentUser.role === 'System Admin' && (
              <button
                onClick={() => onNavigate('audit')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-[#0B56A8] text-white'
                    : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'السجل' : 'Audit'}</span>
              </button>
            )}

            {currentUser.role === 'System Admin' && (
              <button
                onClick={() => onNavigate('users')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors ${
                  activeTab === 'users'
                    ? 'bg-[#0B56A8] text-white'
                    : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'المستخدمين' : 'Users'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Breadcrumbs Bar */}
      {breadcrumbs.length > 0 && (
        <div className="bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-neutral-800">
          <div className="max-w-[1640px] mx-auto px-4 sm:px-8 lg:px-12 py-2 text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-2 overflow-x-auto">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-400 dark:text-neutral-600 font-bold">/</span>}
                {crumb.tab ? (
                  <button
                    onClick={() => onNavigate(crumb.tab!, crumb.param)}
                    className="hover:text-[#0B56A8] dark:hover:text-white font-medium hover:underline transition-colors whitespace-nowrap"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[#0B56A8] dark:text-blue-400 font-bold whitespace-nowrap">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
