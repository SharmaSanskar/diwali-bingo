import { useEffect, useRef } from 'react';
import { blackoutReward } from '../config/content';
import type { BannerItem } from '../hooks/useRoom';
import { Diya } from './icons/Diya';
import { Lotus } from './icons/Lotus';
import { Sparkle } from './icons/Sparkle';

/** Full-screen takeover for full-board completions. Queued in arrival order by the caller. */
export function FullBoardBanner({ banner, onDone }: { banner: BannerItem | null; onDone: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!banner) return undefined;
    buttonRef.current?.focus({ preventScroll: true });
    const t = window.setTimeout(onDone, 6500);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [banner, onDone]);

  if (!banner) return null;

  return (
    <div
      className="fade-in fixed inset-0 z-[150] grid place-items-center bg-ink/70 p-5 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="fullboard-title"
      onClick={onDone}
    >
      <div
        key={banner.id}
        className="banner-in relative w-full max-w-md overflow-hidden rounded-3xl border-[3px] border-gold p-6 text-center shadow-[6px_6px_0_var(--color-ink)] sm:p-8"
        style={{
          background:
            'repeating-conic-gradient(from 0deg at 50% 30%, rgb(255 255 255 / 0.08) 0deg 8deg, transparent 8deg 20deg), radial-gradient(circle at 50% 30%, #ef4196, #c2136f 60%, #8f0b52)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Sparkle className="twinkle absolute left-6 top-6 h-6 w-6 text-gold-soft" />
        <Sparkle className="twinkle absolute right-8 top-10 h-4 w-4 text-rani-soft" />
        <Sparkle className="twinkle absolute bottom-10 left-10 h-4 w-4 text-rani-soft" />
        <Sparkle className="twinkle absolute bottom-6 right-6 h-6 w-6 text-gold-soft" />
        <div className="relative mx-auto mb-2 h-28 w-28">
          <Lotus className="absolute inset-x-0 bottom-0 h-20 w-full opacity-90" />
          <Diya className="absolute inset-x-0 top-0 mx-auto h-20 w-20" />
        </div>
        <p className="text-5xl" aria-hidden="true">
          {banner.avatar}
        </p>
        <h2 id="fullboard-title" className="mt-2 font-display text-3xl leading-tight text-gold-gradient sm:text-4xl">
          {banner.self ? 'You' : banner.name} got a BLACKOUT!
        </h2>
        <p className="mt-2 text-2xl" aria-hidden="true">
          🏆🎆🪔
        </p>
        <p className="mx-auto mt-3 max-w-xs rounded-2xl border-2 border-ink bg-gold px-3 py-2 font-display text-base font-extrabold leading-snug text-berry shadow-[3px_3px_0_var(--color-ink)]">
          {blackoutReward}
        </p>
        <p className="mt-3 text-sm text-cream/90">
          {banner.self ? 'Shubh Deepavali! The whole room just saw that.' : 'Light a diya for them! The game keeps going.'}
        </p>
        <button ref={buttonRef} type="button" onClick={onDone} className="btn-primary mt-6 px-6 py-2.5">
          Keep playing
        </button>
      </div>
    </div>
  );
}
