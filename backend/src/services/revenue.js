import { googleOAuthEnabled } from '../config.js'
import { Integration } from '../models/Integration.js'
import { Project } from '../models/Project.js'
import { logger } from '../utils/logger.js'
import { GoogleApiError } from './googleAuth.js'
import { ADMOB_SCOPE, ADSENSE_SCOPE, NotConnectedError, userFetch } from './googleOAuth.js'

const ADMOB_API = 'https://admob.googleapis.com/v1'
const ADSENSE_API = 'https://adsense.googleapis.com/v2'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_DAYS = 30
const MAX_UNASSIGNED = 8
const MICROS = 1_000_000
const SOURCES = ['admob', 'adsense']

const round = (n) => Math.round(n * 10_000) / 10_000

const bareHost = (value) => {
  if (!value) return ''
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

const nameKey = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '')
// Store titles carry taglines ("Cash Cash - Business Sim", "LingoMate: Speak with AI")
const appNameKey = (value = '') => nameKey(value.split(/\s[-–|]\s|:|\(/)[0])

function localToday(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
}

const shiftDay = (iso, days) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)

const dateParts = (iso) => {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

const compactToIso = (value = '') => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`

// Rolling windows end yesterday so a half-finished day never skews comparisons
function buildWindows(today) {
  const yesterday = shiftDay(today, -1)
  const monthStart = `${today.slice(0, 7)}-01`
  const lastMonthEnd = shiftDay(monthStart, -1)
  const lastMonthStart = `${lastMonthEnd.slice(0, 7)}-01`
  const recentStart = shiftDay(yesterday, -(WINDOW_DAYS - 1))
  const prevStart = shiftDay(recentStart, -WINDOW_DAYS)
  const prevEnd = shiftDay(recentStart, -1)
  const start = prevStart < lastMonthStart ? prevStart : lastMonthStart
  return { today, yesterday, monthStart, lastMonthStart, lastMonthEnd, recentStart, prevStart, prevEnd, start }
}

const sumPoints = (points, from, to, source) => points.reduce(
  (total, p) => (p.date >= from && p.date <= to ? total + (source ? p[source] || 0 : (p.admob || 0) + (p.adsense || 0)) : total),
  0,
)

function windowSummary(points, win) {
  return {
    earnings30d: round(sumPoints(points, win.recentStart, win.yesterday)),
    prev30d: round(sumPoints(points, win.prevStart, win.prevEnd)),
    admob30d: round(sumPoints(points, win.recentStart, win.yesterday, 'admob')),
    adsense30d: round(sumPoints(points, win.recentStart, win.yesterday, 'adsense')),
  }
}

const addPoint = (map, date, source, amount) => {
  const point = map.get(date) ?? { date, admob: 0, adsense: 0 }
  point[source] += amount
  map.set(date, point)
}

const toSeries = (map, from) => [...map.values()]
  .filter((p) => p.date >= from)
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((p) => ({ date: p.date, admob: round(p.admob), adsense: round(p.adsense) }))

// --- AdMob -----------------------------------------------------------------

async function admobAccount() {
  const data = await userFetch(`${ADMOB_API}/accounts`)
  const account = data.account?.[0]
  if (!account) throw new Error('No AdMob account on this Google account')
  return account
}

async function admobApps(accountName) {
  const apps = []
  let pageToken = ''
  do {
    const query = `pageSize=100${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
    const data = await userFetch(`${ADMOB_API}/${accountName}/apps?${query}`)
    apps.push(...(data.apps || []))
    pageToken = data.nextPageToken
  } while (pageToken)

  return apps.map((app) => ({
    appId: app.appId,
    name: app.linkedAppInfo?.displayName || app.manualAppInfo?.displayName || app.appId,
    platform: app.platform,
    packageName: app.platform === 'ANDROID' ? app.linkedAppInfo?.appStoreId : undefined,
    linked: Boolean(app.linkedAppInfo?.appStoreId),
    approval: app.appApprovalState,
  }))
}

