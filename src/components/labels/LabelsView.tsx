/**
 * ARMS - Thermal Label Printing System (Section 8)
 * Conforms 100% to approved archive label specification specifications.
 * 100 x 50 mm Landscape, monochrome black & white, jsPDF 7-page export, live 1:1 preview.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Download, ZoomIn, ZoomOut, Info } from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { LabelData } from '../../types';
import { LabelCanvasPreview, LabelVectorSvg } from './LabelCanvasPreview';
import { buildBoxLabelPackage, generateLabelsPDF, generateQRDataURL, getQRCodeText } from '../../utils/labelGenerator';

interface LabelsViewProps {
  initialBoxCode?: string;
}

interface PrintableLabelItem {
  label: LabelData;
  qrSrc: string;
}

export const LabelsView: React.FC<LabelsViewProps> = ({ initialBoxCode }) => {
  const { boxes, language, showToast } = useArchive();

  // Mode: automatic (from existing box) or manual
  const [mode, setMode] = useState<'automatic' | 'manual' | 'single-dossier'>('automatic');

  // Automatic mode state
  const defaultBox = boxes.find(b => b.boxCode === initialBoxCode) || boxes[0];
  const [selectedBoxCode, setSelectedBoxCode] = useState<string>(
    initialBoxCode?.includes(':') ? initialBoxCode.split(':')[0] : defaultBox?.boxCode || 'D42'
  );

  // Manual mode state
  const [manualBoxCode, setManualBoxCode] = useState('D42');
  const [manualFirstJobId, setManualFirstJobId] = useState(35500);

  // Single dossier mode state
  const [singleDossierNumber, setSingleDossierNumber] = useState<number>(
    initialBoxCode?.includes(':') ? Number(initialBoxCode.split(':')[1]) : 1
  );
  const [singleDossierFirstJobId, setSingleDossierFirstJobId] = useState(35500);

  // Current active label in preview carousel (0 = Box Label, 1..6 = Dossiers 1..6)
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [previewScale, setPreviewScale] = useState(1.0);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [preparingPrint, setPreparingPrint] = useState(false);
  const [printItems, setPrintItems] = useState<PrintableLabelItem[] | null>(null);

  // Compute label package based on mode
  const currentBox = boxes.find(b => b.boxCode === selectedBoxCode);

  let activeLabels: LabelData[] = [];

  if (mode === 'automatic') {
    const boxCode = currentBox ? currentBox.boxCode : selectedBoxCode;
    const firstId = currentBox ? currentBox.firstJobId : 35500;
    activeLabels = buildBoxLabelPackage(boxCode, firstId);
  } else if (mode === 'manual') {
    activeLabels = buildBoxLabelPackage(manualBoxCode.toUpperCase(), Number(manualFirstJobId));
  } else {
    // Single Dossier
    const fromId = Number(singleDossierFirstJobId);
    activeLabels = [
      {
        type: 'dossier',
        boxCode: manualBoxCode.toUpperCase(),
        dossierNumber: singleDossierNumber,
        totalDossiers: 6,
        fromJobId: fromId,
        toJobId: fromId + 49,
      },
    ];
  }

  // Keep active preview index within bounds
  useEffect(() => {
    if (activePreviewIndex >= activeLabels.length) {
      setActivePreviewIndex(0);
    }
  }, [activeLabels.length, activePreviewIndex]);

  // Inject isolated 100x50 mm thermal print CSS only while printing labels
  useEffect(() => {
    if (!printItems || printItems.length === 0) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'arms-thermal-label-print-style';
    styleEl.textContent = `
      @media print {
        @page { size: 100mm 50mm; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
        body > *:not(#arms-label-print-portal) { display: none !important; }
        #arms-label-print-portal { display: block !important; position: static !important; margin: 0 !important; padding: 0 !important; }
      }
    `;
    document.head.appendChild(styleEl);

    const cleanup = () => {
      styleEl.remove();
      setPrintItems(null);
      setPreparingPrint(false);
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
  }, [printItems]);

  const currentPreviewLabel = activeLabels[activePreviewIndex] || activeLabels[0];

  // Download PDF matching the exact 100 x 50 mm specification
  const handleDownloadPDF = async () => {
    setGeneratingPdf(true);
    try {
      const pdf = await generateLabelsPDF(activeLabels);
      const filename =
        mode === 'single-dossier'
          ? `Label_${manualBoxCode}_Dossier_${singleDossierNumber}.pdf`
          : `Labels_${activeLabels[0].boxCode}_7Pages.pdf`;
      pdf.save(filename);
      showToast(language === 'ar' ? `تم تجهيز ملف الليبلات: ${filename}` : `Downloaded ${filename}`, 'success');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast(language === 'ar' ? 'تعذر إنشاء ملف PDF لليبلات.' : 'Failed generating PDF labels.', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Direct thermal printing (prints 1 or all 7 pages directly via native print dialog)
  const handleDirectPrint = async (labelsToPrint: LabelData[]) => {
    if (preparingPrint || labelsToPrint.length === 0) return;
    setPreparingPrint(true);
    try {
      const qrUrls = await Promise.all(labelsToPrint.map(l => generateQRDataURL(getQRCodeText(l))));
      setPrintItems(labelsToPrint.map((label, idx) => ({ label, qrSrc: qrUrls[idx] })));
    } catch (err) {
      console.error('Failed preparing labels for print:', err);
      showToast(language === 'ar' ? 'تعذر تجهيز الليبلات للطباعة.' : 'Failed preparing labels for print.', 'error');
      setPreparingPrint(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#3F4144] dark:text-white tracking-tight flex items-center gap-2">
            <Printer className="w-6 h-6 text-[#0B56A8] dark:text-blue-400" />
            <span>{language === 'ar' ? 'نظام طباعة الليبلات الحرارية (100×50 مم)' : 'Thermal Label Generator (100x50 mm)'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'مطابق بنسبة 100% للمواصفة المعتمدة لليبل الأرشيف — أسود وأبيض فقط لطباعة Zebra، وشعار Intercom مدمج.'
              : 'Strict 1:1 conformity with approved thermal archive label specification — Monochrome Zebra ready.'}
          </p>
        </div>

        {/* Direct Print & Download PDF buttons side-by-side */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDirectPrint(activeLabels)}
            disabled={preparingPrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B56A8] hover:bg-[#094488] rounded-lg transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>
              {preparingPrint
                ? (language === 'ar' ? 'جاري التجهيز للطباعة...' : 'Preparing Print...')
                : mode === 'single-dossier'
                ? (language === 'ar' ? 'طباعة مباشرة (صفحة 1)' : 'Print Label (1 Page)')
                : (language === 'ar' ? 'طباعة مباشرة (7 صفحات)' : 'Print All (7 Pages)')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={generatingPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#3F4144] dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0B56A8] hover:text-[#0B56A8] dark:hover:text-blue-400 rounded-lg transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {generatingPdf
                ? (language === 'ar' ? 'جاري تجهيز PDF...' : 'Generating PDF...')
                : mode === 'single-dossier'
                ? (language === 'ar' ? 'تحميل PDF (صفحة 1)' : 'Download 1-Page PDF')
                : (language === 'ar' ? 'تحميل PDF (7 صفحات)' : 'Download 7-Page PDF')}
            </span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mode Selector */}
          <div className="bg-white dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-[#3F4144] dark:text-white">
              {language === 'ar' ? 'طريقة تحديد الليبل' : 'Generation Mode'}
            </label>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setMode('automatic')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-colors text-center ${
                  mode === 'automatic'
                    ? 'border-[#0B56A8] bg-[#0B56A8] text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'ar' ? 'آلي (من بوكس)' : 'Automatic (Box)'}
              </button>

              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-colors text-center ${
                  mode === 'manual'
                    ? 'border-[#0B56A8] bg-[#0B56A8] text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'ar' ? 'يدوي (Manual)' : 'Manual (Range)'}
              </button>

              <button
                type="button"
                onClick={() => setMode('single-dossier')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-colors text-center ${
                  mode === 'single-dossier'
                    ? 'border-[#0B56A8] bg-[#0B56A8] text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {language === 'ar' ? 'دوسيه منفرد' : 'Single Dossier'}
              </button>
            </div>

            {/* Mode 1: Automatic */}
            {mode === 'automatic' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'ar' ? 'اختر البوكس المطلوب' : 'Select Box from System'}
                  </label>
                  <select
                    value={selectedBoxCode}
                    onChange={e => setSelectedBoxCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold focus:outline-none focus:border-[#0B56A8]"
                  >
                    {boxes.map(b => (
                      <option key={b.id} value={b.boxCode}>
                        Box {b.boxCode} (#{b.firstJobId} → #{b.lastJobId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-[#EAF2FB]/60 dark:bg-slate-800 rounded-lg text-xs space-y-1 border border-[#0B56A8]/15 dark:border-slate-700">
                  <div className="font-bold text-[#0B56A8] dark:text-blue-400">
                    {language === 'ar' ? 'حزمة الليبلات الناتجة (7 صفحات):' : 'Output Package (7 Pages):'}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 tabular-nums" dir="ltr">
                    · Page 1: Box {currentBox?.boxCode || selectedBoxCode} (#{currentBox?.firstJobId} → #{currentBox?.lastJobId})
                    <br />
                    · Pages 2-7: Dossiers 1 to 6 (50 projects each)
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Manual */}
            {mode === 'manual' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'ar' ? 'كود البوكس (Box Code)' : 'Box Code'}
                  </label>
                  <input
                    type="text"
                    value={manualBoxCode}
                    onChange={e => setManualBoxCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-bold focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'ar' ? 'رقم أول مشروع في البوكس (First Job ID)' : 'First Project Number'}
                  </label>
                  <input
                    type="number"
                    value={manualFirstJobId}
                    onChange={e => setManualFirstJobId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums font-bold focus:outline-none focus:border-[#0B56A8]"
                  />
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg tabular-nums">
                  {language === 'ar'
                    ? `النظام يحسب تلقائيًا آخر رقم (+299): #${Number(manualFirstJobId) + 299} ونطاقات الـ 6 دوسيهات (+49 لكل دوسيه).`
                    : `System auto-calculates last ID (+299): #${Number(manualFirstJobId) + 299} and all 6 dossier spans (+49 each).`}
                </div>
              </div>
            )}

            {/* Mode 3: Single Dossier */}
            {mode === 'single-dossier' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === 'ar' ? 'كود البوكس' : 'Box Code'}
                    </label>
                    <input
                      type="text"
                      value={manualBoxCode}
                      onChange={e => setManualBoxCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg uppercase font-bold focus:outline-none focus:border-[#0B56A8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      {language === 'ar' ? 'رقم الدوسيه (1-6)' : 'Dossier # (1-6)'}
                    </label>
                    <select
                      value={singleDossierNumber}
                      onChange={e => {
                        const dNum = Number(e.target.value);
                        setSingleDossierNumber(dNum);
                        setSingleDossierFirstJobId(35500 + (dNum - 1) * 50);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold focus:outline-none focus:border-[#0B56A8]"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>
                          Dossier {num}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'ar' ? 'رقم أول مشروع في الدوسيه' : 'First Project in Dossier'}
                  </label>
                  <input
                    type="number"
                    value={singleDossierFirstJobId}
                    onChange={e => setSingleDossierFirstJobId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg tabular-nums font-bold focus:outline-none focus:border-[#0B56A8]"
                  />
                  <div className="text-[11px] text-slate-400 mt-1 tabular-nums">
                    {language === 'ar'
                      ? `النطاق المحسوب: من #${singleDossierFirstJobId} إلى #${Number(singleDossierFirstJobId) + 49}`
                      : `Calculated range: #${singleDossierFirstJobId} → #${Number(singleDossierFirstJobId) + 49}`}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Standards & Geometry Specifications Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1.5">
            <div className="font-bold text-[#3F4144] dark:text-white flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0B56A8] dark:text-blue-400" />
              <span>{language === 'ar' ? 'المعايير الهندسية لليبل الحراري:' : 'Approved Thermal Geometry:'}</span>
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <li>· <strong>Dimensions:</strong> 100 × 50 mm (Landscape).</li>
              <li>· <strong>Header Bar:</strong> Solid black top with white Intercom logo.</li>
              <li>· <strong>Left Box:</strong> Rounded rect with divider at Y ≈ 35mm.</li>
              <li>· <strong>QR Code:</strong> Top right (X: 62.5, Y: 14.8) with corner brackets.</li>
              <li>· <strong>Range:</strong> FROM / TO box (50.9 → 94 mm) split vertically.</li>
              <li>· <strong>Colors:</strong> 100% Monochrome Black/White. No gradients.</li>
            </ul>
          </div>
        </div>

        {/* Live 1:1 Vector Preview & Carousel Switcher */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#111827] p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-[#3F4144] dark:text-white">
                  {language === 'ar' ? 'المعاينة المباشرة (مطابقة 1:1 للطباعة)' : 'Live 1:1 Print Preview'}
                </h2>
                <div className="text-[11px] text-slate-500">
                  {currentPreviewLabel.type === 'box'
                    ? `Box Label · ${currentPreviewLabel.boxCode}`
                    : `Dossier ${currentPreviewLabel.dossierNumber} Label · Box ${currentPreviewLabel.boxCode}`}
                </div>
              </div>

              {/* Print Current + Zoom Controls */}
              <div className="flex items-center gap-2">
                {activeLabels.length > 1 && currentPreviewLabel && (
                  <button
                    type="button"
                    onClick={() => handleDirectPrint([currentPreviewLabel])}
                    disabled={preparingPrint}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#0B56A8] dark:text-blue-400 bg-[#EAF2FB] dark:bg-blue-950/40 hover:bg-[#0B56A8] hover:text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Printer className="w-3 h-3" />
                    <span>{language === 'ar' ? 'طباعة هذا الليبل' : 'Print This Label'}</span>
                  </button>
                )}

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPreviewScale(prev => Math.max(0.7, prev - 0.1))}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-[#0B56A8] rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold px-1.5 tabular-nums">
                    {Math.round(previewScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewScale(prev => Math.min(1.4, prev + 0.1))}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-[#0B56A8] rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Preview Center */}
            <div className="p-6 bg-slate-100 dark:bg-[#0B111A] rounded-xl flex items-center justify-center overflow-auto min-h-[260px]">
              {currentPreviewLabel && (
                <LabelCanvasPreview data={currentPreviewLabel} scale={previewScale} />
              )}
            </div>

            {/* Carousel Tabs for the 7 pages */}
            {activeLabels.length > 1 && (
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {language === 'ar' ? 'صفحات الملف السبعة (اختر للمعاينة):' : 'Package Pages (Click to inspect):'}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {activeLabels.map((l, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActivePreviewIndex(idx)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        activePreviewIndex === idx
                          ? 'border-[#0B56A8] bg-[#0B56A8] text-white font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="text-[10px] uppercase">
                        {l.type === 'box' ? 'Box' : `D${l.dossierNumber}`}
                      </div>
                      <div className="text-[9px] opacity-80 truncate tabular-nums">
                        #{l.fromJobId}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated 100x50 mm print sheet portal (visible only during print) */}
      {printItems &&
        createPortal(
          <div
            id="arms-label-print-portal"
            dir="ltr"
            className="hidden print:block"
            style={{
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            {printItems.map((item, idx) => (
              <div
                key={`${item.label.boxCode}-${item.label.type}-${item.label.dossierNumber || 0}-${idx}`}
                style={{
                  width: '100mm',
                  height: '50mm',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  pageBreakAfter: idx < printItems.length - 1 ? 'always' : 'auto',
                  breakAfter: idx < printItems.length - 1 ? 'page' : 'auto',
                }}
              >
                <LabelVectorSvg data={item.label} qrSrc={item.qrSrc} />
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};
