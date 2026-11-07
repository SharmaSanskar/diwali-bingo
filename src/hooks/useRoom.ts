import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameEvent } from '../lib/board';
import { sfx } from '../lib/audio';
import { fireworks, friendBurst, lineBurst } from '../lib/effects';
import { lineReward } from '../config/content';
import { fullBoardText, joinText, lineText, markText, oneAwayText } from '../lib/messages';
import { connectRoom, type PresenceState, type RoomConnection, type RoomMessage, type RoomStatus } from '../lib/room';
import type { BoardConfig } from '../lib/share';
import { loadRoster, saveRoster, type Settings } from '../lib/storage';
import { parsePresence } from '../lib/room';
import { getSupabase } from '../lib/supabase';

export type FeedKind = 'mark' | 'line' | 'one_away' | 'full_board' | 'join' | 'system';

export interface FeedEntry {
  id: number;
  ts: number;
  kind: FeedKind;
  text: string;
  self: boolean;
  avatar?: string;
  color?: string;
}

export type ToastKind = 'line' | 'one_away' | 'full_board' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
  avatar?: string;
}

export interface BannerItem {
  id: number;
  name: string;
  self: boolean;
  avatar: string;
  color: string;
}

export interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
  name: string;
}

export interface Identity {
  playerId: string;
  name: string;
  avatarEmoji: string;
  color: string;
}

export interface PlayerView extends PresenceState {
  isMe: boolean;
  /** false when they've closed the tab / locked the phone; they stay listed with their last progress */
  online: boolean;
}

interface Options {
  roomCode: string;
  config: BoardConfig;
  card: string[];
  identity: Identity;
  solo: boolean;
  settings: Settings;
  myPresence: PresenceState;
}

