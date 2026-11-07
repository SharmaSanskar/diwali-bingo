import { houseRules } from '../config/content';
import { Diya } from './icons/Diya';
import { Sparkle } from './icons/Sparkle';

/** The poster's house rules: what lines and blackouts win. */
export function RulesBox({ className = '' }: { className?: string }) {
  return (
    <section aria-labelledby="rules-title" className={`rules-box relative w-full px-4 py-3 sm:px-5 sm:py-4 ${className}`}>
      <h2 id="rules-title" className="sr-only">
        House rules
      </h2>
      <div className="flex items-center gap-3">
        <div className="hidden shrink-0 flex-col items-center min-[400px]:flex" aria-hidden="true">
          <Sparkle className="h-5 w-5 text-gold" />
          <Diya className="h-9 w-9" />
          <Sparkle className="h-3.5 w-3.5 text-gold" />
        </div>
        <ul className="flex-1 list-disc space-y-1 pl-5 font-display text-[15px] font-bold leading-snug text-gold marker:text-gold sm:text-base">
          {houseRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
