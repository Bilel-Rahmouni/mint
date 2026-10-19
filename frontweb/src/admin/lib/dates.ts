export function toISODay(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function today() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function daysFromToday(amount: number) {
  return toISODay(addDays(today(), amount))
}

export function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((parseDay(toIso).getTime() - parseDay(fromIso).getTime()) / 86_400_000)
}

export function formatWeekday(date: Date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short' })
}

export function formatWeekRange(weekStart: Date) {
  const end = addDays(weekStart, 6)
  const startLabel = weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const endLabel = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${startLabel} – ${endLabel}`
}
