import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CENTER_INDEX,
  buildCard,
  deriveGameState,
  diffGameState,
  initialMarks,
  isMarked,
  seedMemory,
  setMark,
  toggleMark,
  type AnnounceMemory,
  type GameEvent,
  type Marks,
} from '../lib/board';
import type { BoardConfig } from '../lib/share';
import { loadMarks, loadMemory, saveMarks, saveMemory } from '../lib/storage';

export interface ToggleResult {
  index: number;
  marked: boolean;
  events: GameEvent[];
}

/** The card a given player sees. Deterministic, so we can rebuild a friend's layout too. */
export function cardFor(config: BoardConfig, roomCode: string, playerId: string): string[] {
  const perPlayer = config.shufflePerPlayer === true;
  return buildCard(config.items, perPlayer ? `${roomCode}:${playerId}` : roomCode, {
    freeCenter: config.freeCenter,
    keepOrder: config.keepOrder && !perPlayer,
    freeText: config.freeText,
  });
}

export function useGame(roomCode: string, config: BoardConfig, playerId: string) {
  const card = useMemo(() => cardFor(config, roomCode, playerId), [config, roomCode, playerId]);

  const [marks, setMarks] = useState<Marks>(() => {
    let m = loadMarks(roomCode, playerId) ?? initialMarks(config.freeCenter);
    if (config.freeCenter) m = setMark(m, CENTER_INDEX, true);
    return m;
  });
  const marksRef = useRef(marks);
  const memoryRef = useRef<AnnounceMemory | null>(null);
  if (memoryRef.current === null) {
    memoryRef.current = loadMemory(roomCode, playerId) ?? seedMemory(marks);
  }

  const state = useMemo(() => deriveGameState(marks), [marks]);

  const toggle = useCallback(
    (index: number): ToggleResult | null => {
      if (config.freeCenter && index === CENTER_INDEX) return null;
      const prev = marksRef.current;
      const next = toggleMark(prev, index);
      const { events, memory } = diffGameState(prev, next, memoryRef.current ?? seedMemory(prev), Date.now());
      marksRef.current = next;
      memoryRef.current = memory;
      saveMarks(roomCode, playerId, next);
      saveMemory(roomCode, playerId, memory);
      setMarks(next);
      return { index, marked: isMarked(next, index), events };
    },
    [config.freeCenter, roomCode, playerId],
  );

  return { card, marks, state, toggle };
}
