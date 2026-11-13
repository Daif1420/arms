/**
 * ARMS - Formal A4 Portrait Corporate Report Exporter (Excel & Multi-Page Canvas->PDF)
 * - Clean English corporate document format (LTR)
 * - Pure Intercom branding (no external client logos)
 * - Simple, clear metadata bar + A4 Portrait (210 x 297 mm) layout
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import logoColor from '../assets/logo.png?inline';

export interface ReportExportOptions {
  reportId: string;
  reportTitleEn: string;
  reportTitleAr: string;
  language: 'ar' | 'en';
  columns: string[];
  rows: Record<string, unknown>[];
  boxFilter: string;
  totalBoxes: number;
  preparedBy: string;
  printDate: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

function drawWrappedHeader(
  ctx: CanvasRenderingContext2D,
  text: string,
  startX: number,
  topY: number,
  boxH: number,
  maxW: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1 || ctx.measureText(text).width <= maxW) {
    ctx.fillText(truncateText(ctx, text, maxW), startX, topY + boxH / 2 + 5);
    return;
  }

  const mid = Math.ceil(words.length / 2);
  const line1 = truncateText(ctx, words.slice(0, mid).join(' '), maxW);
  const line2 = truncateText(ctx, words.slice(mid).join(' '), maxW);
  ctx.fillText(line1, startX, topY + boxH / 2 - 4);
  ctx.fillText(line2, startX, topY + boxH / 2 + 14);
}

export function exportReportToExcel(opts: ReportExportOptions): string {
  const cleanTitle = opts.reportTitleEn.replace(/^\d+\.\s*/, '');
  const scopeLabel = opts.boxFilter === 'all' ? 'All Boxes' : `Box ${opts.boxFilter}`;
  const colCount = Math.max(opts.columns.length + 1, 5);

  const metaRows: (string | number)[][] = [
    ['Intercom ARMS', '', cleanTitle, ...Array(Math.max(0, colCount - 3)).fill('')],
    [],
    ['Scope :', scopeLabel, '', 'Print Date :', opts.printDate],
    ['Total :', `${opts.rows.length} Records (${opts.totalBoxes} Boxes)`, '', 'Prepared By :', opts.preparedBy || 'System Admin'],
    [],
  ];

  const tableRows: (string | number)[][] = [
    ['#', ...opts.columns],
    ...opts.rows.map((row, idx) => [
      idx + 1,
      ...opts.columns.map(col => {
        const val = row[col];
        return typeof val === 'number' ? val : String(val ?? '—');
      }),
    ]),
  ];

  const aoa = [...metaRows, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: Math.max(2, colCount - 1) } }];

  ws['!cols'] = Array.from({ length: opts.columns.length + 1 }, (_, colIdx) => {
    let maxLen = colIdx === 0 ? 6 : 14;
    for (const r of tableRows) {
      const len = String(r[colIdx] ?? '').length;
      if (len > maxLen) maxLen = len;
    }
    return { wch: Math.min(maxLen + 4, 40) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const fileName = `ARMS_${opts.reportId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

export const REPORT_ROWS_PER_PAGE = 30;

export function paginateReportRows<T>(rows: T[], rowsPerPage: number = REPORT_ROWS_PER_PAGE): T[][] {
  if (rows.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }
  return pages;
}

export async function exportReportToPDF(opts: ReportExportOptions): Promise<string> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await loadImage(logoColor);
  } catch {
    logoImg = null;
  }

  // Standard A4 Portrait high-DPI canvas: 210 x 297 mm at 6 px/mm => 1260 x 1782 px
  const W = 1260;
  const H = 1782;
  const M = 60;
  const CONTENT_W = W - M * 2;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cleanTitle = opts.reportTitleEn.replace(/^\d+\.\s*/, '');
  const scopeLabel = opts.boxFilter === 'all' ? 'All Boxes' : `Box ${opts.boxFilter}`;

  const cols = ['#', ...opts.columns];
  const weights = cols.map(c => {
    if (c === '#') return 0.55;
    if (c === 'Details' || c === 'Reason for Closure' || c === 'Notes' || c === 'Source Upload') return 1.85;
    if (c === 'Timestamp' || c === 'File Name' || c === 'Range' || c === 'Action Required') return 1.45;
    return 1.0;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map(w => (w / totalWeight) * CONTENT_W);

  const ROW_H = 44;
  const THEAD_H = 50;
  const TABLE_TOP_Y = 256;

  const pages = paginateReportRows(opts.rows, REPORT_ROWS_PER_PAGE);
  let globalRowOffset = 0;

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageRows = pages[pageIdx];
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // White A4 background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // 1. Top Corporate Header on EVERY page: Intercom Logo | Centered Report Title | System Name
    if (logoImg) {
      const logoH = 42;
      const logoW = logoH * (logoImg.naturalWidth / Math.max(1, logoImg.naturalHeight));
      ctx.drawImage(logoImg, M, 44, logoW, logoH);
    } else {
      ctx.fillStyle = '#0B56A8';
      ctx.font = 'bold 28px "Inter", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Intercom', M, 76);
    }

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 28px "Inter", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cleanTitle, W / 2, 74);

    ctx.fillStyle = '#475569';
    ctx.font = '600 14px "Inter", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Archive Management', W - M, 72);

    // 2. Clean 2-Column English Metadata Box on EVERY page
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(M, 108, CONTENT_W, 104);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(M, 108, CONTENT_W, 104);

    const metaLeftX = M + 22;
    const metaRightX = W / 2 + 34;

    ctx.textAlign = 'left';
    // Left Column
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 17px "Inter", Arial, sans-serif';
    ctx.fillText('Scope :', metaLeftX, 146);
    ctx.fillStyle = '#0F172A';
    ctx.font = '600 17px "Inter", Arial, sans-serif';
    ctx.fillText(scopeLabel, metaLeftX + 94, 146);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 17px "Inter", Arial, sans-serif';
    ctx.fillText('Total :', metaLeftX, 186);
    ctx.fillStyle = '#0F172A';
    ctx.font = '600 17px "Inter", Arial, sans-serif';
    ctx.fillText(`${opts.rows.length} Records · ${opts.totalBoxes} Boxes`, metaLeftX + 94, 186);

    // Right Column
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 17px "Inter", Arial, sans-serif';
    ctx.fillText('Print Date :', metaRightX, 146);
    ctx.fillStyle = '#0F172A';
    ctx.font = '600 17px "Inter", Arial, sans-serif';
    ctx.fillText(opts.printDate, metaRightX + 140, 146);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 17px "Inter", Arial, sans-serif';
    ctx.fillText('Prepared By :', metaRightX, 186);
    ctx.fillStyle = '#0F172A';
    ctx.font = '600 17px "Inter", "Cairo", Arial, sans-serif';
    ctx.fillText(opts.preparedBy || 'System Admin', metaRightX + 140, 186);

    // Horizontal separator rule
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(M, 232);
    ctx.lineTo(W - M, 232);
    ctx.stroke();

    const tableTopY = TABLE_TOP_Y;

    // 3. Gray Table Header (#D9D9D9) with full grid borders
    ctx.fillStyle = '#D9D9D9';
    ctx.fillRect(M, tableTopY, CONTENT_W, THEAD_H);

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(M, tableTopY, CONTENT_W, THEAD_H);

    let xCursor = M;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16.5px "Inter", Arial, sans-serif';
    ctx.textAlign = 'left';

    cols.forEach((col, cIdx) => {
      const cw = colWidths[cIdx];
      if (cIdx > 0) {
        ctx.beginPath();
        ctx.moveTo(xCursor, tableTopY);
        ctx.lineTo(xCursor, tableTopY + THEAD_H);
        ctx.stroke();
      }
      drawWrappedHeader(ctx, col, xCursor + 9, tableTopY, THEAD_H, cw - 18);
      xCursor += cw;
    });

    // 4. Data Rows (clean 16px print-ready typography)
    if (pageRows.length === 0) {
      const emptyY = tableTopY + THEAD_H;
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(M, emptyY, CONTENT_W, ROW_H * 1.4);
      ctx.fillStyle = '#64748B';
      ctx.font = '500 16.5px "Inter", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No matching records', W / 2, emptyY + 36);
    } else {
      pageRows.forEach((row, rIdx) => {
        const y = tableTopY + THEAD_H + rIdx * ROW_H;
        const rowNum = globalRowOffset + rIdx + 1;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(M, y, CONTENT_W, ROW_H);

        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1;
        ctx.strokeRect(M, y, CONTENT_W, ROW_H);

        let cellX = M;
        cols.forEach((col, cIdx) => {
          const cw = colWidths[cIdx];
          if (cIdx > 0) {
            ctx.beginPath();
            ctx.moveTo(cellX, y);
            ctx.lineTo(cellX, y + ROW_H);
            ctx.stroke();
          }

          const rawVal = col === '#' ? String(rowNum) : String(row[col] ?? '—');
          ctx.fillStyle = '#0F172A';
          ctx.font =
            col === 'Job ID' || col === 'First Job ID' || col === 'Range' || col === '#'
              ? '600 16.5px "Inter", Arial, sans-serif'
              : '500 16px "Inter", "Cairo", Arial, sans-serif';

          if (col === '#') {
            ctx.textAlign = 'center';
            ctx.fillText(rawVal, cellX + cw / 2, y + 27);
          } else {
            ctx.textAlign = 'left';
            const fitted = truncateText(ctx, rawVal, cw - 18);
            ctx.fillText(fitted, cellX + 9, y + 27);
          }
          cellX += cw;
        });
      });
    }

    globalRowOffset += pageRows.length;

    // Footer
    ctx.fillStyle = '#475569';
    ctx.font = '600 14px "Inter", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Intercom ARMS', M, H - 30);
    ctx.textAlign = 'right';
    ctx.fillText(`Page ${pageIdx + 1} of ${pages.length}`, W - M, H - 30);

    if (pageIdx > 0) {
      pdf.addPage('a4', 'portrait');
    }
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  }

  const fileName = `ARMS_${opts.reportId}_A4.pdf`;
  pdf.save(fileName);
  return fileName;
}
