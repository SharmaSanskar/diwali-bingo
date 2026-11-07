import { describe, expect, it } from 'vitest';
import {
  buildRoomPath,
  decodeConfig,
  encodeConfig,
  genRoomCode,
  isValidRoomCode,
  parseJoinInput,
  parseLocation,
  type BoardConfig,
} from './share';

const config: BoardConfig = {
  title: 'Festive Bingo ✨',
  items: Array.from({ length: 30 }, (_, i) => `Someone says 'item ${i}' 🪔`),
  freeCenter: true,
  keepOrder: false,
  hideItemText: true,
};

describe('config encoding', () => {
  it('roundtrips', () => {
    expect(decodeConfig(encodeConfig(config))).toEqual(config);
  });

  it('roundtrips other option combos', () => {
    const c = { ...config, freeCenter: false, keepOrder: true, hideItemText: false };
    expect(decodeConfig(encodeConfig(c))).toEqual(c);
  });

  it('rejects garbage', () => {
    expect(decodeConfig('not-a-real-config')).toBeNull();
    expect(decodeConfig('')).toBeNull();
  });
});

describe('urls', () => {
  it('parses a room path with config', () => {
    const path = buildRoomPath('ABC123', config);
    const [pathname, hash] = path.split('#');
    const parsed = parseLocation(pathname, `#${hash}`);
    expect(parsed.roomCode).toBe('ABC123');
    expect(parsed.config).toEqual(config);
  });

  it('parses a code-only path', () => {
    expect(parseLocation('/abc123', '')).toEqual({ roomCode: 'ABC123', config: null });
    expect(parseLocation('/', '')).toEqual({ roomCode: null, config: null });
  });

  it('parses join input as link or code', () => {
    const url = `https://bingo.example.com${buildRoomPath('XYZ789', config)}`;
    const t = parseJoinInput(url);
    expect(t?.roomCode).toBe('XYZ789');
    expect(decodeConfig(t?.hash ?? '')).toEqual(config);
    expect(parseJoinInput(' xyz-789 ')).toEqual({ roomCode: 'XYZ789', hash: '' });
    expect(parseJoinInput('!!')).toBeNull();
  });

  it('generates valid room codes', () => {
    for (let i = 0; i < 20; i++) expect(isValidRoomCode(genRoomCode())).toBe(true);
  });
});
