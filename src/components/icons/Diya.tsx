import { useId } from 'react';

interface Props {
  className?: string;
  lit?: boolean;
  animated?: boolean;
  title?: string;
}

/** Clay diya (oil lamp) with an optional flickering flame. */
export function Diya({ className, lit = true, animated = true, title }: Props) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#ff9933" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ff9933" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="40%" stopColor="#ffcf3f" />
          <stop offset="100%" stopColor="#ff5e00" />
        </linearGradient>
        <linearGradient id={`${id}-bowl`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a2b" />
          <stop offset="100%" stopColor="#a8320b" />
        </linearGradient>
      </defs>
      {lit && (
        <>
          <circle cx="32" cy="22" r="20" fill={`url(#${id}-glow)`} className={animated ? 'flame-glow' : undefined} />
          <g className={animated ? 'flame' : undefined}>
            <path
              d="M32 5 C38 15 41 22 37 28.5 C35 31.5 29 31.5 27 28.5 C23 22 26 15 32 5 Z"
              fill={`url(#${id}-flame)`}
            />
            <ellipse cx="32" cy="25.5" rx="2.6" ry="4.2" fill="#fffbe6" opacity="0.9" />
          </g>
        </>
      )}
      <rect x="31" y="29" width="2" height="4" rx="1" fill="#3b1a0a" />
      <path d="M6 33 C9 45 18 51 32 51 C46 51 55 45 58 33 Z" fill={`url(#${id}-bowl)`} />
      <ellipse cx="32" cy="33" rx="26" ry="4.2" fill="#ffcf6b" />
      <ellipse cx="32" cy="33" rx="22" ry="2.6" fill="#7a2408" opacity="0.55" />
      <path d="M58 33 C61 32 63 30 63.5 28 C61 29.5 59.5 30.5 57 31 Z" fill="#ffcf6b" />
      <g fill="#ffe3a3" opacity="0.9">
        <circle cx="18" cy="41" r="1.4" />
        <circle cx="25" cy="44" r="1.4" />
        <circle cx="32" cy="45" r="1.6" />
        <circle cx="39" cy="44" r="1.4" />
        <circle cx="46" cy="41" r="1.4" />
      </g>
      <ellipse cx="32" cy="54" rx="11" ry="2.4" fill="#7a2408" opacity="0.7" />
    </svg>
  );
}
