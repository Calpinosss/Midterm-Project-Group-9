import React from 'react';

/**
 * PCL Tutor brand mark.
 *
 * The logo is intentionally inline SVG instead of a text character so the
 * shape stays crisp at every size. It also works in both light and dark mode
 * because the colors are taken from the same CSS design tokens as the app.
 */
function BrandMark() {
  return (
    <svg className="brand-logo" viewBox="0 0 48 48" role="img" aria-label="PCL Tutor logo">
      <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill="var(--brand-mark-bg)" stroke="var(--brand-mark-line)" />
      <path d="M15 35V13h9.7a8.1 8.1 0 1 1 0 16H15m0-11h9.3a3 3 0 1 1 0 6H15" fill="none" stroke="var(--brand-mark-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="34" cy="31.5" r="2.8" fill="var(--brand-mark-dot)" />
    </svg>
  );
}

export default function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="PCL Tutor">
      <span className="brand-mark" aria-hidden="true">
        <BrandMark />
      </span>
      {!compact && (
        <span className="brand-wordmark">
          <strong>PCL</strong> Tutor
        </span>
      )}
    </div>
  );
}