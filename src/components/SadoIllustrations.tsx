import React from 'react';

/**
 * Empty State - No Appeals yet
 */
export function NoAppealsIllustration() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="text-brand-accent opacity-55 mx-auto" aria-hidden="true">
      <rect x="35" y="25" width="70" height="90" rx="4" stroke="currentColor" strokeWidth="2" />
      <line x1="48" y1="45" x2="92" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="65" x2="80" y2="65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="48" y1="85" x2="70" y2="85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="95" cy="95" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M95 83A12 12 0 0 1 107 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M95 73A22 22 0 0 1 117 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Empty State - No Notifications
 */
export function NoNotificationsIllustration() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="text-brand-accent opacity-55 mx-auto" aria-hidden="true">
      <path d="M70 30C52 30 50 50 50 65V85H90V65C90 50 88 30 70 30Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 85H100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M62 95A8 8 0 0 0 78 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 40A35 35 0 0 1 95 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

/**
 * Empty State - No Search Results
 */
export function NoSearchResultsIllustration() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="text-brand-accent opacity-55 mx-auto" aria-hidden="true">
      <circle cx="65" cy="65" r="22" stroke="currentColor" strokeWidth="2" />
      <line x1="81" y1="81" x2="105" y2="105" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="110" x2="110" y2="110" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Empty State - No Neighborhood (Mahalla) Appeals
 */
export function NoMahallaAppealsIllustration() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="text-brand-accent opacity-55 mx-auto" aria-hidden="true">
      <path d="M30 75 L45 60 L60 75 V95 H30 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M62 55 L77 40 L92 55 V80 H62 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M85 80 L95 70 L105 80 V95 H85 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 95 H120" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * General Resolved / Success State Checkmark
 */
export function ResolvedSuccessIllustration() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" className="text-brand-accent opacity-55 mx-auto" aria-hidden="true">
      <circle cx="45" cy="95" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M45 65A30 30 0 0 1 75 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M45 45A50 50 0 0 1 95 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      <path d="M45 25A70 70 0 0 1 115 95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      <path d="M35 95 L42 102 L58 84" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Receipt Badge Illustration - A secure coupon seal badge
 */
export function ReceiptBadgeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className={`text-brand-accent ${className}`} aria-hidden="true">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-70" />
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 32 L30 38 L42 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
