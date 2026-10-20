import { Admin } from '../models/Admin.js'
import { Alert } from '../models/Alert.js'
import { logger } from '../utils/logger.js'
import { mailEnabled, sendMail } from './mail.js'

const DAY_MS = 24 * 60 * 60 * 1000

const shiftDay = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)

export function daysUntil(date) {
  if (!date) return null
  return Math.floor((new Date(date).getTime() - Date.now()) / DAY_MS)
}

async function emailAlert(title) {
  if (!mailEnabled()) return
  const admins = await Admin.find({ isActive: true }).select('email')
  for (const admin of admins) {
    await sendMail({ to: admin.email, subject: title, text: title })
  }
}

export async function raiseAlert({ projectId, kind, dedupeKey, title }) {
  try {
    const existing = await Alert.findOne({ dedupeKey }).select('_id')
    if (existing) return existing
    const alert = await Alert.create({ projectId, kind, dedupeKey, title })
    try {
      await emailAlert(title)
    } catch (err) {
      logger.error('Alert email failed:', err.message)
    }
    return alert
  } catch (err) {
    if (err?.code !== 11000) logger.error('Alert failed:', err.message)
    return null
  }
}

function dayEarnings(points, date) {
  const point = points.find((row) => row.date === date)
  return (point?.admob || 0) + (point?.adsense || 0)
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export async function considerRevenueAlert(project, points, yesterday) {
  const prior = Array.from({ length: 7 }, (_, index) => dayEarnings(points, shiftDay(yesterday, -(index + 1))))
  const typical = median(prior)
  const latest = dayEarnings(points, yesterday)
  if (typical < 1 || latest >= typical * 0.6) return
  const pct = Math.round((latest / typical) * 100)
  await raiseAlert({
    projectId: project._id,
    kind: 'revenue',
    dedupeKey: `revenue:${project._id}:${yesterday}`,
    title: `${project.name} earnings fell to ${pct}% of the recent median`,
  })
}
