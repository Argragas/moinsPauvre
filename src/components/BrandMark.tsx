const BARS = [3, 1.5, 2, 1, 3, 1.5, 1, 2.5, 1.5, 3]

export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.30,
        background: 'var(--grad-blue)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.045,
        padding: size * 0.26,
        boxShadow: '0 10px 26px -8px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.3)',
      }}
    >
      {BARS.map((w, i) => (
        <div key={i} style={{ width: w, height: '100%', background: '#fff', borderRadius: 1, opacity: 0.55 + (i % 3) * 0.22 }} />
      ))}
    </div>
  )
}
