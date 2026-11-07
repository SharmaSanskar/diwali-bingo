import { describe, expect, it } from 'vitest';
import {
  CENTER_INDEX,
  FREE_SQUARE_TEXT,
  FULL_MASK,
  LINES,
  buildCard,
  completedLines,
  createMemory,
  diffGameState,
  initialMarks,
  isFullBoard,
  isFullBoardOneAway,
  markedCount,
  oneAwayLines,
  seedMemory,
  seededShuffle,
  setMark,
  toggleMark,
  type AnnounceMemory,
  type Marks,
} from './board';

const maskOf = (cells: readonly number[]): Marks => cells.reduce((m, c) => setMark(m, c, true), 0);
const items = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);
const T0 = 1_000_000;

describe('lines', () => {
  it('has 12 unique lines of 5 cells', () => {
    expect(LINES).toHaveLength(12);
    expect(new Set(LINES.map((l) => l.id)).size).toBe(12);
    for (const l of LINES) expect(l.cells).toHaveLength(5);
  });

  it.each(LINES.map((l) => [l.label, l] as const))('detects %s', (_label, line) => {
    const done = completedLines(maskOf(line.cells));
    expect(done.map((l) => l.id)).toEqual([line.id]);
  });

  it('labels rows, columns and diagonals', () => {
    expect(LINES.map((l) => l.label)).toEqual([
      'Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5',
      'Column A', 'Column B', 'Column C', 'Column D', 'Column E',
      'Diagonal ↘', 'Diagonal ↗',
    ]);
  });

  it('detects nothing on an empty board', () => {
    expect(completedLines(0)).toEqual([]);
    expect(oneAwayLines(0)).toEqual([]);
  });
});

describe('one away', () => {
  it('finds the missing square of a 4/5 row', () => {
    const m = maskOf([5, 6, 8, 9]);
    const oa = oneAwayLines(m);
    expect(oa).toHaveLength(1);
    expect(oa[0].line.id).toBe('row-1');
    expect(oa[0].missingIndex).toBe(7);
  });

  it('finds one-away on the anti-diagonal', () => {
    const oa = oneAwayLines(maskOf([20, 16, 8, 4]));
    expect(oa.map((o) => [o.line.id, o.missingIndex])).toEqual([['diag-up', 12]]);
  });
});

describe('full board', () => {
  it('detects 25/25 and 24/25', () => {
    expect(isFullBoard(FULL_MASK)).toBe(true);
    expect(markedCount(FULL_MASK)).toBe(25);
    const almost = toggleMark(FULL_MASK, 3);
    expect(isFullBoard(almost)).toBe(false);
    expect(isFullBoardOneAway(almost)).toBe(true);
    expect(markedCount(almost)).toBe(24);
    expect(isFullBoardOneAway(FULL_MASK)).toBe(false);
  });

  it('free center starts marked', () => {
    expect(markedCount(initialMarks(true))).toBe(1);
    expect(initialMarks(false)).toBe(0);
  });
});

describe('seeded shuffle and card', () => {
  it('is deterministic for the same room code', () => {
    expect(seededShuffle(items, 'ABC123')).toEqual(seededShuffle(items, 'ABC123'));
    expect(buildCard(items, 'ABC123', { freeCenter: true, keepOrder: false })).toEqual(
      buildCard(items, 'abc123', { freeCenter: true, keepOrder: false }),
    );
  });

  it('differs for different room codes', () => {
    expect(seededShuffle(items, 'ABC123')).not.toEqual(seededShuffle(items, 'XYZ789'));
  });

  it('is a permutation', () => {
    expect([...seededShuffle(items, 'ROOM')].sort()).toEqual([...items].sort());
  });

  it('places FREE in the center with 25 squares', () => {
    const card = buildCard(items, 'ROOM', { freeCenter: true, keepOrder: false });
    expect(card).toHaveLength(25);
    expect(card[CENTER_INDEX]).toBe(FREE_SQUARE_TEXT);
    expect(new Set(card).size).toBe(25);
  });

  it('keeps item order when asked', () => {
    const card = buildCard(items, 'ROOM', { freeCenter: false, keepOrder: true });
    expect(card).toEqual(items.slice(0, 25));
  });
});

