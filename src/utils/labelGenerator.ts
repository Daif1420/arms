/**
 * ARMS - Archive Reports Management System
 * Approved 100 x 50 mm Thermal Label Engine (jsPDF + Vector Canvas)
 * Strictly conforms to approved archive label specification coordinate specifications.
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { LabelData } from '../types';
import logoDark from '../assets/logo-dark.png?inline';

/** White-text Intercom logo placed inside the black label header (source is 250 x 56 px). */
export const LABEL_LOGO = { src: logoDark, x: 6.8, y: 4.2, h: 6.4, w: 6.4 * (250 / 56) } as const;

/**
 * Generate standard QR code payload text matching the specification exactly
 */
export function getQRCodeText(data: LabelData): string {
  if (data.type === 'box') {
    return `BOX: ${data.boxCode}\nFROM: ${data.fromJobId}\nTO: ${data.toJobId}`;
  } else {
    return `BOX: ${data.boxCode}\nDOSSIER: ${data.dossierNumber || 1}\nOF: ${data.totalDossiers || 6}\nFROM: ${data.fromJobId}\nTO: ${data.toJobId}`;
  }
}

/**
 * Generate a QR code as Data URL (PNG)
 */
export async function generateQRDataURL(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    margin: 0,
    width: 256,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Draws the corner brackets around the QR code exactly as specified
 */
function drawCornerBrackets(pdf: jsPDF, x: number, y: number, w: number, h: number, len: number) {
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.4);

  // Top-left
  pdf.line(x, y + len, x, y);
  pdf.line(x, y, x + len, y);

  // Top-right
  pdf.line(x + w - len, y, x + w, y);
  pdf.line(x + w, y, x + w, y + len);

  // Bottom-left
  pdf.line(x, y + h - len, x, y + h);
  pdf.line(x, y + h, x + len, y + h);

  // Bottom-right
  pdf.line(x + w - len, y + h, x + w, y + h);
  pdf.line(x + w, y + h - len, x + w, y + h);
}

/**
 * Renders a single 100 x 50 mm label on a jsPDF page
 */
