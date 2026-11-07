import { memo } from 'react';
import { mulberry32 } from '../lib/board';
import { Marigold } from './icons/Marigold';
import { Sparkle } from './icons/Sparkle';

const rand = mulberry32(2026);
const STARS = Array.from({ length: 16 }, (_, i) => ({
  i,
  left: 6 + rand() * 90,
  top: rand() * 80,
  size: 6 + rand() * 10,
  dur: 2.4 + rand() * 3,
  delay: rand() * 4,
}));

/** Fixed poster backdrop: hot magenta, sunburst rays, yellow zigzag edge, marigolds, sparkles. */
export const Background = memo(function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 110% 70% at 50% 18%, #ef4196 0%, #d4197c 45%, #b5106a 80%, #970b57 100%)',
        }}
      />
      <div className="rays absolute inset-0" />
      {/* yellow zigzag down the left edge, like the poster */}
      <div
        className="absolute inset-y-0 left-0 w-[10px] sm:w-[16px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='18'%3E%3Cpolyline points='2,0 12,9 2,18' fill='none' stroke='%23ffe81a' stroke-width='3.5'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
        }}
      />
      {STARS.map((s) => (
        <Sparkle
          key={s.i}
          className="twinkle absolute text-gold"
          style={
            {
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              '--tw-dur': `${s.dur}s`,
              '--tw-delay': `${s.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
      <Marigold className="absolute -bottom-6 -left-6 h-20 w-20 opacity-90 sm:h-28 sm:w-28" />
      <Marigold className="absolute -bottom-2 left-10 h-12 w-12 opacity-90 sm:left-16 sm:h-16 sm:w-16" />
      <Marigold className="absolute -bottom-6 -right-6 h-20 w-20 opacity-90 sm:h-28 sm:w-28" />
      <Marigold className="absolute -bottom-2 right-10 h-12 w-12 opacity-90 sm:right-16 sm:h-16 sm:w-16" />
    </div>
  );
});
