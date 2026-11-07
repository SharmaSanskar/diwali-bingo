import type { PlayerView } from '../hooks/useRoom';

interface Props {
  players: PlayerView[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** Who's here. Stable join order, never ranked. */
export function PlayersStrip({ players, selectedId, onSelect }: Props) {
  return (
    <section aria-label="Players in this room" className="mx-auto w-full max-w-6xl pl-4 pr-3 sm:px-6">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto py-2">
        {players.map((p) => {
          const selected = selectedId === p.playerId;
          return (
            <li key={p.playerId} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(selected ? null : p.playerId)}
                aria-pressed={selected}
                aria-label={`${p.isMe ? 'You' : p.name}${p.online ? '' : ' (away)'}: ${p.markedCount} of 25 crossed off${
                  p.completedLineCount ? `, ${p.completedLineCount} lines` : ''
                }${p.oneAway ? ', one away' : ''}${p.fullBoard ? ', full board' : ''}. ${
                  selected ? 'Hide' : 'Show'
                } their squares.`}
                className={`flex min-h-11 items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 transition ${
                  selected ? 'border-ink bg-gold text-berry shadow-[2px_2px_0_var(--color-ink)]' : 'border-gold/60 bg-night/70 hover:bg-night'
                } ${p.online ? '' : 'border-dashed opacity-60'}`}
              >
                <span
                  className="relative grid h-8 w-8 place-items-center rounded-full text-lg"
                  style={{ background: `${p.color}33`, boxShadow: `0 0 0 2px ${p.color}` }}
                  aria-hidden="true"
                >
                  {p.avatarEmoji}
                  {p.fullBoard ? (
                    <span className="absolute -right-1 -top-1 text-xs">🏆</span>
                  ) : p.oneAway ? (
                    <span className="absolute -right-1 -top-1 text-xs">🔥</span>
                  ) : null}
                </span>
                <span className="max-w-[6.5rem] truncate text-sm font-medium" aria-hidden="true">
                  {p.isMe ? `${p.name} (you)` : p.name}
                </span>
                {!p.online && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80" aria-hidden="true">
                    away
                  </span>
                )}
                <span
                  className="rounded-full bg-ink/40 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gold"
                  aria-hidden="true"
                >
                  {p.markedCount}/25
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