export async function renderLabelOnPDF(pdf: jsPDF, data: LabelData) {
  // Clean white background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 100, 50, 'F');

  // 1. Outer Border: rounded rectangle, X: 4 to 97, Y: 2.5 to 47.4
  const outerX = 4;
  const outerY = 2.5;
  const outerW = 93;
  const outerH = 44.9;
  const outerR = 2.8;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(outerX, outerY, outerW, outerH, outerR, outerR, 'S');

  // 2. Header: Solid black bar top of the frame, Y: 2.5 to 11.9
  const headerH = 9.4;
  pdf.setFillColor(0, 0, 0);

  // Clip to outer frame rounded top corners
  // We can draw rounded rectangle for top portion
  pdf.roundedRect(outerX, outerY, outerW, headerH, outerR, outerR, 'F');
  // Fill the bottom squared corner of header bar
  pdf.rect(outerX, outerY + outerR, outerW, headerH - outerR, 'F');

  // Official white-text Intercom logo in the black header
  pdf.addImage(LABEL_LOGO.src, 'PNG', LABEL_LOGO.x, LABEL_LOGO.y, LABEL_LOGO.w, LABEL_LOGO.h);

  // 3. Left Box: rounded rectangle, X: 6.8 to 47.7, Y: 14.4 to 44.8
  const leftX = 6.8;
  const leftY = 14.4;
  const leftW = 40.9;
  const leftH = 30.4;
  const leftR = 2.0;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.45);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(leftX, leftY, leftW, leftH, leftR, leftR, 'S');

  // Horizontal divider inside left box at Y ≈ 35
  const divY = 35.0;
  pdf.line(leftX, divY, leftX + leftW, divY);

  // Contents of Left Box
  if (data.type === 'box') {
    // Upper section: Huge Box Code (e.g. "D42")
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.text(data.boxCode, leftX + leftW / 2, divY - 4.5, { align: 'center' });

    // Lower section: "ARCHIVE BOX" uppercase bold with letter spacing
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('A R C H I V E   B O X', leftX + leftW / 2, leftY + leftH - 3.4, { align: 'center' });
  } else {
    // Dossier Label
    // Upper section: Word "Dossier" bold, then large bold dossier number
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.2);
    pdf.text('Dossier', leftX + leftW / 2, 18.7, { align: 'center' });

    pdf.setFontSize(41);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(data.dossierNumber || 1), leftX + leftW / 2, 32.6, { align: 'center' });

    // Lower section: "Box" bold, and below it larger Box code bold
    pdf.setFontSize(7.2);
    pdf.text('Box', leftX + leftW / 2, 38.3, { align: 'center' });

    pdf.setFontSize(13);
    pdf.text(data.boxCode, leftX + leftW / 2, 43.3, { align: 'center' });
  }

  // 4. QR Code: centered directly over Range Box (center X = 72.45)
  const qrX = 63.2;
  const qrY = 14.8;
  const qrSize = 18.5;
  const qrBracketPad = 1.7;

  // Corner brackets around QR code
  drawCornerBrackets(
    pdf,
    qrX - qrBracketPad,
    qrY - qrBracketPad,
    qrSize + qrBracketPad * 2,
    qrSize + qrBracketPad * 2,
    3.0
  );

  const qrText = getQRCodeText(data);
  try {
    const qrDataUrl = await generateQRDataURL(qrText);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.error('Failed generating QR code for label:', err);
  }

  // 5. Range Box (FROM / TO): rounded rectangle, X: 50.9 to 94, Y: 36.1 to 44.7
  const rangeX = 50.9;
  const rangeY = 36.1;
  const rangeW = 43.1;
  const rangeH = 8.6;
  const rangeR = 1.8;
  const rangeMidX = 72.45;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.45);
  pdf.roundedRect(rangeX, rangeY, rangeW, rangeH, rangeR, rangeR, 'S');

  // Vertical dividing line at X = 72.45
  pdf.line(rangeMidX, rangeY, rangeMidX, rangeY + rangeH);

  // FROM Section
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  const leftHalfCenter = rangeX + (rangeMidX - rangeX) / 2;
  pdf.text('FROM', leftHalfCenter, 38.7, { align: 'center' });

  pdf.setFontSize(14);
  pdf.text(String(data.fromJobId), leftHalfCenter, 43.6, { align: 'center' });

  // TO Section
  const rightHalfCenter = rangeMidX + (rangeX + rangeW - rangeMidX) / 2;
  pdf.setFontSize(6.5);
  pdf.text('TO', rightHalfCenter, 38.7, { align: 'center' });

  pdf.setFontSize(14);
  pdf.text(String(data.toJobId), rightHalfCenter, 43.6, { align: 'center' });
}

/**
 * Generate full 7-page PDF (1 Box Label + 6 Dossier Labels) or single label PDF
 */
export async function generateLabelsPDF(labels: LabelData[]): Promise<jsPDF> {
  // Page size 100 x 50 mm, landscape
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [50, 100], // height, width
  });

  for (let i = 0; i < labels.length; i++) {
    if (i > 0) {
      pdf.addPage([50, 100], 'landscape');
    }
    await renderLabelOnPDF(pdf, labels[i]);
  }

  return pdf;
}

/**
 * Helper to build the standard 7-label package for a box
 */
export function buildBoxLabelPackage(boxCode: string, firstJobId: number): LabelData[] {
  const labels: LabelData[] = [];

  // Page 1: Box Label (from firstJobId to firstJobId + 299)
  labels.push({
    type: 'box',
    boxCode,
    fromJobId: firstJobId,
    toJobId: firstJobId + 299,
  });

  // Pages 2-7: 6 Dossiers (50 projects each)
  for (let d = 1; d <= 6; d++) {
    const dFrom = firstJobId + (d - 1) * 50;
    const dTo = dFrom + 49;
    labels.push({
      type: 'dossier',
      boxCode,
      dossierNumber: d,
      totalDossiers: 6,
      fromJobId: dFrom,
      toJobId: dTo,
    });
  }

  return labels;
}
