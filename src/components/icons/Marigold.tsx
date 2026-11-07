/** Simple layered marigold flower. */
export function Marigold({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const ring = (n: number, r: number, len: number, w: number, fill: string, rot = 0) =>
    Array.from({ length: n }, (_, i) => (
      <ellipse
        key={`${r}-${i}`}
        cx="50"
        cy={50 - r}
        rx={w}
        ry={len}
        fill={fill}
        stroke="#b34700"
        strokeWidth="0.8"
        transform={`rotate(${(360 / n) * i + rot} 50 50)`}
      />
    ));
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
      {ring(16, 30, 14, 8, '#ff8c00')}
      {ring(14, 20, 12, 7, '#ffa41c', 12)}
      {ring(10, 11, 9, 6, '#ffc233', 6)}
      <circle cx="50" cy="50" r="7" fill="#e06a00" />
    </svg>
  );
}
