// Google Play "bad behavior" thresholds for user-perceived rates
export const CRASH_RATE_LIMIT = 0.0109
export const ANR_RATE_LIMIT = 0.0047

export type Tone = 'default' | 'mint' | 'warn' | 'danger'

export function vitalTone(rate: number | undefined, limit: number): Tone {
  if (rate == null) return 'default'
  if (rate >= limit) return 'danger'
  if (rate >= limit * 0.75) return 'warn'
  return 'mint'
}

export function ratingTone(rating: number | undefined): Tone {
  if (rating == null) return 'default'
  if (rating >= 4.2) return 'mint'
  if (rating >= 3.5) return 'warn'
  return 'danger'
}