const FEED_CAP = 50;
const REJOIN_QUIET_MS = 20_000;
const PRESENCE_THROTTLE_MS = 250;

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export function useRoom({ roomCode, config, card, identity, solo, settings, myPresence }: Options) {
  const settingsRef = useLatest(settings);
  const configRef = useLatest(config);
  const cardRef = useLatest(card);
  const identityRef = useLatest(identity);

  const idRef = useRef(1);
  const nextId = () => ++idRef.current;

  const [status, setStatus] = useState<RoomStatus>(solo ? 'solo' : 'connecting');
  const [remotePlayers, setRemotePlayers] = useState<PresenceState[]>([]);
  /** Everyone ever seen in this room on this device (insertion order = first seen). */
  const lastSeenRef = useRef(new Map<string, number>());
  const [roster, setRoster] = useState<Map<string, PresenceState>>(() => {
    const m = new Map<string, PresenceState>();
    for (const e of loadRoster(roomCode)) {
      const p = parsePresence(e.presence);
      if (p && p.playerId !== identity.playerId) {
        m.set(p.playerId, p);
        lastSeenRef.current.set(p.playerId, e.lastSeen);
      }
    }
    return m;
  });
  const [feed, setFeed] = useState<FeedEntry[]>(() => [
    { id: 1, ts: Date.now(), kind: 'system', text: 'You joined the room ✨', self: true },
  ]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  const connRef = useRef<RoomConnection | null>(null);
  const orderRef = useRef(new Map<string, number>());
  const playersRef = useRef(new Map<string, PresenceState>());
  const seenRef = useRef(new Map<string, number | null>()); // playerId -> leftAt (null = present)
  const announcedRef = useRef(new Set<string>());
  const lastReactionRef = useRef(0);
  const firstLineDoneRef = useRef(false);
  const latestPresenceRef = useRef<PresenceState>(myPresence);

  // ---------- local UI primitives ----------

  const pushFeed = useCallback((e: Omit<FeedEntry, 'id' | 'ts'>) => {
    const entry = { ...e, id: nextId(), ts: Date.now() };
    setFeed((f) => [entry, ...f].slice(0, FEED_CAP));
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = nextId();
      setToasts((ts) => [...ts, { ...t, id }].slice(-3));
      window.setTimeout(() => dismissToast(id), t.kind === 'full_board' ? 6000 : 4200);
    },
    [dismissToast],
  );

  const info = useCallback((text: string) => pushToast({ kind: 'info', text }), [pushToast]);

  const pushBanner = useCallback((b: Omit<BannerItem, 'id'>) => {
    setBanners((q) => [...q, { ...b, id: nextId() }]);
  }, []);

  const dismissBanner = useCallback(() => setBanners((q) => q.slice(1)), []);

  const addReaction = useCallback((emoji: string, name: string) => {
    const id = nextId();
    const x = 8 + Math.random() * 84;
    setReactions((r) => [...r, { id, emoji, x, name }].slice(-30));
    window.setTimeout(() => setReactions((r) => r.filter((x2) => x2.id !== id)), 2800);
  }, []);

  const notify = useCallback(
    (body: string) => {
      if (!settingsRef.current.notifications) return;
      if (typeof document === 'undefined' || document.visibilityState !== 'hidden') return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      try {
        new Notification(configRef.current.title, { body, tag: `bingo-${Date.now()}` });
      } catch {
        // some mobile browsers only allow notifications from a service worker; ignore
      }
    },
    [settingsRef, configRef],
  );

  /** True if nobody in the room (other than `scorerId`, who may already show 1) has a line yet. */
  const isFirstLineInRoom = useCallback(
    (scorerId: string) => {
      const me = identityRef.current.playerId;
      if (latestPresenceRef.current.completedLineCount > 0) return false; // my state before this toggle
      for (const p of playersRef.current.values()) {
        if (p.playerId === me) continue;
        if (p.playerId === scorerId ? p.completedLineCount > 1 : p.completedLineCount > 0) return false;
      }
      return !firstLineDoneRef.current;
    },
    [identityRef],
  );

  // ---------- remote events ----------

  const handleRemote = useCallback(
    (msg: RoomMessage) => {
      const me = identityRef.current.playerId;
      if (msg.payload.playerId === me) return; // ignore own echoes
      const who = playersRef.current.get(msg.payload.playerId);
      const avatar = who?.avatarEmoji ?? '🪔';
      const color = who?.color ?? '#f5b942';
      const s = settingsRef.current;

      switch (msg.type) {
        case 'reaction': {
          addReaction(msg.payload.emoji, who?.name ?? '');
          sfx.reaction();
          return;
        }
        case 'mark': {
          const p = msg.payload;
          pushFeed({ kind: 'mark', text: markText(p.name, false, p.itemText || undefined), self: false, avatar, color });
          if (s.friendSounds) sfx.friendTick();
          return;
        }
        case 'line_complete': {
          const p = msg.payload;
          const key = `${p.playerId}:${p.lineId}`;
          if (announcedRef.current.has(key)) return;
          announcedRef.current.add(key);
          const text = lineText(p.name, false, p.lineLabel);
          const first = isFirstLineInRoom(p.playerId);
          if (first) firstLineDoneRef.current = true;
          pushFeed({ kind: 'line', text: first ? `${text} First line: ${p.name} assigns one dare! 🎯` : text, self: false, avatar, color });
          pushToast({ kind: 'line', text: first ? `${text} They assign one dare! 🎯` : text, avatar });
          sfx.lineChime(false);
          friendBurst();
          notify(text);
          return;
        }
        case 'one_away': {
          const p = msg.payload;
          const text = oneAwayText(p.name, false, p);
          pushFeed({ kind: 'one_away', text, self: false, avatar, color });
          pushToast({ kind: 'one_away', text, avatar });
          sfx.oneAway(false);
          notify(text);
          return;
        }
        case 'full_board': {
          const p = msg.payload;
          const key = `${p.playerId}:full`;
          if (announcedRef.current.has(key)) return;
          announcedRef.current.add(key);
          const text = fullBoardText(p.name, false);
          pushFeed({ kind: 'full_board', text, self: false, avatar, color });
          pushBanner({ name: p.name, self: false, avatar, color });
          sfx.fanfare();
          fireworks('medium');
          notify(text);
          return;
        }
      }
    },
    [identityRef, settingsRef, addReaction, pushFeed, pushToast, pushBanner, notify, isFirstLineInRoom],
  );
  const handleRemoteRef = useLatest(handleRemote);

  // ---------- connection ----------

  const trackTimerRef = useRef<number | null>(null);
  const lastTrackRef = useRef(0);

  useEffect(() => {
    if (solo) {
      setStatus('solo');
      return undefined;
    }
    const client = getSupabase();
    if (!client) {
      setStatus('solo');
      return undefined;
    }
    setStatus('connecting');
    const me = identity.playerId;
    const remember = (p: PresenceState) => {
      playersRef.current.set(p.playerId, p);
      if (!orderRef.current.has(p.playerId)) orderRef.current.set(p.playerId, orderRef.current.size);
    };

    const conn = connectRoom(client, roomCode, me, {
      onStatus: setStatus,
      onSync: (list) => {
        list.forEach(remember);
        const others = list.filter((p) => p.playerId !== me);
        setRemotePlayers(others);
        if (others.length) {
          setRoster((prev) => {
            const next = new Map(prev);
            const now = Date.now();
            for (const p of others) {
              next.set(p.playerId, p); // keeps first-seen position, updates progress
              lastSeenRef.current.set(p.playerId, now);
            }
            saveRoster(
              roomCode,
              [...next.values()].map((p) => ({ presence: p, lastSeen: lastSeenRef.current.get(p.playerId) ?? now })),
            );
            return next;
          });
        }
      },
      onJoin: (list, initial) => {
        const now = Date.now();
        for (const p of list) {
          remember(p);
          if (p.playerId === me) continue;
          const seen = seenRef.current;
          const known = seen.has(p.playerId);
          const leftAt = seen.get(p.playerId);
          const present = known && leftAt === null;
          seen.set(p.playerId, null);
          if (initial || present) continue;
          if (known && typeof leftAt === 'number' && now - leftAt < REJOIN_QUIET_MS) continue; // refresh
          pushFeed({ kind: 'join', text: joinText(p.name), self: false, avatar: p.avatarEmoji, color: p.color });
        }
      },
      onLeave: (list) => {
        const now = Date.now();
        for (const p of list) if (p.playerId !== me) seenRef.current.set(p.playerId, now);
      },
      onMessage: (msg) => handleRemoteRef.current(msg),
    });
    connRef.current = conn;
    conn.track(latestPresenceRef.current);

    return () => {
      conn.leave();
      connRef.current = null;
    };
  }, [roomCode, identity.playerId, solo, pushFeed, handleRemoteRef]);

  /** Throttled presence update (trailing edge). */
  const track = useCallback((p: PresenceState) => {
    latestPresenceRef.current = p;
    if (trackTimerRef.current !== null) return;
    const delay = Math.max(0, PRESENCE_THROTTLE_MS - (Date.now() - lastTrackRef.current));
    trackTimerRef.current = window.setTimeout(() => {
      trackTimerRef.current = null;
      lastTrackRef.current = Date.now();
      connRef.current?.track(latestPresenceRef.current);
    }, delay);
  }, []);

  useEffect(
    () => () => {
      if (trackTimerRef.current !== null) window.clearTimeout(trackTimerRef.current);
    },
    [],
  );

  // ---------- own events ----------

  const publishOwn = useCallback(
    (events: GameEvent[], unmarked: boolean) => {
      if (unmarked) {
        sfx.unmark();
        return;
      }
      const c = cardRef.current;
      const cfg = configRef.current;
      const me = identityRef.current;
      const conn = connRef.current;
      const base = { playerId: me.playerId, name: me.name };
      const mine = { self: true, avatar: me.avatarEmoji, color: me.color };

      const hasFull = events.some((e) => e.type === 'full_board');
      const hasLine = events.some((e) => e.type === 'line_complete');
      const hasOneAway = events.some((e) => e.type === 'one_away');

      for (const ev of events) {
        switch (ev.type) {
          case 'mark': {
            const item = c[ev.squareIndex] ?? '';
            pushFeed({ kind: 'mark', text: markText(me.name, true, cfg.hideItemText ? undefined : item), ...mine });
            conn?.send({
              type: 'mark',
              payload: { ...base, squareIndex: ev.squareIndex, itemText: cfg.hideItemText ? '' : item },
            });
            break;
          }
          case 'line_complete': {
            const text = lineText(me.name, true, ev.lineLabel);
            const first = isFirstLineInRoom(me.playerId);
            if (first) firstLineDoneRef.current = true;
            pushFeed({ kind: 'line', text: first ? `${text} First line: you assign one dare! 🎯` : text, ...mine });
            pushToast({ kind: 'line', text: first ? `${text} ${lineReward} 🎯` : text, avatar: me.avatarEmoji });
            conn?.send({ type: 'line_complete', payload: { ...base, lineId: ev.lineId, lineLabel: ev.lineLabel } });
            break;
          }
          case 'one_away': {
            const missingItemText =
              ev.missingIndex !== null && !cfg.hideItemText ? c[ev.missingIndex] : undefined;
            const payload = { ...base, lineLabel: ev.lineLabel, missingItemText, fullBoard: ev.fullBoard };
            const text = oneAwayText(me.name, true, payload);
            pushFeed({ kind: 'one_away', text, ...mine });
            pushToast({ kind: 'one_away', text, avatar: me.avatarEmoji });
            conn?.send({ type: 'one_away', payload });
            break;
          }
          case 'full_board': {
            pushFeed({ kind: 'full_board', text: fullBoardText(me.name, true), ...mine });
            pushBanner({ name: me.name, self: true, avatar: me.avatarEmoji, color: me.color });
            conn?.send({ type: 'full_board', payload: base });
            break;
          }
        }
      }

      // Own effects play instantly and in a pleasant order.
      sfx.stamp();
      if (hasFull) {
        window.setTimeout(() => {
          sfx.fanfare();
          fireworks('big');
        }, 220);
      } else if (hasLine) {
        window.setTimeout(() => {
          sfx.lineChime(true);
          lineBurst();
        }, 150);
        if (hasOneAway) window.setTimeout(() => sfx.oneAway(true), 900);
      } else if (hasOneAway) {
        window.setTimeout(() => sfx.oneAway(true), 180);
      }
    },
    [cardRef, configRef, identityRef, pushFeed, pushToast, pushBanner, isFirstLineInRoom],
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      const now = Date.now();
      if (now - lastReactionRef.current < 300) return;
      lastReactionRef.current = now;
      addReaction(emoji, 'You');
      sfx.reaction();
      connRef.current?.send({ type: 'reaction', payload: { playerId: identityRef.current.playerId, emoji } });
    },
    [addReaction, identityRef],
  );

  // ---------- players (me first, then stable first-seen order; never ranked) ----------

  // me first, then everyone here now, then people who stepped away (dimmed, last known progress)
  const players: PlayerView[] = useMemo(() => {
    const live = new Map(remotePlayers.map((p) => [p.playerId, p]));
    const online: PlayerView[] = [];
    const away: PlayerView[] = [];
    for (const [id, p] of roster) {
      if (id === identity.playerId) continue;
      const now = live.get(id);
      if (now) online.push({ ...now, isMe: false, online: true });
      else away.push({ ...p, isMe: false, online: false });
    }
    for (const p of remotePlayers) {
      if (p.playerId !== identity.playerId && !roster.has(p.playerId)) online.push({ ...p, isMe: false, online: true });
    }
    return [{ ...myPresence, isMe: true, online: true }, ...online, ...away];
  }, [remotePlayers, roster, myPresence, identity.playerId]);

  const reconnect = useCallback(() => connRef.current?.reconnect(), []);

  return {
    status,
    players,
    feed,
    toasts,
    dismissToast,
    banner: banners[0] ?? null,
    dismissBanner,
    reactions,
    publishOwn,
    sendReaction,
    track,
    info,
    reconnect,
  };
}