async function admobReport(accountName, win, currency) {
  const data = await userFetch(`${ADMOB_API}/${accountName}/networkReport:generate`, {
    method: 'POST',
    body: {
      reportSpec: {
        dateRange: { startDate: dateParts(win.start), endDate: dateParts(win.today) },
        dimensions: ['DATE', 'APP'],
        metrics: ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'AD_REQUESTS', 'MATCHED_REQUESTS'],
        ...(currency && { localizationSettings: { currencyCode: currency } }),
      },
    },
  })

  const rows = []
  let reportCurrency = currency
  for (const item of Array.isArray(data) ? data : [data]) {
    reportCurrency = item.header?.localizationSettings?.currencyCode || reportCurrency
    if (!item.row) continue
    const dims = item.row.dimensionValues || {}
    const metrics = item.row.metricValues || {}
    rows.push({
      date: compactToIso(dims.DATE?.value),
      appId: dims.APP?.value,
      label: dims.APP?.displayLabel,
      earnings: Number(metrics.ESTIMATED_EARNINGS?.microsValue || 0) / MICROS,
      impressions: Number(metrics.IMPRESSIONS?.integerValue || 0),
      requests: Number(metrics.AD_REQUESTS?.integerValue || 0),
      matched: Number(metrics.MATCHED_REQUESTS?.integerValue || 0),
    })
  }
  return { rows, currency: reportCurrency }
}

// --- AdSense ---------------------------------------------------------------

async function adsenseAccount() {
  const data = await userFetch(`${ADSENSE_API}/accounts?pageSize=50`)
  const accounts = data.accounts || []
  const account = accounts.find((a) => a.state !== 'CLOSED') || accounts[0]
  if (!account) throw new Error('No AdSense account on this Google account')
  return account
}

async function adsenseReport(accountName, win, currency) {
  const params = new URLSearchParams({ dateRange: 'CUSTOM' })
  for (const [prefix, iso] of [['startDate', win.start], ['endDate', win.today]]) {
    const { year, month, day } = dateParts(iso)
    params.set(`${prefix}.year`, year)
    params.set(`${prefix}.month`, month)
    params.set(`${prefix}.day`, day)
  }
  for (const dimension of ['DATE', 'DOMAIN_NAME']) params.append('dimensions', dimension)
  for (const metric of ['ESTIMATED_EARNINGS', 'PAGE_VIEWS', 'CLICKS']) params.append('metrics', metric)
  if (currency) params.set('currencyCode', currency)

  let data
  try {
    data = await userFetch(`${ADSENSE_API}/${accountName}/reports:generate?${params}`)
  } catch (err) {
    if (!currency || !(err instanceof GoogleApiError) || err.status !== 400) throw err
    params.delete('currencyCode')
    data = await userFetch(`${ADSENSE_API}/${accountName}/reports:generate?${params}`)
  }

  const headers = data.headers || []
  const column = (name) => headers.findIndex((h) => h.name === name)
  const at = { date: column('DATE'), domain: column('DOMAIN_NAME'), earnings: column('ESTIMATED_EARNINGS'), views: column('PAGE_VIEWS'), clicks: column('CLICKS') }

  const rows = (data.rows || []).map(({ cells = [] }) => ({
    date: cells[at.date]?.value,
    domain: bareHost(cells[at.domain]?.value),
    earnings: Number(cells[at.earnings]?.value || 0),
    pageViews: Number(cells[at.views]?.value || 0),
    clicks: Number(cells[at.clicks]?.value || 0),
  }))
  return { rows, currency: headers[at.earnings]?.currencyCode || currency }
}

async function adsenseDetails(accountName) {
  const [sites, alerts, payments] = await Promise.allSettled([
    userFetch(`${ADSENSE_API}/${accountName}/sites?pageSize=100`),
    userFetch(`${ADSENSE_API}/${accountName}/alerts`),
    userFetch(`${ADSENSE_API}/${accountName}/payments`),
  ])
  const list = (result, key) => (result.status === 'fulfilled' ? result.value[key] || [] : [])

  return {
    sites: list(sites, 'sites').map((s) => ({ domain: bareHost(s.domain), state: s.state })),
    alerts: list(alerts, 'alerts').map((a) => ({ severity: a.severity, message: a.message })),
    balance: list(payments, 'payments').find((p) => p.name?.endsWith('/unpaid'))?.amount,
  }
}

// --- Sync ------------------------------------------------------------------

const missingScope = (product) => Promise.reject(new Error(`${product} access was not granted, connect Google again and allow it`))
const reasonOf = (result) => (result.status === 'rejected' ? result.reason : undefined)

