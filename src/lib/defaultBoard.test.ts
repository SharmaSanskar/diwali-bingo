import { describe, expect, it } from 'vitest';
import { defaultBoard, partyFreeText } from '../config/content';
import { CENTER_INDEX, buildCard } from './board';
import { decodeConfig, encodeConfig } from './share';

describe('default party board', () => {
  const card = buildCard(defaultBoard.items, 'ANYROOM', {
    freeCenter: defaultBoard.freeCenter,
    keepOrder: defaultBoard.keepOrder,
    freeText: defaultBoard.freeText,
  });

  it('matches the poster square for square, in every room', () => {
    expect(card).toHaveLength(25);
    expect(card[0]).toBe('Someone spills a drink');
    expect(card[4]).toBe('Uber surge announced');
    expect(card[CENTER_INDEX]).toBe(partyFreeText);
    expect(card[13]).toBe('Aux hijacked');
    expect(card[24]).toBe('“Do we have anymore snacks?”');
    expect(buildCard(defaultBoard.items, 'OTHER1', { ...defaultBoard })).toEqual(card);
  });

  it('round-trips the center text through the invite link', () => {
    expect(decodeConfig(encodeConfig(defaultBoard))).toEqual(defaultBoard);
  });
});
