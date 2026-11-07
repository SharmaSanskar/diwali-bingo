import { memo } from 'react';
import { Diya } from './icons/Diya';
import { Starburst } from './icons/Starburst';

interface Props {
  index: number;
  text: string;
  marked: boolean;
  isFree: boolean;
  inLine: boolean;
  nearLine: boolean;
  isMissing: boolean;
  /** color of another player whose marks are being viewed, if they marked this square */
  highlightColor: string | null;
  /** changes each time this square is freshly stamped, to replay the animation */
  stampKey: number | null;
  onToggle: (index: number) => void;
}

function lengthClass(text: string): string {
  const n = text.length;
  if (n <= 14) return 'len-s';
  if (n <= 24) return 'len-m';
  if (n <= 34) return 'len-l';
  return 'len-xl';
}

export const Square = memo(function Square({
  index,
  text,
  marked,
  isFree,
  inLine,
  nearLine,
  isMissing,
  highlightColor,
  stampKey,
  onToggle,
}: Props) {
  const row = Math.floor(index / 5);
  const col = index % 5;
  const rot = stampKey === null ? 0 : (((stampKey * 7) % 13) - 6) * 1.5;
  const classes = [
    'tile flex h-full w-full flex-col items-center justify-center rounded-[10px] p-[3px] text-center sm:rounded-2xl sm:p-2',
    isFree ? 'tile-free' : '',
    inLine ? 'in-line' : '',
    nearLine && !inLine ? 'near-line' : '',
    isMissing ? 'missing-square' : '',
    // alternating animation names restarts the animation without remounting (keeps focus)
    stampKey !== null ? (stampKey % 2 ? 'anim-stamp-a' : 'anim-stamp-b') : '',
  ].join(' ');

  const label = isFree
    ? `Free square: ${text}. Always marked`
    : `${text}${marked ? ', crossed off' : ''}${isMissing ? ', the one square you need' : ''}`;

  return (
    <div role="gridcell" className="aspect-square min-h-11 min-w-11">
      <button
        type="button"
        className={classes}
        aria-pressed={marked}
        aria-label={label}
        aria-disabled={isFree || undefined}
        onClick={() => onToggle(index)}
        style={
          {
            '--rot': `${rot}deg`,
            '--sweep-delay': `${(row + col) * 0.09}s`,
          } as React.CSSProperties
        }
      >
        {isFree ? (
          <span className="relative flex h-full w-full items-center justify-center">
            <Starburst className="absolute -inset-[6%] h-[112%] w-[112%] drop-shadow-[2px_2px_0_var(--color-ink)]" />
            <span className="free-text relative z-10 max-w-[64%] px-0.5">{text}</span>
          </span>
        ) : (
          <>
            <span className={`tile-text ${lengthClass(text)} relative z-10`}>{text}</span>
            {marked && <span className="strike" aria-hidden="true" />}
            {marked && (
              <span
                key={stampKey ?? 'static'}
                className={`${stampKey !== null ? 'stamp-mark' : ''} pointer-events-none absolute -bottom-0.5 -right-0.5 z-0 h-[34%] w-[34%] opacity-90`}
                style={{ transform: `rotate(${rot}deg)` }}
              >
                <Diya className="h-full w-full drop-shadow-[1px_1px_0_rgba(42,7,22,0.8)]" animated={false} />
              </span>
            )}
          </>
        )}
        {highlightColor && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{ boxShadow: `inset 0 0 0 3px ${highlightColor}`, background: `${highlightColor}22` }}
          />
        )}
        {stampKey !== null && <span key={stampKey} className="ripple" aria-hidden="true" />}
      </button>
    </div>
  );
});
