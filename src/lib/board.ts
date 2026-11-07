// Pure game logic. Marks are stored as a 25-bit bitmask (bit i = square i).

export const GRID_SIZE = 5;
export const CELL_COUNT = 25;
export const CENTER_INDEX = 12;
export const FULL_MASK = 0x1ffffff;
export const FREE_SQUARE_TEXT = 'FREE';
export const ONE_AWAY_COOLDOWN_MS = 5000;

export type Marks = number;

export interface LineDef {
  id: string;
  label: string;
  cells: readonly number[];
}

const COLUMN_LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

function buildLines(): LineDef[] {
  const lines: LineDef[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    lines.push({
      id: `row-${r}`,
      label: `Row ${r + 1}`,
      cells: Array.from({ length: GRID_SIZE }, (_, c) => r * GRID_SIZE + c),
    });
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    lines.push({
      id: `col-${c}`,
      label: `Column ${COLUMN_LETTERS[c]}`,
      cells: Array.from({ length: GRID_SIZE }, (_, r) => r * GRID_SIZE + c),
    });
  }
  lines.push({ id: 'diag-down', label: 'Diagonal ↘', cells: [0, 6, 12, 18, 24] });
  lines.push({ id: 'diag-up', label: 'Diagonal ↗', cells: [20, 16, 12, 8, 4] });
  return lines;
}

export const LINES: readonly LineDef[] = buildLines();

export function getLine(id: string): LineDef | undefined {
  return LINES.find((l) => l.id === id);
}

// ---------- marks ----------

export function isMarked(marks: Marks, index: number): boolean {
  return ((marks >>> index) & 1) === 1;
}

export function setMark(marks: Marks, index: number, on: boolean): Marks {
  const bit = 1 << index;
  return (on ? marks | bit : marks & ~bit) >>> 0;
}

export function toggleMark(marks: Marks, index: number): Marks {
  return setMark(marks, index, !isMarked(marks, index));
}

export function markedCount(marks: Marks): number {
  let x = marks & FULL_MASK;
  let n = 0;
  while (x) {
    x &= x - 1;
    n++;
  }
  return n;
}

export function completedLines(marks: Marks): LineDef[] {
  return LINES.filter((l) => l.cells.every((c) => isMarked(marks, c)));
}

export interface OneAwayLine {
  line: LineDef;
  missingIndex: number;
}

export function oneAwayLines(marks: Marks): OneAwayLine[] {
  const out: OneAwayLine[] = [];
  for (const line of LINES) {
    const missing = line.cells.filter((c) => !isMarked(marks, c));
    if (missing.length === 1) out.push({ line, missingIndex: missing[0] });
  }
  return out;
}

export function isFullBoard(marks: Marks): boolean {
  return (marks & FULL_MASK) === FULL_MASK;
}

export function isFullBoardOneAway(marks: Marks): boolean {
  return markedCount(marks) === CELL_COUNT - 1;
}

export function unmarkedSquares(marks: Marks): number[] {
  const out: number[] = [];
  for (let i = 0; i < CELL_COUNT; i++) if (!isMarked(marks, i)) out.push(i);
  return out;
}

export function initialMarks(freeCenter: boolean): Marks {
  return freeCenter ? setMark(0, CENTER_INDEX, true) : 0;
}

export interface GameState {
  count: number;
  completed: LineDef[];
  oneAway: OneAwayLine[];
  full: boolean;
  fullOneAway: boolean;
}

export function deriveGameState(marks: Marks): GameState {
  return {
    count: markedCount(marks),
    completed: completedLines(marks),
    oneAway: oneAwayLines(marks),
    full: isFullBoard(marks),
    fullOneAway: isFullBoardOneAway(marks),
  };
}

// ---------- seeded shuffle ----------

