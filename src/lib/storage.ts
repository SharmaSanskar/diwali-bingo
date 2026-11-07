import { avatarEmojis, playerColors } from '../config/content';
import type { AnnounceMemory, Marks } from './board';
import { FULL_MASK } from './board';

/**
 * Optional per-tab identity namespace for local testing: open a room with `?player=2`
 * and that tab acts as a different player (remembered for the tab via sessionStorage).
 */
function resolveNamespace(): string {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('player');
    if (fromUrl) {
      const clean = fromUrl.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
      sessionStorage.setItem('diwali-bingo:ns', clean);
      return clean;
    }
    return sessionStorage.getItem('diwali-bingo:ns') ?? '';
  } catch {
    return '';
  }
}

const NS = typeof window === 'undefined' ? '' : resolveNamespace();
const PREFIX = NS ? `diwali-bingo:${NS}:` : 'diwali-bingo:';

export const testIdentityLabel = NS;

function readRaw(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or blocked; ignore
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// ---------- identity ----------

export function getPlayerId(): string {
  const existing = readRaw('playerId');
  if (typeof existing === 'string' && existing.length >= 8) return existing;
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  write('playerId', id);
  return id;
}

export interface Profile {
  name: string;
  avatarEmoji: string;
  color: string;
}

export function loadProfile(): Profile {
  const raw = readRaw('profile');
  const p: Profile = {
    name: '',
    avatarEmoji: pick(avatarEmojis),
    color: pick(playerColors),
  };
  if (isRecord(raw)) {
    if (typeof raw.name === 'string') p.name = raw.name.slice(0, 24);
    if (typeof raw.avatarEmoji === 'string' && raw.avatarEmoji) p.avatarEmoji = raw.avatarEmoji;
    if (typeof raw.color === 'string' && raw.color) p.color = raw.color;
  } else {
    write('profile', p);
  }
  return p;
}

export function saveProfile(p: Profile): void {
  write('profile', p);
}

// ---------- per-room progress ----------

export function loadMarks(room: string, playerId: string): Marks | null {
  const v = readRaw(`marks:${room}:${playerId}`);
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v & FULL_MASK : null;
}

export function saveMarks(room: string, playerId: string, marks: Marks): void {
  write(`marks:${room}:${playerId}`, marks);
}

export function loadMemory(room: string, playerId: string): AnnounceMemory | null {
  const v = readRaw(`memory:${room}:${playerId}`);
  if (!isRecord(v)) return null;
  const strArr = (x: unknown): string[] | null =>
    Array.isArray(x) && x.every((s): s is string => typeof s === 'string') ? x : null;
  const lines = strArr(v.lines);
  const oneAway = strArr(v.oneAwayLines);
  if (!lines || !oneAway) return null;
  return {
    lines,
    oneAwayLines: oneAway,
    fullBoardOneAway: v.fullBoardOneAway === true,
    fullBoard: v.fullBoard === true,
    lastOneAwayAt: typeof v.lastOneAwayAt === 'number' ? v.lastOneAwayAt : 0,
  };
}

export function saveMemory(room: string, playerId: string, memory: AnnounceMemory): void {
  write(`memory:${room}:${playerId}`, memory);
}

// ---------- settings ----------

export interface Settings {
  muted: boolean;
  volume: number;
  friendSounds: boolean;
  notifications: boolean;
}

export const defaultSettings: Settings = {
  muted: false,
  volume: 0.8,
  friendSounds: true,
  notifications: false,
};

export function loadSettings(): Settings {
  const v = readRaw('settings');
  if (!isRecord(v)) return { ...defaultSettings };
  return {
    muted: v.muted === true,
    volume:
      typeof v.volume === 'number' && v.volume >= 0 && v.volume <= 1 ? v.volume : defaultSettings.volume,
    friendSounds: v.friendSounds !== false,
    notifications: v.notifications === true,
  };
}

export function saveSettings(s: Settings): void {
  write('settings', s);
}
