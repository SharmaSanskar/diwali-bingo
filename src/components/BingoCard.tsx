import { useMemo } from 'react';
import { CENTER_INDEX, isMarked, type GameState, type Marks } from '../lib/board';
import { Square } from './Square';

interface Props {
  title: string;
  card: string[];
  marks: Marks;
  state: GameState;
  freeCenter: boolean;
  lastStamp: { index: number; nonce: number } | null;
  highlight: { marks: Marks; color: string } | null;
  onToggle: (index: number) => void;
}

export function BingoCard({ title, card, marks, state, freeCenter, lastStamp, highlight, onToggle }: Props) {
  const { lineCells, nearCells, missing } = useMemo(() => {
    const lineCells = new Set<number>();
    for (const l of state.completed) l.cells.forEach((c) => lineCells.add(c));
    const nearCells = new Set<number>();
    const missing = new Set<number>();
    for (const o of state.oneAway) {
      o.line.cells.forEach((c) => nearCells.add(c));
      missing.add(o.missingIndex);
    }
    if (state.fullOneAway) {
      for (let i = 0; i < 25; i++) if (!isMarked(marks, i)) missing.add(i);
    }
    return { lineCells, nearCells, missing };
  }, [state, marks]);

  const rows = [0, 1, 2, 3, 4];

  return (
    <div
      className="card-frame relative mx-auto pb-1 pr-1"
      style={{ width: 'min(100%, max(20rem, calc(100dvh - 15rem)), 42rem)' }}
    >
      <div
        role="grid"
        aria-label={`${title} bingo card. ${state.count} of 25 squares crossed off.`}
        className="@container grid gap-[7px] sm:gap-3"
      >
        {rows.map((r) => (
          <div role="row" key={r} className="grid grid-cols-5 gap-[7px] sm:gap-3">
            {rows.map((c) => {
              const i = r * 5 + c;
              const isFree = freeCenter && i === CENTER_INDEX;
              return (
                <Square
                  key={i}
                  index={i}
                  text={card[i] ?? ''}
                  marked={isMarked(marks, i)}
                  isFree={isFree}
                  inLine={lineCells.has(i)}
                  nearLine={nearCells.has(i)}
                  isMissing={missing.has(i)}
                  highlightColor={highlight && isMarked(highlight.marks, i) ? highlight.color : null}
                  stampKey={lastStamp && lastStamp.index === i ? lastStamp.nonce : null}
                  onToggle={onToggle}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
