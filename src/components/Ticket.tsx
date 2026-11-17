import { useState } from 'react'
import { Pencil, Share2, Trash2 } from 'lucide-react'
import type { Bet, Status } from '../lib/types'
import { SPORTS, STATUS_LABEL } from '../lib/types'
import { betStatus, fmtDateTime, money, nominalOdds, odds, potentialWin, profit, signedMoney, totalOdds } from '../lib/calc'
import { Barcode } from './Graphics'

interface Props {
  bet: Bet
  readOnly?: boolean
  onLegStatus?: (legId: string, s: Status) => void
  onEdit?: () => void
  onShare?: () => void
  onDelete?: () => void
}

const SETTLE: { s: Status; label: string }[] = [
  { s: 'won', label: 'Wygrany' },
  { s: 'lost', label: 'Przegrany' },
  { s: 'void', label: 'Zwrot' },
  { s: 'pending', label: 'W grze' },
]

export function Ticket({ bet, readOnly, onLegStatus, onEdit, onShare, onDelete }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const status = betStatus(bet)
  const isCoupon = bet.kind === 'coupon'
  const settled = status === 'won' || status === 'lost' || status === 'void'
  const shownOdds = status === 'pending' ? nominalOdds(bet.legs) : totalOdds(bet.legs)
  const p = profit(bet)

  return (
    <article className={`ticket is-${status}`} aria-label={`${isCoupon ? 'Kupon' : 'Typ'}: ${bet.legs.map((l) => l.event).join(', ')}`}>
      <header className="ticket-top">
        <span className="kind">
          <span className="kind-badge">{isCoupon ? 'Kupon' : 'Single'}</span>
          {isCoupon && <span>{bet.legs.length} {bet.legs.length >= 5 ? 'zdarzeń' : 'zdarzenia'}</span>}
          {!isCoupon && bet.bookmaker && <span>{bet.bookmaker}</span>}
        </span>
        <span className="id">#{bet.id.replace('demo-', '').slice(0, 6).toUpperCase()}</span>
      </header>

      {settled && <div className={`stamp ${status}`}>{STATUS_LABEL[status]}</div>}

      <ul className="legs">
        {bet.legs.map((l) => (
          <li key={l.id} className={`leg is-${l.status}`}>
            <div className="leg-meta">
              <span className="sport-code" title={SPORTS[l.sport].label}>{SPORTS[l.sport].code}</span>
              <span className="league">{l.league}</span>
              <span className="time">{fmtDateTime(l.kickoff)}</span>
            </div>
            <div className="leg-main">
              <div className="leg-event">{l.event}</div>
              <div className="leg-pick">
                {l.pick}
                {(isCoupon || !readOnly) && (
                  <button
                    type="button"
                    className={`leg-status ${l.status}`}
                    disabled={readOnly}
                    onClick={() => setOpen(open === l.id ? null : l.id)}
                    aria-expanded={open === l.id}
                    title="Zmień wynik zdarzenia"
                  >
                    <i /> {STATUS_LABEL[l.status]}
                  </button>
                )}
              </div>
              <div className="leg-odds">{odds(l.odds)}</div>
            </div>
            {!readOnly && open === l.id && (
              <div className="settle" role="group" aria-label="Rozlicz zdarzenie">
                {SETTLE.map(({ s, label }) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={l.status === s}
                    onClick={() => {
                      onLegStatus?.(l.id, s)
                      setOpen(null)
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="perf" aria-hidden="true"><span className="n2" /></div>

      <div className="ticket-sum">
        <div>
          <span className="eyebrow">Stawka</span>
          <span className="v">{money(bet.stake)}</span>
        </div>
        <div>
          <span className="eyebrow">{isCoupon ? 'Kurs łączny' : 'Kurs'}</span>
          <span className="v big">{odds(shownOdds)}</span>
        </div>
        <div>
          <span className="eyebrow">{status === 'pending' ? 'Do wygrania' : status === 'void' ? 'Zwrot' : 'Zysk'}</span>
          <span className={`v ${status}`}>
            {status === 'pending' ? money(potentialWin(bet)) : status === 'void' ? money(bet.stake) : signedMoney(p)}
          </span>
        </div>
      </div>

      {bet.note && <p className="ticket-note">{bet.note}</p>}

      <div className="ticket-foot">
        <span className="conf" title={`Pewność ${bet.confidence}/5`}>
          Pewność
          <span className="conf-bars">
            {[1, 2, 3, 4, 5].map((n) => (
              <i key={n} className={n <= bet.confidence ? 'on' : ''} style={{ height: 4 + n * 2.4 }} />
            ))}
          </span>
        </span>
        {settled ? <span style={{ height: 26 }} /> : <Barcode seed={bet.id} />}
      </div>

      {!readOnly && (
        <div className="ticket-actions">
          <button type="button" onClick={onEdit}><Pencil /> Edytuj</button>
          <button type="button" onClick={onShare}><Share2 /> Grafika</button>
          <button type="button" className="danger" onClick={onDelete}><Trash2 /> Usuń</button>
        </div>
      )}
    </article>
  )
}
