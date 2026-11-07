import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export type PresenceState = {
  playerId: string;
  name: string;
  avatarEmoji: string;
  color: string;
  markedCount: number;
  completedLineCount: number;
  oneAway: boolean;
  fullBoard: boolean;
  /** 25-bit bitmask of marked squares */
  marked: number;
};

export type MarkPayload = { playerId: string; name: string; squareIndex: number; itemText: string };
export type LineCompletePayload = { playerId: string; name: string; lineId: string; lineLabel: string };
export type OneAwayPayload = {
  playerId: string;
  name: string;
  lineLabel: string;
  missingItemText?: string;
  fullBoard: boolean;
};
export type FullBoardPayload = { playerId: string; name: string };
export type ReactionPayload = { playerId: string; emoji: string };

export type RoomMessage =
  | { type: 'mark'; payload: MarkPayload }
  | { type: 'line_complete'; payload: LineCompletePayload }
  | { type: 'one_away'; payload: OneAwayPayload }
  | { type: 'full_board'; payload: FullBoardPayload }
  | { type: 'reaction'; payload: ReactionPayload };

export type RoomStatus = 'connecting' | 'connected' | 'reconnecting' | 'solo';

export interface RoomHandlers {
  onStatus: (status: RoomStatus) => void;
  onSync: (players: PresenceState[]) => void;
  /** `initial` is true for players already present when we first subscribed. */
  onJoin: (players: PresenceState[], initial: boolean) => void;
  onLeave: (players: PresenceState[]) => void;
  onMessage: (msg: RoomMessage) => void;
}

export interface RoomConnection {
  send: (msg: RoomMessage) => void;
  track: (presence: PresenceState) => void;
  leave: () => void;
}

const EVENTS: RoomMessage['type'][] = ['mark', 'line_complete', 'one_away', 'full_board', 'reaction'];

// ---------- validation of untrusted payloads ----------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
const str = (v: unknown, max = 140): string => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export function parsePresence(v: unknown): PresenceState | null {
  if (!isRecord(v) || typeof v.playerId !== 'string' || !v.playerId) return null;
  return {
    playerId: v.playerId,
    name: str(v.name, 24) || 'Guest',
    avatarEmoji: str(v.avatarEmoji, 8) || '🪔',
    color: str(v.color, 16) || '#f5b942',
    markedCount: num(v.markedCount),
    completedLineCount: num(v.completedLineCount),
    oneAway: v.oneAway === true,
    fullBoard: v.fullBoard === true,
    marked: num(v.marked) >>> 0,
  };
}

export function parseMessage(type: string, payload: unknown): RoomMessage | null {
  if (!isRecord(payload) || typeof payload.playerId !== 'string') return null;
  const playerId = payload.playerId;
  const name = str(payload.name, 24) || 'Someone';
  switch (type) {
    case 'mark':
      if (typeof payload.squareIndex !== 'number') return null;
      return { type, payload: { playerId, name, squareIndex: payload.squareIndex, itemText: str(payload.itemText) } };
    case 'line_complete':
      if (typeof payload.lineId !== 'string') return null;
      return { type, payload: { playerId, name, lineId: payload.lineId, lineLabel: str(payload.lineLabel, 30) } };
    case 'one_away': {
      const missing = str(payload.missingItemText);
      return {
        type,
        payload: {
          playerId,
          name,
          lineLabel: str(payload.lineLabel, 30),
          missingItemText: missing || undefined,
          fullBoard: payload.fullBoard === true,
        },
      };
    }
    case 'full_board':
      return { type, payload: { playerId, name } };
    case 'reaction': {
      const emoji = str(payload.emoji, 8);
      return emoji ? { type, payload: { playerId, emoji } } : null;
    }
    default:
      return null;
  }
}

function flattenPresence(channel: RealtimeChannel): PresenceState[] {
  const state = channel.presenceState() as unknown as Record<string, unknown[]>;
  const out: PresenceState[] = [];
  for (const metas of Object.values(state)) {
    if (!Array.isArray(metas) || metas.length === 0) continue;
    const p = parsePresence(metas[metas.length - 1]);
    if (p) out.push(p);
  }
  return out;
}

// ---------- channel ----------

/**
 * realtime-js returns the *existing* channel for a topic until its removal finishes, so a quick
 * leave + rejoin (React StrictMode, room switches) must wait for the previous removal first.
 */
const pendingRemovals = new Map<string, Promise<unknown>>();

export function connectRoom(
  client: SupabaseClient,
  roomCode: string,
  playerId: string,
  handlers: RoomHandlers,
): RoomConnection {
  const topic = `room:${roomCode}`;
  let channel: RealtimeChannel | null = null;
  let subscribed = false;
  let synced = false;
  let closedByUs = false;
  let latest: PresenceState | null = null;

  const open = () => {
    if (closedByUs) return;
    const ch = client.channel(topic, {
      config: { broadcast: { self: false, ack: false }, presence: { key: playerId } },
    });
    channel = ch;

    ch.on('presence', { event: 'sync' }, () => {
      synced = true;
      handlers.onSync(flattenPresence(ch));
    });
    ch.on('presence', { event: 'join' }, ({ newPresences }) => {
      const list = (newPresences as unknown[]).map(parsePresence).filter((p): p is PresenceState => p !== null);
      handlers.onJoin(list, !synced);
    });
    ch.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const list = (leftPresences as unknown[]).map(parsePresence).filter((p): p is PresenceState => p !== null);
      handlers.onLeave(list);
    });
    for (const event of EVENTS) {
      ch.on('broadcast', { event }, (msg: { payload?: unknown }) => {
        const parsed = parseMessage(event, msg.payload);
        if (parsed) handlers.onMessage(parsed);
      });
    }

    ch.subscribe((status) => {
      if (closedByUs) return;
      const s = String(status);
      if (s === 'SUBSCRIBED') {
        subscribed = true;
        handlers.onStatus('connected');
        if (latest) void ch.track(latest).catch(() => undefined); // (re-)track on every (re)connect
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
        subscribed = false;
        handlers.onStatus('reconnecting');
      }
    });
  };

  const pending = pendingRemovals.get(topic);
  if (pending) void pending.then(open, open);
  else open();

  return {
    send(msg) {
      if (!subscribed || !channel) return; // events are ephemeral; drop while offline
      void channel.send({ type: 'broadcast', event: msg.type, payload: msg.payload }).catch(() => undefined);
    },
    track(presence) {
      latest = presence;
      if (subscribed && channel) void channel.track(presence).catch(() => undefined);
    },
    leave() {
      closedByUs = true;
      subscribed = false;
      const ch = channel;
      channel = null;
      if (!ch) return;
      const removal = client
        .removeChannel(ch)
        .catch(() => undefined)
        .finally(() => {
          if (pendingRemovals.get(topic) === removal) pendingRemovals.delete(topic);
        });
      pendingRemovals.set(topic, removal);
    },
  };
}
