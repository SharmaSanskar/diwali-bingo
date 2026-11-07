import LZString from 'lz-string';

export interface BoardConfig {
  title: string;
  items: string[];
  freeCenter: boolean;
  keepOrder: boolean;
  hideItemText: boolean;
  /** Text for the free center square (defaults to FREE). */
  freeText?: string;
}

interface WireConfig {
  v: 1;
  t: string;
  i: string[];
  f: 0 | 1;
  k: 0 | 1;
  h: 0 | 1;
  c?: string;
}

const MAX_TITLE = 80;
const MAX_ITEM = 120;
const MAX_ITEMS = 100;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function encodeConfig(config: BoardConfig): string {
  const wire: WireConfig = {
    v: 1,
    t: config.title,
    i: config.items,
    f: config.freeCenter ? 1 : 0,
    k: config.keepOrder ? 1 : 0,
    h: config.hideItemText ? 1 : 0,
  };
  if (config.freeText && config.freeText.trim()) wire.c = config.freeText.trim();
  return LZString.compressToEncodedURIComponent(JSON.stringify(wire));
}

export function decodeConfig(encoded: string): BoardConfig | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const data: unknown = JSON.parse(json);
    if (!isRecord(data)) return null;
    const { t, i } = data;
    if (typeof t !== 'string' || !Array.isArray(i)) return null;
    if (!i.every((x): x is string => typeof x === 'string')) return null;
    return {
      title: t.trim().slice(0, MAX_TITLE) || 'Diwali Bingo',
      items: i.slice(0, MAX_ITEMS).map((x) => x.slice(0, MAX_ITEM)),
      freeCenter: data.f !== 0,
      keepOrder: data.k === 1,
      hideItemText: data.h === 1,
      ...(typeof data.c === 'string' && data.c.trim() ? { freeText: data.c.trim().slice(0, MAX_ITEM) } : {}),
    };
  } catch {
    return null;
  }
}

// ---------- room codes ----------

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function genRoomCode(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ROOM_ALPHABET[b % ROOM_ALPHABET.length];
  return out;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4,12}$/.test(code);
}

// ---------- URLs ----------

export function buildRoomPath(roomCode: string, config: BoardConfig): string {
  return `/${roomCode}#${encodeConfig(config)}`;
}

export function buildRoomUrl(origin: string, roomCode: string, config: BoardConfig): string {
  return `${origin}${buildRoomPath(roomCode, config)}`;
}

export interface ParsedLocation {
  roomCode: string | null;
  config: BoardConfig | null;
}

export function parseLocation(pathname: string, hash: string): ParsedLocation {
  let segment = '';
  try {
    segment = decodeURIComponent(pathname.replace(/^\/+|\/+$/g, ''));
  } catch {
    segment = '';
  }
  if (!segment || segment.includes('/')) return { roomCode: null, config: null };
  const code = normalizeRoomCode(segment);
  if (!isValidRoomCode(code)) return { roomCode: null, config: null };
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return { roomCode: code, config: raw ? decodeConfig(raw) : null };
}

export interface JoinTarget {
  roomCode: string;
  hash: string;
}

/** Accepts a full invite link, a path like `/ABC123#...`, or a bare room code. */
export function parseJoinInput(input: string): JoinTarget | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const looksLikeLink = /^https?:\/\//i.test(trimmed) || trimmed.includes('/') || trimmed.includes('#');
  if (looksLikeLink) {
    try {
      const url = new URL(trimmed, 'https://placeholder.invalid');
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1] ?? '';
      const code = normalizeRoomCode(last);
      if (!isValidRoomCode(code)) return null;
      return { roomCode: code, hash: url.hash.replace(/^#/, '') };
    } catch {
      return null;
    }
  }
  const code = normalizeRoomCode(trimmed);
  return isValidRoomCode(code) ? { roomCode: code, hash: '' } : null;
}

// ---------- clipboard ----------

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
