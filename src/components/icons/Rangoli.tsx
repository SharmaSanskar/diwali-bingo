/** Line-art mandala / rangoli used as a faint background pattern. */
export function Rangoli({ className }: { className?: string }) {
  const petals16 = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const petals8 = Array.from({ length: 8 }, (_, i) => i * 45);
  const dots24 = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true" fill="none" stroke="currentColor">
      <circle cx="200" cy="200" r="190" strokeWidth="1" />
      <circle cx="200" cy="200" r="178" strokeWidth="0.6" strokeDasharray="2 6" />
      {petals16.map((a) => (
        <path
          key={`o${a}`}
          d="M200 30 C222 70 222 100 200 128 C178 100 178 70 200 30 Z"
          strokeWidth="1"
          transform={`rotate(${a} 200 200)`}
        />
      ))}
      <circle cx="200" cy="200" r="72" strokeWidth="1" />
      {petals8.map((a) => (
        <path
          key={`i${a}`}
          d="M200 130 C214 150 214 166 200 182 C186 166 186 150 200 130 Z"
          strokeWidth="1.2"
          transform={`rotate(${a} 200 200)`}
        />
      ))}
      {dots24.map((a) => (
        <circle key={`d${a}`} cx="200" cy="14" r="2.5" fill="currentColor" stroke="none" transform={`rotate(${a} 200 200)`} />
      ))}
      <circle cx="200" cy="200" r="16" strokeWidth="1.4" />
      <circle cx="200" cy="200" r="6" fill="currentColor" stroke="none" />
    </svg>
  );
}
