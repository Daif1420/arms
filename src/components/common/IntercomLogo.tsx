/**
 * ARMS - Intercom Logo Component
 * Uses the official logo files: dark-text logo on light backgrounds,
 * white-text logo on dark backgrounds (follows the app's dark mode).
 */

import React from 'react';
import logoLight from '../../assets/logo.png';
import logoDark from '../../assets/logo-dark.png';

interface IntercomLogoProps {
  className?: string;
  /** 'auto' follows dark mode; 'white' always uses the white-text logo (for dark surfaces). */
  variant?: 'auto' | 'white';
  size?: 'sm' | 'md' | 'lg';
}

// Logo files are 250 x 56 px
const ASPECT = 250 / 56;
const HEIGHTS = { sm: 20, md: 28, lg: 36 } as const;

export const IntercomLogo: React.FC<IntercomLogoProps> = ({
  className = '',
  variant = 'auto',
  size = 'md',
}) => {
  const h = HEIGHTS[size];
  const w = Math.round(h * ASPECT);
  const common = { width: w, height: h, alt: 'Intercom', draggable: false } as const;

  return (
    <span className={`inline-flex items-center select-none shrink-0 ${className}`}>
      {variant === 'auto' && <img src={logoLight} {...common} className="block dark:hidden" />}
      <img src={logoDark} {...common} className={variant === 'auto' ? 'hidden dark:block' : 'block'} />
    </span>
  );
};
