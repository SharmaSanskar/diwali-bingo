import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { appTitle } from '../config/content';
import { useGame } from '../hooks/useGame';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useRoom, type Identity } from '../hooks/useRoom';
import { useSettings } from '../hooks/useSettings';
import { unlockAudio } from '../lib/audio';
import type { PresenceState } from '../lib/room';
import { buildRoomUrl, copyText, type BoardConfig } from '../lib/share';
import { ActivityFeed, FeedItem } from './ActivityFeed';
import { BingoCard } from './BingoCard';
import { FullBoardBanner } from './FullBoardBanner';
import { Header } from './Header';
import { PlayersStrip } from './PlayersStrip';
import { RulesBox } from './RulesBox';
import { FloatingReactions, ReactionsBar } from './Reactions';
import { Toasts } from './Toasts';
import { CloseIcon } from './icons/UiIcons';

interface Props {
  roomCode: string;
  config: BoardConfig;
  identity: Identity;
  solo: boolean;
  onLeave: () => void;
}

export function Game({ roomCode, config, identity, solo, onLeave }: Props) {
  const { settings, update } = useSettings();
  const { card, marks, state, toggle } = useGame(roomCode, config, identity.playerId);

  const myPresence: PresenceState = useMemo(
    () => ({
      playerId: identity.playerId,
      name: identity.name,
      avatarEmoji: identity.avatarEmoji,
      color: identity.color,
      markedCount: state.count,
      completedLineCount: state.completed.length,
      oneAway: state.oneAway.length > 0 || state.fullOneAway,
      fullBoard: state.full,
      marked: marks,
    }),
    [identity, state, marks],
  );

  const room = useRoom({ roomCode, config, card, identity, solo, settings, myPresence });
  const { track } = room;

  useEffect(() => {
    track(myPresence);
  }, [myPresence, track]);

  useEffect(() => {
    document.title = `${config.title} · ${appTitle}`;
    return () => {
      document.title = appTitle;
    };
  }, [config.title]);

  // ---------- interactions ----------

  const stampCounter = useRef(0);
  const [lastStamp, setLastStamp] = useState<{ index: number; nonce: number } | null>(null);
  const publishOwn = room.publishOwn;

  const handleToggle = useCallback(
    (index: number) => {
      unlockAudio();
      const r = toggle(index);
      if (!r) return;
      if (r.marked) {
        stampCounter.current += 1;
        setLastStamp({ index, nonce: stampCounter.current });
      } else {
        setLastStamp(null);
      }
      publishOwn(r.events, !r.marked);
    },
    [toggle, publishOwn],
  );

  const inviteUrl = useMemo(() => buildRoomUrl(window.location.origin, roomCode, config), [roomCode, config]);

  const handleInvite = useCallback(async () => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: config.title, text: `Join my ${config.title} room! 🪔`, url: inviteUrl });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    const ok = await copyText(inviteUrl);
    room.info(ok ? 'Invite link copied! Send it to your friends 🪔' : 'Could not copy. Copy the link from the address bar.');
  }, [config.title, inviteUrl, room]);

  const handleCopyCode = useCallback(async () => {
    const ok = await copyText(inviteUrl);
    room.info(ok ? `Invite link for room ${roomCode} copied` : 'Could not copy');
  }, [inviteUrl, roomCode, room]);

  const handleNotifications = useCallback(
    async (on: boolean) => {
      if (!on) {
        update({ notifications: false });
        return;
      }
      if (!('Notification' in window)) {
        room.info('Notifications are not supported in this browser');
        return;
      }
      let perm = Notification.permission;
      if (perm === 'default') {
        try {
          perm = await Notification.requestPermission();
        } catch {
          perm = 'denied';
        }
      }
      if (perm === 'granted') {
        update({ notifications: true });
        room.info('You’ll be notified when friends hit big moments');
      } else {
        update({ notifications: false });
        room.info('Notifications are blocked in your browser settings');
      }
    },
    [update, room],
  );

  // ---------- view a friend's squares ----------

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = room.players.find((p) => p.playerId === selectedId) ?? null;
  const highlight = selected && !selected.isMe ? { marks: selected.marked, color: selected.color } : null;

  // ---------- mobile feed sheet ----------

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seenId, setSeenId] = useState(0);
  const latest = room.feed[0];
  const unread = useMemo(
    () => room.feed.filter((e) => e.id > seenId && !e.self && e.kind !== 'system').length,
    [room.feed, seenId],
  );
  useEffect(() => {
    if ((sheetOpen || isDesktop) && latest) setSeenId(latest.id);
  }, [sheetOpen, isDesktop, latest]);

  const statusLine = state.full
    ? 'Full board! You lit up every square 🏆'
    : state.fullOneAway
      ? 'One square from the FULL BOARD! 🔥'
      : `${state.count}/25 crossed off${state.completed.length ? ` · ${state.completed.length} line${state.completed.length > 1 ? 's' : ''}` : ''}${
          state.oneAway.length ? ' · one away! 🔥' : ''
        }`;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        title={config.title}
        roomCode={roomCode}
        playerCount={room.players.length}
        status={room.status}
        settings={settings}
        onSettings={update}
        onToggleNotifications={handleNotifications}
        onInvite={handleInvite}
        onCopyCode={handleCopyCode}
        onLeave={onLeave}
      />

      <PlayersStrip players={room.players} selectedId={selectedId} onSelect={setSelectedId} />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pl-4 pr-3 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:pb-8">
        <section aria-label="Bingo card" className="flex flex-col items-center gap-3">
          {selected && !selected.isMe && (
            <div className="fade-in flex w-full max-w-[42rem] items-center gap-2 rounded-xl border-2 bg-night/80 px-3 py-2 text-sm"
              style={{ borderColor: selected.color }}
            >
              <span aria-hidden="true">{selected.avatarEmoji}</span>
              <span className="flex-1">
                Showing <strong>{selected.name}</strong>’s squares ({selected.markedCount}/25)
              </span>
              <button type="button" onClick={() => setSelectedId(null)} className="rounded-full p-1 hover:bg-white/10" aria-label="Stop showing their squares">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          <BingoCard
            title={config.title}
            card={card}
            marks={marks}
            state={state}
            freeCenter={config.freeCenter}
            lastStamp={lastStamp}
            highlight={highlight}
            onToggle={handleToggle}
          />
          <p className="rounded-full border-2 border-ink bg-gold px-4 py-1 text-center font-display text-[15px] font-extrabold text-berry shadow-[2px_2px_0_var(--color-ink)]">
            {statusLine}
          </p>
          <ReactionsBar onReact={(e) => { unlockAudio(); room.sendReaction(e); }} />
          <RulesBox className="mt-1 max-w-[42rem]" />
          {solo && (
            <p className="max-w-md text-center text-xs text-cream/80">
              Solo mode: realtime is off, so the feed only shows your own moves. Add Supabase keys to play with friends.
            </p>
          )}
        </section>

        {isDesktop && (
          <aside className="sticky top-24 h-[calc(100dvh-8rem)]">
            <ActivityFeed entries={room.feed} className="h-full" />
          </aside>
        )}
      </main>

      {!isDesktop && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="glass mx-auto flex w-full max-w-xl items-center gap-2 rounded-2xl p-2 text-left"
              aria-label={`Open live activity${unread ? `, ${unread} new` : ''}`}
              aria-expanded={sheetOpen}
            >
              <div className="min-w-0 flex-1" aria-live="polite">
                {latest && <FeedItem entry={latest} compact />}
              </div>
              <span className="relative shrink-0 rounded-xl border-2 border-ink bg-gold px-3 py-2 text-xs font-bold text-berry">
                Activity
                {unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border border-ink bg-cream px-1 text-[10px] font-bold text-berry">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </span>
            </button>
          </div>
          {sheetOpen && (
            <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Live activity">
              <button
                type="button"
                className="fade-in absolute inset-0 bg-ink/60"
                onClick={() => setSheetOpen(false)}
                aria-label="Close activity"
                tabIndex={-1}
              />
              <div className="sheet-up absolute inset-x-0 bottom-0 flex h-[72dvh] flex-col">
                <div className="relative flex h-full flex-col">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="btn-ghost absolute right-3 top-2.5 z-10 grid h-10 w-10 place-items-center bg-night-2"
                    aria-label="Close activity"
                    autoFocus
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                  <ActivityFeed entries={room.feed} className="h-full rounded-b-none" live={false} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Toasts toasts={room.toasts} onDismiss={room.dismissToast} />
      <FloatingReactions reactions={room.reactions} />
      <FullBoardBanner banner={room.banner} onDone={room.dismissBanner} />
    </div>
  );
}
