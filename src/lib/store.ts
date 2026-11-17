import { useCallback, useEffect, useState } from 'react'
import type { Bet, Leg, SportId, Status } from './types'
import { uid } from './calc'

const KEY = 'gsb.bets.v1'
const SEEDED_KEY = 'gsb.seeded'

function daysAgo(d: number, h = 20, m = 45) {
  const t = new Date()
  t.setDate(t.getDate() - d)
  t.setHours(h, m, 0, 0)
  return t.toISOString()
}

const leg = (sport: SportId, league: string, event: string, pick: string, odds: number, kickoff: string, status: Status): Leg => ({
  id: uid(), sport, league, event, pick, odds, kickoff, status,
})

function seed(): Bet[] {
  const single = (l: Leg, stake: number, confidence: Bet['confidence'], note: string, bookmaker = 'STS'): Bet => ({
    id: 'demo-' + uid(), kind: 'single', legs: [l], stake, confidence, note, bookmaker, createdAt: l.kickoff,
  })
  const coupon = (legs: Leg[], stake: number, confidence: Bet['confidence'], note: string, bookmaker = 'Fortuna'): Bet => ({
    id: 'demo-' + uid(), kind: 'coupon', legs, stake, confidence, note, bookmaker, createdAt: legs[0].kickoff,
  })
  return [
    single(leg('football', 'Ekstraklasa', 'Lech Poznań – Pogoń Szczecin', 'Powyżej 2,5 gola', 1.78, daysAgo(24), 'won'), 100, 4, 'Oba zespoły w top 3 pod względem xG w lidze. Pogoń gra wysoko, zostawia przestrzeń.'),
    single(leg('tennis', 'ATP Paryż', 'Hurkacz – Fritz', 'Hurkacz wygra', 2.35, daysAgo(21, 16, 0), 'lost'), 60, 3, 'Hala, szybka nawierzchnia, serwis na serwis. Value na underdogu.'),
    coupon([
      leg('football', 'Premier League', 'Arsenal – Brentford', 'Arsenal wygra', 1.42, daysAgo(18, 16, 0), 'won'),
      leg('football', 'LaLiga', 'Real Sociedad – Getafe', 'Poniżej 2,5 gola', 1.65, daysAgo(18, 18, 30), 'won'),
      leg('football', 'Serie A', 'Atalanta – Lecce', 'Atalanta −1 (handicap)', 1.90, daysAgo(18, 20, 45), 'won'),
    ], 50, 3, 'Sobotni AKO – trzy mecze, w których faworyt kontroluje tempo.'),
    single(leg('basketball', 'Euroliga', 'Real Madryt – Partizan', 'Real −6,5', 1.87, daysAgo(15, 21, 0), 'won'), 80, 4, 'Partizan na back-to-back, bez podstawowego rozgrywającego.'),
    single(leg('hockey', 'NHL', 'Oilers – Canucks', 'Powyżej 6,5 gola', 2.05, daysAgo(13, 4, 0), 'lost'), 50, 2, ''),
    coupon([
      leg('football', 'Bundesliga', 'Leverkusen – Mainz', 'Obie strzelą – TAK', 1.72, daysAgo(11, 15, 30), 'won'),
      leg('football', 'Ligue 1', 'Lille – Nantes', 'Lille wygra', 1.55, daysAgo(11, 17, 0), 'lost'),
    ], 40, 2, 'Lille zawiodło w końcówce.'),
    single(leg('volleyball', 'PlusLiga', 'Jastrzębski Węgiel – Projekt Warszawa', 'Powyżej 3,5 seta', 1.95, daysAgo(9, 17, 30), 'won'), 70, 3, 'Ostatnie 4 H2H – wszystkie po 4 lub 5 setów.'),
    single(leg('football', 'Liga Mistrzów', 'Inter – PSG', 'Remis', 3.40, daysAgo(7, 21, 0), 'void'), 30, 2, 'Mecz przełożony – zwrot stawki.'),
    single(leg('esports', 'CS2 · IEM', 'Vitality – FaZe', 'Vitality −1,5 mapy', 1.83, daysAgo(5, 19, 0), 'won'), 60, 4, ''),
    coupon([
      leg('football', 'Ekstraklasa', 'Legia Warszawa – Raków Częstochowa', 'Powyżej 1,5 gola', 1.30, daysAgo(3, 17, 30), 'won'),
      leg('tennis', 'ATP Finals', 'Sinner – de Minaur', 'Sinner 2:0 w setach', 1.70, daysAgo(3, 14, 0), 'won'),
      leg('basketball', 'NBA', 'Celtics – Knicks', 'Celtics wygrają', 1.62, daysAgo(2, 1, 30), 'won'),
      leg('mma', 'UFC', 'Prochazka – Hill', 'Walka nie dotrwa do decyzji', 1.45, daysAgo(2, 4, 0), 'won'),
    ], 25, 3, 'Weekendowy kombinowany – wszedł komplet.'),
    single(leg('football', 'Premier League', 'Liverpool – Manchester City', 'Obie strzelą – TAK', 1.66, daysAgo(-1, 17, 30), 'pending'), 100, 5, 'Hit kolejki. Obie defensywy z problemami kadrowymi, City traci po stałych fragmentach.'),
    coupon([
      leg('football', 'Ekstraklasa', 'Jagiellonia – Widzew', 'Jagiellonia wygra', 1.68, daysAgo(-2, 20, 30), 'pending'),
      leg('football', 'LaLiga', 'Barcelona – Sevilla', 'Barcelona −1,5', 1.95, daysAgo(-2, 21, 0), 'pending'),
      leg('tennis', 'Davis Cup', 'Polska – Kanada', 'Polska wygra', 2.10, daysAgo(-3, 12, 0), 'pending'),
    ], 30, 3, ''),
  ]
}

function load(): Bet[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Bet[]
    if (!localStorage.getItem(SEEDED_KEY)) {
      localStorage.setItem(SEEDED_KEY, '1')
      return seed()
    }
  } catch {
    /* prywatne okno / brak storage */
  }
  return []
}

export function useBets() {
  const [bets, setBets] = useState<Bet[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(bets))
    } catch {
      /* ignore */
    }
  }, [bets])

  const upsert = useCallback((bet: Bet) => {
    setBets((prev) => (prev.some((b) => b.id === bet.id) ? prev.map((b) => (b.id === bet.id ? bet : b)) : [bet, ...prev]))
  }, [])

  const remove = useCallback((id: string) => setBets((prev) => prev.filter((b) => b.id !== id)), [])

  const setLegStatus = useCallback((betId: string, legId: string, status: Status) => {
    setBets((prev) =>
      prev.map((b) => (b.id !== betId ? b : { ...b, legs: b.legs.map((l) => (l.id === legId ? { ...l, status } : l)) })),
    )
  }, [])

  const replaceAll = useCallback((next: Bet[]) => setBets(next), [])

  return { bets, upsert, remove, setLegStatus, replaceAll }
}

export function isValidBackup(data: unknown): data is Bet[] {
  return (
    Array.isArray(data) &&
    data.every((b) => b && typeof b.id === 'string' && Array.isArray(b.legs) && typeof b.stake === 'number')
  )
}
