import { Diya } from './icons/Diya';

interface Props {
  onSolo: () => void;
  onBack: () => void;
}

/** Shown when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing. */
export function SetupScreen({ onSolo, onBack }: Props) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-10">
      <section className="glass rounded-3xl p-6">
        <Diya className="mx-auto h-16 w-16" />
        <h1 className="mt-2 text-center font-display text-3xl text-gold-gradient">Realtime isn’t set up yet</h1>
        <p className="mt-3 text-sm text-cream/95">
          To play live with friends, this app needs a free Supabase project (no tables, no auth, just Realtime). It takes about
          five minutes:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-cream/95">
          <li>
            Create a free project at <span className="font-semibold text-gold">supabase.com</span>.
          </li>
          <li>
            Open <em>Project Settings → API</em> and copy the <em>Project URL</em> and the <em>anon public</em> key.
          </li>
          <li>
            Copy <code className="rounded bg-ink/50 px-1">.env.example</code> to <code className="rounded bg-ink/50 px-1">.env</code> and
            fill in:
          </li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-gold/20 bg-ink/50 p-3 text-xs leading-relaxed text-gold">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
        </pre>
        <p className="mt-3 text-sm text-cream/95">
          Restart <code className="rounded bg-ink/50 px-1">npm run dev</code>. On Vercel, add the same two variables under
          <em> Settings → Environment Variables</em> and redeploy.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button type="button" className="btn-primary h-12 flex-1" onClick={onSolo}>
            Play solo for now
          </button>
          <button type="button" className="btn-ghost h-12 flex-1" onClick={onBack}>
            Back home
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-cream/80">Solo mode works fully offline. The feed shows only your own moves.</p>
      </section>
    </main>
  );
}
