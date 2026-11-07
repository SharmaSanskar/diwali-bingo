import { describe, expect, it } from 'vitest';
import { defaultBoard, partyFreeText, partyItems } from '../config/content';
import { cardFor } from '../hooks/useGame';
import { CENTER_INDEX, isMarked, setMark, translateMarks } from './board';
import { decodeConfig, encodeConfig } from './share';

describe('default party board', () => {
  const alice = cardFor(defaultBoard, 'ROOM42', 'alice-id');
  const bob = cardFor(defaultBoard, 'ROOM42', 'bob-id');

  it('gives every player all 24 poster squares plus the free center', () => {
    for (const card of [alice, bob]) {
      expect(card).toHaveLength(25);
      expect(card[CENTER_INDEX]).toBe(partyFreeText);
      expect([...card.slice(0, CENTER_INDEX), ...card.slice(CENTER_INDEX + 1)].sort()).toEqual([...partyItems].sort());
    }
  });

  it('shuffles per player, stably', () => {
    expect(alice).not.toEqual(bob);
    expect(cardFor(defaultBoard, 'ROOM42', 'alice-id')).toEqual(alice);
    expect(cardFor(defaultBoard, 'OTHER1', 'alice-id')).not.toEqual(alice);
  });

  it("maps a friend's marks onto my layout by square text", () => {
    const bobMarks = setMark(setMark(0, 0, true), 7, true);
    const onAlice = translateMarks(bobMarks, bob, alice);
    expect(isMarked(onAlice, alice.indexOf(bob[0]))).toBe(true);
    expect(isMarked(onAlice, alice.indexOf(bob[7]))).toBe(true);
    expect(onAlice.toString(2).replace(/0/g, '')).toHaveLength(2);
  });

  it('round-trips center text and per-player shuffle through the invite link', () => {
    expect(decodeConfig(encodeConfig(defaultBoard))).toEqual(defaultBoard);
  });
});
