import { Diya } from './icons/Diya';
import { Marigold } from './icons/Marigold';
import { Sparkle } from './icons/Sparkle';

/** "CHILCOTT दिवाली PARTY" headline from the poster. */
export function PosterTitle({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const big = size === 'lg';
  return (
    <div className={`relative mx-auto text-center ${big ? 'w-full max-w-sm pt-2' : 'w-full max-w-xs'}`} role="img" aria-label="Chilcott Diwali Party">
      {big && (
        <>
          <span className="absolute left-0 top-6 w-14 sm:w-16">
            <Diya className="h-14 w-14 sm:h-16 sm:w-16" />
            <Marigold className="-mt-3 ml-5 h-7 w-7" />
          </span>
          <span className="absolute right-0 top-6 w-14 sm:w-16">
            <Diya className="h-14 w-14 sm:h-16 sm:w-16" />
            <Marigold className="-mt-3 ml-1 h-7 w-7" />
          </span>
          <Sparkle className="twinkle absolute right-12 top-0 h-5 w-5 text-gold" />
        </>
      )}
      {/* sunburst behind the word */}
      <svg viewBox="0 0 100 100" className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${big ? 'h-48 w-48' : 'h-32 w-32'}`} aria-hidden="true">
        <polygon
          points={Array.from({ length: 24 }, (_, i) => {
            const r = i % 2 === 0 ? 50 : 22;
            const a = (Math.PI * i) / 12;
            return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
          }).join(' ')}
          fill="#ffb627"
          opacity="0.85"
        />
      </svg>
      <div className="relative" aria-hidden="true">
        <p
          className={`-rotate-6 font-comic leading-none tracking-wide text-gold ${big ? 'text-3xl' : 'text-lg'}`}
          style={{ textShadow: '2px 2px 0 var(--color-ink), 3px 3px 0 var(--color-ink)', marginRight: big ? '6rem' : '3.5rem' }}
        >
          CHILCOTT
        </p>
        <p
          className={`font-display font-extrabold leading-[0.95] text-gold ${big ? 'text-[5.25rem]' : 'text-5xl'}`}
          style={{
            textShadow: big
              ? '3px 3px 0 var(--color-ink), 5px 5px 0 var(--color-ink), 7px 7px 0 var(--color-ink)'
              : '2px 2px 0 var(--color-ink), 3px 3px 0 var(--color-ink)',
          }}
        >
          दिवाली
        </p>
        <p
          className={`-rotate-3 font-comic leading-none tracking-wide text-gold ${big ? '-mt-1 text-3xl' : 'text-lg'}`}
          style={{ textShadow: '2px 2px 0 var(--color-ink), 3px 3px 0 var(--color-ink)', marginLeft: big ? '7rem' : '4rem' }}
        >
          PARTY
        </p>
      </div>
    </div>
  );
}
