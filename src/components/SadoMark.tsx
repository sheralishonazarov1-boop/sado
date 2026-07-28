import React from 'react';

interface SadoMarkProps {
  size?: number;
  className?: string;
}

export default function SadoMark({ size = 32, className = "" }: SadoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="23" r="3.2" fill="currentColor" />
      <path
        d="M9 15.5A7.5 7.5 0 0 1 16.5 23"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="1"
      />
      <path
        d="M9 9.5A13.5 13.5 0 0 1 22.5 23"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.72"
      />
      <path
        d="M9 3.5A19.5 19.5 0 0 1 28.5 23"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
