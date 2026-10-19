const DAY_MS = 24 * 60 * 60 * 1000

export function daysUntil(date?: string): number | null {
  if (!date) return null
  return Math.floor((new Date(date).getTime() - Date.now()) / DAY_MS)
}

export function hostOf(url?: string): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function formatPct(value: number | null | undefined): string {
  if (value == null) return '—'
  if (value === 100) return '100%'
  return `${value.toFixed(value >= 99 ? 2 : 1)}%`
}

export function formatCount(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatMoney(value: number | null | undefined, currency = 'USD'): string {
  if (value == null) return '—'
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      ...(Math.abs(value) >= 1000 && { notation: 'compact', maximumFractionDigits: 1 }),
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

export function formatChange(current?: number, previous?: number): string | undefined {
  if (current == null || !previous) return undefined
  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? '+' : ''}${change.toFixed(0)}% vs prev 30d`
}

export function formatRate(fraction: number | null | undefined): string {
  if (fraction == null) return '—'
  return `${(fraction * 100).toFixed(2)}%`
}

export function formatShare(fraction: number | null | undefined): string {
  if (fraction == null) return '—'
  return `${(fraction * 100).toFixed(1)}%`
}

export function formatPosition(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toFixed(1)
}

export function formatRating(value: number | null | undefined): string {
  if (value == null) return '—'
  return value.toFixed(2)
}

export function formatMs(value: number | null | undefined): string {
  if (value == null) return '—'
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`
}

export function formatDays(days: number | null): string {
  if (days == null) return '—'
  if (days < 0) return 'expired'
  return `${days}d`
}

export function formatDate(date?: string): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(date?: string): string {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}
