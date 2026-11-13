/**
 * ARMS - Dashboard View
 * Balanced 12-column enterprise layout: 4 KPI cards + progress strip, 8/4 BarChart + Quick Actions rail,
 * 4/8 Status Distribution + Upload History table, and clean Missing Alerts strip.
 */

import React from 'react';
import {
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  CheckCircle2,
  FolderArchive,
  ArrowRight,
  ArrowLeft,
  FileBarChart,
  ArrowUpRight,
  ClipboardList,
  FolderPlus,
  Layers,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useArchive } from '../../context/ArchiveContext';
import { ActiveTab } from '../navigation/TopNav';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab, param?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { boxes, dossiers, projects, uploadHistory, currentUser, language } = useArchive();
  const isAr = language === 'ar';
  const DirectionalArrow = isAr ? ArrowLeft : ArrowRight;

  const totalProjects = projects.length;
  const archivedProjects = projects.filter(p => p.status === 'Archived').length;
  const missingProjects = projects.filter(p => p.status === 'Missing').length;
  const pendingProjects = projects.filter(p => p.status === 'Pending').length;

  const totalBoxes = boxes.length;
  const archivedBoxes = boxes.filter(b => b.status === 'Archived').length;
  const inprogressBoxes = boxes.filter(b => b.status === 'Inprogress').length;
  const forceClosedBoxes = boxes.filter(b => b.isForceClosed).length;

  const totalDossiers = dossiers.length;
  const archivedDossiers = dossiers.filter(d => d.status === 'Archived').length;
  const inprogressDossiers = dossiers.filter(d => d.status === 'Inprogress').length;

  const completionRate = totalProjects > 0 ? ((archivedProjects / totalProjects) * 100).toFixed(1) : '0.0';

  const projectStatusData = [
    { name: isAr ? 'مؤرشف' : 'Archived', value: archivedProjects, color: '#0B56A8' },
    { name: isAr ? 'مفقود (فجوة)' : 'Missing', value: missingProjects, color: '#E52225' },
    { name: isAr ? 'قيد الانتظار' : 'Pending', value: pendingProjects, color: '#CBD5E1' },
  ];

  const boxProgressData = boxes.map(b => ({
    name: b.boxCode,
    Archived: b.archivedProjects,
    Missing: b.missingProjects,
    Pending: b.pendingProjects,
    isForceClosed: b.isForceClosed,
  }));

  const recentMissing = projects.filter(p => p.status === 'Missing').slice(0, 6);
  const isAdmin = currentUser.role === 'System Admin';

  const quickActions = [
    {
      id: 'print-label',
      label: isAr ? 'طباعة ليبل' : 'Print Label',
      sublabel: isAr ? 'ليبلات البوكسات والدوسيهات 100×50' : 'Box & Dossier 100×50mm',
      icon: Printer,
      accent: 'text-[#0B56A8] bg-[#EAF2FB] dark:bg-blue-950/60 dark:text-blue-400',
      onClick: () => onNavigate('labels'),
    },
    {
      id: 'audit-entry',
      label: isAr ? 'سجل المراجعة' : 'Audit Entry',
      sublabel: isAr ? 'متابعة العمليات وسجل الحركات' : 'Trace logs & user actions',
      icon: ClipboardList,
      accent: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
      onClick: () => onNavigate('audit'),
    },
    {
      id: 'create-dossier',
      label: isAr ? 'إنشاء دوسيه / بوكس' : 'Create New Dossier',
      sublabel: isAdmin
        ? (isAr ? 'فتح بوكس جديد بـ 6 دوسيهات' : 'New box & 6 dossier slots')
        : (isAr ? 'عرض وإدارة الدوسيهات' : 'Open dossiers workspace'),
      icon: FolderPlus,
      accent: 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
      onClick: () => (isAdmin ? onNavigate('boxes', 'create') : onNavigate('dossiers')),
    },
    {
      id: 'import-excel',
      label: isAr ? 'استيراد Excel' : 'Import Excel',
      sublabel: isAr ? 'رفع كشوف المشاريع الجديدة' : 'Upload Job ID batches',
      icon: FileSpreadsheet,
      accent: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
      onClick: () => onNavigate('import'),
    },
    {
      id: 'reports',
      label: isAr ? 'مركز التقارير' : 'Reports Center',
      sublabel: isAr ? 'تصدير A4 PDF و Excel وطباعة' : 'A4 PDF, Excel & Print',
      icon: FileBarChart,
      accent: 'text-[#0B56A8] bg-[#EAF2FB] dark:bg-blue-950/60 dark:text-blue-400',
      onClick: () => onNavigate('reports'),
    },
    {
      id: 'missing-gaps',
      label: isAr ? 'فحص الفجوات' : 'Check Missing Gaps',
      sublabel: isAr ? `${missingProjects} مشروع مفقود حالياً` : `${missingProjects} gaps detected`,
      icon: AlertTriangle,
      accent: 'text-[#E52225] bg-red-50 dark:bg-red-950/50 dark:text-red-400',
      onClick: () => onNavigate('projects', 'Missing'),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'لوحة المتابعة والتحكم' : 'Archive Operations Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'متابعة حركة 300 مشروع لكل بوكس، 50 لكل دوسيه، واكتشاف الفجوات تلقائياً.'
              : 'Real-time 300-project box capacity, 50-project dossiers, and automated gap detection.'}
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

      {/* Row 1: Balanced 4-Column KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('projects')}
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-start hover:border-[#0B56A8]/60 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'إجمالي المشاريع' : 'Total Projects'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#0B56A8] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {totalProjects.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span>{totalBoxes} {isAr ? 'بوكس' : 'Boxes'}</span>
            <span aria-hidden="true">·</span>
            <span>{totalDossiers} {isAr ? 'دوسيه' : 'Dossiers'}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('projects', 'Archived')}
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-start hover:border-[#0B56A8] transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#0B56A8] dark:text-blue-400">
            <span>{isAr ? 'المشاريع المؤرشفة' : 'Archived Projects'}</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0B56A8] dark:text-blue-400 tabular-nums">
            {archivedProjects.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium tabular-nums flex items-center gap-1.5">
            <span className="text-[#0B56A8] dark:text-blue-400 font-semibold">{completionRate}%</span>
            <span aria-hidden="true">·</span>
            <span>{isAr ? 'نسبة الإنجاز الكلي' : 'Completion rate'}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('projects', 'Missing')}
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-start hover:border-[#E52225] transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#E52225] dark:text-red-400">
            <span>{isAr ? 'المشاريع المفقودة (فجوات)' : 'Missing Projects (Gaps)'}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#E52225]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#E52225] dark:text-red-400 tabular-nums">
            {missingProjects.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            <span>{isAr ? 'فجوات تسلسل مثبتة' : 'Proven gaps'}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{pendingProjects.toLocaleString()} {isAr ? 'انتظار' : 'pending'}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('boxes')}
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-start hover:border-[#0B56A8]/60 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'البوكسات والدوسيهات' : 'Boxes & Dossiers'}</span>
            <FolderArchive className="w-3.5 h-3.5 text-[#0B56A8]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums flex items-baseline gap-2">
            <span>{totalBoxes}</span>
            <span className="text-sm font-semibold text-slate-400">/ {totalDossiers} {isAr ? 'دوسيه' : 'dos.'}</span>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span className="text-[#0B56A8] dark:text-blue-400 font-semibold tabular-nums">
              {archivedBoxes} {isAr ? 'مكتمل' : 'archived'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#B45309] dark:text-amber-400 font-semibold tabular-nums">
              {inprogressBoxes} {isAr ? 'جاري' : 'active'}
            </span>
            {forceClosedBoxes > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{forceClosedBoxes} {isAr ? 'مغلق' : 'closed'}</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Unified Archiving Progress Strip */}
      <div className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <div className="flex items-center justify-between sm:justify-start gap-2.5 shrink-0">
          <Layers className="w-4 h-4 text-[#0B56A8]" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {isAr ? 'التقدم الإجمالي للأرشفة' : 'Overall Archiving Progress'}
          </span>
          <span className="text-xs font-bold text-[#0B56A8] dark:text-blue-400 tabular-nums">
            {completionRate}%
          </span>
        </div>

        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
          <div
            className="bg-[#0B56A8] h-full transition-all"
            style={{ width: `${(archivedProjects / (totalProjects || 1)) * 100}%` }}
            title={`Archived: ${archivedProjects}`}
          />
          <div
            className="bg-[#E52225] h-full transition-all"
            style={{ width: `${(missingProjects / (totalProjects || 1)) * 100}%` }}
            title={`Missing: ${missingProjects}`}
          />
          <div
            className="bg-slate-300 dark:bg-slate-700 h-full transition-all"
            style={{ width: `${(pendingProjects / (totalProjects || 1)) * 100}%` }}
            title={`Pending: ${pendingProjects}`}
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 text-[11px] text-slate-500 shrink-0 tabular-nums">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#0B56A8] inline-block" />
            <span>{isAr ? 'مؤرشف' : 'Archived'} ({archivedProjects})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#E52225] inline-block" />
            <span>{isAr ? 'مفقود' : 'Missing'} ({missingProjects})</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-slate-300 dark:bg-slate-600 inline-block" />
            <span>{isAr ? 'انتظار' : 'Pending'} ({pendingProjects})</span>
          </span>
        </div>
      </div>

      {/* Row 2: 8/4 Split — Box Completion Chart + Quick Actions Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'حالة البوكسات الحالية (300 مشروع)' : 'Box Completion Overview (300 Slots)'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'توزيع المشاريع المؤرشفة والمفقودة وقيد الانتظار في كل بوكس' : 'Archived, missing, and pending projects per box'}
              </p>
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

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={boxProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 300]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Archived" stackId="a" fill="#0B56A8" />
                <Bar dataKey="Missing" stackId="a" fill="#E52225" />
                <Bar dataKey="Pending" stackId="a" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0B56A8]" />
                <span>{isAr ? 'مؤرشف' : 'Archived'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#E52225]" />
                <span>{isAr ? 'مفقود (فجوة)' : 'Missing'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
                <span>{isAr ? 'قيد الانتظار' : 'Pending'}</span>
              </span>
            </div>
            <span className="text-[11px] tabular-nums">
              {archivedDossiers} / {totalDossiers} {isAr ? 'دوسيه مكتمل' : 'dossiers completed'}
            </span>
          </div>
        </div>

        {/* Quick Actions Menu Rail (clean divided list, no nested card borders) */}
        <section
          aria-label={isAr ? 'إجراءات سريعة' : 'Quick Actions'}
          className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isAr ? 'انتقال مباشر للمهام اليومية بنقرة واحدة' : 'One-click navigation to common tasks'}
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className="w-full px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-start group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.accent}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 truncate transition-colors">
                        {action.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {action.sublabel}
                      </div>
                    </div>
                  </div>
                  <DirectionalArrow className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B56A8] dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Row 3: 4/8 Split — Status Distribution Donut + Recent Excel Upload History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'توزيع حالات المشاريع' : 'Project Status Distribution'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr ? 'نسبة المكتمل والفجوات وقيد الانتظار' : 'Archived vs Missing vs Pending'}
            </p>
          </div>

          <div className="h-52 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} projects`, '']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#1E293B',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            {projectStatusData.map(item => (
              <div key={item.name} className="flex flex-col">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-[#0B56A8]" />
                <span>{isAr ? 'آخر عمليات استيراد Excel' : 'Recent Excel Upload History'}</span>
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
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold">
                  <tr>
                    <th className="px-3 py-2 text-start">{isAr ? 'الملف' : 'File Name'}</th>
                    <th className="px-3 py-2 text-start">{isAr ? 'المستخدم' : 'User'}</th>
                    <th className="px-3 py-2 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="px-3 py-2 text-end">{isAr ? 'المستورد' : 'Imported'}</th>
                    <th className="px-3 py-2 text-end">{isAr ? 'التكرار' : 'Duplicates'}</th>
                    <th className="px-3 py-2 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {uploadHistory.slice(0, 5).map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
                        {u.fileName}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{u.userName}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-[11px] tabular-nums">{u.timestamp}</td>
                      <td className="px-3 py-2.5 text-end font-bold text-[#0B56A8] dark:text-blue-400 tabular-nums">
                        {u.importedCount}
                      </td>
                      <td className="px-3 py-2.5 text-end text-slate-500 tabular-nums">{u.duplicateCount}</td>
                      <td className="px-3 py-2.5">
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
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {isAr ? 'لم يتم رفع ملفات بعد' : 'No uploads yet'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isAr
                ? 'يتم قراءة عمودي Job ID و Date Approved وتجاهل باقي الأعمدة.'
                : 'Engine strictly extracts Job ID & Date Approved only.'}
            </span>
            <span className="text-[11px] tabular-nums">
              {inprogressDossiers} {isAr ? 'دوسيه جاري' : 'in-progress dossiers'}
            </span>
          </div>
        </div>
      </div>

      {/* Row 4: Full-Width Missing Projects Alerts Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E52225]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'تنبيهات المشاريع المفقودة (فجوات التسلسل)' : 'Missing Projects Alerts (Sequence Gaps)'}
            </h2>
            <span className="text-xs text-[#E52225] dark:text-red-400 font-semibold tabular-nums">
              · {missingProjects} {isAr ? 'ناقص' : 'missing'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('projects', 'Missing')}
            className="text-xs font-semibold text-[#0B56A8] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <span>{isAr ? 'عرض كافة المشاريع المفقودة' : 'View all missing projects'}</span>
            <DirectionalArrow className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentMissing.length > 0 ? (
          <div className="-mt-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:divide-x rtl:sm:divide-x-reverse divide-slate-100 dark:divide-slate-800">
            {recentMissing.map(p => (
              <button
                type="button"
                key={p.jobId}
                onClick={() => onNavigate('projects', String(p.jobId))}
                className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between text-start border-t border-slate-100 dark:border-slate-800"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    Job #{p.jobId}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Box {p.boxId} · Dossier {p.dossierNumber}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#E52225] dark:text-red-400">
                  {isAr ? 'فجوة مثبتة' : 'Proven Gap'}
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
