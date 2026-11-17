import { useEffect, useMemo, useRef, useState } from 'react'
import type { Stats } from '../lib/calc'
import { fmtDate, signedMoney } from '../lib/calc'

const PAD = { t: 14, r: 14, b: 26, l: 52 }

export function ProfitChart({ curve }: { curve: Stats['curve'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(640)
  const [H, setH] = useState(220)
  const hasData = curve.length > 0
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setW(Math.max(200, Math.round(e.contentRect.width)))
      setH(Math.round(e.contentRect.height) || 220)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [hasData])

  const geo = useMemo(() => {
    const pts = [{ value: 0, date: '' }, ...curve]
    const vals = pts.map((p) => p.value)
    let min = Math.min(0, ...vals)
    let max = Math.max(0, ...vals)
    if (max - min < 1) { max += 1; min -= 1 }
    const span = max - min
    min -= span * 0.08
    max += span * 0.08
    const x = (i: number) => PAD.l + (i / Math.max(1, pts.length - 1)) * (W - PAD.l - PAD.r)
    const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b)
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
    const area = `${line}L${x(pts.length - 1)},${y(0)}L${x(0)},${y(0)}Z`
    const ticks = niceTicks(min, max, 4)
    return { pts, x, y, line, area, ticks }
  }, [curve, W, H])

  if (curve.length === 0) {
    return <div className="chart-empty">Wykres pojawi się po rozliczeniu pierwszego typu.</div>
  }

  const last = geo.pts.length - 1
  const active = hover ?? last
  const ap = geo.pts[active]
  const endVal = geo.pts[last].value
  const tone = endVal >= 0 ? 'var(--volt)' : 'var(--red)'

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * last)
    setHover(Math.max(1, Math.min(last, i)))
  }

  return (
    <>
      <div ref={box} className="chart-svg"><svg
        width={W}
        height={H}
        style={{ display: 'block', overflow: 'visible' }}
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Wykres bilansu: ${signedMoney(endVal)} po ${curve.length} rozliczonych typach`}
      >
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={tone} stopOpacity=".28" />
            <stop offset="1" stopColor={tone} stopOpacity="0" />
          </linearGradient>
        </defs>
        {geo.ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={geo.y(t)} y2={geo.y(t)} stroke="var(--line)" strokeDasharray={t === 0 ? '0' : '2 4'} vectorEffect="non-scaling-stroke" />
            <text x={PAD.l - 10} y={geo.y(t) + 4} textAnchor="end" fill="var(--muted)" fontSize="11" fontFamily="var(--mono)">
              {t > 0 ? '+' : ''}{Math.round(t)}
            </text>
          </g>
        ))}
        <path d={geo.area} fill="url(#area)" />
        <path d={geo.line} fill="none" stroke={tone} strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hover !== null && (
          <line x1={geo.x(active)} x2={geo.x(active)} y1={PAD.t} y2={H - PAD.b} stroke="var(--chalk-dim)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        )}
        <circle cx={geo.x(active)} cy={geo.y(ap.value)} r="5" fill="var(--ink)" stroke={tone} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        <text x={PAD.l} y={H - 6} fill="var(--muted)" fontSize="11" fontFamily="var(--mono)">{fmtDate(geo.pts[1].date)}</text>
        <text x={W - PAD.r} y={H - 6} textAnchor="end" fill="var(--muted)" fontSize="11" fontFamily="var(--mono)">{fmtDate(geo.pts[last].date)}</text>
      </svg></div>
      <div className="chart-tip">
        {hover !== null && 'bet' in ap
          ? `${fmtDate(ap.date)} · ${(ap as Stats['curve'][number]).bet.legs[0].event}${(ap as Stats['curve'][number]).bet.legs.length > 1 ? ` +${(ap as Stats['curve'][number]).bet.legs.length - 1}` : ''} → ${signedMoney(ap.value)}`
          : ' '}
      </div>
    </>
  )
}

function niceTicks(min: number, max: number, n: number) {
  const raw = (max - min) / n
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw
  const out: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) out.push(Math.round(v * 100) / 100)
  return out
}
