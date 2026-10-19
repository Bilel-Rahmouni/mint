import { config, googleEnabled } from '../config.js'
import { Project } from '../models/Project.js'
import { logger } from '../utils/logger.js'
import { GoogleApiError, googleFetch } from './googleAuth.js'

const REPORTING_API = 'https://playdeveloperreporting.googleapis.com/v1beta1'
const PUBLISHER_API = 'https://androidpublisher.googleapis.com/androidpublisher/v3'
const STORAGE_API = 'https://storage.googleapis.com/storage/v1'

const SERIES_DAYS = 60
const WINDOW_DAYS = 30
const MAX_REVIEWS = 20

const monthKey = (date) => `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}`

const recentMonths = () => {
  const now = new Date()
  const previous = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  return [monthKey(previous), monthKey(now)]
}

// Play exports reports as UTF-16LE with a BOM
function decodeReport(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le')
  return buffer.toString('utf8').replace(/^\uFEFF/, '')
}

function parseCsv(text) {
  const [header, ...lines] = text.split(/\r?\n/).filter((l) => l.trim())
  if (!header) return []
  const unquote = (v) => v.trim().replace(/^"(.*)"$/, '$1')
  const keys = header.split(',').map(unquote)
  return lines.map((line) => {
    const values = line.split(',').map(unquote)
    return Object.fromEntries(keys.map((k, i) => [k, values[i]]))
  })
}

const num = (value) => {
  const n = Number(value)
  return value === undefined || value === '' || Number.isNaN(n) ? undefined : n
}

async function downloadReport(objectPath) {
  const url = `${STORAGE_API}/b/${config.google.reportsBucket}/o/${encodeURIComponent(objectPath)}?alt=media`
  try {
    return parseCsv(decodeReport(await googleFetch(url, { raw: true })))
  } catch (err) {
    if (err instanceof GoogleApiError && err.status === 404) return []
    throw err
  }
}

