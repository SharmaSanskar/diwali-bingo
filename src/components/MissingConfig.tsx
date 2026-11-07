import { useState } from 'react';
import { parseJoinInput } from '../lib/share';
import { Diya } from './icons/Diya';

interface Props {
  roomCode: string;
  navigate: (to: string) => void;
}

/** Someone opened `/{code}` without the `#board` part of the link. */
export function MissingConfig({ roomCode, navigate }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseJoinInput(value);
    if (!t || !t.hash) {
      setError('Paste the whole invite link, including the part after the #.');
      return;
    }
    navigate(`/${t.roomCode}#${t.hash}`);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10">
      <section className="glass rounded-3xl p-6 text-center">
        <Diya className="mx-auto h-16 w-16" lit={false} />
        <h1 className="mt-2 font-display text-3xl text-gold-gradient">Almost there!</h1>
        <p className="mt-3 text-sm text-cream/95">
          We found room <span className="font-mono font-bold tracking-widest text-gold">{roomCode}</span>, but not the board
          itself. The board lives inside the invite link, so there’s no server to fetch it from.
        </p>
        <p className="mt-2 text-sm text-cream/95">Ask whoever invited you for the <strong>full link</strong>, then paste it here:</p>
        <form onSubmit={submit} className="mt-4 text-left" noValidate>
          <label htmlFor="full-link" className="sr-only">
            Full invite link
          </label>
          <input
            id="full-link"
            className="field h-12 w-full px-4 text-sm"
            placeholder={`https://…/${roomCode}#…`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'full-link-error' : undefined}
          />
          {error && (
            <p id="full-link-error" className="mt-2 text-sm font-semibold text-gold" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn-primary mt-3 h-12 w-full">
            Join with link
          </button>
        </form>
        <button type="button" className="mt-4 text-sm text-cream/85 underline-offset-4 hover:underline" onClick={() => navigate('/')}>
          Back home
        </button>
      </section>
    </main>
  );
}
