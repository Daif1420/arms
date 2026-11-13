/**
 * ARMS - Audit Log View (Section 12)
 * Full audit trail tracking Imports, Project Updates, Box/Dossier Changes, Force Close, and User Permissions.
 */

import React, { useState } from 'react';
import { History, Search } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';

export const AuditLogView: React.FC = () => {
  const { auditLogs, language } = useArchive();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = auditLogs.filter(log => {
    const matchSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recordId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (typeFilter !== 'all' && log.recordType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#3F4144] dark:text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-[#0B56A8] dark:text-blue-400" />
            <span>{language === 'ar' ? 'سجل العمليات والرقابة (Audit Log)' : 'System Audit Log'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'توثيق غير قابل للتعديل لكافة حركات الاستيراد، تعديلات الحالات، والإغلاق الإداري.'
              : 'Immutable operational audit trail for all data imports, status updates, and force-closures.'}
          </p>
        </div>

        <div className="text-xs text-slate-500">
          {language === 'ar' ? 'إجمالي السجلات:' : 'Total Events:'}{' '}
          <strong className="text-[#0B56A8] dark:text-blue-400 tabular-nums">{filtered.length}</strong>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111827] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث بالمستخدم أو الإجراء...' : 'Search action or user...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8]"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {(['all', 'Import', 'Force Close', 'Project', 'Box', 'User'] as const).map(t => (
            <button
              type="button"
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                typeFilter === t
                  ? 'bg-[#0B56A8] text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t === 'all' ? (language === 'ar' ? 'كافة العمليات' : 'All Events') : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">{language === 'ar' ? 'التاريخ والوقت' : 'Timestamp'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'نوع السجل' : 'Record Type'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'المعرف' : 'Record ID'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 text-slate-500 text-[11px] tabular-nums whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#3F4144] dark:text-white whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.recordType === 'Force Close'
                          ? 'bg-amber-50 text-[#B45309] dark:bg-amber-950/40 dark:text-amber-300'
                          : log.recordType === 'Import'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : log.recordType === 'Project'
                          ? 'bg-[#EAF2FB] text-[#0B56A8] dark:bg-blue-950/40 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {log.recordType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#3F4144] dark:text-slate-200 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {log.recordId}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-md">
                    <div>{log.details}</div>
                    {log.beforeState && log.afterState && (
                      <div className="mt-1 text-[10px] bg-slate-50 dark:bg-slate-800 p-1.5 rounded">
                        <span className="text-slate-400">Before:</span> {log.beforeState}
                        <br />
                        <span className="text-slate-400">After:</span> {log.afterState}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
