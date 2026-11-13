/**
 * ARMS - Reports Engine (Section 9)
 * All 12 specialized archive reports with filters and multi-format export (Excel, PDF, Print).
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileBarChart, Download, Printer, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import logoColor from '../../assets/logo.png';
import {
  exportReportToExcel,
  exportReportToPDF,
  paginateReportRows,
  REPORT_ROWS_PER_PAGE,
} from '../../utils/reportExporter';

export type ReportType =
  | 'archived-projects'
  | 'missing-projects'
  | 'pending-projects'
  | 'archived-boxes'
  | 'inprogress-boxes'
  | 'dossier-report'
  | 'box-details-report'
  | 'archive-summary'
  | 'upload-history'
  | 'user-activity'
  | 'exception-report'
  | 'force-close-report'
  | 'boxes-dossiers-ranges';

export const ReportsView: React.FC = () => {
  const { boxes, dossiers, projects, uploadHistory, auditLogs, currentUser, language, showToast } = useArchive();

  const [activeReport, setActiveReport] = useState<ReportType>('archived-projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [boxFilter, setBoxFilter] = useState('all');
  const [previewPage, setPreviewPage] = useState(1);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printingReport, setPrintingReport] = useState(false);

  const reportOptions: { id: ReportType; titleAr: string; titleEn: string; category: string }[] = [
    { id: 'archived-projects', titleAr: '1. تقرير المشاريع المؤرشفة', titleEn: '1. Archived Projects', category: 'Projects' },
    { id: 'missing-projects', titleAr: '2. تقرير المشاريع المفقودة (الفجوات)', titleEn: '2. Missing Projects (Gaps)', category: 'Projects' },
    { id: 'pending-projects', titleAr: '3. تقرير المشاريع قيد الانتظار', titleEn: '3. Pending Projects', category: 'Projects' },
    { id: 'archived-boxes', titleAr: '4. تقرير البوكسات المكتملة', titleEn: '4. Archived Boxes', category: 'Boxes' },
    { id: 'inprogress-boxes', titleAr: '5. تقرير البوكسات الجارية', titleEn: '5. Inprogress Boxes', category: 'Boxes' },
    { id: 'dossier-report', titleAr: '6. تقرير الدوسيهات الشامل', titleEn: '6. Dossiers Overview', category: 'Dossiers' },
    { id: 'box-details-report', titleAr: '7. تقرير تفاصيل البوكسات والدوسيهات', titleEn: '7. Box & Dossier Details', category: 'Boxes' },
    { id: 'archive-summary', titleAr: '8. الملخص العام للأرشفة', titleEn: '8. Archive Summary', category: 'Executive' },
    { id: 'upload-history', titleAr: '9. تقرير سجل عمليات الرفع', titleEn: '9. Upload History Log', category: 'Upload' },
    { id: 'user-activity', titleAr: '10. تقرير نشاط المستخدمين (Audit)', titleEn: '10. User Activity (Audit)', category: 'Security' },
    { id: 'exception-report', titleAr: '11. تقرير الاستثناءات والفجوات', titleEn: '11. Exception Report', category: 'Quality' },
    { id: 'force-close-report', titleAr: '12. تقرير الإغلاق الإداري (Force Close)', titleEn: '12. Force Close Report', category: 'Audit' },
    { id: 'boxes-dossiers-ranges', titleAr: '13. تقرير البوكسات ورينجات الدوسيهات', titleEn: '13. Boxes & Dossiers Ranges', category: 'Boxes' },
  ];

  // Build report dataset based on selected report
  let reportColumns: string[] = [];
  let reportData: Record<string, unknown>[] = [];

  switch (activeReport) {
    case 'archived-projects':
      reportColumns = ['Job ID', 'Date Approved', 'Box Code', 'Dossier #', 'Slot #', 'Source Upload'];
      reportData = projects
        .filter(p => p.status === 'Archived' && (boxFilter === 'all' || p.boxId === boxFilter))
        .map(p => ({
          'Job ID': p.jobId,
          'Date Approved': p.dateApproved || '—',
          'Box Code': p.boxId,
          'Dossier #': p.dossierNumber,
          'Slot #': p.slotIndex + 1,
          'Source Upload': p.sourceUpload,
        }));
      break;

    case 'missing-projects':
      reportColumns = ['Job ID', 'Box Code', 'Dossier #', 'Slot #', 'Status'];
      reportData = projects
        .filter(p => p.status === 'Missing' && (boxFilter === 'all' || p.boxId === boxFilter))
        .map(p => ({
          'Job ID': p.jobId,
          'Box Code': p.boxId,
          'Dossier #': p.dossierNumber,
          'Slot #': p.slotIndex + 1,
          'Status': 'Missing',
        }));
      break;

    case 'pending-projects':
      reportColumns = ['Job ID', 'Box Code', 'Dossier #', 'Slot #', 'Status'];
      reportData = projects
        .filter(p => p.status === 'Pending' && (boxFilter === 'all' || p.boxId === boxFilter))
        .map(p => ({
          'Job ID': p.jobId,
          'Box Code': p.boxId,
          'Dossier #': p.dossierNumber,
          'Slot #': p.slotIndex + 1,
          'Status': 'Pending Delivery',
        }));
      break;

    case 'archived-boxes':
      reportColumns = ['Box Code', 'First Job ID', 'Last Job ID', 'Total Projects', 'Completed Dossiers', 'Status'];
      reportData = boxes
        .filter(b => b.status === 'Archived')
        .map(b => ({
          'Box Code': b.boxCode,
          'First Job ID': b.firstJobId,
          'Last Job ID': b.lastJobId,
          'Total Projects': `${b.archivedProjects} / 300`,
          'Completed Dossiers': `${b.completedDossiers} / 6`,
          'Status': b.status,
        }));
      break;

    case 'inprogress-boxes':
      reportColumns = ['Box Code', 'Range', 'Archived', 'Missing', 'Pending', 'Completion %', 'Force Closed'];
      reportData = boxes
        .filter(b => b.status === 'Inprogress')
        .map(b => ({
          'Box Code': b.boxCode,
          'Range': `${b.firstJobId} → ${b.lastJobId}`,
          'Archived': `${b.archivedProjects} / 300`,
          'Missing': b.missingProjects,
          'Pending': b.pendingProjects,
          'Completion %': `${((b.archivedProjects / 300) * 100).toFixed(0)}%`,
          'Force Closed': b.isForceClosed ? `Yes (${b.forceCloseReason})` : 'No',
        }));
      break;

    case 'dossier-report':
      reportColumns = ['Dossier ID', 'Box Code', 'Dossier #', 'Range', 'Archived (50)', 'Missing', 'Pending', 'Status'];
      reportData = dossiers
        .filter(d => boxFilter === 'all' || d.boxId === boxFilter)
        .map(d => ({
          'Dossier ID': d.id,
          'Box Code': d.boxId,
          'Dossier #': d.dossierNumber,
          'Range': `${d.fromJobId} → ${d.toJobId}`,
          'Archived (50)': `${d.archivedCount} / 50`,
          'Missing': d.missingCount,
          'Pending': d.pendingCount,
          'Status': d.status,
        }));
      break;

    case 'box-details-report':
      reportColumns = ['Box Code', 'Total Dossiers', 'Total Projects', 'Archived', 'Missing', 'Force Closed', 'Created'];
      reportData = boxes.map(b => ({
        'Box Code': b.boxCode,
        'Total Dossiers': 6,
        'Total Projects': 300,
        'Archived': b.archivedProjects,
        'Missing': b.missingProjects,
        'Force Closed': b.isForceClosed ? 'Yes' : 'No',
        'Created': b.createdAt.slice(0, 10),
      }));
      break;

    case 'archive-summary':
      reportColumns = ['Metric', 'Count / Value', 'Notes'];
      reportData = [
        { 'Metric': 'Total Projects Capacity', 'Count / Value': projects.length, 'Notes': 'Strict 300 slots per box' },
        { 'Metric': 'Archived Projects', 'Count / Value': projects.filter(p => p.status === 'Archived').length, 'Notes': 'Successfully imported' },
        { 'Metric': 'Missing Projects', 'Count / Value': projects.filter(p => p.status === 'Missing').length, 'Notes': 'Proven sequence gaps' },
        { 'Metric': 'Pending Projects', 'Count / Value': projects.filter(p => p.status === 'Pending').length, 'Notes': 'Awaiting physical delivery' },
        { 'Metric': 'Total Boxes', 'Count / Value': boxes.length, 'Notes': 'Active repository boxes' },
        { 'Metric': 'Archived Boxes', 'Count / Value': boxes.filter(b => b.status === 'Archived').length, 'Notes': '100% completed' },
        { 'Metric': 'Force Closed Boxes', 'Count / Value': boxes.filter(b => b.isForceClosed).length, 'Notes': 'Administrative closures' },
      ];
      break;

    case 'upload-history':
      reportColumns = ['File Name', 'User', 'Timestamp', 'Total Rows', 'Imported', 'Duplicates', 'Status'];
      reportData = uploadHistory.map(u => ({
        'File Name': u.fileName,
        'User': u.userName,
        'Timestamp': u.timestamp,
        'Total Rows': u.totalRows,
        'Imported': u.importedCount,
        'Duplicates': u.duplicateCount,
        'Status': u.status,
      }));
      break;

    case 'user-activity':
      reportColumns = ['Timestamp', 'User', 'Action', 'Record Type', 'Record ID', 'Details'];
      reportData = auditLogs.map(a => ({
        'Timestamp': a.timestamp,
        'User': a.userName,
        'Action': a.action,
        'Record Type': a.recordType,
        'Record ID': a.recordId,
        'Details': a.details,
      }));
      break;

    case 'exception-report':
      reportColumns = ['Job ID', 'Box Code', 'Dossier #', 'Anomaly Type', 'Action Required'];
      reportData = projects
        .filter(p => p.status === 'Missing')
        .map(p => ({
          'Job ID': p.jobId,
          'Box Code': p.boxId,
          'Dossier #': p.dossierNumber,
          'Anomaly Type': 'Proven Sequence Gap',
          'Action Required': 'Physical audit of branch folder',
        }));
      break;

    case 'force-close-report':
      reportColumns = ['Box Code', 'Range', 'Reason for Closure', 'Closed By', 'Closed At', 'Archived Count'];
      reportData = boxes
        .filter(b => b.isForceClosed)
        .map(b => ({
          'Box Code': b.boxCode,
          'Range': `${b.firstJobId} → ${b.lastJobId}`,
          'Reason for Closure': b.forceCloseReason || 'No reason provided',
          'Closed By': b.forceClosedBy || 'Admin',
          'Closed At': b.forceClosedAt || '—',
          'Archived Count': `${b.archivedProjects} / 300`,
        }));
      break;

    case 'boxes-dossiers-ranges':
      reportColumns = ['Box / Dossier', 'Range (From → To)', 'Projects', 'Missing', 'Pending', 'Status'];
      reportData = boxes
        .filter(b => boxFilter === 'all' || b.boxCode === boxFilter)
        .flatMap(b => {
          const boxDossiers = dossiers
            .filter(d => d.boxId === b.boxCode)
            .sort((a, z) => a.dossierNumber - z.dossierNumber);

          const boxHeaderRow: Record<string, unknown> = {
            __isBoxHeader: true,
            'Box / Dossier': `Box ${b.boxCode}`,
            'Range (From → To)': `${b.firstJobId} → ${b.lastJobId}`,
            'Projects': `${b.archivedProjects} / ${b.totalProjects}`,
            'Missing': b.missingProjects,
            'Pending': b.pendingProjects,
            'Status': b.isForceClosed ? 'Force Closed' : b.status,
          };

          const dossierRows: Record<string, unknown>[] = boxDossiers.map(d => ({
            __isBoxHeader: false,
            'Box / Dossier': `  • Dossier ${d.dossierNumber} (${d.id})`,
            'Range (From → To)': `${d.fromJobId} → ${d.toJobId}`,
            'Projects': `${d.archivedCount} / ${d.totalProjects}`,
            'Missing': d.missingCount,
            'Pending': d.pendingCount,
            'Status': d.status,
          }));

          return [boxHeaderRow, ...dossierRows];
        });
      break;
  }

  // Filter report data with local search term
  const filteredReportData = reportData.filter(row => {
    if (!searchTerm) return true;
    return reportColumns.some(col => String(row[col] ?? '').toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const activeOption = reportOptions.find(r => r.id === activeReport)!;
  const cleanTitleEn = activeOption.titleEn.replace(/^\d+\.\s*/, '');
  const formattedPrintDate = new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const activeRowsPerPage = activeReport === 'boxes-dossiers-ranges' ? 28 : REPORT_ROWS_PER_PAGE;

  const buildExportOptions = () => ({
    reportId: activeReport,
    reportTitleEn: activeOption.titleEn,
    reportTitleAr: activeOption.titleAr,
    language,
    columns: reportColumns,
    rows: filteredReportData,
    boxFilter,
    totalBoxes: boxes.length,
    preparedBy: currentUser?.name || 'System Admin',
    printDate: formattedPrintDate,
    rowsPerPage: activeRowsPerPage,
  });

  // Export to Excel matching the clean A4 template
  const handleExportExcel = () => {
    const fileName = exportReportToExcel(buildExportOptions());
    showToast(
      language === 'ar' ? `تم تصدير التقرير بصيغة Excel: ${fileName}` : `Excel report downloaded: ${fileName}`,
      'success'
    );
  };

  // Export to A4 Portrait PDF
  const handleExportPDF = async () => {
    if (exportingPdf) return;
    setExportingPdf(true);
    try {
      const fileName = await exportReportToPDF(buildExportOptions());
      showToast(
        language === 'ar' ? `تم تصدير التقرير بصيغة PDF (A4): ${fileName}` : `A4 PDF report downloaded: ${fileName}`,
        'success'
      );
    } catch (err) {
      console.error('Failed to generate report PDF:', err);
      showToast(language === 'ar' ? 'تعذر إنشاء ملف PDF للتقرير.' : 'Failed generating report PDF.', 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  // Isolated A4 Portrait print portal matching the formal clean sheet
  useEffect(() => {
    if (!printingReport) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'arms-formal-report-print-style';
    styleEl.textContent = `
      @media print {
        @page { size: A4 portrait; margin: 10mm; }
        html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
        body > *:not(#arms-report-print-portal) { display: none !important; }
        #arms-report-print-portal { display: block !important; position: static !important; margin: 0 !important; padding: 0 !important; }
      }
    `;
    document.head.appendChild(styleEl);

    const cleanup = () => {
      styleEl.remove();
      setPrintingReport(false);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);

    let timerId = 0;
    const rafId = window.requestAnimationFrame(() => {
      timerId = window.setTimeout(() => {
        window.print();
      }, 90);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      window.removeEventListener('afterprint', cleanup);
      styleEl.remove();
    };
  }, [printingReport]);

  const scopeLabel = boxFilter === 'all' ? 'All Boxes' : `Box ${boxFilter}`;

  const reportPages = paginateReportRows(filteredReportData, activeRowsPerPage);
  const totalPreviewPages = reportPages.length;
  const safePreviewPage = Math.min(previewPage, totalPreviewPages);
  const currentPreviewRows = reportPages[safePreviewPage - 1] || [];

  const renderFormalSheet = (
    pageRows: Record<string, unknown>[],
    pageNum: number,
    totalPg: number,
    isPrintMode: boolean,
    isLastPrintPage = true
  ) => {
    const startOffset = (pageNum - 1) * activeRowsPerPage;

    return (
      <div
        key={isPrintMode ? `print-page-${pageNum}` : `preview-page-${pageNum}`}
        dir="ltr"
        className={
          isPrintMode
            ? `bg-white text-slate-900 w-full flex flex-col justify-between ${
                !isLastPrintPage ? 'break-after-page' : ''
              }`
            : 'bg-white text-slate-900 border border-slate-300 rounded-lg p-5 sm:p-6 shadow-sm mx-auto max-w-[794px] space-y-4'
        }
        style={{
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          ...(isPrintMode && !isLastPrintPage ? { pageBreakAfter: 'always' } : {}),
        }}
      >
        <div className="space-y-3.5">
          {/* 1. Clean Corporate Header (rendered on EVERY page) */}
          <div className="flex items-center justify-between gap-4 pb-1.5">
            <div className="shrink-0">
              <img src={logoColor} alt="Intercom" className="h-7 sm:h-8 w-auto object-contain" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight text-center min-w-0 leading-snug">
              {cleanTitleEn}
            </h3>

            <div className="text-right shrink-0 text-[10.5px] font-semibold text-slate-500">
              Archive Management
            </div>
          </div>

          {/* 2. Clear 2-Column English Metadata Box (rendered on EVERY page) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[12px] bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 shrink-0">Scope :</span>
                <span className="font-semibold text-slate-900">{scopeLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 shrink-0">Total :</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {filteredReportData.length} Records · {boxes.length} Boxes
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 shrink-0">Print Date :</span>
                <span className="text-slate-900 tabular-nums">{formattedPrintDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600 shrink-0">Prepared By :</span>
                <span className="font-semibold text-slate-900 truncate">
                  {currentUser?.name || 'System Admin'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-b-2 border-slate-700" />

          {/* 3. Classic Gray-Header Grid Table (#D9D9D9) */}
          <div className={isPrintMode ? 'mt-2' : 'mt-2 overflow-x-auto'}>
            <table className="w-full border-collapse text-[12px] text-left">
              <thead>
                <tr className="bg-[#D9D9D9] text-slate-900 font-bold">
                  <th className="border border-slate-400 px-2 py-1.5 w-9 text-center">#</th>
                  {reportColumns.map(col => (
                    <th key={col} className="border border-slate-400 px-2.5 py-1.5 leading-tight">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length > 0 ? (
                  pageRows.map((row, idx) => {
                    const isBoxHeader = Boolean(row.__isBoxHeader);
                    return (
                      <tr
                        key={startOffset + idx}
                        className={isBoxHeader ? 'bg-[#E8EEF5] font-bold' : 'bg-white hover:bg-slate-50'}
                      >
                        <td
                          className={`border px-2 py-1.5 text-center text-[11px] tabular-nums ${
                            isBoxHeader ? 'border-slate-400 text-slate-800 font-bold' : 'border-slate-300 text-slate-600'
                          }`}
                        >
                          {startOffset + idx + 1}
                        </td>
                        {reportColumns.map(col => (
                          <td
                            key={col}
                            className={`border px-2.5 py-1.5 text-slate-900 ${
                              isBoxHeader ? 'border-slate-400 font-bold' : 'border-slate-300'
                            } ${
                              col === 'Job ID' ||
                              col === 'First Job ID' ||
                              col === 'Range' ||
                              col === 'Range (From → To)'
                                ? 'font-semibold tabular-nums'
                                : ''
                            }`}
                          >
                            {String(row[col] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={reportColumns.length + 1}
                      className="border border-slate-300 py-8 text-center text-slate-500"
                    >
                      No records match current filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Page Footer on EVERY page */}
        <div className="pt-2.5 mt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium">Intercom ARMS</span>
          <span className="font-semibold tabular-nums">
            Page {pageNum} of {totalPg}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#3F4144] dark:text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-[#0B56A8] dark:text-blue-400" />
            <span>{language === 'ar' ? 'مركز التقارير المتقدمة (13 تقرير)' : 'Advanced Reports Center'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'معاينة وتصدير التقارير بصيغة A4 احترافية بهوية Intercom إلى Excel و PDF والطباعة المباشرة.'
              : 'Clean Intercom A4 portrait report layout exportable to Excel, paginated PDF, and direct Print.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تصدير إلى Excel' : 'Export Excel'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#3F4144] dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0B56A8] rounded-lg transition-colors shadow-xs whitespace-nowrap disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5 text-[#E52225]" />
            <span>
              {exportingPdf
                ? (language === 'ar' ? 'جاري التجهيز...' : 'Generating PDF...')
                : (language === 'ar' ? 'تصدير PDF (A4)' : 'Export PDF (A4)')}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPrintingReport(true)}
            disabled={printingReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#3F4144] dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0B56A8] rounded-lg transition-colors shadow-xs whitespace-nowrap disabled:opacity-60"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'طباعة A4' : 'Print A4'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 13 Reports Menu */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            {language === 'ar' ? 'التقارير المتوفرة (13 تقرير)' : 'Available Reports'}
          </div>

          <div className="space-y-1 max-h-[640px] overflow-y-auto">
            {reportOptions.map(opt => (
              <button
                type="button"
                key={opt.id}
                onClick={() => {
                  setActiveReport(opt.id);
                  setSearchTerm('');
                  setPreviewPage(1);
                }}
                className={`w-full text-start px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between gap-2 ${
                  activeReport === opt.id
                    ? 'bg-[#0B56A8] text-white font-bold shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{language === 'ar' ? opt.titleAr : opt.titleEn}</span>
                <span className="text-[10px] opacity-75 shrink-0">{opt.category}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters & Formal Report Sheet Preview */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-[#3F4144] dark:text-white">
                {language === 'ar' ? activeOption.titleAr : activeOption.titleEn}
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {language === 'ar'
                  ? `معاينة التقرير (${filteredReportData.length} سجل · ${totalPreviewPages} صفحة)`
                  : `Report preview (${filteredReportData.length} records · ${totalPreviewPages} pages)`}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute start-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === 'ar' ? 'تصفية النتائج...' : 'Filter in table...'}
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setPreviewPage(1);
                  }}
                  className="ps-8 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8] w-36 sm:w-44"
                />
              </div>

              {(activeReport.includes('project') || activeReport.includes('dossier')) && (
                <select
                  value={boxFilter}
                  onChange={e => {
                    setBoxFilter(e.target.value);
                    setPreviewPage(1);
                  }}
                  className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#0B56A8]"
                >
                  <option value="all">{language === 'ar' ? 'كافة البوكسات' : 'All Boxes'}</option>
                  {boxes.map(b => (
                    <option key={b.id} value={b.boxCode}>
                      Box {b.boxCode}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Preview Page Flipper Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs">
            <div className="text-slate-600 dark:text-slate-300 font-medium tabular-nums">
              {language === 'ar'
                ? `الصفحة ${safePreviewPage} من ${totalPreviewPages}`
                : `Page ${safePreviewPage} of ${totalPreviewPages}`}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                disabled={safePreviewPage <= 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0B56A8] hover:text-[#0B56A8] disabled:opacity-40 disabled:pointer-events-none transition-colors font-semibold"
              >
                {language === 'ar' ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
                <span>{language === 'ar' ? 'السابقة' : 'Prev'}</span>
              </button>

              {totalPreviewPages > 1 && (
                <select
                  aria-label={language === 'ar' ? 'اختيار الصفحة' : 'Select page'}
                  value={safePreviewPage}
                  onChange={e => setPreviewPage(Number(e.target.value))}
                  className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold tabular-nums focus:outline-none focus:border-[#0B56A8]"
                >
                  {Array.from({ length: totalPreviewPages }, (_, i) => i + 1).map(pNum => (
                    <option key={pNum} value={pNum}>
                      {pNum} / {totalPreviewPages}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                disabled={safePreviewPage >= totalPreviewPages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#0B56A8] hover:text-[#0B56A8] disabled:opacity-40 disabled:pointer-events-none transition-colors font-semibold"
              >
                <span>{language === 'ar' ? 'التالية' : 'Next'}</span>
                {language === 'ar' ? (
                  <ChevronLeft className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Crisp Formal White A4 Sheet Preview */}
          {renderFormalSheet(currentPreviewRows, safePreviewPage, totalPreviewPages, false)}
        </div>
      </div>

      {/* Isolated A4 Portrait Print Portal (all pages with full header on each page) */}
      {printingReport &&
        createPortal(
          <div id="arms-report-print-portal" className="hidden print:block">
            {reportPages.map((pageRows, idx) =>
              renderFormalSheet(
                pageRows,
                idx + 1,
                reportPages.length,
                true,
                idx === reportPages.length - 1
              )
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
