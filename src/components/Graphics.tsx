/** Ręcznie rysowane grafiki SVG – bez stocków, bez generatorów. */

export function BrandMark({ className = 'brand-mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 10h48v15a7 7 0 0 0 0 14v15H8V39a7 7 0 0 0 0-14z" fill="var(--volt)" />
      <path d="M20 32h22M34 23l9 9-9 9" stroke="var(--ink)" strokeWidth="6" fill="none" strokeLinecap="square" />
      <path d="M8 18h4M8 46h4" stroke="var(--ink)" strokeWidth="2" />
    </svg>
  )
}

export function Brand() {
  return (
    <a className="brand" href="./" aria-label="Great Sport Bets – strona główna">
      <BrandMark />
      <span className="brand-word">
        Great Sport<br />
        <span>Bets</span>
      </span>
    </a>
  )
}

/** Linie boiska jako tło sekcji – szkic połowy boiska widziany z góry. */
export function Pitch({ className = 'hero-pitch' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="-10" y="20" width="1220" height="480" />
        <line x1="600" y1="20" x2="600" y2="500" />
        <circle cx="600" cy="260" r="92" />
        <circle cx="600" cy="260" r="4" fill="currentColor" />
        <rect x="-10" y="130" width="176" height="260" />
        <rect x="-10" y="200" width="66" height="120" />
        <path d="M166 205a92 92 0 0 1 0 110" />
        <rect x="1034" y="130" width="176" height="260" />
        <rect x="1144" y="200" width="66" height="120" />
        <path d="M1034 205a92 92 0 0 0 0 110" />
        <circle cx="120" cy="260" r="3" fill="currentColor" />
        <circle cx="1080" cy="260" r="3" fill="currentColor" />
      </g>
    </svg>
  )
}

/** Deterministyczny „kod kreskowy” z identyfikatora kuponu. */
export function Barcode({ seed }: { seed: string }) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const bars: { x: number; w: number }[] = []
  let x = 0
  while (x < 118) {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    const w = 1 + (Math.abs(h) % 3)
    const gap = 1 + (Math.abs(h >> 4) % 3)
    if (x + w > 118) break
    bars.push({ x, w })
    x += w + gap
  }
  return (
    <svg className="barcode" viewBox="0 0 118 26" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="0" width={b.w} height="26" fill="currentColor" />
      ))}
    </svg>
  )
}