async function syncRevenue() {
  const integration = await Integration.findOne({ provider: 'google' })
  if (!integration) throw new NotConnectedError('Google account is not connected')
  const previous = integration.toObject().revenue ?? {}
  const scopes = new Set(integration.scopes || [])

  const accounts = await Promise.allSettled([
    scopes.has(ADMOB_SCOPE) ? admobAccount() : missingScope('AdMob'),
    scopes.has(ADSENSE_SCOPE) ? adsenseAccount() : missingScope('AdSense'),
  ])
  const signedOut = accounts.map(reasonOf).find((reason) => reason instanceof NotConnectedError)
  if (signedOut) throw signedOut
  const [admob, adsense] = accounts.map((r) => (r.status === 'fulfilled' ? r.value : null))

  const win = buildWindows(localToday(admob?.reportingTimeZone || adsense?.timeZone?.id || 'UTC'))
  const requestedCurrency = admob?.currencyCode || previous.currency

  const [admobResult, adsenseResult] = await Promise.allSettled([
    admob ? Promise.all([admobApps(admob.name), admobReport(admob.name, win, requestedCurrency)]) : Promise.reject(reasonOf(accounts[0])),
    adsense ? Promise.all([adsenseReport(adsense.name, win, requestedCurrency), adsenseDetails(adsense.name)]) : Promise.reject(reasonOf(accounts[1])),
  ])

  const projects = await Project.find().select('name url packageName revenue')
  const byPackage = new Map()
  const byName = new Map()
  const byHost = new Map()
  for (const project of projects) {
    if (project.packageName) byPackage.set(project.packageName.toLowerCase(), project)
    const key = nameKey(project.name)
    if (key && (!byName.has(key) || (project.packageName && !byName.get(key).packageName))) byName.set(key, project)
    const host = bareHost(project.url)
    if (host && !byHost.has(host)) byHost.set(host, project)
  }
  const matchApp = (app) => byPackage.get(app.packageName?.toLowerCase()) || byName.get(appNameKey(app.name))

  const totals = new Map()
  const perProject = new Map()
  const unassigned = new Map()
  const errors = {}
  const isRecent = (date) => date >= win.recentStart && date <= win.yesterday

  const entryFor = (project) => {
    const id = String(project._id)
    if (!perProject.has(id)) perProject.set(id, { project, points: new Map(), impressions30d: 0, admobApps: new Set(), adsenseDomain: undefined })
    return perProject.get(id)
  }
  const addUnassigned = (source, label, amount) => {
    const key = `${source}:${label}`
    const row = unassigned.get(key) ?? { source, label, earnings30d: 0 }
    row.earnings30d += amount
    unassigned.set(key, row)
  }

  let currency = requestedCurrency
  let admobSummary
  let adsenseSummary

  if (admobResult.status === 'fulfilled') {
    const [apps, report] = admobResult.value
    currency = report.currency || currency
    const appById = new Map(apps.map((app) => [app.appId, app]))
    const projectByApp = new Map()
    for (const app of apps) {
      const project = matchApp(app)
      app.projectId = project?._id
      if (project) projectByApp.set(app.appId, project)
    }

    let impressions = 0
    let requests = 0
    let matched = 0
    let earnings = 0
    for (const row of report.rows) {
      addPoint(totals, row.date, 'admob', row.earnings)
      const app = appById.get(row.appId) ?? { name: row.label }
      const project = projectByApp.get(row.appId) ?? matchApp(app)
      const recent = isRecent(row.date)
      if (recent) {
        impressions += row.impressions
        requests += row.requests
        matched += row.matched
        earnings += row.earnings
      }
      if (project) {
        const entry = entryFor(project)
        addPoint(entry.points, row.date, 'admob', row.earnings)
        entry.admobApps.add(app.name)
        if (recent) entry.impressions30d += row.impressions
      } else if (recent && row.earnings > 0) {
        addUnassigned('admob', app.name, row.earnings)
      }
    }

    admobSummary = {
      publisherId: admob.publisherId,
      impressions30d: impressions,
      requests30d: requests,
      matchRate: requests ? matched / requests : undefined,
      ecpm: impressions ? round((earnings / impressions) * 1000) : undefined,
      apps,
    }
  } else {
    errors.admob = admobResult.reason?.message || 'Failed'
  }

  if (adsenseResult.status === 'fulfilled') {
    const [report, details] = adsenseResult.value
    if (currency && report.currency && report.currency !== currency) {
      errors.adsense = `AdSense reports in ${report.currency} while totals use ${currency}`
    } else {
      currency = currency || report.currency
      let pageViews = 0
      let clicks = 0
      let earnings = 0
      for (const row of report.rows) {
        addPoint(totals, row.date, 'adsense', row.earnings)
        const project = byHost.get(row.domain)
        const recent = isRecent(row.date)
        if (recent) {
          pageViews += row.pageViews
          clicks += row.clicks
          earnings += row.earnings
        }
        if (project) {
          const entry = entryFor(project)
          addPoint(entry.points, row.date, 'adsense', row.earnings)
          entry.adsenseDomain = row.domain
        } else if (recent && row.earnings > 0) {
          addUnassigned('adsense', row.domain || 'Unknown', row.earnings)
        }
      }

      adsenseSummary = {
        accountId: adsense.name.split('/').pop(),
        pageViews30d: pageViews,
        clicks30d: clicks,
        rpm: pageViews ? round((earnings / pageViews) * 1000) : undefined,
        balance: details.balance,
        sites: details.sites.map((site) => ({ ...site, projectId: byHost.get(site.domain)?._id })),
        alerts: details.alerts,
      }
    }
  } else {
    errors.adsense = adsenseResult.reason?.message || 'Failed'
  }

  // A failed source keeps its last known numbers instead of dropping to zero
  if (previous.currency === currency) {
    for (const source of SOURCES.filter((s) => errors[s])) {
      for (const p of previous.series || []) addPoint(totals, p.date, source, p[source] || 0)
      for (const row of previous.unassigned || []) if (row.source === source) addUnassigned(source, row.label, row.earnings30d)
      for (const project of projects) {
        const past = project.revenue
        if (!past?.series?.length) continue
        const entry = entryFor(project)
        for (const p of past.series) addPoint(entry.points, p.date, source, p[source] || 0)
        if (source === 'admob') {
          entry.impressions30d = past.impressions30d || 0
          for (const name of past.admobApps || []) entry.admobApps.add(name)
        } else {
          entry.adsenseDomain = past.adsenseDomain
        }
      }
    }
  }

  const series = toSeries(totals, win.start)
  integration.revenue = {
    currency,
    today: round(sumPoints(series, win.today, win.today)),
    yesterday: round(sumPoints(series, win.yesterday, win.yesterday)),
    thisMonth: round(sumPoints(series, win.monthStart, win.today)),
    lastMonth: round(sumPoints(series, win.lastMonthStart, win.lastMonthEnd)),
    ...windowSummary(series, win),
    series,
    unassigned: [...unassigned.values()]
      .map((row) => ({ ...row, earnings30d: round(row.earnings30d) }))
      .sort((a, b) => b.earnings30d - a.earnings30d)
      .slice(0, MAX_UNASSIGNED),
    admob: admobSummary ?? previous.admob,
    adsense: adsenseSummary ?? previous.adsense,
    errors,
    syncedAt: new Date(),
  }
  await integration.save()

  const syncedAt = new Date()
  const ops = []
  for (const project of projects) {
    const entry = perProject.get(String(project._id))
    if (!entry) {
      if (project.revenue?.syncedAt) ops.push({ updateOne: { filter: { _id: project._id }, update: { $unset: { revenue: 1 } } } })
      continue
    }
    const points = toSeries(entry.points, win.start)
    const summary = windowSummary(points, win)
    ops.push({
      updateOne: {
        filter: { _id: project._id },
        update: {
          $set: {
            revenue: {
              currency,
              ...summary,
              impressions30d: entry.impressions30d,
              ecpm: entry.impressions30d ? round((summary.admob30d / entry.impressions30d) * 1000) : undefined,
              admobApps: [...entry.admobApps],
              adsenseDomain: entry.adsenseDomain,
              series: points,
              syncedAt,
            },
          },
        },
      },
    })
  }
  if (ops.length) await Project.bulkWrite(ops)

  return integration
}

let running = null

export function runRevenueSync() {
  running ??= syncRevenue().finally(() => {
    running = null
  })
  return running
}

export async function runScheduledRevenueSync() {
  if (!googleOAuthEnabled) return
  try {
    const integration = await runRevenueSync()
    const { errors = {} } = integration.revenue
    const failed = SOURCES.filter((s) => errors[s])
    logger.info(`Revenue sync done${failed.length ? ` (${failed.map((s) => `${s}: ${errors[s]}`).join('; ')})` : ''}`)
  } catch (err) {
    if (!(err instanceof NotConnectedError)) logger.error('Revenue sync failed:', err.message)
  }
}
