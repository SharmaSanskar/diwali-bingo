import { useEffect, useRef, useState } from 'react';
import type { RoomStatus } from '../lib/room';
import { supportsPlayOnSilent } from '../lib/audio';
import type { Settings } from '../lib/storage';
import { Diya } from './icons/Diya';
import { Torana } from './icons/Torana';
import { GearIcon, ShareIcon, SoundOffIcon, SoundOnIcon, UsersIcon } from './icons/UiIcons';

interface Props {
  title: string;
  roomCode: string;
  playerCount: number;
  status: RoomStatus;
  settings: Settings;
  onSettings: (patch: Partial<Settings>) => void;
  onToggleNotifications: (on: boolean) => void;
  onInvite: () => void;
  onCopyCode: () => void;
  onLeave: () => void;
}

function StatusChip({ status }: { status: RoomStatus }) {
  if (status === 'connected') return null;
  const map: Record<Exclude<RoomStatus, 'connected'>, { text: string; cls: string }> = {
    connecting: { text: 'Connecting…', cls: 'border-cream/60 text-cream' },
    reconnecting: { text: 'Reconnecting…', cls: 'border-marigold text-marigold animate-pulse' },
    solo: { text: 'Solo mode', cls: 'border-cream/50 text-cream/90' },
  };
  const s = map[status];
  return (
    <span role="status" className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.cls}`}>
      {s.text}
    </span>
  );
}

export function Header(props: Props) {
  const { title, roomCode, playerCount, status, settings, onSettings, onToggleNotifications, onInvite, onCopyCode, onLeave } =
    props;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setMenuOpen(false);
        return;
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  const notifSupported = typeof window !== 'undefined' && 'Notification' in window;

  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-night/95 pt-[env(safe-area-inset-top)] shadow-[0_3px_0_rgba(42,7,22,0.35)]">
      <Torana className="pointer-events-none h-3 w-full opacity-90 sm:h-5" />
      <div className="mx-auto flex max-w-6xl items-center gap-2 pb-2 pl-4 pr-3 sm:px-6">
        <button type="button" onClick={onLeave} className="shrink-0 rounded-full p-0.5" aria-label="Leave room and go home">
          <Diya className="h-9 w-9" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[17px] leading-tight text-gold-gradient min-[400px]:text-xl sm:text-2xl">{title}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-cream/90">
            <button
              type="button"
              onClick={onCopyCode}
              className="min-h-6 rounded-md border border-gold/60 bg-ink/30 px-1.5 font-mono font-semibold tracking-widest text-gold hover:bg-gold/10"
              aria-label={`Room code ${roomCode.split('').join(' ')}. Copy code`}
            >
              {roomCode}
            </button>
            <span className="flex items-center gap-1" aria-label={`${playerCount} ${playerCount === 1 ? 'player' : 'players'} here`}>
              <UsersIcon className="h-3.5 w-3.5" />
              {playerCount}
            </span>
            <StatusChip status={status} />
          </div>
        </div>
        <button
          type="button"
          onClick={onInvite}
          className="btn-primary flex h-10 shrink-0 items-center gap-1.5 px-3 text-sm sm:px-4"
          aria-label="Copy or share invite link"
        >
          <ShareIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Invite</span>
        </button>
        <button
          type="button"
          onClick={() => onSettings({ muted: !settings.muted })}
          className="btn-ghost hidden h-10 w-10 shrink-0 place-items-center min-[400px]:grid"
          aria-pressed={settings.muted}
          aria-label={settings.muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {settings.muted ? <SoundOffIcon className="h-5 w-5" /> : <SoundOnIcon className="h-5 w-5" />}
        </button>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="btn-ghost grid h-10 w-10 place-items-center"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-label="Settings"
          >
            <GearIcon className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="glass fade-in absolute right-0 top-12 z-50 w-[min(16rem,calc(100vw-2rem))] rounded-2xl p-4 text-sm" role="group" aria-label="Settings">
              <label className="mb-3 flex items-center justify-between gap-3">
                <span className="text-cream/95">Sound on</span>
                <input
                  type="checkbox"
                  checked={!settings.muted}
                  onChange={(e) => onSettings({ muted: !e.target.checked })}
                  className="h-5 w-5 accent-gold"
                />
              </label>
              {supportsPlayOnSilent() && (
                <label className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-cream/95">
                    Play sounds even on silent
                    <span className="block text-xs text-cream/75">Pauses music playing on this phone</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.playOnSilent}
                    onChange={(e) => onSettings({ playOnSilent: e.target.checked, muted: false })}
                    className="h-5 w-5 shrink-0 accent-gold"
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-1 flex justify-between text-cream/95">
                  Volume <span className="tabular-nums">{Math.round(settings.volume * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume}
                  onChange={(e) => onSettings({ volume: Number(e.target.value), muted: false })}
                  className="w-full accent-gold"
                />
              </label>
              <label className="mt-3 flex items-center justify-between gap-3">
                <span className="text-cream/95">Friend cross-off sounds</span>
                <input
                  type="checkbox"
                  checked={settings.friendSounds}
                  onChange={(e) => onSettings({ friendSounds: e.target.checked })}
                  className="h-5 w-5 accent-gold"
                />
              </label>
              {notifSupported && (
                <label className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-cream/95">
                    Notify me when the tab is hidden
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => onToggleNotifications(e.target.checked)}
                    className="h-5 w-5 accent-gold"
                  />
                </label>
              )}
              <button type="button" onClick={onLeave} className="btn-ghost mt-4 w-full py-2 text-sm">
                Leave room
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
