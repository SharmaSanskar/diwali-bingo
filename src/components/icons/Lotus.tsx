import { useId } from 'react';

export function Lotus({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const petal = 'M32 12 C40 24 40 37 32 47 C24 37 24 24 32 12 Z';
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd1ea" />
          <stop offset="55%" stopColor="#ff4fa8" />
          <stop offset="100%" stopColor="#b3005f" />
        </linearGradient>
        <linearGradient id={`${id}-o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb3d9" />
          <stop offset="100%" stopColor="#8f0050" />
        </linearGradient>
      </defs>
      <g transform="rotate(-72 32 47)">
        <path d={petal} fill={`url(#${id}-o)`} opacity="0.85" />
      </g>
      <g transform="rotate(72 32 47)">
        <path d={petal} fill={`url(#${id}-o)`} opacity="0.85" />
      </g>
      <g transform="rotate(-38 32 47)">
        <path d={petal} fill={`url(#${id}-p)`} />
      </g>
      <g transform="rotate(38 32 47)">
        <path d={petal} fill={`url(#${id}-p)`} />
      </g>
      <path d={petal} fill={`url(#${id}-p)`} stroke="#ffd98a" strokeWidth="0.6" />
      <path d="M14 50 Q32 56 50 50" stroke="#f5b942" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M20 54 Q32 58 44 54" stroke="#2ec4b6" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
