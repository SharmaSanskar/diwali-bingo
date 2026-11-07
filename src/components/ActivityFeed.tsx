import type { FeedEntry, FeedKind } from '../hooks/useRoom';

const STYLE: Record<FeedKind, { icon: string; row: string; text: string }> = {
  mark: { icon: '🪔', row: 'border-transparent bg-white/[0.06]', text: 'text-cream/90 text-[13px]' },
  line: {
    icon: '🎆',
    row: 'border-gold bg-gold/20',
    text: 'text-gold font-semibold text-sm',
  },
  one_away: {
    icon: '🔥',
    row: 'border-marigold bg-marigold/20',
    text: 'text-[#ffd9a8] font-medium text-sm',
  },
  full_board: {
    icon: '🏆',
    row: 'border-gold bg-gold text-berry shadow-[2px_2px_0_var(--color-ink)]',
    text: 'text-berry font-bold text-sm',
  },
  join: { icon: '✨', row: 'border-cream/60 bg-white/10', text: 'text-cream text-[13px] font-medium' },
  system: { icon: '✨', row: 'border-white/20 bg-white/[0.06]', text: 'text-cream/80 text-[13px] italic' },
};

const KIND_LABEL: Record<FeedKind, string> = {
  mark: 'Cross-off',
  line: 'Line complete',
  one_away: 'One away',
  full_board: 'Full board',
  join: 'Joined',
  system: 'Info',
};

function time(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function FeedItem({ entry, compact = false }: { entry: FeedEntry; compact?: boolean }) {
  const s = STYLE[entry.kind];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border-l-[3px] px-3 py-2 ${compact ? '' : 'feed-in'} ${s.row}`}>
      <span className="mt-0.5 text-base leading-none" aria-hidden="true">
        {entry.kind === 'mark' || entry.kind === 'system' ? entry.avatar ?? s.icon : s.icon}
      </span>
      <p className={`min-w-0 flex-1 leading-snug ${s.text} ${compact ? 'truncate' : ''}`}>
        <span className="sr-only">{KIND_LABEL[entry.kind]}: </span>
        {entry.text}
      </p>
      {!compact && (
        <time className="shrink-0 pt-0.5 text-[10px] tabular-nums text-cream/70" dateTime={new Date(entry.ts).toISOString()}>
          {time(entry.ts)}
        </time>
      )}
    </div>
  );
}

interface Props {
  entries: FeedEntry[];
  className?: string;
  live?: boolean;
}

export function ActivityFeed({ entries, className = '', live = true }: Props) {
  return (
    <section className={`glass flex min-h-0 flex-col rounded-2xl ${className}`} aria-labelledby="feed-title">
      <div className="flex items-center gap-2 border-b-2 border-gold/40 px-4 py-3">
        <span className="live-dot h-2 w-2 rounded-full bg-teal" aria-hidden="true" />
        <h2 id="feed-title" className="font-display text-lg font-extrabold text-gold">
          Live activity
        </h2>
      </div>
      <ol
        className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3"
        aria-live={live ? 'polite' : 'off'}
        aria-relevant="additions"
      >
        {entries.map((e) => (
          <li key={e.id}>
            <FeedItem entry={e} />
          </li>
        ))}
      </ol>
    </section>
  );
}
