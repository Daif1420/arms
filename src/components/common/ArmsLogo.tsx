/**
 * ARMS - Archive Report Management System Logo Component
 * Uses transparent PNG files: dark-text logo on light backgrounds,
 * white-text logo on dark backgrounds (follows the app's dark mode).
 */

import React from 'react';
import armsLogoLight from '../../assets/arms-logo.png';
import armsLogoDark from '../../assets/arms-logo-dark.png';

interface ArmsLogoProps {
  className?: string;
  /** 'auto' follows dark mode; 'light' forces dark-text PNG; 'white' forces white-text PNG. */
  variant?: 'auto' | 'light' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

// Trimmed transparent PNG files are 600 x 166 px
const ASPECT = 600 / 166;
const HEIGHTS = { sm: 22, md: 30, lg: 38 } as const;

export const ArmsLogo: React.FC<ArmsLogoProps> = ({
  className = '',
  variant = 'auto',
  size = 'md',
}) => {
  const h = HEIGHTS[size];
  const w = Math.round(h * ASPECT);
  const common = {
    width: w,
    height: h,
    alt: 'ARMS Archive Report Management System',
    draggable: false,
  } as const;

  return (
    <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
      {variant !== 'white' && (
        <img
          src={armsLogoLight}
          {...common}
          className={variant === 'auto' ? 'block dark:hidden' : 'block'}
        />
      )}
      {variant !== 'light' && (
        <img
          src={armsLogoDark}
          {...common}
          className={variant === 'auto' ? 'hidden dark:block' : 'block'}
        />
      )}
    </span>
  );
};
