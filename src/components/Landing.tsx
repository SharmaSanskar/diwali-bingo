import { useState } from 'react';
import { tagline } from '../config/content';
import { parseJoinInput } from '../lib/share';
import type { Profile } from '../lib/storage';
import { hasSupabaseConfig } from '../lib/supabase';
import { CreateRoom } from './CreateRoom';
import { ProfileFields } from './ProfileFields';
import { PosterTitle } from './PosterTitle';
import { RulesBox } from './RulesBox';

interface Props {
  profile: Profile;
  onProfileChange: (p: Profile) => void;
  navigate: (to: string) => void;
}

export function Landing({ profile, onProfileChange, navigate }: Props) {
  const [view, setView] = useState<'home' | 'create' | 'quick'>('home');
  const [joinInput, setJoinInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const requireName = (): boolean => {
    if (!profile.name.trim()) {
      setNameError('Please enter your name first, so friends know who’s crossing things off.');
      document.getElementById('player-name')?.focus();
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireName()) return;
    const target = parseJoinInput(joinInput);
    if (!target) {
      setJoinError('That doesn’t look like an invite link or room code.');
      return;
    }
    setJoinError(null);
    navigate(`/${target.roomCode}${target.hash ? `#${target.hash}` : ''}`);
  };

  if (view === 'create' || view === 'quick') {
    return <CreateRoom quick={view === 'quick'} onBack={() => setView('home')} navigate={navigate} />;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-24 pt-6 sm:pt-12">
      <h1 className="sr-only">Chilcott Diwali Party Bingo</h1>
      <PosterTitle />
      <p className="mx-auto mt-4 max-w-xs text-center text-sm font-medium text-cream/90">{tagline}</p>

      {!hasSupabaseConfig && (
        <div className="mt-6 rounded-2xl border border-marigold/40 bg-night/60 p-3 text-sm text-cream" role="note">
          <strong>Realtime isn’t set up yet.</strong> You can still create a room and play solo. Add your Supabase keys
          to <code className="rounded bg-black/30 px-1">.env</code> to play with friends (see README).
        </div>
      )}

      <section className="glass mt-6 rounded-3xl p-5">
        <ProfileFields
          profile={profile}
          onChange={(p) => {
            onProfileChange(p);
            if (p.name.trim()) setNameError(null);
          }}
          error={nameError}
        />
      </section>

      <section className="glass mt-4 rounded-3xl p-5">
        <h2 className="font-display text-2xl font-extrabold text-gold">Host the party board</h2>
        <p className="mt-1 text-sm text-cream/85">The poster board, all 25 squares exactly as printed. One tap, one link to share.</p>
        <button
          type="button"
          className="btn-primary mt-4 h-14 w-full text-lg"
          onClick={() => {
            if (requireName()) setView('quick');
          }}
        >
          🪔 Quick start
        </button>
      </section>

      <form className="glass mt-4 rounded-3xl p-5" onSubmit={handleJoin} noValidate>
        <h2 className="font-display text-2xl font-extrabold text-gold">Join friends</h2>
        <label htmlFor="join-input" className="mt-1 block text-sm text-cream/70">
          Paste the invite link (or a room code)
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id="join-input"
            className="field h-12 min-w-0 flex-1 px-4"
            placeholder="https://…/ABC123#…"
            value={joinInput}
            onChange={(e) => setJoinInput(e.target.value)}
            aria-invalid={joinError ? true : undefined}
            aria-describedby={joinError ? 'join-error' : undefined}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button type="submit" className="btn-ghost h-12 shrink-0 px-5 font-semibold">
            Join
          </button>
        </div>
        {joinError && (
          <p id="join-error" className="mt-2 text-sm font-semibold text-gold-soft" role="alert">
            {joinError}
          </p>
        )}
      </form>

      <RulesBox className="mt-6" />

      <details className="mt-6 rounded-3xl border-2 border-dashed border-gold/60 p-4">
        <summary className="cursor-pointer select-none font-display text-lg font-bold text-gold">Advanced: make a custom board</summary>
        <p className="mt-2 text-sm text-cream/85">Write your own squares, shuffle them, or start from another template.</p>
        <button
          type="button"
          className="btn-ghost mt-3 h-12 w-full font-semibold"
          onClick={() => {
            if (requireName()) setView('create');
          }}
        >
          ✏️ Build a custom board
        </button>
      </details>

      <p className="mt-auto pt-10 text-center text-xs text-cream/70">Shubh Deepavali 🪔 May your board be bright.</p>
    </main>
  );
}