async function fetchStats(packageName) {
  if (!config.google.reportsBucket) throw new Error('PLAY_REPORTS_BUCKET is not set')

  const months = recentMonths()
  const [installRows, ratingRows] = await Promise.all([
    Promise.all(months.map((m) => downloadReport(`stats/installs/installs_${packageName}_${m}_overview.csv`))),
    Promise.all(months.map((m) => downloadReport(`stats/ratings/ratings_${packageName}_${m}_overview.csv`))),
  ])

  const days = new Map()
  const day = (date) => {
    if (!days.has(date)) days.set(date, { date })
    return days.get(date)
  }

  for (const row of installRows.flat()) {
    if (!row.Date) continue
    Object.assign(day(row.Date), {
      installs: num(row['Daily User Installs'] ?? row['Daily Device Installs']),
      uninstalls: num(row['Daily User Uninstalls'] ?? row['Daily Device Uninstalls']),
      activeDevices: num(row['Active Device Installs']),
      totalInstalls: num(row['Total User Installs']),
    })
  }
  for (const row of ratingRows.flat()) {
    if (!row.Date) continue
    day(row.Date).rating = num(row['Total Average Rating'])
  }

  const series = [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
  if (!series.length) throw new Error('No reports exported yet')

  const recent = series.slice(-WINDOW_DAYS)
  const latest = (key) => [...series].reverse().find((d) => d[key] != null)?.[key]
  const sum = (key) => recent.reduce((total, d) => total + (d[key] ?? 0), 0)

  return {
    series,
    summary: {
      rating: latest('rating'),
      activeDevices: latest('activeDevices'),
      totalInstalls: latest('totalInstalls'),
      installs30d: sum('installs'),
      uninstalls30d: sum('uninstalls'),
    },
  }
}

const toIsoDate = ({ year, month, day }) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const shiftDate = (dateTime, days) => {
  const d = new Date(Date.UTC(dateTime.year, dateTime.month - 1, dateTime.day + days))
  return { ...dateTime, year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

async function fetchVitalRate(packageName, metricSet, metric) {
  const base = `${REPORTING_API}/apps/${packageName}/${metricSet}`
  const info = await googleFetch(base)
  const daily = info.freshnessInfo?.freshnesses?.find((f) => f.aggregationPeriod === 'DAILY')
  if (!daily) return { series: [], rate: undefined }

  const endTime = daily.latestEndTime
  const data = await googleFetch(`${base}:query`, {
    method: 'POST',
    body: {
      timelineSpec: { aggregationPeriod: 'DAILY', startTime: shiftDate(endTime, -WINDOW_DAYS), endTime },
      metrics: [metric, 'distinctUsers'],
      pageSize: WINDOW_DAYS + 5,
    },
  })

  const series = (data.rows || []).map((row) => {
    const value = (name) => num(row.metrics?.find((m) => m.metric === name)?.decimalValue?.value)
    return { date: toIsoDate(row.startTime), rate: value(metric), users: value('distinctUsers') ?? 0 }
  })

  const users = series.reduce((total, d) => total + d.users, 0)
  const rate = users
    ? series.reduce((total, d) => total + (d.rate ?? 0) * d.users, 0) / users
    : undefined

  return { series, rate }
}

async function fetchVitals(packageName) {
  const [crash, anr] = await Promise.all([
    fetchVitalRate(packageName, 'crashRateMetricSet', 'userPerceivedCrashRate'),
    fetchVitalRate(packageName, 'anrRateMetricSet', 'userPerceivedAnrRate'),
  ])
  return { crash, anr }
}

async function fetchReviews(packageName) {
  const data = await googleFetch(`${PUBLISHER_API}/applications/${packageName}/reviews?maxResults=${MAX_REVIEWS}`)
  return (data.reviews || []).map((review) => {
    const comment = review.comments?.find((c) => c.userComment)?.userComment ?? {}
    return {
      id: review.reviewId,
      author: review.authorName,
      rating: comment.starRating,
      text: comment.text?.trim(),
      version: comment.appVersionName,
      at: comment.lastModified?.seconds ? new Date(Number(comment.lastModified.seconds) * 1000) : undefined,
    }
  })
}

const errorMessage = (result) => (result.status === 'rejected' ? result.reason?.message || 'Failed' : undefined)

export async function runPlaySync(project) {
  if (!googleEnabled || !project.packageName) return project

  const [stats, vitals, reviews] = await Promise.allSettled([
    fetchStats(project.packageName),
    fetchVitals(project.packageName),
    fetchReviews(project.packageName),
  ])

  const previous = project.play?.toObject?.() ?? project.play ?? {}
  const play = { ...previous, errors: {} }
  const seriesByDate = new Map((previous.series || []).map((d) => [d.date, { ...d }]))
  const point = (date) => {
    if (!seriesByDate.has(date)) seriesByDate.set(date, { date })
    return seriesByDate.get(date)
  }

  if (stats.status === 'fulfilled') {
    Object.assign(play, stats.value.summary)
    for (const d of stats.value.series) {
      Object.assign(point(d.date), {
        installs: d.installs,
        uninstalls: d.uninstalls,
        activeDevices: d.activeDevices,
        rating: d.rating,
      })
    }
  } else {
    play.errors.stats = errorMessage(stats)
  }

  if (vitals.status === 'fulfilled') {
    play.crashRate = vitals.value.crash.rate
    play.anrRate = vitals.value.anr.rate
    for (const d of vitals.value.crash.series) point(d.date).crashRate = d.rate
    for (const d of vitals.value.anr.series) point(d.date).anrRate = d.rate
  } else {
    play.errors.vitals = errorMessage(vitals)
  }

  if (reviews.status === 'fulfilled') {
    // The API only returns the last week of reviews, so keep older ones we already have
    const merged = new Map((previous.reviews || []).map((r) => [r.id, r]))
    for (const r of reviews.value) merged.set(r.id, r)
    play.reviews = [...merged.values()]
      .sort((a, b) => new Date(b.at ?? 0) - new Date(a.at ?? 0))
      .slice(0, MAX_REVIEWS)
  } else {
    play.errors.reviews = errorMessage(reviews)
  }

  play.series = [...seriesByDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-SERIES_DAYS)
  play.syncedAt = new Date()

  project.play = play
  await project.save()
  return project
}

export async function runAllPlaySyncs() {
  if (!googleEnabled) return 0
  const projects = await Project.find({ packageName: { $nin: [null, ''] } })
  const results = await Promise.allSettled(projects.map(runPlaySync))
  results.forEach((r, i) => {
    if (r.status === 'rejected') logger.error(`Play sync failed for ${projects[i].name}:`, r.reason)
  })
  return projects.length
}
