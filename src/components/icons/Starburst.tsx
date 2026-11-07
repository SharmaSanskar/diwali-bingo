/** Spiky comic starburst used for the free center square (yellow fill, ink outline). */
const POINTS = (() => {
  const spikes = 14;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 48 : 33 + ((i * 7) % 5);
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
})();

export function Starburst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon points={POINTS} fill="var(--color-gold)" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}
