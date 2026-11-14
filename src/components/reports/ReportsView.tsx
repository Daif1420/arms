/**
 * ARMS - Reports Engine (Section 9)
 * All 13 specialized archive reports with filters and multi-format export (Excel, PDF, Print).
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileBarChart, FileDown, Printer, FileSpreadsheet, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import logoColor from '../../assets/logo.png';
import armsLogoLight from '../../assets/arms-logo.png';
import {
  BoxDirectoryItem,
  exportReportToExcel,
  exportReportToPDF,
  paginateReportRows,
  REPORT_BOXES_PER_PAGE,
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

interface ReportOption {
  id: ReportType;
  titleAr: string;
  titleEn: string;
  group: 'projects' | 'boxes' | 'operations';
}

export const ReportsView: React.FC = () => {
  const { boxes, dossiers, projects, uploadHistory, auditLogs, currentUser, language, showToast } = useArchive();

  const [activeReport, setActiveReport] = useState<ReportType>('archived-projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [boxFilter, setBoxFilter] = useState('all');
  const [previewPage, setPreviewPage] = useState(1);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [printingReport, setPrintingReport] = useState(false);

  const isSystemAdmin = currentUser?.role === 'System Admin';

  const allReportOptions: ReportOption[] = [
    { id: 'archived-projects', titleAr: '1. تقرير المشاريع المؤرشفة', titleEn: '1. Archived Projects', group: 'projects' },
    { id: 'missing-projects', titleAr: '2. تقرير المشاريع المفقودة (الفجوات)', titleEn: '2. Missing Projects (Gaps)', group: 'projects' },
    { id: 'pending-projects', titleAr: '3. تقرير المشاريع قيد الانتظار', titleEn: '3. Pending Projects', group: 'projects' },
    { id: 'archived-boxes', titleAr: '4. تقرير البوكسات المكتملة', titleEn: '4. Archived Boxes', group: 'boxes' },
    { id: 'inprogress-boxes', titleAr: '5. تقرير البوكسات الجارية', titleEn: '5. Inprogress Boxes', group: 'boxes' },
    { id: 'dossier-report', titleAr: '6. تقرير الدوسيهات الشامل', titleEn: '6. Dossiers Overview', group: 'boxes' },
    { id: 'box-details-report', titleAr: '7. تقرير تفاصيل البوكسات والدوسيهات', titleEn: '7. Box & Dossier Details', group: 'boxes' },
    { id: 'boxes-dossiers-ranges', titleAr: '8. تقرير البوكسات ورينجات الدوسيهات', titleEn: '8. Boxes & Dossiers Ranges', group: 'boxes' },
    { id: 'archive-summary', titleAr: '9. الملخص العام للأرشفة', titleEn: '9. Archive Summary', group: 'operations' },
    { id: 'upload-history', titleAr: '10. تقرير سجل عمليات الرفع', titleEn: '10. Upload History Log', group: 'operations' },
    { id: 'user-activity', titleAr: '11. تقرير نشاط المستخدمين (Audit)', titleEn: '11. User Activity (Audit)', group: 'operations' },
    { id: 'exception-report', titleAr: '12. تقرير الاستثناءات والفجوات', titleEn: '12. Exception Report', group: 'operations' },
    { id: 'force-close-report', titleAr: '13. تقرير الإغلاق الإداري (Force Close)', titleEn: '13. Force Close Report', group: 'operations' },
  ];

  // The User Activity (Audit) report is restricted to System Admin only.
  const reportOptions = allReportOptions.filter(opt => opt.id !== 'user-activity' || isSystemAdmin);

  const reportGroups: { key: ReportOption['group']; labelAr: string; labelEn: string }[] = [
    { key: 'projects', labelAr: 'تقارير المشاريع', labelEn: 'Projects' },
    { key: 'boxes', labelAr: 'تقارير البوكسات والدوسيهات', labelEn: 'Boxes & Dossiers' },
    { key: 'operations', labelAr: 'العمليات والتدقيق', labelEn: 'Operations & Audit' },
  ];

  const isBoxDirectoryReport = activeReport === 'boxes-dossiers-ranges';

  const sortedBoxes = [...boxes].sort((a, b) => a.firstJobId - b.firstJobId);
  const sortedDossiers = [...dossiers].sort((a, b) => a.fromJobId - b.fromJobId);
  const sortedProjects = [...projects].sort((a, b) => a.jobId - b.jobId);

  // Build standard tabular report dataset
  let reportColumns: string[] = [];
  let reportData: Record<string, unknown>[] = [];

  switch (activeReport) {
    case 'archived-projects':
      reportColumns = ['Job ID', 'Date Approved', 'Box Code', 'Dossier #', 'Slot #', 'Source Upload'];
      reportData = sortedProjects
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
      reportData = sortedProjects
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
      reportData = sortedProjects
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
      reportData = sortedBoxes
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
      reportData = sortedBoxes
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
      reportData = sortedDossiers
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
      reportData = sortedBoxes.map(b => ({
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
      reportData = (isSystemAdmin ? auditLogs : []).map(a => ({
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
      reportData = sortedProjects
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
      reportData = sortedBoxes
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
      break;
  }

  // Structured Box Directory items for Report #13
  const filteredBoxDirectoryItems: BoxDirectoryItem[] = isBoxDirectoryReport
    ? sortedBoxes
        .filter(b => boxFilter === 'all' || b.boxCode === boxFilter)
        .map(b => ({
          boxCode: b.boxCode,
          firstJobId: b.firstJobId,
          lastJobId: b.lastJobId,
          archivedProjects: b.archivedProjects,
          missingProjects: b.missingProjects,
          pendingProjects: b.pendingProjects,
          totalProjects: b.totalProjects,
          status: b.status,
          isForceClosed: b.isForceClosed,
          dossiers: sortedDossiers
            .filter(d => d.boxId === b.boxCode)
            .sort((a, z) => a.dossierNumber - z.dossierNumber)
            .map(d => ({
              id: d.id,
              dossierNumber: d.dossierNumber,
              fromJobId: d.fromJobId,
              toJobId: d.toJobId,
              archivedCount: d.archivedCount,
              missingCount: d.missingCount,
              pendingCount: d.pendingCount,
              totalProjects: d.totalProjects,
              status: d.status,
            })),
        }))
        .filter(b => {
          if (!searchTerm) return true;
          const q = searchTerm.toLowerCase();
          return (
            b.boxCode.toLowerCase().includes(q) ||
            String(b.firstJobId).includes(q) ||
            String(b.lastJobId).includes(q) ||
            b.status.toLowerCase().includes(q) ||
            b.dossiers.some(
              d =>
                d.id.toLowerCase().includes(q) ||
                String(d.fromJobId).includes(q) ||
                String(d.toJobId).includes(q) ||
                d.status.toLowerCase().includes(q)
            )
          );
        })
    : [];

  // Filter standard tabular report data
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

  const buildExportOptions = () => ({
    reportId: activeReport,
    reportTitleEn: activeOption.titleEn,
    reportTitleAr: activeOption.titleAr,
    language,
    columns: reportColumns,
    rows: filteredReportData,
    boxDirectoryItems: isBoxDirectoryReport ? filteredBoxDirectoryItems : undefined,
    boxFilter,
    totalBoxes: boxes.length,
    preparedBy: currentUser?.name || 'System Admin',
    printDate: formattedPrintDate,
    rowsPerPage: REPORT_ROWS_PER_PAGE,
  });

  const handleExportExcel = () => {
    const fileName = exportReportToExcel(buildExportOptions());
    showToast(
      language === 'ar' ? `تم تصدير التقرير بصيغة Excel: ${fileName}` : `Excel report downloaded: ${fileName}`,
      'success'
    );
  };

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

  const tabularPages = paginateReportRows(filteredReportData, REPORT_ROWS_PER_PAGE);
  const boxPages = paginateReportRows(filteredBoxDirectoryItems, REPORT_BOXES_PER_PAGE);

  const totalPreviewPages = isBoxDirectoryReport ? boxPages.length : tabularPages.length;
  const safePreviewPage = Math.min(previewPage, totalPreviewPages);

  const totalCountDisplay = isBoxDirectoryReport
    ? `${filteredBoxDirectoryItems.length} Boxes · ${filteredBoxDirectoryItems.reduce(
        (sum, b) => sum + b.dossiers.length,
        0
      )} Dossiers`
    : `${filteredReportData.length} Records · ${boxes.length} Boxes`;

  const previewRecordLabel = isBoxDirectoryReport
    ? language === 'ar'
      ? `معاينة التقرير (${filteredBoxDirectoryItems.length} بوكس · ${totalPreviewPages} صفحة)`
      : `Report preview (${filteredBoxDirectoryItems.length} boxes · ${totalPreviewPages} pages)`
    : language === 'ar'
      ? `معاينة التقرير (${filteredReportData.length} سجل · ${totalPreviewPages} صفحة)`
      : `Report preview (${filteredReportData.length} records · ${totalPreviewPages} pages)`;

  const renderFormalSheet = (
    pageIdx: number,
    totalPg: number,
    isPrintMode: boolean,
    isLastPrintPage = true
  ) => {
    const pageNum = pageIdx + 1;
    const startOffset = pageIdx * REPORT_ROWS_PER_PAGE;
    const pageRows = tabularPages[pageIdx] || [];
    const pageBoxes = boxPages[pageIdx] || [];

    return (
      <div
        key={isPrintMode ? `print-page-${pageNum}` : `preview-page-${pageNum}`}
        dir="ltr"
        className={
          isPrintMode
            ? `bg-white text-slate-900 w-full flex flex-col justify-between ${
                !isLastPrintPage ? 'break-after-page' : ''
              }`
            : 'bg-white text-slate-900 border border-slate-300 rounded-lg overflow-hidden shadow-md mx-auto max-w-[794px]'
        }
        style={{
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          ...(isPrintMode && !isLastPrintPage ? { pageBreakAfter: 'always' } : {}),
        }}
      >
        <div className={isPrintMode ? 'flex-1 flex flex-col justify-between' : 'p-5 sm:p-6 space-y-4'}>
          <div className="space-y-3.5">
            {/* 1. Clean Corporate Header (rendered on EVERY page) */}
            <div className="flex items-center justify-between gap-4 pb-1">
              <div className="shrink-0">
                <img src={logoColor} alt="Intercom" className="h-7 sm:h-8 w-auto object-contain" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight text-center min-w-0 leading-snug">
                {cleanTitleEn}
              </h3>

              <div className="shrink-0">
                <img src={armsLogoLight} alt="ARMS Archive Report Management System" className="h-7 sm:h-9 w-auto object-contain" />
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
                  <span className="font-semibold text-slate-900 tabular-nums">{totalCountDisplay}</span>
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

            {/* 3. Report Body: Box Directory 2x3 Cards OR Standard Tabular Grid */}
            {isBoxDirectoryReport ? (
              <div className="space-y-3 mt-2">
                {pageBoxes.length > 0 ? (
                  pageBoxes.map(box => {
                    const boxStatusText = box.isForceClosed ? 'Force Closed' : box.status;
                    return (
                      <div
                        key={box.boxCode}
                        className="border border-slate-400 rounded-md overflow-hidden bg-white"
                      >
                        {/* Box Banner Header (print-safe neutral gray matching table headers) */}
                        <div className="bg-[#D9D9D9] border-b border-slate-400 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[13px] font-extrabold text-slate-900">
                              Box {box.boxCode}
                            </span>
                            <span className="text-[12.5px] font-bold text-slate-900 tabular-nums">
                              Range: {box.firstJobId} → {box.lastJobId}
                            </span>
                          </div>

                          <div className="text-[11px] font-semibold text-slate-800 tabular-nums">
                            {box.archivedProjects}/{box.totalProjects} Archived · {box.missingProjects} Missing · {box.pendingProjects} Pending ·{' '}
                            <span className="text-slate-900 font-bold">{boxStatusText}</span>
                          </div>
                        </div>

                        {/* 2x3 Dossiers Grid underneath the Box */}
                        <div
                          className={`grid ${
                            isPrintMode ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
                          } divide-y sm:divide-y-0 divide-slate-200`}
                        >
                          {box.dossiers.map((dossier, dIdx) => {
                            const isSecondRowOrLater = dIdx >= 2;
                            const isRightCol = dIdx % 2 === 1;
                            const countsLabel =
                              dossier.missingCount > 0 || dossier.pendingCount > 0
                                ? `${dossier.archivedCount}/${dossier.totalProjects} Archived · ${dossier.missingCount} Missing · ${dossier.pendingCount} Pending`
                                : `${dossier.archivedCount}/${dossier.totalProjects} Archived`;

                            return (
                              <div
                                key={dossier.id}
                                className={`px-3 py-2 flex flex-col justify-between gap-0.5 bg-white ${
                                  isSecondRowOrLater ? 'sm:border-t border-slate-300' : ''
                                } ${isRightCol ? 'sm:border-s border-slate-300' : ''}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[12px] font-bold text-slate-900">
                                    Dossier {dossier.dossierNumber} ({dossier.id})
                                  </span>
                                  <span className="text-[12px] font-bold text-slate-900 tabular-nums">
                                    {dossier.fromJobId} → {dossier.toJobId}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-[10.5px]">
                                  <span className="text-slate-600 tabular-nums">{countsLabel}</span>
                                  <span className="font-bold text-slate-900">{dossier.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="border border-slate-300 rounded-md py-8 text-center text-[12px] text-slate-500">
                    No boxes match current filter
                  </div>
                )}
              </div>
            ) : (
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
                      pageRows.map((row, idx) => (
                        <tr key={startOffset + idx} className="bg-white hover:bg-slate-50">
                          <td className="border border-slate-300 px-2 py-1.5 text-center text-slate-600 text-[11px] tabular-nums">
                            {startOffset + idx + 1}
                          </td>
                          {reportColumns.map(col => (
                            <td
                              key={col}
                              className={`border border-slate-300 px-2.5 py-1.5 text-slate-900 ${
                                col === 'Job ID' || col === 'First Job ID' || col === 'Range'
                                  ? 'font-semibold tabular-nums'
                                  : ''
                              }`}
                            >
                              {String(row[col] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))
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
            )}
          </div>

          {/* 4. Page Footer on EVERY page */}
          <div className="pt-2.5 mt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium">Intercom ARMS</span>
            <span className="font-semibold tabular-nums">
              Page {pageNum} of {totalPg}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-[#0B56A8] dark:text-blue-400" />
            <span>{language === 'ar' ? 'مركز التقارير المتقدمة (13 تقرير)' : 'Advanced Reports Center'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
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
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:border-emerald-600 dark:hover:text-white rounded-lg transition-colors shadow-xs whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
            <span>{language === 'ar' ? 'تصدير إلى Excel' : 'Export Excel'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exportingPdf}
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:bg-[#E52225] hover:border-[#E52225] hover:text-white dark:hover:bg-red-600 dark:hover:border-red-600 dark:hover:text-white rounded-lg transition-colors shadow-xs whitespace-nowrap disabled:opacity-60"
          >
            <FileDown className="w-3.5 h-3.5 text-[#E52225] dark:text-red-400 group-hover:text-white transition-colors" />
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
            className="group inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:bg-[#0B56A8] hover:border-[#0B56A8] hover:text-white dark:hover:bg-[#0B56A8] dark:hover:border-[#0B56A8] dark:hover:text-white rounded-lg transition-colors shadow-xs whitespace-nowrap disabled:opacity-60"
          >
            <Printer className="w-3.5 h-3.5 text-[#0B56A8] dark:text-blue-400 group-hover:text-white transition-colors" />
            <span>{language === 'ar' ? 'طباعة A4' : 'Print A4'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Grouped 13 Reports Sidebar */}
        <aside className="lg:col-span-4 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl p-3.5 space-y-4">
          {reportGroups.map(group => {
            const items = reportOptions.filter(opt => opt.group === group.key);
            return (
              <div key={group.key} className="space-y-1">
                <div className="px-2.5 pb-1 text-[11px] font-bold text-slate-400 dark:text-neutral-500 border-b border-slate-100 dark:border-neutral-800">
                  {language === 'ar' ? group.labelAr : group.labelEn}
                </div>
                <div className="space-y-0.5 pt-1">
                  {items.map(opt => (
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
                          : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <span className="truncate">{language === 'ar' ? opt.titleAr : opt.titleEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Filters & Formal Report Sheet Preview */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111111] border border-slate-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800">
            <div>
              <h2 className="text-sm font-bold text-[#3F4144] dark:text-white">
                {language === 'ar' ? activeOption.titleAr : activeOption.titleEn}
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">{previewRecordLabel}</p>
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
                  className="ps-8 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-[#0B56A8] w-36 sm:w-44"
                />
              </div>

              {(activeReport.includes('project') || activeReport.includes('dossier')) && (
                <select
                  value={boxFilter}
                  onChange={e => {
                    setBoxFilter(e.target.value);
                    setPreviewPage(1);
                  }}
                  className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-[#0B56A8]"
                >
                  <option value="all">{language === 'ar' ? 'كافة البوكسات' : 'All Boxes'}</option>
                  {sortedBoxes.map(b => (
                    <option key={b.id} value={b.boxCode}>
                      Box {b.boxCode}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Preview Page Flipper Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-xs">
            <div className="text-slate-600 dark:text-neutral-300 font-medium tabular-nums">
              {language === 'ar'
                ? `الصفحة ${safePreviewPage} من ${totalPreviewPages}`
                : `Page ${safePreviewPage} of ${totalPreviewPages}`}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                disabled={safePreviewPage <= 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-200 hover:border-[#0B56A8] hover:text-[#0B56A8] disabled:opacity-40 disabled:pointer-events-none transition-colors font-semibold"
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
                  className="px-2 py-1 rounded-md border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-800 dark:text-neutral-100 font-semibold tabular-nums focus:outline-none focus:border-[#0B56A8]"
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-200 hover:border-[#0B56A8] hover:text-[#0B56A8] disabled:opacity-40 disabled:pointer-events-none transition-colors font-semibold"
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

          {/* Subtle Preview Desk Stage around the A4 Paper */}
          <div className="bg-slate-100/80 dark:bg-black border border-slate-200/80 dark:border-neutral-800 rounded-xl p-3 sm:p-5">
            {renderFormalSheet(safePreviewPage - 1, totalPreviewPages, false)}
          </div>
        </div>
      </div>

      {/* Isolated A4 Portrait Print Portal (all pages with full header on each page) */}
      {printingReport &&
        createPortal(
          <div id="arms-report-print-portal" className="hidden print:block">
            {Array.from({ length: totalPreviewPages }, (_, idx) =>
              renderFormalSheet(idx, totalPreviewPages, true, idx === totalPreviewPages - 1)
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
