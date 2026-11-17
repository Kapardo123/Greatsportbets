export type Status = 'pending' | 'won' | 'lost' | 'void'
export type Kind = 'single' | 'coupon'

export type SportId = 'football' | 'tennis' | 'basketball' | 'hockey' | 'volleyball' | 'esports' | 'mma' | 'other'

export interface Leg {
  id: string
  sport: SportId
  league: string
  event: string
  pick: string
  odds: number
  kickoff: string // ISO datetime
  status: Status
}

export interface Bet {
  id: string
  kind: Kind
  legs: Leg[]
  stake: number
  bookmaker: string
  confidence: 1 | 2 | 3 | 4 | 5
  note: string
  createdAt: string
}

export const SPORTS: Record<SportId, { label: string; code: string }> = {
  football: { label: 'Piłka nożna', code: 'FTB' },
  tennis: { label: 'Tenis', code: 'TEN' },
  basketball: { label: 'Koszykówka', code: 'BSK' },
  hockey: { label: 'Hokej', code: 'HOK' },
  volleyball: { label: 'Siatkówka', code: 'VOL' },
  esports: { label: 'E-sport', code: 'ESP' },
  mma: { label: 'MMA / Boks', code: 'MMA' },
  other: { label: 'Inne', code: 'INN' },
}

export const STATUS_LABEL: Record<Status, string> = {
  pending: 'W grze',
  won: 'Wygrany',
  lost: 'Przegrany',
  void: 'Zwrot',
}
