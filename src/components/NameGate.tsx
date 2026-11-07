import { useState } from 'react';
import type { Profile } from '../lib/storage';
import { ProfileFields } from './ProfileFields';
import { defaultBoard } from '../config/content';
import { PosterTitle } from './PosterTitle';
import { RulesBox } from './RulesBox';
import { Diya } from './icons/Diya';

interface Props {
  title: string;
  profile: Profile;
  onDone: (p: Profile) => void;
  onBack: () => void;
}

/** Asks for a name when someone opens an invite link for the first time. */
export function NameGate({ title, profile, onDone, onBack }: Props) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError('Please enter your name so friends know who’s playing.');
      return;
    }
    onDone({ ...draft, name: draft.name.trim() });
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-8">
      {title === defaultBoard.title && <PosterTitle size="sm" />}
      <form className="glass mt-4 rounded-3xl p-5 sm:p-6" onSubmit={submit} noValidate>
        {title !== defaultBoard.title && <Diya className="mx-auto h-16 w-16" />}
        <p className="mt-1 text-center text-sm text-cream/90">You’re invited to</p>
        <h1 className="text-center font-display text-3xl text-gold-gradient">{title}</h1>
        <div className="mt-6">
          <ProfileFields profile={draft} onChange={setDraft} error={error} autoFocus />
        </div>
        <button type="submit" className="btn-primary mt-6 h-12 w-full text-base">
          Join the game 🪔
        </button>
        <button type="button" onClick={onBack} className="mt-2 min-h-11 w-full text-sm text-cream/85 underline-offset-4 hover:underline">
          Back home
        </button>
      </form>
      <RulesBox className="mt-5" />
    </main>
  );
}
