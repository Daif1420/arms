/**
 * ARMS - 1:1 High-Fidelity Vector Label Preview (100 x 50 mm)
 * Strictly matches approved archive label specification layout and thermal print dimensions.
 */

import React, { useEffect, useState } from 'react';
import { LabelData } from '../../types';
import { generateQRDataURL, getQRCodeText, LABEL_ARMS_LOGO, LABEL_LOGO } from '../../utils/labelGenerator';


interface LabelCanvasPreviewProps {
  data: LabelData;
  scale?: number; // scale multiplier for visual display
  responsive?: boolean;
  className?: string;
}

interface LabelVectorSvgProps {
  data: LabelData;
  qrSrc: string;
}

export const LabelVectorSvg: React.FC<LabelVectorSvgProps> = ({ data, qrSrc }) => (
  <svg
    viewBox="0 0 100 50"
    width="100%"
    height="100%"
    className="w-full h-full text-black font-sans block"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background */}
    <rect x="0" y="0" width="100" height="50" fill="#FFFFFF" />

        {/* 1. Outer Border: rounded rectangle, X: 3.5 to 96.5, Y: 2.5 to 47.5 */}
        <rect
          x="3.5"
          y="2.5"
          width="93"
          height="45"
          rx="2.6"
          fill="none"
          stroke="#000000"
          strokeWidth="0.65"
        />

        {/* 2. Header: Solid black bar top of the frame, Y: 2.5 to 11.8 */}
        <g>
          {/* Top-rounded header bar */}
          <path
            d="M 6.1 2.5 L 93.9 2.5 Q 96.5 2.5 96.5 5.1 L 96.5 11.8 L 3.5 11.8 L 3.5 5.1 Q 3.5 2.5 6.1 2.5 Z"
            fill="#000000"
          />

          {/* Official white-text Intercom logo (left) & ARMS logo (right) inside header bar */}
          <image
            href={LABEL_LOGO.src}
            x={LABEL_LOGO.x}
            y={LABEL_LOGO.y}
            width={LABEL_LOGO.w}
            height={LABEL_LOGO.h}
            preserveAspectRatio="xMinYMid meet"
          />
          <image
            href={LABEL_ARMS_LOGO.src}
            x={LABEL_ARMS_LOGO.x}
            y={LABEL_ARMS_LOGO.y}
            width={LABEL_ARMS_LOGO.w}
            height={LABEL_ARMS_LOGO.h}
            preserveAspectRatio="xMaxYMid meet"
          />
        </g>

        {/* 3. Left Box: rounded rectangle, X: 6.4 to 47.9, Y: 13.8 to 45.0 */}
        <rect
          x="6.4"
          y="13.8"
          width="41.5"
          height="31.2"
          rx="2.0"
          fill="none"
          stroke="#000000"
          strokeWidth="0.6"
        />

        {/* Horizontal divider inside left box at Y = 34.2 */}
        <line x1="6.4" y1="34.2" x2="47.9" y2="34.2" stroke="#000000" strokeWidth="0.55" />

        {/* Contents of Left Box (center X = 27.15) */}
        {data.type === 'box' ? (
          <>
            {/* Box Code (huge bold font e.g. D42) */}
            <text
              x="27.15"
              y="28.8"
              textAnchor="middle"
              fill="#000000"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize="16.0"
              fontWeight="800"
              letterSpacing="-0.02em"
            >
              {data.boxCode}
            </text>

            {/* "ARCHIVE BOX" bottom label */}
            <text
              x="27.15"
              y="41.3"
              textAnchor="middle"
              fill="#000000"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize="3.4"
              fontWeight="800"
              letterSpacing="0.14em"
            >
              ARCHIVE BOX
            </text>
          </>
        ) : (
          <>
            {/* Word "Dossier" */}
            <text
              x="27.15"
              y="18.2"
              textAnchor="middle"
              fill="#000000"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize="4.2"
              fontWeight="800"
            >
              Dossier
            </text>

            {/* Large Centered Dossier Number */}
            <text
              x="27.15"
              y="31.8"
              textAnchor="middle"
              fill="#000000"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize="16.2"
              fontWeight="800"
            >
              {data.dossierNumber || 1}
            </text>

            {/* Word "Box" */}
            <text
              x="27.15"
              y="38.0"
              textAnchor="middle"
              fill="#000000"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize="3.0"
              fontWeight="800"
            >
              Box
            </text>

            {/* Box Code */}
            <text
              x="27.15"
              y="43.5"
              textAnchor="middle"
              fill="#000000"
              fontFamily="Helvetica, Arial, sans-serif"
              fontSize="5.4"
              fontWeight="800"
            >
              {data.boxCode}
            </text>
          </>
        )}

        {/* 4. QR Code: centered directly over Range Box (center X = 72.45) */}
        {/* Corner Brackets */}
        <g stroke="#000000" strokeWidth="0.6" fill="none">
          {/* Top-left */}
          <path d="M 61.95 16.1 L 61.95 12.9 L 65.15 12.9" />
          {/* Top-right */}
          <path d="M 79.75 12.9 L 82.95 12.9 L 82.95 16.1" />
          {/* Bottom-left */}
          <path d="M 61.95 30.7 L 61.95 33.9 L 65.15 33.9" />
          {/* Bottom-right */}
          <path d="M 79.75 33.9 L 82.95 33.9 L 82.95 30.7" />
        </g>

        {/* QR Code Image */}
        {qrSrc && (
          <image
            href={qrSrc}
            x="63.45"
            y="14.4"
            width="18.0"
            height="18.0"
            preserveAspectRatio="none"
          />
        )}

        {/* 5. Range Box (FROM / TO): rounded rectangle, X: 50.5 to 94.4, Y: 35.0 to 45.0 */}
        <rect
          x="50.5"
          y="35.0"
          width="43.9"
          height="10.0"
          rx="1.8"
          fill="none"
          stroke="#000000"
          strokeWidth="0.6"
        />

        {/* Vertical divider line at X = 72.45 */}
        <line x1="72.45" y1="35.0" x2="72.45" y2="45.0" stroke="#000000" strokeWidth="0.55" />

        {/* FROM Section (left half center = 61.475) */}
        <text
          x="61.475"
          y="38.2"
          textAnchor="middle"
          fill="#000000"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="2.8"
          fontWeight="800"
        >
          FROM
        </text>
        <text
          x="61.475"
          y="43.6"
          textAnchor="middle"
          fill="#000000"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="5.6"
          fontWeight="800"
        >
          {data.fromJobId}
        </text>

        {/* TO Section (right half center = 83.425) */}
        <text
          x="83.425"
          y="38.2"
          textAnchor="middle"
          fill="#000000"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="2.8"
          fontWeight="800"
        >
          TO
        </text>
        <text
          x="83.425"
          y="43.6"
          textAnchor="middle"
          fill="#000000"
          fontFamily="Helvetica, Arial, sans-serif"
          fontSize="5.6"
          fontWeight="800"
        >
          {data.toJobId}
        </text>
      </svg>
);

export const LabelCanvasPreview: React.FC<LabelCanvasPreviewProps> = ({
  data,
  scale = 1.0,
  responsive = false,
  className = '',
}) => {
  const [qrSrc, setQrSrc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const text = getQRCodeText(data);
    generateQRDataURL(text).then(url => {
      if (isMounted) setQrSrc(url);
    });
    return () => {
      isMounted = false;
    };
  }, [data]);

  const widthMm = 100;
  const heightMm = 50;

  return (
    <div
      dir="ltr"
      className={`${
        responsive ? 'block w-full aspect-[2/1]' : 'inline-block'
      } shadow-sm transition-all bg-white select-none rounded border border-slate-300 dark:border-neutral-800 overflow-hidden ${className}`}
      style={
        responsive
          ? undefined
          : {
              width: `${widthMm * 3.78 * scale}px`,
              height: `${heightMm * 3.78 * scale}px`,
            }
      }
    >
      <LabelVectorSvg data={data} qrSrc={qrSrc} />
    </div>
  );
};
