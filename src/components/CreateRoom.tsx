import { useMemo, useState } from 'react';
import { defaultBoard, templates } from '../config/content';
import { cleanItems, requiredItemCount } from '../lib/board';
import { buildRoomPath, buildRoomUrl, copyText, genRoomCode, type BoardConfig } from '../lib/share';
import { BackIcon, CopyIcon, ShareIcon } from './icons/UiIcons';

interface Props {
  /** Skip the editor: create a room with the poster board right away. */
  quick?: boolean;
  onBack: () => void;
  navigate: (to: string) => void;
}

const MAX_ITEM_LEN = 100;

function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-white/10">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-gold"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-cream/75">{hint}</span>
      </span>
    </label>
  );
}

export function CreateRoom({ quick = false, onBack, navigate }: Props) {
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [title, setTitle] = useState(templates[0].title);
  const [itemsText, setItemsText] = useState(templates[0].items.join('\n'));
  const [freeCenter, setFreeCenter] = useState(true);
  const [freeText, setFreeText] = useState(templates[0].freeText ?? '');
  const [keepOrder, setKeepOrder] = useState(templates[0].keepOrder ?? false);
  const [hideItemText, setHideItemText] = useState(false);
  const [created, setCreated] = useState<{ code: string; config: BoardConfig } | null>(() =>
    quick ? { code: genRoomCode(), config: defaultBoard } : null,
  );
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const items = useMemo(() => cleanItems(itemsText.split('\n')), [itemsText]);
  const need = requiredItemCount(freeCenter);

  const { errors, warnings } = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!title.trim()) errors.push('Give your board a title.');
    if (items.length < need) {
      const missing = need - items.length;
      errors.push(`Add ${missing} more item${missing > 1 ? 's' : ''}. You need at least ${need}${freeCenter ? ' (plus the free center)' : ''}.`);
    }
    const tooLong = items.filter((i) => i.length > MAX_ITEM_LEN).length;
    if (tooLong) errors.push(`${tooLong} item${tooLong > 1 ? 's are' : ' is'} longer than ${MAX_ITEM_LEN} characters. Keep squares short.`);
    const lower = items.map((i) => i.toLowerCase());
    const dupes = lower.length - new Set(lower).size;
    if (dupes) warnings.push(`${dupes} duplicate item${dupes > 1 ? 's' : ''}. They may show up twice on the card.`);
    if (items.length > need) {
      warnings.push(
        keepOrder
          ? `Only the first ${need} items will be used (in order).`
          : `The room picks ${need} of your ${items.length} items, shuffled the same way for everyone.`,
      );
    }
    return { errors, warnings };
  }, [title, items, need, freeCenter, keepOrder]);

  const pickTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setTemplateId(id);
    setTitle(t.title);
    setItemsText(t.items.join('\n'));
    setKeepOrder(t.keepOrder ?? false);
    setFreeText(t.freeText ?? '');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (errors.length) return;
    const config: BoardConfig = {
      title: title.trim(),
      items,
      freeCenter,
      keepOrder,
      hideItemText,
      ...(freeCenter && freeText.trim() ? { freeText: freeText.trim() } : {}),
    };
    setCreated({ code: genRoomCode(), config });
  };

  if (created) {
    const url = buildRoomUrl(window.location.origin, created.code, created.config);
    const canShare = typeof navigator.share === 'function';
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10">
        <section className="glass banner-in rounded-3xl p-6 text-center">
          <p className="text-4xl" aria-hidden="true">🎆</p>
          <h1 className="mt-2 font-display text-3xl text-gold-gradient">Your room is ready!</h1>
          <p className="mt-1 font-display text-lg font-bold text-gold-soft">{created.config.title}</p>
          <p className="mt-2 text-sm text-cream/85">Drop this link in the group chat. Everyone who opens it plays the same card.</p>
          <p className="mt-5 text-xs uppercase tracking-widest text-cream/70">Room code</p>
          <p className="font-mono text-4xl font-bold tracking-[0.3em] text-gold">{created.code}</p>
          <label htmlFor="invite-url" className="sr-only">Invite link</label>
          <input
            id="invite-url"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
            className="field mt-5 h-11 w-full px-3 font-mono text-xs"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn-ghost flex h-11 flex-1 items-center justify-center gap-2 text-sm font-semibold"
              onClick={async () => setCopied(await copyText(url))}
            >
              <CopyIcon className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy link'}
            </button>
            {canShare && (
              <button
                type="button"
                className="btn-ghost flex h-11 flex-1 items-center justify-center gap-2 text-sm font-semibold"
                onClick={() => {
                  navigator.share({ title: created.config.title, text: `Join my ${created.config.title} room! 🪔`, url }).catch(() => undefined);
                }}
              >
                <ShareIcon className="h-4 w-4" /> Share
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-cream/75">
            Joining by code alone won’t work: the board lives in the link, so share the full link.
          </p>
          <button
            type="button"
            className="btn-primary mt-6 h-12 w-full text-base"
            onClick={() => navigate(buildRoomPath(created.code, created.config))}
          >
            Enter room →
          </button>
          <div className="mt-4 flex justify-center gap-6 text-sm text-cream/85">
            <button type="button" className="min-h-11 underline-offset-4 hover:underline" onClick={onBack}>
              Back home
            </button>
            <button type="button" className="min-h-11 underline-offset-4 hover:underline" onClick={() => setCreated(null)}>
              Customize board
            </button>
          </div>
        </section>
      </main>
    );
  }

  const showErrors = submitted || items.length > 0;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-12 pt-6">
      <button type="button" onClick={onBack} className="btn-ghost flex h-10 items-center gap-1 pl-2 pr-4 text-sm">
        <BackIcon className="h-4 w-4" /> Back
      </button>
      <h1 className="mt-4 font-display text-4xl text-gold-gradient">Custom board</h1>

      <form className="mt-5 space-y-4" onSubmit={handleCreate} noValidate>
        <fieldset className="glass rounded-3xl p-5">
          <legend className="sr-only">Template</legend>
          <p className="mb-2 text-sm font-medium text-cream/90">Start from a template</p>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTemplate(t.id)}
                aria-pressed={templateId === t.id}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  templateId === t.id ? 'border-ink bg-gold font-semibold text-berry shadow-[2px_2px_0_var(--color-ink)]' : 'border-gold/60 hover:bg-white/10'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>

          <label htmlFor="board-title" className="mt-5 block text-sm font-medium text-cream/90">
            Board title
          </label>
          <input
            id="board-title"
            className="field mt-1.5 h-12 w-full px-4"
            value={title}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="mt-5 flex items-end justify-between">
            <label htmlFor="board-items" className="block text-sm font-medium text-cream/90">
              Squares <span className="text-cream/70">(one per line)</span>
            </label>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                items.length >= need ? 'bg-gold text-berry' : 'bg-night text-gold-soft'
              }`}
              aria-live="polite"
            >
              {items.length} / {need} needed
            </span>
          </div>
          <textarea
            id="board-items"
            className="field mt-1.5 h-72 w-full resize-y p-3 text-sm leading-relaxed"
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            spellCheck
            aria-describedby="items-feedback"
            aria-invalid={showErrors && errors.length ? true : undefined}
          />
          <div id="items-feedback" className="mt-2 space-y-1">
            {showErrors &&
              errors.map((e) => (
                <p key={e} className="text-sm font-semibold text-gold-soft" role="alert">
                  ⚠️ {e}
                </p>
              ))}
            {warnings.map((w) => (
              <p key={w} className="text-xs text-cream/75">
                ℹ️ {w}
              </p>
            ))}
          </div>
        </fieldset>

        <fieldset className="glass space-y-1 rounded-3xl p-3">
          <legend className="sr-only">Options</legend>
          <Toggle
            id="opt-free"
            label="Free center square"
            hint="A starburst in the middle that counts as marked."
            checked={freeCenter}
            onChange={setFreeCenter}
          />
          {freeCenter && (
            <div className="px-2 pb-2">
              <label htmlFor="free-text" className="block text-xs font-medium text-cream/85">
                Center square text <span className="text-cream/75">(optional, defaults to FREE)</span>
              </label>
              <input
                id="free-text"
                className="field mt-1 h-11 w-full px-3"
                value={freeText}
                maxLength={40}
                placeholder="FREE"
                onChange={(e) => setFreeText(e.target.value)}
              />
            </div>
          )}
          <Toggle
            id="opt-order"
            label="Keep my item order"
            hint="Don’t shuffle. Squares fill the card left to right, top to bottom."
            checked={keepOrder}
            onChange={setKeepOrder}
          />
          <Toggle
            id="opt-hide"
            label="Hide item text in the feed"
            hint="Feed says “Aarav crossed off a square” instead of naming it."
            checked={hideItemText}
            onChange={setHideItemText}
          />
        </fieldset>

        <button type="submit" className="btn-primary h-12 w-full text-base" disabled={submitted && errors.length > 0}>
          🪔 Create room & get link
        </button>
      </form>
    </main>
  );
}
