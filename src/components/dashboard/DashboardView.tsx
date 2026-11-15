/**
 * ARMS - Dashboard View
 * Calm, executive-grade layout with minimal visual clutter:
 * - Unified 4-KPI + Progress strip
 * - Sleek Horizontal Box Capacity Meters (300 slots per box — clean bar, count & %)
 * - Streamlined Quick Actions rail
 * - Centered Status Donut & concise Recent Uploads + Missing Alerts
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Archive,
  ArrowRight,
  ArrowLeft,
  FileBarChart,
  ArrowUpRight,
  ClipboardList,
  FolderPlus,
  Layers,
  Lock,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useArchive } from '../../context/ArchiveContext';
import { ActiveTab } from '../navigation/TopNav';
import { GlobalSearch } from '../navigation/GlobalSearch';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab, param?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { boxes, dossiers, projects, uploadHistory, currentUser, language } = useArchive();
  const [boxStatusTab, setBoxStatusTab] = useState<'all' | 'Inprogress' | 'Archived'>('all');

  const isAr = language === 'ar';
  const DirectionalArrow = isAr ? ArrowLeft : ArrowRight;

  const totalProjects = projects.length;
  const archivedProjects = projects.filter(p => p.status === 'Archived').length;
  const missingProjects = projects.filter(p => p.status === 'Missing').length;
  const pendingProjects = projects.filter(p => p.status === 'Pending').length;

  const totalBoxes = boxes.length;
  const archivedBoxes = boxes.filter(b => b.status === 'Archived').length;
  const inprogressBoxes = boxes.filter(b => b.status === 'Inprogress').length;

  const totalDossiers = dossiers.length;
  const completionRate = totalProjects > 0 ? ((archivedProjects / totalProjects) * 100).toFixed(1) : '0.0';

  const projectStatusData = [
    { name: isAr ? 'مؤرشف' : 'Archived', value: archivedProjects, color: '#0B56A8' },
    { name: isAr ? 'مفقود' : 'Missing', value: missingProjects, color: '#E52225' },
    { name: isAr ? 'انتظار' : 'Pending', value: pendingProjects, color: '#A3A3A3' },
  ];

  const sortedBoxes = [...boxes].sort((a, b) => a.firstJobId - b.firstJobId);
  const visibleBoxes = sortedBoxes.filter(b => {
    if (boxStatusTab === 'all') return true;
    return b.status === boxStatusTab;
  });

  const recentMissing = [...projects]
    .filter(p => p.status === 'Missing')
    .sort((a, b) => a.jobId - b.jobId)
    .slice(0, 6);

  const isAdmin = currentUser.role === 'System Admin';

  const allQuickActions: Array<{
    id: string;
    label: string;
    icon: any;
    accent: string;
    onClick: () => void;
    adminOnly?: boolean;
  }> = [
    {
      id: 'print-label',
      label: isAr ? 'طباعة ليبل' : 'Print Label',
      icon: Printer,
      accent: 'text-[#0B56A8] bg-[#EAF2FB] dark:bg-blue-950/60 dark:text-blue-400',
      onClick: () => onNavigate('labels'),
    },
    {
      id: 'audit-entry',
      label: isAr ? 'سجل المراجعة' : 'Audit Entry',
      icon: ClipboardList,
      accent: 'text-slate-700 bg-slate-100 dark:bg-neutral-900 dark:text-neutral-300',
      onClick: () => onNavigate('audit'),
      adminOnly: true,
    },
    {
      id: 'create-dossier',
      label: isAr ? 'إنشاء دوسيه / بوكس' : 'Create New Dossier',
      icon: FolderPlus,
      accent: 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
      onClick: () => (isAdmin ? onNavigate('boxes', 'create') : onNavigate('dossiers')),
    },
    {
      id: 'import-excel',
      label: isAr ? 'استيراد Excel' : 'Import Excel',
      icon: FileSpreadsheet,
      accent: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
      onClick: () => onNavigate('import'),
    },
    {
      id: 'reports',
      label: isAr ? 'مركز التقارير' : 'Reports Center',
      icon: FileBarChart,
      accent: 'text-[#0B56A8] bg-[#EAF2FB] dark:bg-blue-950/60 dark:text-blue-400',
      onClick: () => onNavigate('reports'),
    },
    {
      id: 'missing-gaps',
      label: isAr ? `فحص الفجوات (${missingProjects})` : `Check Gaps (${missingProjects})`,
      icon: AlertTriangle,
      accent: 'text-[#E52225] bg-red-50 dark:bg-red-950/50 dark:text-red-400',
      onClick: () => onNavigate('projects', 'Missing'),
    },
  ];
  const quickActions = allQuickActions.filter(action => !action.adminOnly || isAdmin);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'لوحة المتابعة والتحكم' : 'Archive Operations Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            {isAr
              ? 'نظرة شاملة على الأرشفة وحالة البوكسات.'
              : 'High-level overview of archiving progress and box capacity.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('import')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{isAr ? 'استيراد Excel' : 'Import Excel'}</span>
        </button>
      </div>

      {/* Global Archive Search (indexed from context) */}
      <GlobalSearch onNavigate={onNavigate} />

      {/* Unified KPI Strip + Progress Bar */}
      <section
        aria-label={isAr ? 'ملخص مؤشرات الأرشفة' : 'Archive Metrics Summary'}
        className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="p-5 text-start bg-white dark:bg-[#111111] hover:bg-slate-50/80 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
              <span>{isAr ? 'إجمالي المشاريع' : 'Total Projects'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#0B56A8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {totalProjects.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {totalBoxes} {isAr ? 'بوكس' : 'Boxes'} · {totalDossiers} {isAr ? 'دوسيه' : 'Dossiers'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('projects', 'Archived')}
            className="p-5 text-start bg-white dark:bg-[#111111] hover:bg-slate-50/80 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs font-medium text-[#0B56A8] dark:text-blue-400">
              <span>{isAr ? 'المؤرشف' : 'Archived'}</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0B56A8] dark:text-blue-400 tabular-nums">
              {archivedProjects.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 tabular-nums">
              {completionRate}% {isAr ? 'من الإجمالي' : 'completed'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('projects', 'Missing')}
            className="p-5 text-start bg-white dark:bg-[#111111] hover:bg-slate-50/80 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs font-medium text-[#E52225] dark:text-red-400">
              <span>{isAr ? 'المفقود (الفجوات)' : 'Missing Gaps'}</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#E52225]" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#E52225] dark:text-red-400 tabular-nums">
              {missingProjects.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 tabular-nums">
              {pendingProjects.toLocaleString()} {isAr ? 'قيد الانتظار' : 'pending'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('boxes')}
            className="p-5 text-start bg-white dark:bg-[#111111] hover:bg-slate-50/80 dark:hover:bg-neutral-900/60 transition-colors group"
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
              <span>{isAr ? 'البوكسات' : 'Boxes'}</span>
              <Archive className="w-3.5 h-3.5 text-[#0B56A8]" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {totalBoxes}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 tabular-nums">
              {archivedBoxes} {isAr ? 'مكتمل' : 'done'} · {inprogressBoxes} {isAr ? 'جاري' : 'active'}
            </div>
          </button>
        </div>

        {/* Clean Integrated Overall Progress Bar */}
        <div className="px-5 py-3 bg-slate-50/70 dark:bg-neutral-900/30 border-t border-slate-200 dark:border-neutral-800 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-4 h-4 text-[#0B56A8]" />
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-200">
              {isAr ? 'التقدم الإجمالي' : 'Overall Progress'}
            </span>
          </div>

          <div className="flex-1 bg-slate-200 dark:bg-neutral-800/80 rounded-full h-2 overflow-hidden flex">
            <div
              className="bg-[#0B56A8] h-full transition-all"
              style={{ width: `${(archivedProjects / (totalProjects || 1)) * 100}%` }}
            />
            <div
              className="bg-[#E52225] h-full transition-all"
              style={{ width: `${(missingProjects / (totalProjects || 1)) * 100}%` }}
            />
          </div>

          <span className="text-xs font-extrabold text-[#0B56A8] dark:text-blue-400 tabular-nums shrink-0">
            {completionRate}%
          </span>
        </div>
      </section>

      {/* Row 2: 8/4 Split — Clean Box Capacity Meters (300 slots) + Minimal Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <section
          aria-label={isAr ? 'حالة البوكسات الحالية (300 مشروع)' : 'Current Boxes Status (300 Slots)'}
          className="lg:col-span-8 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl flex flex-col justify-between overflow-hidden"
        >
          <div>
            {/* Clean Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'حالة البوكسات الحالية (300 مشروع)' : 'Current Boxes Status (300 Slots)'}
              </h2>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center bg-slate-100 dark:bg-neutral-900 p-0.5 rounded-lg text-[11px]">
                  <button
                    type="button"
                    onClick={() => setBoxStatusTab('all')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      boxStatusTab === 'all'
                        ? 'bg-white dark:bg-[#111111] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoxStatusTab('Inprogress')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      boxStatusTab === 'Inprogress'
                        ? 'bg-white dark:bg-[#111111] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {isAr ? 'جاري' : 'Active'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBoxStatusTab('Archived')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      boxStatusTab === 'Archived'
                        ? 'bg-white dark:bg-[#111111] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    {isAr ? 'مكتمل' : 'Done'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('boxes')}
                  className="text-xs font-semibold text-[#0B56A8] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>{isAr ? 'كل البوكسات' : 'View all'}</span>
                  <DirectionalArrow className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Ultra-Clean Horizontal Progress Bars (zero cluttered micro-details) */}
            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {visibleBoxes.slice(0, 6).map(box => {
                const capacity = box.totalProjects || 300;
                const pct = Math.round((box.archivedProjects / capacity) * 100);
                const archivedPct = (box.archivedProjects / capacity) * 100;
                const missingPct = (box.missingProjects / capacity) * 100;

                const dotColor = box.isForceClosed
                  ? 'bg-slate-400'
                  : box.status === 'Archived'
                  ? 'bg-[#0B56A8]'
                  : 'bg-amber-500';

                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => onNavigate('box-detail', box.boxCode)}
                    className="w-full px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/80 dark:hover:bg-neutral-900/40 transition-colors text-start group"
                  >
                    {/* Box Code */}
                    <div className="flex items-center gap-2.5 w-24 shrink-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 transition-colors">
                        Box {box.boxCode}
                      </span>
                      {box.isForceClosed && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                    </div>

                    {/* Sleek 300-Slot Capacity Bar */}
                    <div className="flex-1 h-2.5 bg-slate-100 dark:bg-neutral-900 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#0B56A8] h-full transition-all duration-300"
                        style={{ width: `${archivedPct}%` }}
                      />
                      <div
                        className="bg-[#E52225] h-full transition-all duration-300"
                        style={{ width: `${missingPct}%` }}
                      />
                    </div>

                    {/* Clean Right Numeric Summary */}
                    <div className="flex items-center justify-end gap-3 w-28 shrink-0 tabular-nums">
                      <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                        {box.archivedProjects} / {capacity}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white w-9 text-end">
                        {pct}%
                      </span>
                    </div>
                  </button>
                );
              })}

              {visibleBoxes.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  {isAr ? 'لا توجد بوكسات مطابقة' : 'No matching boxes'}
                </div>
              )}
            </div>
          </div>

          {/* Minimal Legend Footer */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2 rounded-sm bg-[#0B56A8]" />
                <span>{isAr ? 'مؤرشف' : 'Archived'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2 rounded-sm bg-[#E52225]" />
                <span>{isAr ? 'مفقود' : 'Missing'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2 rounded-sm bg-slate-200 dark:bg-neutral-800" />
                <span>{isAr ? 'متبقي' : 'Remaining'}</span>
              </span>
            </div>
            {visibleBoxes.length > 6 && (
              <span className="tabular-nums text-slate-400">
                +{visibleBoxes.length - 6} {isAr ? 'بوكسات أخرى' : 'more boxes'}
              </span>
            )}
          </div>
        </section>

        {/* Streamlined Quick Actions Rail */}
        <section
          aria-label={isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          className="lg:col-span-4 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl flex flex-col justify-between overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-neutral-800 flex-1 flex flex-col justify-center">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors text-start group flex-1"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.accent}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 truncate transition-colors">
                      {action.label}
                    </span>
                  </div>
                  <DirectionalArrow className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Row 3: 4/8 Split — Status Distribution Donut + Concise Upload History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-4 p-5 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {isAr ? 'توزيع حالات المشاريع' : 'Status Distribution'}
          </h2>

          <div className="relative h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={54} outerRadius={76} paddingAngle={3} dataKey="value">
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val}`, '']}
                  contentStyle={{
                    backgroundColor: '#111111',
                    borderColor: '#262626',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {completionRate}%
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                {isAr ? 'مؤرشف' : 'Archived'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800 text-center">
            {projectStatusData.map(item => (
              <div key={item.name} className="flex flex-col">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 truncate flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl flex flex-col justify-between overflow-hidden">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-[#0B56A8]" />
                <span>{isAr ? 'آخر عمليات استيراد Excel' : 'Recent Excel Uploads'}</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('import')}
                className="text-xs font-semibold text-[#0B56A8] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <span>{isAr ? 'رفع ملف جديد' : 'Upload File'}</span>
                <DirectionalArrow className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 dark:bg-neutral-900/70 text-slate-500 text-[11px] font-semibold border-b border-slate-100 dark:border-neutral-800">
                  <tr>
                    <th className="px-5 py-2.5 text-start">{isAr ? 'الملف' : 'File Name'}</th>
                    <th className="px-3 py-2.5 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="px-3 py-2.5 text-end">{isAr ? 'المستورد' : 'Imported'}</th>
                    <th className="px-5 py-2.5 text-end">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {uploadHistory.slice(0, 5).map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-neutral-900/40">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white max-w-[240px] truncate">
                        {u.fileName}
                      </td>
                      <td className="px-3 py-3 text-slate-400 text-[11px] tabular-nums">{u.timestamp}</td>
                      <td className="px-3 py-3 text-end font-bold text-[#0B56A8] dark:text-blue-400 tabular-nums">
                        {u.importedCount}
                      </td>
                      <td className="px-5 py-3 text-end">
                        <span
                          className={`text-[11px] font-semibold ${
                            u.status === 'Completed'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-[#B45309] dark:text-amber-400'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {uploadHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        {isAr ? 'لم يتم رفع ملفات بعد' : 'No uploads yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Clean Missing Projects Alerts Strip */}
      <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E52225]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'المشاريع المفقودة' : 'Missing Projects'}
            </h2>
            <span className="text-xs text-[#E52225] dark:text-red-400 font-semibold tabular-nums">
              · {missingProjects}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('projects', 'Missing')}
            className="text-xs font-semibold text-[#0B56A8] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>{isAr ? 'عرض الكل' : 'View all'}</span>
            <DirectionalArrow className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentMissing.length > 0 ? (
          <div className="-mt-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:divide-x rtl:sm:divide-x-reverse divide-slate-100 dark:divide-neutral-800">
            {recentMissing.map(p => (
              <button
                type="button"
                key={p.jobId}
                onClick={() => onNavigate('projects', String(p.jobId))}
                className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-neutral-900/50 transition-colors flex items-center justify-between text-start border-t border-slate-100 dark:border-neutral-800"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                  Job #{p.jobId}
                </span>
                <span className="text-[11px] text-slate-500">
                  Box {p.boxId} · D{p.dossierNumber}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            {isAr ? 'لا توجد مشاريع مفقودة حالياً' : 'No missing projects detected'}
          </div>
        )}
      </div>
    </div>
  );
};
