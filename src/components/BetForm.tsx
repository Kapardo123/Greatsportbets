import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Bet, Kind, Leg, SportId } from '../lib/types'
import { SPORTS } from '../lib/types'
import { money, nominalOdds, odds, uid } from '../lib/calc'

interface Props {
  initial?: Bet
  onSave: (bet: Bet) => void
  onClose: () => void
}

type LegDraft = Omit<Leg, 'odds'> & { odds: string }

function localInput(iso: string) {
  const d = iso ? new Date(iso) : new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

const emptyLeg = (sport: SportId = 'football'): LegDraft => {
  const t = new Date()
  t.setHours(t.getHours() + 3, 0, 0, 0)
  return { id: uid(), sport, league: '', event: '', pick: '', odds: '', kickoff: localInput(t.toISOString()), status: 'pending' }
}

const parseNum = (s: string) => Number(String(s).replace(',', '.').trim())

export function BetForm({ initial, onSave, onClose }: Props) {
  const [kind, setKind] = useState<Kind>(initial?.kind ?? 'single')
  const [legs, setLegs] = useState<LegDraft[]>(
    initial ? initial.legs.map((l) => ({ ...l, odds: String(l.odds), kickoff: localInput(l.kickoff) })) : [emptyLeg()],
  )
  const [stake, setStake] = useState(initial ? String(initial.stake) : '50')
  const [bookmaker, setBookmaker] = useState(initial?.bookmaker ?? '')
  const [confidence, setConfidence] = useState<Bet['confidence']>(initial?.confidence ?? 3)
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function switchKind(k: Kind) {
    setKind(k)
    if (k === 'coupon' && legs.length < 2) setLegs([...legs, emptyLeg(legs[0]?.sport)])
    if (k === 'single' && legs.length > 1) setLegs(legs.slice(0, 1))
  }

  const patch = (id: string, p: Partial<LegDraft>) => setLegs((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)))

  const numericLegs = legs.map((l) => ({ ...l, odds: parseNum(l.odds) || 0 }))
  const total = nominalOdds(numericLegs.map((l) => ({ ...l, odds: l.odds || 1 })))
  const stakeN = parseNum(stake) || 0

  function submit(e: React.FormEvent) {
    e.preventDefault()
    for (const [i, l] of numericLegs.entries()) {
      const n = kind === 'coupon' ? ` (zdarzenie ${i + 1})` : ''
      if (!l.event.trim()) return setError(`Wpisz nazwę meczu / wydarzenia${n}.`)
      if (!l.pick.trim()) return setError(`Wpisz swój typ${n}.`)
      if (!(l.odds >= 1.01)) return setError(`Kurs musi być ≥ 1.01${n}.`)
    }
    if (kind === 'coupon' && legs.length < 2) return setError('Kupon musi mieć co najmniej 2 zdarzenia.')
    if (!(stakeN > 0)) return setError('Podaj stawkę większą od zera.')
    onSave({
      id: initial?.id ?? uid(),
      kind,
      legs: numericLegs.map((l) => ({ ...l, kickoff: new Date(l.kickoff).toISOString(), league: l.league.trim(), event: l.event.trim(), pick: l.pick.trim() })),
      stake: stakeN,
      bookmaker: bookmaker.trim(),
      confidence,
      note: note.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <form className="drawer" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="drawer-head">
          <h2 id="form-title">{initial ? 'Edytuj typ' : 'Nowy typ'}</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Zamknij"><X /></button>
        </div>

        <div className="drawer-body">
          <div className="seg" role="group" aria-label="Rodzaj zakładu" style={{ alignSelf: 'flex-start' }}>
            <button type="button" aria-pressed={kind === 'single'} onClick={() => switchKind('single')}>Pojedynczy</button>
            <button type="button" aria-pressed={kind === 'coupon'} onClick={() => switchKind('coupon')}>Kupon (AKO)</button>
          </div>

          {legs.map((l, i) => (
            <div className="leg-edit" key={l.id}>
              {kind === 'coupon' && (
                <div className="leg-edit-head">
                  <span className="eyebrow">Zdarzenie {String(i + 1).padStart(2, '0')}</span>
                  {legs.length > 2 && (
                    <button type="button" className="btn btn-ghost btn-icon" style={{ height: 28, width: 28 }} onClick={() => setLegs(legs.filter((x) => x.id !== l.id))} aria-label={`Usuń zdarzenie ${i + 1}`}>
                      <X />
                    </button>
                  )}
                </div>
              )}
              <div className="row">
                <div className="field">
                  <label htmlFor={`sport-${l.id}`}>Dyscyplina</label>
                  <select id={`sport-${l.id}`} value={l.sport} onChange={(e) => patch(l.id, { sport: e.target.value as SportId })}>
                    {Object.entries(SPORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`league-${l.id}`}>Liga / turniej</label>
                  <input id={`league-${l.id}`} className="input" value={l.league} onChange={(e) => patch(l.id, { league: e.target.value })} placeholder="np. Ekstraklasa" />
                </div>
              </div>
              <div className="field">
                <label htmlFor={`event-${l.id}`}>Mecz / wydarzenie</label>
                <input id={`event-${l.id}`} className="input" value={l.event} onChange={(e) => patch(l.id, { event: e.target.value })} placeholder="Legia Warszawa – Lech Poznań" />
              </div>
              <div className="row row-3">
                <div className="field">
                  <label htmlFor={`pick-${l.id}`}>Typ</label>
                  <input id={`pick-${l.id}`} className="input" value={l.pick} onChange={(e) => patch(l.id, { pick: e.target.value })} placeholder="Powyżej 2,5 gola" />
                </div>
                <div className="field">
                  <label htmlFor={`odds-${l.id}`}>Kurs</label>
                  <input id={`odds-${l.id}`} className="input odds-input" inputMode="decimal" value={l.odds} onChange={(e) => patch(l.id, { odds: e.target.value })} placeholder="1.85" />
                </div>
                <div className="field">
                  <label htmlFor={`ko-${l.id}`}>Start</label>
                  <input id={`ko-${l.id}`} className="input" type="datetime-local" value={l.kickoff} onChange={(e) => patch(l.id, { kickoff: e.target.value })} />
                </div>
              </div>
            </div>
          ))}

          {kind === 'coupon' && (
            <button type="button" className="add-leg" onClick={() => setLegs([...legs, emptyLeg(legs[legs.length - 1]?.sport)])}>
              <Plus size={16} /> Dodaj zdarzenie
            </button>
          )}

          <div className="row">
            <div className="field">
              <label htmlFor="stake">Stawka (zł)</label>
              <input id="stake" className="input odds-input" inputMode="decimal" value={stake} onChange={(e) => setStake(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="bk">Bukmacher</label>
              <input id="bk" className="input" value={bookmaker} onChange={(e) => setBookmaker(e.target.value)} placeholder="np. STS, Fortuna, Superbet" />
            </div>
          </div>

          <div className="field">
            <span className="label">Pewność typu</span>
            <div className="conf-pick" role="group" aria-label="Pewność typu">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button key={n} type="button" aria-pressed={confidence === n} onClick={() => setConfidence(n)}>{n}</button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="note">Analiza / uzasadnienie</label>
            <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dlaczego ten typ? Forma, kontuzje, H2H, value…" />
          </div>
        </div>

        <div className="drawer-foot">
          <div className="summary">
            <div><span className="eyebrow">Kurs łączny</span><div className="v">{odds(total)}</div></div>
            <div><span className="eyebrow">Stawka</span><div className="v">{money(stakeN)}</div></div>
            <div><span className="eyebrow">Do wygrania</span><div className="v pos">{money(stakeN * total)}</div></div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 48, justifyContent: 'center', fontSize: 15 }}>
            {initial ? 'Zapisz zmiany' : kind === 'coupon' ? 'Dodaj kupon' : 'Dodaj typ'}
          </button>
        </div>
      </form>
    </>
  )
}
