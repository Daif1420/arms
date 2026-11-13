/**
 * ARMS - Box Detail View
 * Displays metadata and the 6 Dossiers of the selected Box.
 */

import React from 'react';
import { Printer, ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { ActiveTab } from '../navigation/TopNav';

interface BoxDetailViewProps {
  boxId: string;
  onNavigate: (tab: ActiveTab, param?: string) => void;
  onSelectDossier: (dossierId: string) => void;
}

export const BoxDetailView: React.FC<BoxDetailViewProps> = ({ boxId, onNavigate, onSelectDossier }) => {
  const { boxes, dossiers, language } = useArchive();

  const box = boxes.find(b => b.id === boxId || b.boxCode === boxId);
  if (!box) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500">{language === 'ar' ? 'البوكس غير موجود.' : 'Box not found.'}</p>
        <button onClick={() => onNavigate('boxes')} className="mt-3 text-xs font-semibold text-[#0B56A8] underline">
          {language === 'ar' ? 'العودة للبوكسات' : 'Back to Boxes'}
        </button>
      </div>
    );
  }

  const boxDossiers = dossiers
    .filter(d => d.boxId === box.boxCode)
    .sort((a, b) => a.dossierNumber - b.dossierNumber);

  const percent = ((box.archivedProjects / 300) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('boxes')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#0B56A8] hover:text-[#0B56A8] transition-colors text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'ar' ? `تفاصيل البوكس ${box.boxCode}` : `Box ${box.boxCode} Details`}
              </h1>
              {box.isForceClosed && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B45309] dark:text-amber-300">
                  <Lock className="w-3 h-3" />
                  <span>Force Closed</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ar'
                ? `نطاق البوكس: من #${box.firstJobId} إلى #${box.lastJobId} (إجمالي 300 مشروع)`
                : `Job ID Range: #${box.firstJobId} → #${box.lastJobId} (Strict 300 Project Slots)`}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('labels', box.boxCode)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'طباعة ليبلات البوكس الـ 7' : 'Print 7-Page Labels'}</span>
        </button>
      </div>

      {box.isForceClosed && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs space-y-1">
          <div className="font-bold text-[#B45309] dark:text-amber-200 flex items-center gap-1.5">
            <Lock className="w-4 h-4" />
            <span>{language === 'ar' ? 'تم تطبيق الإغلاق الإداري (Force Close)' : 'Administratively Force Closed'}</span>
          </div>
          <p className="text-amber-900 dark:text-amber-300">
            <strong>{language === 'ar' ? 'السبب المسجل:' : 'Recorded Reason:'}</strong> {box.forceCloseReason}
          </p>
          <p className="text-amber-700 dark:text-amber-400 text-[11px]">
            {language === 'ar' ? 'بواسطة:' : 'By:'} {box.forceClosedBy} · {box.forceClosedAt}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[11px] text-slate-500">{language === 'ar' ? 'المشاريع المؤرشفة' : 'Archived Projects'}</span>
          <div className="text-xl font-bold text-[#0B56A8] dark:text-blue-400 tabular-nums">{box.archivedProjects} / 300</div>
          <span className="text-[10px] text-slate-400">{percent}% {language === 'ar' ? 'مكتمل' : 'completed'}</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500">{language === 'ar' ? 'المشاريع المفقودة (فجوات)' : 'Missing Projects (Gaps)'}</span>
          <div className="text-xl font-bold text-[#E52225] tabular-nums">{box.missingProjects}</div>
          <span className="text-[10px] text-[#E52225]/80">{language === 'ar' ? 'فجوات تسلسل مثبتة' : 'Proven sequence gaps'}</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500">{language === 'ar' ? 'مشاريع قيد الانتظار' : 'Pending Projects'}</span>
          <div className="text-xl font-bold text-slate-700 dark:text-slate-300 tabular-nums">{box.pendingProjects}</div>
          <span className="text-[10px] text-slate-400">{language === 'ar' ? 'لم تستورد بعد' : 'Awaiting delivery'}</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-500">{language === 'ar' ? 'الدوسيهات المكتملة' : 'Completed Dossiers'}</span>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{box.completedDossiers} / 6</div>
          <span className="text-[10px] text-slate-400">50 {language === 'ar' ? 'مشروع لكل دوسيه' : 'projects/dossier'}</span>
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          {language === 'ar' ? 'الدوسيهات الستة التابعة للبوكس' : 'The 6 Dossiers of this Box'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boxDossiers.map(dossier => {
            const dPercent = ((dossier.archivedCount / 50) * 100).toFixed(0);
            return (
              <div
                key={dossier.id}
                onClick={() => {
                  onSelectDossier(dossier.id);
                  onNavigate('dossier-detail', dossier.id);
                }}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-[#0B56A8]/60 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#EAF2FB] dark:bg-[#0B56A8]/25 flex items-center justify-center font-bold text-[#0B56A8] dark:text-blue-400 text-sm">
                        {dossier.dossierNumber}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 transition-colors">
                          {language === 'ar' ? `دوسيه رقم ${dossier.dossierNumber}` : `Dossier ${dossier.dossierNumber}`}
                        </h3>
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

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
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
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                      <div className="bg-[#0B56A8] h-full" style={{ width: `${(dossier.archivedCount / 50) * 100}%` }} />
                      <div className="bg-[#E52225] h-full" style={{ width: `${(dossier.missingCount / 50) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex items-center justify-between text-xs text-slate-500 group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 transition-colors">
                  <span className="text-[11px] font-semibold">{dPercent}% {language === 'ar' ? 'مكتمل' : 'complete'}</span>
                  <div className="flex items-center gap-1 text-[11px] font-medium">
                    <span>{language === 'ar' ? 'استعراض الـ 50 مشروع' : 'View 50 slots'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
