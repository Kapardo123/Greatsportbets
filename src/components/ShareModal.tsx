import { useEffect, useRef, useState } from 'react'
import { Download, X } from 'lucide-react'
import { toPng } from 'html-to-image'
import type { Bet } from '../lib/types'
import { Ticket } from './Ticket'
import { BrandMark } from './Graphics'

export function ShareModal({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function download() {
    if (!ref.current) return
    setBusy(true)
    setErr('')
    try {
      await document.fonts.ready
      const url = await toPng(ref.current, { pixelRatio: 2.5, cacheBust: true })
      const a = document.createElement('a')
      a.href = url
      a.download = `great-sport-bets-${bet.kind === 'coupon' ? 'kupon' : 'typ'}-${bet.id.replace('demo-', '').slice(0, 6)}.png`
      a.click()
    } catch {
      setErr('Nie udało się wygenerować grafiki. Spróbuj ponownie lub zrób zrzut ekranu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <div className="drawer-head">
          <h2 id="share-title">Grafika do social mediów</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Zamknij"><X /></button>
        </div>
        <div className="modal-body">
          <div className="share-stage">
            <div className="share-card" ref={ref}>
              <div className="share-card-head">
                <span className="brand" style={{ pointerEvents: 'none' }}>
                  <BrandMark />
                  <span className="brand-word">Great Sport<br /><span>Bets</span></span>
                </span>
                <span className="eyebrow" style={{ color: 'var(--volt)' }}>{bet.kind === 'coupon' ? 'Kupon dnia' : 'Typ dnia'}</span>
              </div>
              <Ticket bet={bet} readOnly />
              <div className="share-card-foot">
                <span>Graj odpowiedzialnie · 18+</span>
                <span>greatsportbets</span>
              </div>
            </div>
          </div>
          {err && <p className="form-error" style={{ marginTop: 12 }}>{err}</p>}
          <button type="button" className="btn btn-primary" onClick={download} disabled={busy} style={{ width: '100%', marginTop: 16, height: 48, justifyContent: 'center' }}>
            <Download /> {busy ? 'Generuję…' : 'Pobierz PNG'}
          </button>
        </div>
      </div>
    </>
  )
}
