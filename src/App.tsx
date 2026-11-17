import { useMemo, useRef, useState } from 'react'
import { Download, Plus, Search, Upload } from 'lucide-react'
import { useBets, isValidBackup } from './lib/store'
import type { Bet, SportId, Status } from './lib/types'
import { SPORTS } from './lib/types'
import { betDate, betStatus, computeStats, money, odds, pct, signedMoney } from './lib/calc'
import { Brand, Pitch } from './components/Graphics'
import { ProfitChart } from './components/ProfitChart'
import { Ticket } from './components/Ticket'
import { BetForm } from './components/BetForm'
import { ShareModal } from './components/ShareModal'

type KindFilter = 'all' | 'single' | 'coupon'
type StatusFilter = 'all' | Status

export default function App() {
  const { bets, upsert, remove, setLegStatus, replaceAll } = useBets()
  const [editing, setEditing] = useState<Bet | 'new' | null>(null)
  const [sharing, setSharing] = useState<Bet | null>(null)
  const [kind, setKind] = useState<KindFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sport, setSport] = useState<SportId | 'all'>('all')
  const [q, setQ] = useState('')
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => computeStats(bets), [bets])
  const isDemo = bets.some((b) => b.id.startsWith('demo-'))

  const flash = (m: string) => {
    setToast(m)
    window.setTimeout(() => setToast(''), 2400)
  }

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return [...bets]
      .filter((b) => kind === 'all' || b.kind === kind)
      .filter((b) => status === 'all' || betStatus(b) === status)
      .filter((b) => sport === 'all' || b.legs.some((l) => l.sport === sport))
      .filter((b) => !needle || b.legs.some((l) => `${l.event} ${l.league} ${l.pick}`.toLowerCase().includes(needle)) || b.note.toLowerCase().includes(needle))
      .sort((a, b) => {
        const pa = betStatus(a) === 'pending' ? 1 : 0
        const pb = betStatus(b) === 'pending' ? 1 : 0
        if (pa !== pb) return pb - pa
        return pa ? betDate(a).localeCompare(betDate(b)) : betDate(b).localeCompare(betDate(a))
      })
  }, [bets, kind, status, sport, q])

  const counts = {
    all: bets.length,
    single: bets.filter((b) => b.kind === 'single').length,
    coupon: bets.filter((b) => b.kind === 'coupon').length,
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(bets, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `great-sport-bets-kopia-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    flash('Kopia zapasowa pobrana')
  }

  async function importJson(f: File) {
    try {
      const data = JSON.parse(await f.text())
      if (!isValidBackup(data)) throw new Error()
      if (bets.length && !confirm(`Zastąpić obecne ${bets.length} typów danymi z pliku (${data.length})?`)) return
      replaceAll(data)
      flash(`Wczytano ${data.length} typów`)
    } catch {
      flash('To nie jest poprawny plik kopii Great Sport Bets')
    }
  }

  const streakLabel = stats.streak.type ? `${stats.streak.count}${stats.streak.type === 'won' ? 'W' : 'P'}` : '—'

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <Brand />
          <div className="topbar-actions">
            <button className="btn btn-ghost" onClick={exportJson} title="Pobierz kopię zapasową (JSON)">
              <Download /> <span className="btn-label">Kopia</span>
            </button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()} title="Wczytaj kopię zapasową">
              <Upload /> <span className="btn-label">Import</span>
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              <Plus /> <span className="btn-label">Dodaj typ</span>
            </button>
          </div>
        </div>
      </header>

      {isDemo && (
        <div className="demo-banner">
          <div className="wrap">
            <span>Na start widzisz przykładowe typy. Twoje własne zapisują się w tej przeglądarce – rób kopię przyciskiem „Kopia”.</span>
            <button onClick={() => { replaceAll(bets.filter((b) => !b.id.startsWith('demo-'))); flash('Usunięto przykłady – czas na Twoje typy') }}>Usuń przykłady</button>
          </div>
        </div>
      )}

      <section className="hero">
        <Pitch />
        <div className="wrap">
          <div>
            <div className="hero-kicker">
              <span className="live-dot" />
              <span className="eyebrow" style={{ color: 'var(--chalk-dim)' }}>
                {stats.pending ? `${stats.pending} w grze · ${money(stats.inPlay)} na kuponach` : 'Brak otwartych typów'}
              </span>
            </div>
            <h1 className="hero-title">
              Twoje typy.<br />
              <span className="outline">Twój</span> bilans.
            </h1>
            <div className="hero-profit">
              <span className={`value ${stats.profit > 0 ? 'pos' : stats.profit < 0 ? 'neg' : ''}`}>{signedMoney(stats.profit)}</span>
              <span className="sub">zysk netto z {stats.won + stats.lost} rozliczonych</span>
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-head">
              <span className="eyebrow">Krzywa bilansu</span>
              <span className="eyebrow">obrót {money(stats.staked)}</span>
            </div>
            <ProfitChart curve={stats.curve} />
          </div>
        </div>
      </section>

      <section className="board wrap" style={{ padding: 0, maxWidth: 'none' }} aria-label="Statystyki">
        <div className="board-cell">
          <span className="eyebrow">Yield / ROI</span>
          <div className={`board-value ${stats.roi > 0 ? 'pos' : stats.roi < 0 ? 'neg' : ''}`}>{pct(stats.roi, true)}</div>
        </div>
        <div className="board-cell">
          <span className="eyebrow">Skuteczność</span>
          <div className="board-value">{pct(stats.hitRate)}<small>{stats.won}/{stats.won + stats.lost}</small></div>
        </div>
        <div className="board-cell">
          <span className="eyebrow">Śr. kurs</span>
          <div className="board-value">{stats.avgOdds ? odds(stats.avgOdds) : '—'}</div>
        </div>
        <div className="board-cell">
          <span className="eyebrow">Typy</span>
          <div className="board-value">{stats.total}<small>{counts.coupon} kup.</small></div>
        </div>
        <div className="board-cell">
          <span className="eyebrow">Seria</span>
          <div className={`board-value ${stats.streak.type === 'won' ? 'pos' : stats.streak.type === 'lost' ? 'neg' : ''}`}>{streakLabel}</div>
        </div>
        <div className="board-cell">
          <span className="eyebrow">Forma · ost. 10</span>
          <div className="form-strip" aria-label="Forma z ostatnich 10 rozliczonych typów">
            {Array.from({ length: 10 }, (_, i) => {
              const s = stats.form[i - (10 - stats.form.length)]
              return <span key={i} className={`form-pip ${s ?? 'none'}`}>{s === 'won' ? 'W' : s === 'lost' ? 'P' : ''}</span>
            })}
          </div>
        </div>
      </section>

      <main className="wrap">
        <div className="feed-head">
          <h2 className="feed-title">Typy & kupony<sup>{visible.length}</sup></h2>
        </div>
        <div className="toolbar">
          <div className="seg" role="group" aria-label="Rodzaj">
            {(['all', 'single', 'coupon'] as const).map((k) => (
              <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
                {k === 'all' ? 'Wszystkie' : k === 'single' ? 'Single' : 'Kupony'}
                <span className="count">{counts[k]}</span>
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Status">
            {(['all', 'pending', 'won', 'lost'] as const).map((s) => (
              <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>
                {s === 'all' ? 'Każdy' : s === 'pending' ? 'W grze' : s === 'won' ? 'Wygrane' : 'Przegrane'}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="sport-filter">Dyscyplina</label>
          <select id="sport-filter" className="select" value={sport} onChange={(e) => setSport(e.target.value as SportId | 'all')}>
            <option value="all">Wszystkie dyscypliny</option>
            {Object.entries(SPORTS).map(([id, s]) => <option key={id} value={id}>{s.label}</option>)}
          </select>
          <div className="search-wrap">
            <Search />
            <label className="sr-only" htmlFor="q">Szukaj</label>
            <input id="q" className="search" placeholder="Szukaj drużyny, ligi, typu…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty" style={{ marginBottom: 80 }}>
            <h3>{bets.length ? 'Nic tu nie ma' : 'Pierwszy kupon czeka'}</h3>
            <p>{bets.length ? 'Zmień filtry, żeby zobaczyć więcej typów.' : 'Dodaj swój pierwszy typ – pojedynczy albo cały kupon.'}</p>
            {!bets.length && <button className="btn btn-primary" onClick={() => setEditing('new')}><Plus /> Dodaj typ</button>}
          </div>
        ) : (
          <div className="grid">
            {visible.map((b) => (
              <Ticket
                key={b.id}
                bet={b}
                onLegStatus={(legId, s) => setLegStatus(b.id, legId, s)}
                onEdit={() => setEditing(b)}
                onShare={() => setSharing(b)}
                onDelete={() => {
                  if (confirm('Usunąć ten typ? Tej operacji nie da się cofnąć.')) {
                    remove(b.id)
                    flash('Typ usunięty')
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="wrap">
          <span>© Great Sport Bets · dziennik typów</span>
          <span>Hazard uzależnia. Graj odpowiedzialnie, tylko u legalnych bukmacherów. 18+</span>
        </div>
      </footer>

      {editing && (
        <BetForm
          initial={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(b) => {
            upsert(b)
            setEditing(null)
            flash(editing === 'new' ? 'Typ dodany' : 'Zapisano zmiany')
          }}
        />
      )}
      {sharing && <ShareModal bet={sharing} onClose={() => setSharing(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  )
}
