import type { Bet, Leg, Status } from './types'

export const round2 = (n: number) => Math.round(n * 100) / 100

export function betStatus(bet: Bet): Status {
  const s = bet.legs.map((l) => l.status)
  if (s.includes('lost')) return 'lost'
  if (s.includes('pending')) return 'pending'
  if (s.every((x) => x === 'void')) return 'void'
  return 'won'
}

/** Kurs łączny – zwrócone zdarzenia liczą się jako 1.00 */
export function totalOdds(legs: Leg[]): number {
  return legs.reduce((acc, l) => acc * (l.status === 'void' ? 1 : l.odds || 1), 1)
}

/** Kurs „z kuponu” – bez uwzględniania zwrotów, do wyświetlania przed rozliczeniem */
export function nominalOdds(legs: Leg[]): number {
  return legs.reduce((acc, l) => acc * (l.odds || 1), 1)
}

export function potentialWin(bet: Bet): number {
  return bet.stake * totalOdds(bet.legs)
}

export function profit(bet: Bet): number {
  switch (betStatus(bet)) {
    case 'won':
      return bet.stake * totalOdds(bet.legs) - bet.stake
    case 'lost':
      return -bet.stake
    default:
      return 0
  }
}

export function betDate(bet: Bet): string {
  const times = bet.legs.map((l) => l.kickoff).filter(Boolean).sort()
  return times[times.length - 1] ?? bet.createdAt
}

export interface Stats {
  total: number
  pending: number
  won: number
  lost: number
  voided: number
  staked: number
  profit: number
  roi: number
  hitRate: number
  avgOdds: number
  streak: { type: 'won' | 'lost' | null; count: number }
  form: Status[]
  curve: { date: string; value: number; bet: Bet }[]
  inPlay: number
}

export function computeStats(bets: Bet[]): Stats {
  const sorted = [...bets].sort((a, b) => betDate(a).localeCompare(betDate(b)))
  const settled = sorted.filter((b) => {
    const s = betStatus(b)
    return s === 'won' || s === 'lost'
  })
  let running = 0
  const curve = settled.map((b) => {
    running += profit(b)
    return { date: betDate(b), value: round2(running), bet: b }
  })
  const staked = settled.reduce((a, b) => a + b.stake, 0)
  const won = settled.filter((b) => betStatus(b) === 'won').length
  const lost = settled.length - won

  const streak: Stats['streak'] = { type: null, count: 0 }
  for (let i = settled.length - 1; i >= 0; i--) {
    const s = betStatus(settled[i]) as 'won' | 'lost'
    if (streak.type === null) streak.type = s
    if (s !== streak.type) break
    streak.count++
  }

  const pendingBets = bets.filter((b) => betStatus(b) === 'pending')

  return {
    total: bets.length,
    pending: pendingBets.length,
    won,
    lost,
    voided: bets.filter((b) => betStatus(b) === 'void').length,
    staked,
    profit: round2(running),
    roi: staked ? (running / staked) * 100 : 0,
    hitRate: settled.length ? (won / settled.length) * 100 : 0,
    avgOdds: settled.length ? settled.reduce((a, b) => a + totalOdds(b.legs), 0) / settled.length : 0,
    streak,
    form: settled.slice(-10).map(betStatus),
    curve,
    inPlay: pendingBets.reduce((a, b) => a + b.stake, 0),
  }
}

const pln = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const money = (n: number) => `${pln.format(n)} zł`
export const signedMoney = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${pln.format(Math.abs(n))} zł`
export const odds = (n: number) => n.toFixed(2)
export const pct = (n: number, signed = false) =>
  `${signed && n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1).replace('.', ',')}%`

const dtf = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const df = new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: 'short' })
export const fmtDateTime = (iso: string) => (iso ? dtf.format(new Date(iso)) : '—')
export const fmtDate = (iso: string) => (iso ? df.format(new Date(iso)) : '—')

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