/** Small, fast 32-bit string hash (cyrb53-style mixing). */
export function hashString(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const rand = mulberry32(hashString(seed));
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface CardOptions {
  freeCenter: boolean;
  keepOrder: boolean;
  freeText?: string;
}

export function requiredItemCount(freeCenter: boolean): number {
  return freeCenter ? CELL_COUNT - 1 : CELL_COUNT;
}

export function cleanItems(items: readonly string[]): string[] {
  return items.map((s) => s.trim()).filter((s) => s.length > 0);
}

/** Build the shared 25-square card. Identical for everyone with the same room code. */
export function buildCard(items: readonly string[], roomCode: string, opts: CardOptions): string[] {
  const clean = cleanItems(items);
  const need = requiredItemCount(opts.freeCenter);
  const pool = opts.keepOrder ? clean : seededShuffle(clean, roomCode.toUpperCase());
  const picked = pool.slice(0, need);
  while (picked.length < need) picked.push('—');
  if (opts.freeCenter) picked.splice(CENTER_INDEX, 0, opts.freeText?.trim() || FREE_SQUARE_TEXT);
  return picked;
}

// ---------- event diffing ----------

/** What has already been announced for this player (persisted so refreshes don't re-announce). */
export interface AnnounceMemory {
  lines: string[];
  oneAwayLines: string[];
  fullBoardOneAway: boolean;
  fullBoard: boolean;
  lastOneAwayAt: number;
}

export function createMemory(): AnnounceMemory {
  return { lines: [], oneAwayLines: [], fullBoardOneAway: false, fullBoard: false, lastOneAwayAt: 0 };
}

/** Memory that treats everything currently true as already announced. */
export function seedMemory(marks: Marks): AnnounceMemory {
  return {
    lines: completedLines(marks).map((l) => l.id),
    oneAwayLines: oneAwayLines(marks).map((o) => o.line.id),
    fullBoardOneAway: markedCount(marks) >= CELL_COUNT - 1,
    fullBoard: isFullBoard(marks),
    lastOneAwayAt: 0,
  };
}

export type GameEvent =
  | { type: 'mark'; squareIndex: number }
  | { type: 'line_complete'; lineId: string; lineLabel: string }
  | {
      type: 'one_away';
      lineId: string | null;
      lineLabel: string;
      missingIndex: number | null;
      fullBoard: boolean;
    }
  | { type: 'full_board' };

export interface DiffResult {
  events: GameEvent[];
  memory: AnnounceMemory;
}

/**
 * Decide which events to emit for a change from `prev` to `next`.
 * - every newly marked square -> `mark`
 * - lines complete for the first time ever -> `line_complete` (re-completion is silent)
 * - first full board -> `full_board`
 * - 24/25 for the first time -> `one_away` (fullBoard variant)
 * - otherwise at most one new one-away line per cooldown window -> `one_away`
 * Un-marking never emits anything.
 */
export function diffGameState(
  prev: Marks,
  next: Marks,
  memory: AnnounceMemory,
  now: number,
): DiffResult {
  const events: GameEvent[] = [];
  const mem: AnnounceMemory = {
    ...memory,
    lines: [...memory.lines],
    oneAwayLines: [...memory.oneAwayLines],
  };
  const prevM = prev & FULL_MASK;
  const nextM = next & FULL_MASK;
  const added = nextM & ~prevM;

  for (let i = 0; i < CELL_COUNT; i++) {
    if (isMarked(added, i)) events.push({ type: 'mark', squareIndex: i });
  }
  if (added === 0) return { events, memory: mem };

  const prevDone = new Set(completedLines(prevM).map((l) => l.id));
  for (const line of completedLines(nextM)) {
    if (prevDone.has(line.id) || mem.lines.includes(line.id)) continue;
    events.push({ type: 'line_complete', lineId: line.id, lineLabel: line.label });
    mem.lines.push(line.id);
  }

  const full = isFullBoard(nextM);
  if (full && !mem.fullBoard) {
    events.push({ type: 'full_board' });
    mem.fullBoard = true;
  }

  if (!full) {
    if (markedCount(nextM) === CELL_COUNT - 1 && !mem.fullBoardOneAway) {
      events.push({
        type: 'one_away',
        lineId: null,
        lineLabel: 'Full board',
        missingIndex: unmarkedSquares(nextM)[0] ?? null,
        fullBoard: true,
      });
      mem.fullBoardOneAway = true;
      mem.lastOneAwayAt = now;
    } else if (now - mem.lastOneAwayAt >= ONE_AWAY_COOLDOWN_MS) {
      const candidate = oneAwayLines(nextM).find(
        (o) => !mem.oneAwayLines.includes(o.line.id) && !mem.lines.includes(o.line.id),
      );
      if (candidate) {
        events.push({
          type: 'one_away',
          lineId: candidate.line.id,
          lineLabel: candidate.line.label,
          missingIndex: candidate.missingIndex,
          fullBoard: false,
        });
        mem.oneAwayLines.push(candidate.line.id);
        mem.lastOneAwayAt = now;
      }
    }
  }

  return { events, memory: mem };
}
