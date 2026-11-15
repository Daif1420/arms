/**
 * ARMS - Global Search Command Palette
 * Indexes boxes, dossiers, and projects from ArchiveContext for instant ID and keyword lookup.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Archive,
  FolderArchive,
  FileText,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CornerDownLeft,
} from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { ArchiveSearchItem, SearchEntityType } from '../../types';
import type { ActiveTab } from './TopNav';

interface GlobalSearchProps {
  onNavigate: (tab: ActiveTab, param?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const { boxes, dossiers, projects, searchIndex, searchArchive, language } = useArchive();
  const isAr = language === 'ar';

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SearchEntityType | 'all'>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { results, totalMatches, countsByType } = useMemo(
    () => searchArchive(query, { type: typeFilter, limit: 24 }),
    [searchArchive, query, typeFilter]
  );

  // Global keyboard shortcut: Ctrl+K / Cmd+K or '/' when outside form inputs
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
        return;
      }

      if (e.key === '/' && !open) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Focus input when opened and reset keyboard highlight on query/filter change
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, typeFilter, open]);

  // Keep active keyboard selection visible inside scroll container
  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-search-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  const closeSearch = () => {
    setOpen(false);
    setQuery('');
    setTypeFilter('all');
    setActiveIndex(0);
  };

  const handleSelectItem = (item: ArchiveSearchItem) => {
    if (item.type === 'box') {
      onNavigate('box-detail', item.boxId);
    } else if (item.type === 'dossier') {
      onNavigate('dossier-detail', item.primaryId);
    } else if (item.type === 'project' && item.jobId !== undefined) {
      onNavigate('projects', String(item.jobId));
    }
    closeSearch();
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
      return;
    }
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      const target = results[activeIndex];
      if (target) {
        e.preventDefault();
        handleSelectItem(target);
      }
    }
  };

  const quickExamples = useMemo(() => {
    const samples: string[] = [];
    if (boxes[0]) samples.push(boxes[0].boxCode);
    if (dossiers[0]) samples.push(dossiers[0].id);
    const archivedProject = projects.find(p => p.status === 'Archived') || projects[0];
    if (archivedProject) samples.push(String(archivedProject.jobId));
    samples.push(isAr ? 'مفقود' : 'Missing');
    samples.push(isAr ? 'مؤرشف' : 'Archived');
    return samples;
  }, [boxes, dossiers, projects, isAr]);

  const statusBadge = (item: ArchiveSearchItem) => {
    if (item.status === 'Force Closed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B45309] dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
          <Lock className="w-3 h-3" />
          <span>{isAr ? 'مغلق إدارياً' : 'Force Closed'}</span>
        </span>
      );
    }
    if (item.status === 'Archived') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3 h-3" />
          <span>{isAr ? 'مؤرشف' : 'Archived'}</span>
        </span>
      );
    }
    if (item.status === 'Missing') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E52225] dark:text-red-300 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-md">
          <AlertTriangle className="w-3 h-3" />
          <span>{isAr ? 'مفقود' : 'Missing'}</span>
        </span>
      );
    }
    if (item.status === 'Inprogress') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B56A8] dark:text-blue-300 bg-[#EAF2FB] dark:bg-[#0B56A8]/25 px-2 py-0.5 rounded-md">
          <Clock className="w-3 h-3" />
          <span>{isAr ? 'قيد التنفيذ' : 'Inprogress'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
        <Clock className="w-3 h-3" />
        <span>{isAr ? 'قيد الانتظار' : 'Pending'}</span>
      </span>
    );
  };

  const renderItemContent = (item: ArchiveSearchItem) => {
    if (item.type === 'box' && item.box) {
      return {
        icon: <Archive className="w-4 h-4" />,
        iconBoxClass: 'bg-[#EAF2FB] dark:bg-[#0B56A8]/25 text-[#0B56A8] dark:text-blue-400',
        typeLabel: isAr ? 'بوكس' : 'Box',
        title: isAr ? `بوكس ${item.box.boxCode}` : `Box ${item.box.boxCode}`,
        subtitle: isAr
          ? `النطاق #${item.box.firstJobId} → #${item.box.lastJobId} · ${item.box.archivedProjects}/300 مؤرشف`
          : `Range #${item.box.firstJobId} → #${item.box.lastJobId} · ${item.box.archivedProjects}/300 archived`,
      };
    }
    if (item.type === 'dossier' && item.dossier) {
      return {
        icon: <FolderArchive className="w-4 h-4" />,
        iconBoxClass: 'bg-amber-50 dark:bg-amber-950/50 text-[#B45309] dark:text-amber-400',
        typeLabel: isAr ? 'دوسيه' : 'Dossier',
        title: isAr
          ? `دوسيه ${item.dossier.dossierNumber} · بوكس ${item.dossier.boxId}`
          : `Dossier ${item.dossier.id}`,
        subtitle: isAr
          ? `النطاق #${item.dossier.fromJobId} → #${item.dossier.toJobId} · ${item.dossier.archivedCount}/50 مؤرشف`
          : `Box ${item.dossier.boxId} · #${item.dossier.fromJobId} → #${item.dossier.toJobId} · ${item.dossier.archivedCount}/50 archived`,
      };
    }
    const p = item.project!;
    return {
      icon: <FileText className="w-4 h-4" />,
      iconBoxClass: 'bg-slate-100 dark:bg-neutral-900 text-[#3F4144] dark:text-neutral-300',
      typeLabel: isAr ? 'مشروع' : 'Project',
      title: `Job #${p.jobId}`,
      subtitle: isAr
        ? `بوكس ${p.boxId} · دوسيه ${p.dossierNumber} (خانة #${p.slotIndex + 1})${p.dateApproved ? ` · ${p.dateApproved}` : ''}`
        : `Box ${p.boxId} · Dossier ${p.dossierNumber} (Slot #${p.slotIndex + 1})${p.dateApproved ? ` · ${p.dateApproved}` : ''}`,
    };
  };

  const allCount = countsByType.box + countsByType.dossier + countsByType.project;

  return (
    <>
      {/* TopNav Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={isAr ? 'بحث شامل (Ctrl+K)' : 'Global Search (Ctrl+K)'}
        aria-label={isAr ? 'بحث شامل في الأرشيف' : 'Open global archive search'}
        className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 text-xs text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 hover:border-[#0B56A8]/50 rounded-lg transition-colors"
      >
        <Search className="w-3.5 h-3.5 text-[#0B56A8] dark:text-blue-400 shrink-0" />
        <span className="hidden md:inline text-[11px] font-medium whitespace-nowrap">
          {isAr ? 'بحث سريع...' : 'Quick search...'}
        </span>
        <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-neutral-500 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Search Palette Modal */}
      {open && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-900/45 dark:bg-black/75 backdrop-blur-xs"
          onMouseDown={e => {
            if (e.target === e.currentTarget) closeSearch();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isAr ? 'البحث الشامل في الأرشيف' : 'Global Archive Search'}
            onKeyDown={handleDialogKeyDown}
            className="w-full max-w-2xl bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Input Row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-neutral-800">
              <Search className="w-4 h-4 text-[#0B56A8] dark:text-blue-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث برقم البوكس (D42)، الدوسيه (D42-1)، رقم المشروع (35500)، الحالة أو اسم الملف...'
                    : 'Search by Box (D42), Dossier (D42-1), Job ID (35500), status, date, or filename...'
                }
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800"
                  aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={closeSearch}
                className="px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-md"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center justify-between gap-2 px-4 py-2 bg-slate-50/70 dark:bg-neutral-950/60 border-b border-slate-100 dark:border-neutral-800 overflow-x-auto">
              <div className="flex items-center gap-1">
                {(
                  [
                    { key: 'all', label: isAr ? 'الكل' : 'All', count: query.trim() ? allCount : searchIndex.length },
                    { key: 'box', label: isAr ? 'البوكسات' : 'Boxes', count: query.trim() ? countsByType.box : boxes.length },
                    {
                      key: 'dossier',
                      label: isAr ? 'الدوسيهات' : 'Dossiers',
                      count: query.trim() ? countsByType.dossier : dossiers.length,
                    },
                    {
                      key: 'project',
                      label: isAr ? 'المشاريع' : 'Projects',
                      count: query.trim() ? countsByType.project : projects.length,
                    },
                  ] as const
                ).map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTypeFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      typeFilter === tab.key
                        ? 'bg-[#0B56A8] text-white'
                        : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-200/70 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`tabular-nums text-[10px] px-1.5 py-0.2 rounded ${
                        typeFilter === tab.key
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/70 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-neutral-500 whitespace-nowrap hidden sm:inline">
                {isAr ? `${searchIndex.length} سجل مفهرس` : `${searchIndex.length} indexed items`}
              </span>
            </div>

            {/* Body */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/80">
              {!query.trim() ? (
                <div className="p-5 space-y-4">
                  <div className="text-xs text-slate-500 dark:text-neutral-400">
                    {isAr
                      ? 'اكتب رقم البوكس أو الدوسيه أو المشروع أو أي كلمة مفتاحية (الحالة، التاريخ، اسم ملف الاستيراد) للوصول السريع.'
                      : 'Type a Box code, Dossier ID, Project Job ID, status, approval date, or source filename to jump straight to it.'}
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 mb-2">
                      {isAr ? 'أمثلة بحث سريعة' : 'Quick Search Examples'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickExamples.map(sample => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => {
                            setQuery(sample);
                            inputRef.current?.focus();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0B56A8] dark:text-blue-300 bg-[#EAF2FB] dark:bg-[#0B56A8]/20 hover:bg-blue-100 dark:hover:bg-[#0B56A8]/35 rounded-lg transition-colors"
                        >
                          {sample}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-1.5">
                  <div className="text-sm font-bold text-slate-700 dark:text-neutral-200">
                    {isAr ? `لا توجد نتائج مطابقة لـ "${query}"` : `No results found for "${query}"`}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-neutral-500">
                    {isAr
                      ? 'جرب البحث برقم المشروع (مثل 35500) أو رمز البوكس (مثل D42) أو حالة الأرشفة.'
                      : 'Try searching by Job ID (e.g. 35500), Box code (e.g. D42), Dossier ID (D42-1), or status.'}
                  </p>
                </div>
              ) : (
                results.map((item, idx) => {
                  const info = renderItemContent(item);
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={item.uid}
                      type="button"
                      data-search-index={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectItem(item)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-start transition-colors ${
                        isActive
                          ? 'bg-[#EAF2FB]/80 dark:bg-[#0B56A8]/20'
                          : 'hover:bg-slate-50 dark:hover:bg-neutral-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${info.iconBoxClass}`}
                        >
                          {info.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {info.title}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                              {info.typeLabel}
                            </span>
                            {statusBadge(item)}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5 tabular-nums">
                            {info.subtitle}
                          </div>
                        </div>
                      </div>

                      <ArrowRight
                        className={`w-4 h-4 shrink-0 rtl:rotate-180 transition-colors ${
                          isActive ? 'text-[#0B56A8] dark:text-blue-400' : 'text-slate-300 dark:text-neutral-700'
                        }`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-neutral-950 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-neutral-500">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" />
                  <span>{isAr ? 'فتح النتيجة' : 'Open'}</span>
                </span>
                <span>↑↓ {isAr ? 'تنقل' : 'Navigate'}</span>
                <span>ESC {isAr ? 'إغلاق' : 'Close'}</span>
              </div>

              {query.trim() && totalMatches > results.length && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('projects', query.trim());
                    closeSearch();
                  }}
                  className="font-semibold text-[#0B56A8] dark:text-blue-400 hover:underline"
                >
                  {isAr
                    ? `عرض كل النتائج (${totalMatches}) في سجل المشاريع`
                    : `View all ${totalMatches} matches in Projects`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
