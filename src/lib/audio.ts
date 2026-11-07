// All sounds are synthesized with the Web Audio API. No audio files.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let volume = 0.8;
let lastFriendTick = 0;

function getCtor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext ?? w.webkitAudioContext;
}

/**
 * iOS uses an extra 'interrupted' state (screen lock, app switch, incoming call), so anything
 * other than 'running' needs a resume, not just 'suspended'.
 */
function needsResume(c: AudioContext): boolean {
  return (c.state as string) !== 'running' && c.state !== 'closed';
}

let primed = false;

/** Create or resume the AudioContext. Call from a user gesture. */
export function unlockAudio(): void {
  const Ctor = getCtor();
  if (!Ctor) return;
  if (!ctx || ctx.state === 'closed') {
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : volume;
      master.connect(ctx.destination);
      primed = false;
    } catch {
      ctx = null;
      master = null;
      return;
    }
  }
  if (needsResume(ctx)) void ctx.resume().catch(() => undefined);
  // Older iOS only truly unlocks once something is played inside the gesture: play one silent sample.
  if (!primed) {
    try {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
      primed = true;
    } catch {
      // ignore
    }
  }
}

/** Resume after the tab comes back (iOS suspends/interrupts audio when the phone locks). */
export function resumeIfNeeded(): void {
  if (ctx && needsResume(ctx)) void ctx.resume().catch(() => undefined);
}

function applyGain(): void {
  if (ctx && master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.02);
}

export function setMuted(m: boolean): void {
  muted = m;
  applyGain();
}

export function setVolume(v: number): void {
  volume = Math.min(1, Math.max(0, v));
  applyGain();
}

interface Out {
  c: AudioContext;
  out: AudioNode;
}

function ready(): Out | null {
  if (muted || !ctx || !master) return null;
  if (needsResume(ctx)) void ctx.resume().catch(() => undefined);
  return { c: ctx, out: master };
}

interface ToneOpts {
  freq: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  start?: number;
  attack?: number;
  freqEnd?: number;
  vibrato?: number;
}

function tone({ c, out }: Out, o: ToneOpts): void {
  const t0 = c.currentTime + (o.start ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + o.duration);
  if (o.vibrato) {
    const lfo = c.createOscillator();
    const lfoGain = c.createGain();
    lfo.frequency.value = o.vibrato;
    lfoGain.gain.value = o.freq * 0.012;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + o.duration + 0.05);
  }
  const attack = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.gain), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.duration);
  osc.connect(g).connect(out);
  osc.start(t0);
  osc.stop(t0 + o.duration + 0.05);
}

function noiseBurst({ c, out }: Out, start: number, duration: number, gain: number, cutoff: number): void {
  const t0 = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(out);
  src.start(t0);
}

/** Bell-like tone: fundamental plus inharmonic partials. */
function bell(o: Out, freq: number, start: number, gain: number, duration = 1.1): void {
  tone(o, { freq, start, gain, duration, type: 'sine', attack: 0.004 });
  tone(o, { freq: freq * 2.76, start, gain: gain * 0.28, duration: duration * 0.55, type: 'sine' });
  tone(o, { freq: freq * 5.4, start, gain: gain * 0.1, duration: duration * 0.3, type: 'sine' });
}

export const sfx = {
  /** Your cross-off: thud + bright tick. */
  stamp(): void {
    const o = ready();
    if (!o) return;
    tone(o, { freq: 150, freqEnd: 55, duration: 0.16, gain: 0.55, type: 'sine' });
    noiseBurst(o, 0, 0.06, 0.25, 900);
    tone(o, { freq: 2100, duration: 0.05, gain: 0.12, type: 'triangle', start: 0.025 });
    tone(o, { freq: 3150, duration: 0.04, gain: 0.05, type: 'sine', start: 0.03 });
  },

  /** Un-mark: soft low blip. */
  unmark(): void {
    const o = ready();
    if (!o) return;
    tone(o, { freq: 320, freqEnd: 200, duration: 0.13, gain: 0.14, type: 'sine' });
  },

  /** Friend cross-off: very quiet tick, rate limited. */
  friendTick(): void {
    const now = performance.now();
    if (now - lastFriendTick < 400) return;
    lastFriendTick = now;
    const o = ready();
    if (!o) return;
    tone(o, { freq: 1700, duration: 0.035, gain: 0.05, type: 'triangle' });
  },

  /** Rising three-note chime. */
  lineChime(own: boolean): void {
    const o = ready();
    if (!o) return;
    const notes = [523.25, 659.25, 783.99];
    const g = own ? 0.26 : 0.13;
    notes.forEach((f, i) => {
      tone(o, { freq: f, start: i * 0.1, duration: 0.5, gain: g, type: 'triangle' });
      if (own) tone(o, { freq: f * 2, start: i * 0.1, duration: 0.35, gain: g * 0.3, type: 'sine' });
    });
    if (own) bell(o, 1046.5, 0.32, 0.18, 1.2);
  },

  /** Tension cue: pulsing ascending notes. */
  oneAway(own: boolean): void {
    const o = ready();
    if (!o) return;
    if (own) {
      [0, 0.09, 0.18].forEach((t) =>
        tone(o, { freq: 392, start: t, duration: 0.08, gain: 0.16, type: 'sawtooth' }),
      );
      tone(o, { freq: 587.33, start: 0.3, duration: 0.45, gain: 0.18, type: 'triangle', vibrato: 9 });
      tone(o, { freq: 293.66, start: 0.3, duration: 0.45, gain: 0.08, type: 'sine' });
    } else {
      tone(o, { freq: 440, duration: 0.14, gain: 0.08, type: 'triangle' });
      tone(o, { freq: 587.33, start: 0.15, duration: 0.3, gain: 0.08, type: 'triangle', vibrato: 7 });
    }
  },

  /** Full board: celebratory bell arpeggio. */
  fanfare(): void {
    const o = ready();
    if (!o) return;
    const arp = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
    arp.forEach((f, i) => bell(o, f, i * 0.085, 0.16, 1.3));
    const chordAt = arp.length * 0.085 + 0.1;
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => {
      tone(o, { freq: f, start: chordAt, duration: 1.6, gain: 0.09, type: 'triangle', attack: 0.03 });
    });
    bell(o, 2093, chordAt + 0.2, 0.12, 1.8);
  },

  /** Reaction pop. */
  reaction(): void {
    const o = ready();
    if (!o) return;
    tone(o, { freq: 880, freqEnd: 1320, duration: 0.09, gain: 0.07, type: 'sine' });
  },
};