describe('diffGameState', () => {
  const step = (prev: Marks, index: number, mem: AnnounceMemory, now = T0) => {
    const next = toggleMark(prev, index);
    return { next, ...diffGameState(prev, next, mem, now) };
  };

  it('emits a mark event for a new mark', () => {
    const r = step(0, 3, createMemory());
    expect(r.events).toEqual([{ type: 'mark', squareIndex: 3 }]);
  });

  it('emits nothing on un-mark', () => {
    const r = diffGameState(maskOf([1, 2]), maskOf([1]), createMemory(), T0);
    expect(r.events).toEqual([]);
  });

  it('emits line_complete once and not again after un-mark/re-mark', () => {
    let mem = createMemory();
    let m = maskOf([0, 1, 2, 3]);
    let r = step(m, 4, mem);
    expect(r.events).toContainEqual({ type: 'line_complete', lineId: 'row-0', lineLabel: 'Row 1' });
    mem = r.memory;
    m = r.next;
    r = step(m, 4, mem); // un-mark
    expect(r.events).toEqual([]);
    mem = r.memory;
    m = r.next;
    r = step(m, 4, mem, T0 + 60_000); // re-mark
    expect(r.events.filter((e) => e.type === 'line_complete')).toEqual([]);
    expect(r.events.filter((e) => e.type === 'one_away')).toEqual([]);
  });

  it('emits one_away with the missing square', () => {
    const r = step(maskOf([10, 11, 12]), 13, createMemory());
    expect(r.events).toContainEqual({
      type: 'one_away',
      lineId: 'row-2',
      lineLabel: 'Row 3',
      missingIndex: 14,
      fullBoard: false,
    });
  });

  it('rate-limits one_away to one per 5s and announces the skipped line later', () => {
    let r = step(maskOf([0, 1, 2]), 3, createMemory(), T0); // row-0 one away
    expect(r.events.filter((e) => e.type === 'one_away')).toHaveLength(1);
    const mem = r.memory;
    // make column D one away within the cooldown (3 is marked; add 8, 13, then 18 -> missing 23)
    let m = setMark(setMark(r.next, 8, true), 13, true);
    r = step(m, 18, mem, T0 + 1000);
    expect(r.events.filter((e) => e.type === 'one_away')).toEqual([]);
    // after cooldown, the next mark announces a pending line
    m = r.next;
    r = step(m, 20, r.memory, T0 + 6000);
    const oa = r.events.filter((e) => e.type === 'one_away');
    expect(oa).toHaveLength(1);
    expect(oa[0]).toMatchObject({ lineId: 'col-3', missingIndex: 23 });
  });

  it('does not re-announce the same one-away line', () => {
    let r = step(maskOf([0, 1, 2]), 3, createMemory(), T0);
    r = step(r.next, 3, r.memory, T0 + 10_000); // un-mark
    r = step(r.next, 3, r.memory, T0 + 20_000); // re-mark
    expect(r.events.filter((e) => e.type === 'one_away')).toEqual([]);
  });

  it('emits the full-board one-away at 24/25 and full_board at 25/25, once each', () => {
    const almost = toggleMark(toggleMark(FULL_MASK, 7), 8); // 23 marked
    let mem = seedMemory(almost);
    let r = step(almost, 7, mem, T0);
    expect(r.events).toContainEqual({
      type: 'one_away',
      lineId: null,
      lineLabel: 'Full board',
      missingIndex: 8,
      fullBoard: true,
    });
    mem = r.memory;
    r = step(r.next, 8, mem, T0 + 100);
    expect(r.events.filter((e) => e.type === 'full_board')).toHaveLength(1);
    // un-mark and re-mark: no repeats
    r = step(r.next, 8, r.memory, T0 + 200);
    r = step(r.next, 8, r.memory, T0 + 10_000);
    expect(r.events.filter((e) => e.type === 'full_board' || e.type === 'one_away')).toEqual([]);
  });
});
