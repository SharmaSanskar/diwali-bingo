/** Hanging string lights with marigold drops (torana-style header decoration). */
export function Torana({ className }: { className?: string }) {
  const bulbs = Array.from({ length: 21 }, (_, i) => {
    const x = 10 + i * 19;
    const y = 4 + Math.sin((i / 20) * Math.PI * 4 - Math.PI / 2) * 3 + 5;
    return { x, y, i };
  });
  const colors = ['#ffcf3f', '#ff4fa8', '#ff9933', '#2ec4b6', '#ffd98a'];
  const wire = bulbs.map((b, i) => `${i === 0 ? 'M' : 'L'}${b.x} ${b.y - 3}`).join(' ');
  return (
    <svg viewBox="0 0 400 22" preserveAspectRatio="xMidYMin slice" className={className} aria-hidden="true">
      <path d={wire} stroke="#f5b942" strokeOpacity="0.45" strokeWidth="0.8" fill="none" />
      {bulbs.map((b) =>
        b.i % 4 === 2 ? (
          <g key={b.i}>
            <line x1={b.x} y1={b.y - 3} x2={b.x} y2={b.y + 6} stroke="#f5b942" strokeOpacity="0.5" strokeWidth="0.6" />
            <circle cx={b.x} cy={b.y + 8} r="3" fill="#ff8c1a" />
            <circle cx={b.x} cy={b.y + 13} r="2.3" fill="#ffb000" />
          </g>
        ) : (
          <circle key={b.i} className="bulb" cx={b.x} cy={b.y} r="2.2" fill={colors[b.i % colors.length]} />
        ),
      )}
    </svg>
  );
}
