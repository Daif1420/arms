/**
 * ARMS - Archive Reports Management System
 * Approved 100 x 50 mm Thermal Label Engine (jsPDF + Vector Canvas)
 * Strictly conforms to approved archive label specification coordinate specifications.
 */

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { LabelData } from '../types';
import logoDark from '../assets/logo-dark.png?inline';
import armsLogoDark from '../assets/arms-logo-dark.png?inline';

/** White-text Intercom logo placed on the left side of the black label header (source is 250 x 56 px). */
export const LABEL_LOGO = { src: logoDark, x: 6.4, y: 4.1, h: 6.4, w: 6.4 * (250 / 56) } as const;

/** White-text ARMS logo placed on the right side of the black label header (source is 600 x 166 px). */
const ARMS_H = 6.6;
const ARMS_W = ARMS_H * (600 / 166);
export const LABEL_ARMS_LOGO = { src: armsLogoDark, x: 94.0 - ARMS_W, y: 3.9, h: ARMS_H, w: ARMS_W } as const;

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
  pdf.setLineWidth(0.6);

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

  // 1. Outer Border: rounded rectangle, X: 3.5 to 96.5, Y: 2.5 to 47.5
  const outerX = 3.5;
  const outerY = 2.5;
  const outerW = 93;
  const outerH = 45;
  const outerR = 2.6;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.65);
  pdf.roundedRect(outerX, outerY, outerW, outerH, outerR, outerR, 'S');

  // 2. Header: Solid black bar top of the frame, Y: 2.5 to 11.8
  const headerH = 9.3;
  pdf.setFillColor(0, 0, 0);

  // Clip to outer frame rounded top corners
  pdf.roundedRect(outerX, outerY, outerW, headerH, outerR, outerR, 'F');
  // Fill the bottom squared corner of header bar
  pdf.rect(outerX, outerY + outerR, outerW, headerH - outerR, 'F');

  // Official white-text Intercom logo (left) & ARMS logo (right) in the black header
  pdf.addImage(LABEL_LOGO.src, 'PNG', LABEL_LOGO.x, LABEL_LOGO.y, LABEL_LOGO.w, LABEL_LOGO.h);
  pdf.addImage(
    LABEL_ARMS_LOGO.src,
    'PNG',
    LABEL_ARMS_LOGO.x,
    LABEL_ARMS_LOGO.y,
    LABEL_ARMS_LOGO.w,
    LABEL_ARMS_LOGO.h
  );

  // 3. Left Box: rounded rectangle, X: 6.4 to 47.9, Y: 13.8 to 45.0
  const leftX = 6.4;
  const leftY = 13.8;
  const leftW = 41.5;
  const leftH = 31.2;
  const leftR = 2.0;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.6);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(leftX, leftY, leftW, leftH, leftR, leftR, 'S');

  // Horizontal divider inside left box at Y = 34.2
  const divY = 34.2;
  pdf.setLineWidth(0.55);
  pdf.line(leftX, divY, leftX + leftW, divY);

  // Contents of Left Box
  if (data.type === 'box') {
    // Upper section: Huge Box Code (e.g. "D42")
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(42);
    pdf.text(data.boxCode, leftX + leftW / 2, 28.8, { align: 'center' });

    // Lower section: "ARCHIVE BOX" bold
    pdf.setFontSize(9.5);
    pdf.setFont('helvetica', 'bold');
    pdf.text('A R C H I V E   B O X', leftX + leftW / 2, 41.3, { align: 'center' });
  } else {
    // Dossier Label
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Dossier', leftX + leftW / 2, 18.2, { align: 'center' });

    pdf.setFontSize(44);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(data.dossierNumber || 1), leftX + leftW / 2, 31.8, { align: 'center' });

    // Lower section: "Box" bold, and below it larger Box code bold
    pdf.setFontSize(8.5);
    pdf.text('Box', leftX + leftW / 2, 38.0, { align: 'center' });

    pdf.setFontSize(15.5);
    pdf.text(data.boxCode, leftX + leftW / 2, 43.5, { align: 'center' });
  }

  // 4. QR Code: centered directly over Range Box (center X = 72.45)
  const qrX = 63.45;
  const qrY = 14.4;
  const qrSize = 18.0;
  const qrBracketPad = 1.5;

  // Corner brackets around QR code
  drawCornerBrackets(
    pdf,
    qrX - qrBracketPad,
    qrY - qrBracketPad,
    qrSize + qrBracketPad * 2,
    qrSize + qrBracketPad * 2,
    3.2
  );

  const qrText = getQRCodeText(data);
  try {
    const qrDataUrl = await generateQRDataURL(qrText);
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.error('Failed generating QR code for label:', err);
  }

  // 5. Range Box (FROM / TO): rounded rectangle, X: 50.5 to 94.4, Y: 35.0 to 45.0
  const rangeX = 50.5;
  const rangeY = 35.0;
  const rangeW = 43.9;
  const rangeH = 10.0;
  const rangeR = 1.8;
  const rangeMidX = 72.45;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(rangeX, rangeY, rangeW, rangeH, rangeR, rangeR, 'S');

  // Vertical dividing line at X = 72.45
  pdf.setLineWidth(0.55);
  pdf.line(rangeMidX, rangeY, rangeMidX, rangeY + rangeH);

  // FROM Section
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.0);
  const leftHalfCenter = rangeX + (rangeMidX - rangeX) / 2;
  pdf.text('FROM', leftHalfCenter, 38.2, { align: 'center' });

  pdf.setFontSize(16);
  pdf.text(String(data.fromJobId), leftHalfCenter, 43.6, { align: 'center' });

  // TO Section
  const rightHalfCenter = rangeMidX + (rangeX + rangeW - rangeMidX) / 2;
  pdf.setFontSize(8.0);
  pdf.text('TO', rightHalfCenter, 38.2, { align: 'center' });

  pdf.setFontSize(16);
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
