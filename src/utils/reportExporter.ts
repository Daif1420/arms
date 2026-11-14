/**
 * ARMS - Formal A4 Portrait Corporate Report Exporter (Excel & Multi-Page Canvas->PDF)
 * - Clean English corporate document format (LTR)
 * - Pure Intercom branding (no external client logos)
 * - Supports standard tabular reports AND Box+Dossiers 2x3 directory cards (Report #13)
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import logoColor from '../assets/logo.png?inline';
import armsLogoLight from '../assets/arms-logo.png?inline';

export interface BoxDirectoryDossierItem {
  id: string;
  dossierNumber: number;
  fromJobId: number;
  toJobId: number;
  archivedCount: number;
  missingCount: number;
  pendingCount: number;
  totalProjects: number;
  status: string;
}

export interface BoxDirectoryItem {
  boxCode: string;
  firstJobId: number;
  lastJobId: number;
  archivedProjects: number;
  missingProjects: number;
  pendingProjects: number;
  totalProjects: number;
  status: string;
  isForceClosed: boolean;
  dossiers: BoxDirectoryDossierItem[];
}

export interface ReportExportOptions {
  reportId: string;
  reportTitleEn: string;
  reportTitleAr: string;
  language: 'ar' | 'en';
  columns: string[];
  rows: Record<string, unknown>[];
  boxDirectoryItems?: BoxDirectoryItem[];
  boxFilter: string;
  totalBoxes: number;
  preparedBy: string;
  printDate: string;
  rowsPerPage?: number;
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

export const REPORT_ROWS_PER_PAGE = 30;
export const REPORT_BOXES_PER_PAGE = 5;

export function paginateReportRows<T>(rows: T[], rowsPerPage: number = REPORT_ROWS_PER_PAGE): T[][] {
  if (rows.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < rows.length; i += rowsPerPage) {
    pages.push(rows.slice(i, i + rowsPerPage));
  }
  return pages;
}

export function exportReportToExcel(opts: ReportExportOptions): string {
  const cleanTitle = opts.reportTitleEn.replace(/^\d+\.\s*/, '');
  const scopeLabel = opts.boxFilter === 'all' ? 'All Boxes' : `Box ${opts.boxFilter}`;

  let columns = opts.columns;
  let rows = opts.rows;
  let totalCountText = `${opts.rows.length} Records (${opts.totalBoxes} Boxes)`;

  if (opts.boxDirectoryItems) {
    columns = ['Box Code', 'Box Range', 'Box Archived', 'Dossier #', 'Dossier Range', 'Dossier Archived', 'Missing', 'Pending', 'Status'];
    rows = opts.boxDirectoryItems.flatMap(b =>
      b.dossiers.map(d => ({
        'Box Code': b.boxCode,
        'Box Range': `${b.firstJobId} → ${b.lastJobId}`,
        'Box Archived': `${b.archivedProjects} / ${b.totalProjects}`,
        'Dossier #': `${d.id} (${d.dossierNumber}/6)`,
        'Dossier Range': `${d.fromJobId} → ${d.toJobId}`,
        'Dossier Archived': `${d.archivedCount} / ${d.totalProjects}`,
        'Missing': d.missingCount,
        'Pending': d.pendingCount,
        'Status': d.status,
      }))
    );
    totalCountText = `${opts.boxDirectoryItems.length} Boxes (${rows.length} Dossiers)`;
  }

  const colCount = Math.max(columns.length + 1, 5);

  const metaRows: (string | number)[][] = [
    ['Intercom ARMS', '', cleanTitle, ...Array(Math.max(0, colCount - 3)).fill('')],
    [],
    ['Scope :', scopeLabel, '', 'Print Date :', opts.printDate],
    ['Total :', totalCountText, '', 'Prepared By :', opts.preparedBy || 'System Admin'],
    [],
  ];

  const tableRows: (string | number)[][] = [
    ['#', ...columns],
    ...rows.map((row, idx) => [
      idx + 1,
      ...columns.map(col => {
        const val = row[col];
        return typeof val === 'number' ? val : String(val ?? '—');
      }),
    ]),
  ];

  const aoa = [...metaRows, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!merges'] = [{ s: { r: 0, c: 2 }, e: { r: 0, c: Math.max(2, colCount - 1) } }];

  ws['!cols'] = Array.from({ length: columns.length + 1 }, (_, colIdx) => {
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

function drawPageChrome(
  ctx: CanvasRenderingContext2D,
  logoImg: HTMLImageElement | null,
  armsLogoImg: HTMLImageElement | null,
  cleanTitle: string,
  scopeLabel: string,
  totalSummaryText: string,
  printDate: string,
  preparedBy: string,
  pageIdx: number,
  totalPages: number
) {
  const W = 1260;
  const H = 1782;
  const M = 60;
  const CONTENT_W = W - M * 2;

  // White A4 background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 1. Top Corporate Header (Intercom left, Title center, ARMS right)
  if (logoImg) {
    const logoH = 42;
    const logoW = logoH * (logoImg.naturalWidth / Math.max(1, logoImg.naturalHeight));
    ctx.drawImage(logoImg, M, 42, logoW, logoH);
  } else {
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 28px "Inter", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Intercom', M, 74);
  }

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 28px "Inter", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(cleanTitle, W / 2, 72);

  if (armsLogoImg) {
    const armsH = 46;
    const armsW = armsH * (armsLogoImg.naturalWidth / Math.max(1, armsLogoImg.naturalHeight));
    ctx.drawImage(armsLogoImg, W - M - armsW, 40, armsW, armsH);
  } else {
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 24px "Inter", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ARMS', W - M, 70);
  }

  // 2. Clean 2-Column English Metadata Box
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(M, 106, CONTENT_W, 104);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(M, 106, CONTENT_W, 104);

  const metaLeftX = M + 22;
  const metaRightX = W / 2 + 34;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 17px "Inter", Arial, sans-serif';
  ctx.fillText('Scope :', metaLeftX, 144);
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 17px "Inter", Arial, sans-serif';
  ctx.fillText(scopeLabel, metaLeftX + 94, 144);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 17px "Inter", Arial, sans-serif';
  ctx.fillText('Total :', metaLeftX, 184);
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 17px "Inter", Arial, sans-serif';
  ctx.fillText(totalSummaryText, metaLeftX + 94, 184);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 17px "Inter", Arial, sans-serif';
  ctx.fillText('Print Date :', metaRightX, 144);
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 17px "Inter", Arial, sans-serif';
  ctx.fillText(printDate, metaRightX + 140, 144);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 17px "Inter", Arial, sans-serif';
  ctx.fillText('Prepared By :', metaRightX, 184);
  ctx.fillStyle = '#0F172A';
  ctx.font = '600 17px "Inter", "Cairo", Arial, sans-serif';
  ctx.fillText(preparedBy || 'System Admin', metaRightX + 140, 184);

  // Clean dark divider rule
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(M, 228);
  ctx.lineTo(W - M, 228);
  ctx.stroke();

  // Footer
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(M, H - 56);
  ctx.lineTo(W - M, H - 56);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '600 14px "Inter", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Intercom ARMS', M, H - 28);
  ctx.textAlign = 'right';
  ctx.fillText(`Page ${pageIdx + 1} of ${totalPages}`, W - M, H - 28);
}

export async function exportReportToPDF(opts: ReportExportOptions): Promise<string> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  let logoImg: HTMLImageElement | null = null;
  let armsLogoImg: HTMLImageElement | null = null;
  try {
    [logoImg, armsLogoImg] = await Promise.all([loadImage(logoColor), loadImage(armsLogoLight)]);
  } catch {
    logoImg = await loadImage(logoColor).catch(() => null);
    armsLogoImg = await loadImage(armsLogoLight).catch(() => null);
  }

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

  // Specialized Box + 2x3 Dossiers Grid Renderer (Report #13)
  if (opts.boxDirectoryItems) {
    const boxPages = paginateReportRows(opts.boxDirectoryItems, REPORT_BOXES_PER_PAGE);
    const totalSummary = `${opts.boxDirectoryItems.length} Boxes · ${opts.boxDirectoryItems.reduce(
      (sum, b) => sum + b.dossiers.length,
      0
    )} Dossiers`;

    for (let pageIdx = 0; pageIdx < boxPages.length; pageIdx++) {
      const pageBoxes = boxPages[pageIdx];
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      drawPageChrome(
        ctx,
        logoImg,
        armsLogoImg,
        cleanTitle,
        scopeLabel,
        totalSummary,
        opts.printDate,
        opts.preparedBy,
        pageIdx,
        boxPages.length
      );

      if (pageBoxes.length === 0) {
        ctx.strokeStyle = '#CBD5E1';
        ctx.strokeRect(M, 252, CONTENT_W, 70);
        ctx.fillStyle = '#64748B';
        ctx.font = '500 16.5px "Inter", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No matching boxes', W / 2, 293);
      } else {
        const START_Y = 250;
        const CARD_GAP = 22;
        const HEADER_H = 52;
        const DOSSIER_ROW_H = 72;
        const CARD_H = HEADER_H + DOSSIER_ROW_H * 3;
        const HALF_W = CONTENT_W / 2;

        pageBoxes.forEach((box, bIdx) => {
          const cardY = START_Y + bIdx * (CARD_H + CARD_GAP);

          // Box header band (print-safe neutral #D9D9D9 matching standard tables)
          ctx.fillStyle = '#D9D9D9';
          ctx.fillRect(M, cardY, CONTENT_W, HEADER_H);

          // Outer card border
          ctx.strokeStyle = '#64748B';
          ctx.lineWidth = 1.3;
          ctx.strokeRect(M, cardY, CONTENT_W, CARD_H);

          // Header divider
          ctx.beginPath();
          ctx.moveTo(M, cardY + HEADER_H);
          ctx.lineTo(M + CONTENT_W, cardY + HEADER_H);
          ctx.stroke();

          // Left header: Box Code + Box Range
          ctx.textAlign = 'left';
          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 18px "Inter", Arial, sans-serif';
          ctx.fillText(`Box ${box.boxCode}`, M + 18, cardY + 33);

          ctx.fillStyle = '#1E293B';
          ctx.font = 'bold 17px "Inter", Arial, sans-serif';
          ctx.fillText(`Range: ${box.firstJobId} → ${box.lastJobId}`, M + 135, cardY + 33);

          // Right header: Capacity summary + Status
          const boxStatusLabel = box.isForceClosed ? 'Force Closed' : box.status;
          const summaryStr = `${box.archivedProjects}/${box.totalProjects} Archived · ${box.missingProjects} Missing · ${box.pendingProjects} Pending · ${boxStatusLabel}`;
          ctx.textAlign = 'right';
          ctx.fillStyle = '#1E293B';
          ctx.font = '600 15.5px "Inter", Arial, sans-serif';
          ctx.fillText(truncateText(ctx, summaryStr, CONTENT_W - 430), M + CONTENT_W - 18, cardY + 32);

          // 2x3 Dossiers Grid
          for (let row = 0; row < 3; row++) {
            const rowY = cardY + HEADER_H + row * DOSSIER_ROW_H;
            if (row > 0) {
              ctx.strokeStyle = '#CBD5E1';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(M, rowY);
              ctx.lineTo(M + CONTENT_W, rowY);
              ctx.stroke();
            }

            for (let col = 0; col < 2; col++) {
              const dIdx = row * 2 + col;
              const dossier = box.dossiers[dIdx];
              const cellX = M + col * HALF_W;

              if (col === 1) {
                ctx.strokeStyle = '#CBD5E1';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(cellX, rowY);
                ctx.lineTo(cellX, rowY + DOSSIER_ROW_H);
                ctx.stroke();
              }

              if (!dossier) continue;

              // Top line: Dossier # (ID) on left, Range on right
              ctx.textAlign = 'left';
              ctx.fillStyle = '#0F172A';
              ctx.font = 'bold 16px "Inter", Arial, sans-serif';
              ctx.fillText(`Dossier ${dossier.dossierNumber} (${dossier.id})`, cellX + 18, rowY + 28);

              ctx.textAlign = 'right';
              ctx.fillStyle = '#0F172A';
              ctx.font = 'bold 16.5px "Inter", Arial, sans-serif';
              ctx.fillText(`${dossier.fromJobId} → ${dossier.toJobId}`, cellX + HALF_W - 18, rowY + 28);

              // Bottom line: Counts on left, Status on right
              const countsStr =
                dossier.missingCount > 0 || dossier.pendingCount > 0
                  ? `${dossier.archivedCount}/${dossier.totalProjects} Archived · ${dossier.missingCount} Missing · ${dossier.pendingCount} Pending`
                  : `${dossier.archivedCount}/${dossier.totalProjects} Archived`;
              ctx.textAlign = 'left';
              ctx.fillStyle = '#475569';
              ctx.font = '500 14.5px "Inter", Arial, sans-serif';
              ctx.fillText(truncateText(ctx, countsStr, HALF_W - 135), cellX + 18, rowY + 55);

              ctx.textAlign = 'right';
              ctx.fillStyle = '#0F172A';
              ctx.font = 'bold 14.5px "Inter", Arial, sans-serif';
              ctx.fillText(dossier.status, cellX + HALF_W - 18, rowY + 55);
            }
          }
        });
      }

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

  // Standard Tabular Reports (Reports 1..12)
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
  const TABLE_TOP_Y = 252;

  const pages = paginateReportRows(opts.rows, opts.rowsPerPage ?? REPORT_ROWS_PER_PAGE);
  let globalRowOffset = 0;

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const pageRows = pages[pageIdx];
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    drawPageChrome(
      ctx,
      logoImg,
      armsLogoImg,
      cleanTitle,
      scopeLabel,
      `${opts.rows.length} Records · ${opts.totalBoxes} Boxes`,
      opts.printDate,
      opts.preparedBy,
      pageIdx,
      pages.length
    );

    const tableTopY = TABLE_TOP_Y;

    // 3. Gray Table Header (#D9D9D9) with full grid borders
    ctx.fillStyle = '#D9D9D9';
    ctx.fillRect(M, tableTopY, CONTENT_W, THEAD_H);

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.3;
    ctx.strokeRect(M, tableTopY, CONTENT_W, THEAD_H);

    let xCursor = M;
    ctx.fillStyle = '#0F172A';
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

    // 4. Data Rows with subtle zebra striping for scan clarity
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
