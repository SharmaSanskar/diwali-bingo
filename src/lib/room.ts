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
  /** Force a fresh connection now (e.g. user tapped "reconnect"). */
  reconnect: () => void;
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

/** If a (re)connect hasn't succeeded by now, tear everything down and start fresh. */
const CONNECT_WATCHDOG_MS = 10_000;
/** After an error/close, wait this long before forcing a fresh connection. */
const RETRY_DELAY_MS = 1_500;
/** Mobile browsers silently kill sockets in the background; after this long hidden, assume it's dead. */
const HIDDEN_RESTART_MS = 5_000;

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<void>((r) => window.setTimeout(r, ms))]);

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
  let restarting = false;
  let latest: PresenceState | null = null;
  let watchdog: number | null = null;
  let retryTimer: number | null = null;
  let hiddenAt: number | null = null;

  const clearTimers = () => {
    if (watchdog !== null) window.clearTimeout(watchdog);
    if (retryTimer !== null) window.clearTimeout(retryTimer);
    watchdog = null;
    retryTimer = null;
  };

  /** Drop a channel without waiting on a possibly dead socket. */
  const dropChannel = async (ch: RealtimeChannel) => {
    await withTimeout(client.removeChannel(ch).catch(() => undefined), 2_000);
    // if the graceful removal didn't finish, force it out so the topic can be reused
    const rt = client.realtime as unknown as { channels: RealtimeChannel[] };
    if (rt.channels.includes(ch)) {
      try {
        ch.teardown();
      } catch {
        // ignore
      }
      rt.channels = rt.channels.filter((c) => c !== ch);
    }
  };

  const open = () => {
    if (closedByUs) return;
    const ch = client.channel(topic, {
      config: { broadcast: { self: false, ack: false }, presence: { key: playerId } },
    });
    channel = ch;
    synced = false;

    ch.on('presence', { event: 'sync' }, () => {
      if (ch !== channel) return;
      synced = true;
      handlers.onSync(flattenPresence(ch));
    });
    ch.on('presence', { event: 'join' }, ({ newPresences }) => {
      if (ch !== channel) return;
      const list = (newPresences as unknown[]).map(parsePresence).filter((p): p is PresenceState => p !== null);
      handlers.onJoin(list, !synced);
    });
    ch.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (ch !== channel) return;
      const list = (leftPresences as unknown[]).map(parsePresence).filter((p): p is PresenceState => p !== null);
      handlers.onLeave(list);
    });
    for (const event of EVENTS) {
      ch.on('broadcast', { event }, (msg: { payload?: unknown }) => {
        if (ch !== channel) return;
        const parsed = parseMessage(event, msg.payload);
        if (parsed) handlers.onMessage(parsed);
      });
    }

    clearTimers();
    watchdog = window.setTimeout(() => {
      watchdog = null;
      if (ch === channel && !subscribed) void restart();
    }, CONNECT_WATCHDOG_MS);

    ch.subscribe((status) => {
      if (closedByUs || ch !== channel) return; // stale callback from a replaced channel
      const s = String(status);
      if (s === 'SUBSCRIBED') {
        subscribed = true;
        clearTimers();
        handlers.onStatus('connected');
        if (latest) void ch.track(latest).catch(() => undefined); // (re-)track on every (re)connect
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
        subscribed = false;
        handlers.onStatus('reconnecting');
        // don't sit in the library's slow backoff: force a clean reconnect shortly
        if (retryTimer === null) {
          retryTimer = window.setTimeout(() => {
            retryTimer = null;
            void restart();
          }, RETRY_DELAY_MS);
        }
      }
    });
  };

  /** Throw away the socket and channel and connect again from scratch. */
  const restart = async () => {
    if (closedByUs || restarting) return;
    restarting = true;
    clearTimers();
    subscribed = false;
    handlers.onStatus('reconnecting');
    const old = channel;
    channel = null; // makes any late callbacks from the old channel no-ops
    try {
      // close the (possibly half-dead) socket first so unsubscribe resolves instantly
      await withTimeout(client.realtime.disconnect().catch(() => undefined), 1_500);
      if (old) await dropChannel(old);
    } finally {
      restarting = false;
    }
    open();
  };

  // ---------- page lifecycle: phones lock, apps switch, networks drop ----------

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      return;
    }
    const hiddenFor = hiddenAt === null ? 0 : Date.now() - hiddenAt;
    hiddenAt = null;
    if (!subscribed || hiddenFor > HIDDEN_RESTART_MS) void restart();
  };
  const onOnline = () => void restart();
  const onPageShow = (e: PageTransitionEvent) => {
    if (e.persisted) void restart(); // restored from the back/forward cache with a dead socket
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', onOnline);
  window.addEventListener('pageshow', onPageShow);

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
    reconnect() {
      void restart();
    },
    leave() {
      closedByUs = true;
      subscribed = false;
      clearTimers();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('pageshow', onPageShow);
      const ch = channel;
      channel = null;
      if (!ch) return;
      const removal = dropChannel(ch).finally(() => {
        if (pendingRemovals.get(topic) === removal) pendingRemovals.delete(topic);
      });
      pendingRemovals.set(topic, removal);
    },
  };
}
