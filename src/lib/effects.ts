import confetti from 'canvas-confetti';

const COLORS = ['#f5b942', '#ff9933', '#ffcf6b', '#e6007e', '#ff8c1a', '#fff4dc', '#2ec4b6'];
const GOLD = ['#f5b942', '#ff9933', '#ffcf6b', '#fff4dc', '#ff8c1a'];
const Z = 200;

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Your own line: medium gold and saffron burst. */
export function lineBurst(): void {
  if (prefersReducedMotion()) return;
  void confetti({
    particleCount: 110,
    spread: 80,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.65 },
    colors: GOLD,
    zIndex: Z,
    scalar: 1.05,
  });
}

/** A friend's line: small burst from the top. */
export function friendBurst(): void {
  if (prefersReducedMotion()) return;
  void confetti({
    particleCount: 35,
    spread: 60,
    startVelocity: 28,
    origin: { x: 0.5, y: 0.15 },
    colors: COLORS,
    gravity: 1.1,
    ticks: 140,
    scalar: 0.8,
    zIndex: Z,
  });
}

/** Firework-style bursts. `big` for your own full board. */
export function fireworks(size: 'big' | 'medium'): void {
  if (prefersReducedMotion()) return;
  const duration = size === 'big' ? 4200 : 2400;
  const end = Date.now() + duration;
  const base = size === 'big' ? 60 : 30;

  if (size === 'big') {
    void confetti({ particleCount: 180, spread: 120, startVelocity: 55, origin: { y: 0.7 }, colors: COLORS, zIndex: Z });
    void confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors: COLORS, zIndex: Z });
    void confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors: COLORS, zIndex: Z });
  }

  const timer = window.setInterval(() => {
    const left = end - Date.now();
    if (left <= 0) {
      window.clearInterval(timer);
      return;
    }
    const count = Math.max(10, Math.round(base * (left / duration)));
    const common = { startVelocity: 30, spread: 360, ticks: 70, zIndex: Z, colors: COLORS, scalar: 0.9 };
    void confetti({ ...common, particleCount: count, origin: { x: 0.1 + Math.random() * 0.2, y: Math.random() * 0.4 + 0.05 } });
    void confetti({ ...common, particleCount: count, origin: { x: 0.7 + Math.random() * 0.2, y: Math.random() * 0.4 + 0.05 } });
  }, 260);
}
