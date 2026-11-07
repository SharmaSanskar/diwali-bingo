import type { Toast, ToastKind } from '../hooks/useRoom';

const STYLE: Record<ToastKind, string> = {
  line: 'border-ink bg-gold text-berry',
  one_away: 'border-ink bg-marigold text-ink',
  full_board: 'border-gold bg-night text-gold',
  info: 'border-gold bg-night/95 text-cream',
};

const ICON: Record<ToastKind, string> = { line: '🎆', one_away: '🔥', full_board: '🏆', info: '✨' };

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    // The activity feed is the live region; toasts are visual only to avoid double announcements.
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-40 flex flex-col items-center gap-2 px-4"
      aria-hidden="true"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          tabIndex={-1}
          onClick={() => onDismiss(t.id)}
          className={`toast-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-display text-[15px] font-bold leading-snug shadow-[3px_3px_0_var(--color-ink)] ${STYLE[t.kind]}`}
        >
          <span className="text-xl">{t.avatar ?? ICON[t.kind]}</span>
          <span className="flex-1">{t.text}</span>
        </button>
      ))}
    </div>
  );
}
