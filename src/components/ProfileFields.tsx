import { avatarEmojis } from '../config/content';
import type { Profile } from '../lib/storage';

interface Props {
  profile: Profile;
  onChange: (p: Profile) => void;
  error?: string | null;
  autoFocus?: boolean;
}

export function ProfileFields({ profile, onChange, error, autoFocus }: Props) {
  return (
    <div>
      <label htmlFor="player-name" className="mb-1.5 block text-sm font-medium text-cream/95">
        Your name
      </label>
      <div className="flex items-center gap-2">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl"
          style={{ background: `${profile.color}33`, boxShadow: `0 0 0 2px ${profile.color}` }}
          aria-hidden="true"
        >
          {profile.avatarEmoji}
        </span>
        <input
          id="player-name"
          className="field h-12 w-full px-4 text-base"
          placeholder="e.g. Aarav"
          maxLength={24}
          autoComplete="nickname"
          autoFocus={autoFocus}
          value={profile.name}
          onChange={(e) => onChange({ ...profile, name: e.target.value })}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'name-error' : undefined}
        />
      </div>
      {error && (
        <p id="name-error" className="mt-1.5 text-sm font-semibold text-gold-soft" role="alert">
          {error}
        </p>
      )}
      <fieldset className="mt-3">
        <legend className="mb-1.5 text-xs font-medium text-cream/85">Pick your avatar</legend>
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 py-1">
          {avatarEmojis.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange({ ...profile, avatarEmoji: e })}
              aria-pressed={profile.avatarEmoji === e}
              aria-label={`Avatar ${e}`}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl transition ${
                profile.avatarEmoji === e ? 'bg-gold ring-2 ring-ink' : 'hover:bg-white/10'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
