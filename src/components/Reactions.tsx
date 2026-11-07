import { reactionEmojis } from '../config/content';
import type { FloatingReaction } from '../hooks/useRoom';

const LABELS: Record<string, string> = {
  '🪔': 'diya',
  '🎆': 'fireworks',
  '😂': 'laughing',
  '🔥': 'fire',
  '👏': 'clapping',
};

export function ReactionsBar({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <div className="glass mx-auto flex w-fit items-center gap-1 rounded-full px-2 py-1.5" role="group" aria-label="Send a reaction">
      {reactionEmojis.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onReact(e)}
          className="grid h-11 w-11 place-items-center rounded-full text-2xl transition hover:scale-110 hover:bg-gold/20 active:scale-90"
          aria-label={`Send ${LABELS[e] ?? e} reaction`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function FloatingReactions({ reactions }: { reactions: FloatingReaction[] }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] h-full overflow-hidden" aria-hidden="true">
      {reactions.map((r) => (
        <div key={r.id} className="float-up absolute bottom-24 flex flex-col items-center" style={{ left: `${r.x}%` }}>
          <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,200,90,0.6)]">{r.emoji}</span>
          {r.name && (
            <span className="mt-0.5 rounded-full bg-ink/60 px-1.5 text-[10px] font-medium text-cream/90">{r.name}</span>
          )}
        </div>
      ))}
    </div>
  );
}
