/**
 * ARMS - Inline Global Search Bar
 * Placed above the Dashboard KPIs; indexes boxes, dossiers, and projects from ArchiveContext.
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

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<SearchEntityType | 'all'>('all');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { results, totalMatches, countsByType } = useMemo(
    () => searchArchive(query, { type: typeFilter, limit: 20 }),
    [searchArchive, query, typeFilter]
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K or '/' focuses the inline search bar
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setDropdownOpen(true);
        return;
      }

      if (e.key === '/') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        inputRef.current?.focus();
        setDropdownOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, typeFilter]);

  useEffect(() => {
    if (!dropdownOpen || !listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-search-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, dropdownOpen]);

  const handleSelectItem = (item: ArchiveSearchItem) => {
    if (item.type === 'box') {
      onNavigate('box-detail', item.boxId);
    } else if (item.type === 'dossier') {
      onNavigate('dossier-detail', item.primaryId);
    } else if (item.type === 'project' && item.jobId !== undefined) {
      onNavigate('projects', String(item.jobId));
    }
    setDropdownOpen(false);
    setQuery('');
    setTypeFilter('all');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (query) {
        setQuery('');
      } else {
        setDropdownOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (!dropdownOpen) {
      if (e.key === 'ArrowDown') {
        setDropdownOpen(true);
      }
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
    <div ref={containerRef} className="relative z-30">
      {/* Inline Search Bar Card */}
      <div
        className={`bg-white dark:bg-[#111111] border rounded-xl transition-colors ${
          dropdownOpen
            ? 'border-[#0B56A8] ring-2 ring-[#0B56A8]/15'
            : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3.5 py-2.5">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Search className="w-4 h-4 text-[#0B56A8] dark:text-blue-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onFocus={() => setDropdownOpen(true)}
              onChange={e => {
                setQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder={
                isAr
                  ? 'بحث شامل: ابحث برقم البوكس (D41)، الدوسيه (D41-1)، رقم المشروع (35200)، أو أي كلمة مفتاحية...'
                  : 'Global search: find any Box (D41), Dossier (D41-1), Project ID (35200), status, date, or keyword...'
              }
              aria-label={isAr ? 'البحث الشامل في الأرشيف' : 'Global archive search'}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                  setDropdownOpen(true);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-neutral-800 shrink-0"
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-neutral-800 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                [
                  { key: 'all', label: isAr ? 'الكل' : 'All', count: query.trim() ? allCount : searchIndex.length },
                  { key: 'box', label: isAr ? 'بوكس' : 'Boxes', count: query.trim() ? countsByType.box : boxes.length },
                  {
                    key: 'dossier',
                    label: isAr ? 'دوسيه' : 'Dossiers',
                    count: query.trim() ? countsByType.dossier : dossiers.length,
                  },
                  {
                    key: 'project',
                    label: isAr ? 'مشروع' : 'Projects',
                    count: query.trim() ? countsByType.project : projects.length,
                  },
                ] as const
              ).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setTypeFilter(tab.key);
                    setDropdownOpen(true);
                    inputRef.current?.focus();
                  }}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    typeFilter === tab.key
                      ? 'bg-[#0B56A8] text-white'
                      : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`tabular-nums text-[10px] px-1 rounded ${
                      typeFilter === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-neutral-500 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Results Dropdown Panel */}
      {dropdownOpen && (
        <div
          role="region"
          aria-label={isAr ? 'نتائج البحث الشامل' : 'Global search results'}
          className="absolute start-0 end-0 top-full mt-2 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden"
        >
          <div ref={listRef} className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/80">
            {!query.trim() ? (
              <div className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-neutral-400">
                  <span>
                    {isAr
                      ? 'ابحث بالرقم التعريفي أو الكلمات المفتاحية (الحالة، التاريخ، اسم ملف الاستيراد).'
                      : 'Search by ID or keywords (status, approval date, or Excel source filename).'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-neutral-500 tabular-nums">
                    {isAr ? `${searchIndex.length.toLocaleString()} عنصر مفهرس` : `${searchIndex.length.toLocaleString()} indexed items`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 me-1">
                    {isAr ? 'أمثلة سريعة:' : 'Quick try:'}
                  </span>
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
            ) : results.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-1">
                <div className="text-sm font-bold text-slate-700 dark:text-neutral-200">
                  {isAr ? `لا توجد نتائج مطابقة لـ "${query}"` : `No results found for "${query}"`}
                </div>
                <p className="text-xs text-slate-400 dark:text-neutral-500">
                  {isAr
                    ? 'جرب البحث برقم المشروع (مثل 35200) أو رمز البوكس (مثل D41) أو حالة الأرشفة.'
                    : 'Try searching by Job ID (e.g. 35200), Box code (e.g. D41), Dossier ID (D41-1), or status.'}
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
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-start transition-colors ${
                      isActive
                        ? 'bg-[#EAF2FB]/80 dark:bg-[#0B56A8]/20'
                        : 'hover:bg-slate-50 dark:hover:bg-neutral-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${info.iconBoxClass}`}
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

          <div className="px-4 py-2 bg-slate-50 dark:bg-neutral-950 border-t border-slate-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-neutral-500">
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
                  setDropdownOpen(false);
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
      )}
    </div>
  );
};
