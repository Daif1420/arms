/**
 * ARMS - Dossiers List View
 * Displays all dossiers across all boxes with filters and quick access to the 50 slots.
 */

import React, { useState } from 'react';
import { FolderArchive, Search, ArrowRight } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { ActiveTab } from '../navigation/TopNav';

interface DossiersViewProps {
  onNavigate: (tab: ActiveTab, param?: string) => void;
  onSelectDossier: (dossierId: string) => void;
}

export const DossiersView: React.FC<DossiersViewProps> = ({ onNavigate, onSelectDossier }) => {
  const { dossiers, boxes, language } = useArchive();
  const [searchTerm, setSearchTerm] = useState('');
  const [boxFilter, setBoxFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Archived' | 'Inprogress' | 'Pending'>('all');

  const sortedBoxes = [...boxes].sort((a, b) => a.firstJobId - b.firstJobId);

  const filtered = dossiers
    .filter(d => {
      const matchSearch =
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.boxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(d.fromJobId).includes(searchTerm) ||
        String(d.toJobId).includes(searchTerm);

      if (!matchSearch) return false;
      if (boxFilter !== 'all' && d.boxId !== boxFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => a.fromJobId - b.fromJobId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-[#0B56A8] dark:text-blue-400" />
            <span>{language === 'ar' ? 'إدارة الدوسيهات (Dossiers)' : 'Dossiers Management'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            {language === 'ar'
              ? 'كل دوسيه يحتوي بدقة على 50 خانة مشروع متسلسلة.'
              : 'Strict 50-project slots per dossier with gap and status mapping.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#111111] p-3 rounded-xl border border-slate-200 dark:border-neutral-800">
        <div className="relative w-full sm:w-72">
          <Search className="absolute start-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث بالدوسيه أو النطاق...' : 'Search dossier or range...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B56A8]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={boxFilter}
            onChange={e => setBoxFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-[#0B56A8]"
          >
            <option value="all">{language === 'ar' ? 'كافة البوكسات' : 'All Boxes'}</option>
            {sortedBoxes.map(b => (
              <option key={b.id} value={b.boxCode}>
                Box {b.boxCode}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            {(['all', 'Inprogress', 'Archived', 'Pending'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  statusFilter === s
                    ? 'bg-[#0B56A8] text-white font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900'
                }`}
              >
                {s === 'all' && (language === 'ar' ? 'الكل' : 'All')}
                {s === 'Inprogress' && (language === 'ar' ? 'جاري' : 'Inprogress')}
                {s === 'Archived' && (language === 'ar' ? 'مكتمل (50)' : 'Archived')}
                {s === 'Pending' && (language === 'ar' ? 'فارغ' : 'Pending')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(dossier => {
          const percent = ((dossier.archivedCount / 50) * 100).toFixed(0);
          return (
            <div
              key={dossier.id}
              onClick={() => {
                onSelectDossier(dossier.id);
                onNavigate('dossier-detail', dossier.id);
              }}
              className="p-4 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl hover:border-[#0B56A8]/60 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF2FB] dark:bg-[#0B56A8]/25 flex items-center justify-center font-bold text-[#0B56A8] dark:text-blue-400 text-sm">
                      {dossier.dossierNumber}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 transition-colors">
                        Box {dossier.boxId} · {language === 'ar' ? `دوسيه ${dossier.dossierNumber}` : `Dossier ${dossier.dossierNumber}`}
                      </div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        #{dossier.fromJobId} → #{dossier.toJobId}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold ${
                      dossier.status === 'Archived'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : dossier.status === 'Inprogress'
                        ? 'text-[#B45309] dark:text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {dossier.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">{language === 'ar' ? 'مؤرشف' : 'Archived'}</div>
                    <div className="text-xs font-bold text-[#0B56A8] dark:text-blue-400 tabular-nums">
                      {dossier.archivedCount} / 50
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">{language === 'ar' ? 'مفقود' : 'Missing'}</div>
                    <div className="text-xs font-bold text-[#E52225] tabular-nums">
                      {dossier.missingCount > 0 ? dossier.missingCount : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</div>
                    <div className="text-xs font-bold text-slate-400 tabular-nums">{dossier.pendingCount}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="w-full bg-slate-100 dark:bg-neutral-900 rounded-full h-1.5 overflow-hidden flex">
                    <div className="bg-[#0B56A8] h-full" style={{ width: `${(dossier.archivedCount / 50) * 100}%` }} />
                    <div className="bg-[#E52225] h-full" style={{ width: `${(dossier.missingCount / 50) * 100}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 flex items-center justify-between text-xs text-slate-500 group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 transition-colors">
                <span className="text-[11px] font-semibold">{percent}% {language === 'ar' ? 'مكتمل' : 'complete'}</span>
                <div className="flex items-center gap-1 text-[11px] font-medium">
                  <span>{language === 'ar' ? 'عرض الـ 50 مشروع' : 'View 50 slots'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl py-12 px-4 text-center space-y-2.5">
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            {language === 'ar' ? 'لا توجد دوسيهات مطابقة لمعايير البحث' : 'No matching dossiers found'}
          </p>
          {(searchTerm || boxFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setBoxFilter('all');
                setStatusFilter('all');
              }}
              className="px-3 py-1.5 text-xs font-semibold text-[#0B56A8] dark:text-blue-400 hover:underline"
            >
              {language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
