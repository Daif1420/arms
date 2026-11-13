/**
 * ARMS - Notifications Drawer / Center (Section 11)
 * Displays events: Successful Import, Duplicate Projects, Missing Projects, Force Close.
 * Clicking a notification navigates directly to the related record.
 */

import React from 'react';
import { Bell, X, CheckCircle2, AlertTriangle, Lock, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { ActiveTab } from '../navigation/TopNav';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab, param?: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, language } =
    useArchive();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border-s border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#0B56A8] dark:text-blue-400" />
            <h2 className="text-base font-bold text-[#3F4144] dark:text-white">
              {language === 'ar' ? 'مركز الإشعارات والتنبيهات' : 'Notifications & Alerts'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-xs text-[#0B56A8] dark:text-blue-400 hover:underline font-semibold"
            >
              {language === 'ar' ? 'تعيين الكل كمقروء' : 'Mark all read'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#3F4144] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  markNotificationAsRead(item.id);
                  onNavigate(item.targetRoute, item.targetParam);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  item.isRead
                    ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-white dark:bg-slate-800 border-[#0B56A8]/25 dark:border-slate-700 shadow-xs hover:border-[#0B56A8]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'missing' && <AlertTriangle className="w-4 h-4 text-[#E52225] shrink-0" />}
                    {item.type === 'import' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {item.type === 'force_close' && <Lock className="w-4 h-4 text-[#B45309] dark:text-amber-400 shrink-0" />}
                    {item.type === 'duplicate' && <FileSpreadsheet className="w-4 h-4 text-[#F5A614] shrink-0" />}
                    <span
                      className={`text-xs font-bold ${
                        item.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-[#3F4144] dark:text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>

                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#0B56A8] shrink-0 mt-1" />
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.message}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="tabular-nums">{item.timestamp}</span>
                  <span className="flex items-center gap-1 text-[#0B56A8] dark:text-blue-400 font-semibold font-sans">
                    <span>{language === 'ar' ? 'عرض السجل' : 'View Record'}</span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-xs text-slate-400">
              {language === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
