import { googleEnabled } from '../config.js'
import { Project } from '../models/Project.js'
import { logger } from '../utils/logger.js'
import { googleFetch } from './googleAuth.js'

const SEARCH_API = 'https://searchconsole.googleapis.com/webmasters/v3'
const ANALYTICS_DATA_API = 'https://analyticsdata.googleapis.com/v1beta'
const ANALYTICS_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta'

const DAY_MS = 24 * 60 * 60 * 1000
const SERIES_DAYS = 60
const WINDOW_DAYS = 30
const TOP_ROWS = 10
const TOP_SOURCES = 6

const bareHost = (value) => {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

const isoDay = (offsetDays) => new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10)

const errorMessage = (result) => (result.status === 'rejected' ? result.reason?.message || 'Failed' : undefined)

// Sites and properties are matched to projects by domain, so sharing them with the service account is enough
async function discoverSearchSites() {
  const data = await googleFetch(`${SEARCH_API}/sites`)
  const sites = new Map()
  for (const { siteUrl, permissionLevel } of data.siteEntry || []) {
    if (permissionLevel === 'siteUnverifiedUser') continue
    const isDomain = siteUrl.startsWith('sc-domain:')
    const host = isDomain ? siteUrl.slice('sc-domain:'.length).toLowerCase().replace(/^www\./, '') : bareHost(siteUrl)
    if (host && (isDomain || !sites.has(host))) sites.set(host, siteUrl)
  }
  return sites
}

async function discoverAnalyticsProperties() {
  const accounts = []
  let pageToken = ''
  do {
    const query = `pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`
    const data = await googleFetch(`${ANALYTICS_ADMIN_API}/accountSummaries?${query}`)
    accounts.push(...(data.accountSummaries || []))
    pageToken = data.nextPageToken
  } while (pageToken)

  const properties = new Map()
  const propertyIds = accounts.flatMap((a) => (a.propertySummaries || []).map((p) => p.property))
  await Promise.all(propertyIds.map(async (property) => {
    const data = await googleFetch(`${ANALYTICS_ADMIN_API}/${property}/dataStreams`)
    for (const stream of data.dataStreams || []) {
      const host = bareHost(stream.webStreamData?.defaultUri)
      if (host && !properties.has(host)) properties.set(host, property)
    }
  }))
  return properties
}

async function discoverLinks() {
  const [sites, properties] = await Promise.allSettled([discoverSearchSites(), discoverAnalyticsProperties()])
  const value = (r) => (r.status === 'fulfilled' ? r.value : r.reason)
  return { sites: value(sites), properties: value(properties) }
}

function resolveLink(links, host, missingMessage) {
  if (links instanceof Error) throw links
  const id = links.get(host)
  if (!id) throw new Error(missingMessage)
  return id
}

async function searchQuery(site, body) {
  const data = await googleFetch(`${SEARCH_API}/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
    method: 'POST',
    body: { dataState: 'all', ...body },
  })
  return data.rows || []
}

async function fetchSearch(site) {
  const endDate = isoDay(-1)
  const recent = { startDate: isoDay(-WINDOW_DAYS), endDate }
  const [daily, totals, queries] = await Promise.all([
    searchQuery(site, { startDate: isoDay(-SERIES_DAYS), endDate, dimensions: ['date'], rowLimit: SERIES_DAYS + 5 }),
    searchQuery(site, recent),
    searchQuery(site, { ...recent, dimensions: ['query'], rowLimit: TOP_ROWS }),
  ])

  const total = totals[0] ?? {}
  return {
    site,
    series: daily.map((r) => ({ date: r.keys[0], clicks: r.clicks, impressions: r.impressions })),
    summary: {
      clicks30d: total.clicks ?? 0,
      impressions30d: total.impressions ?? 0,
      ctr: total.ctr,
      position: total.position,
    },
    queries: queries.map((r) => ({
      key: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      position: r.position,
    })),
  }
}

async function runReport(property, body) {
  const data = await googleFetch(`${ANALYTICS_DATA_API}/${property}:runReport`, { method: 'POST', body })
  return (data.rows || []).map((row) => ({
    dims: (row.dimensionValues || []).map((v) => v.value),
    values: (row.metricValues || []).map((v) => Number(v.value)),
  }))
}

const fromGaDate = (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`

const metrics = (...names) => names.map((name) => ({ name }))

const topBy = (metricName) => [{ metric: { metricName }, desc: true }]

async function fetchAnalytics(property) {
  const recent = [{ startDate: `${WINDOW_DAYS}daysAgo`, endDate: 'yesterday' }]
  const [daily, totals, pages, sources] = await Promise.all([
    runReport(property, {
      dateRanges: [{ startDate: `${SERIES_DAYS}daysAgo`, endDate: 'yesterday' }],
      dimensions: [{ name: 'date' }],
      metrics: metrics('activeUsers', 'sessions', 'screenPageViews'),
      limit: SERIES_DAYS + 5,
    }),
    runReport(property, {
      dateRanges: recent,
      metrics: metrics('activeUsers', 'sessions', 'screenPageViews', 'engagementRate'),
    }),
    runReport(property, {
      dateRanges: recent,
      dimensions: [{ name: 'pagePath' }],
      metrics: metrics('screenPageViews'),
      orderBys: topBy('screenPageViews'),
      limit: TOP_ROWS,
    }),
    runReport(property, {
      dateRanges: recent,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: metrics('sessions'),
      orderBys: topBy('sessions'),
      limit: TOP_SOURCES,
    }),
  ])

  const [users = 0, sessions = 0, views = 0, engagementRate] = totals[0]?.values ?? []
  return {
    property,
    series: daily.map((r) => ({ date: fromGaDate(r.dims[0]), users: r.values[0], sessions: r.values[1], views: r.values[2] })),
    summary: { users30d: users, sessions30d: sessions, views30d: views, engagementRate },
    pages: pages.map((r) => ({ key: r.dims[0], value: r.values[0] })),
    sources: sources.map((r) => ({ key: r.dims[0], value: r.values[0] })),
  }
}

export async function runWebSync(project, links) {
  if (!googleEnabled || !project.url) return project

  const host = bareHost(project.url)
  const { sites, properties } = links ?? (await discoverLinks())

  const [search, analytics] = await Promise.allSettled([
    (async () => fetchSearch(resolveLink(sites, host, `${host} is not shared in Search Console`)))(),
    (async () => fetchAnalytics(resolveLink(properties, host, `${host} is not shared in Analytics`)))(),
  ])

  const previous = project.web?.toObject?.() ?? project.web ?? {}
  const web = { ...previous, errors: {} }
  const seriesByDate = new Map((previous.series || []).map((d) => [d.date, { ...d }]))
  const point = (date) => {
    if (!seriesByDate.has(date)) seriesByDate.set(date, { date })
    return seriesByDate.get(date)
  }

  if (search.status === 'fulfilled') {
    const { site, summary, series, queries } = search.value
    Object.assign(web, summary, { searchSite: site, queries })
    for (const d of series) Object.assign(point(d.date), { clicks: d.clicks, impressions: d.impressions })
  } else {
    web.errors.search = errorMessage(search)
  }

  if (analytics.status === 'fulfilled') {
    const { property, summary, series, pages, sources } = analytics.value
    Object.assign(web, summary, { analyticsProperty: property, pages, sources })
    for (const d of series) Object.assign(point(d.date), { users: d.users, sessions: d.sessions, views: d.views })
  } else {
    web.errors.analytics = errorMessage(analytics)
  }

  web.series = [...seriesByDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-SERIES_DAYS)
  web.syncedAt = new Date()

  project.web = web
  await project.save()
  return project
}

export async function runAllWebSyncs() {
  if (!googleEnabled) return 0
  const projects = await Project.find({ url: { $nin: [null, ''] } })
  if (!projects.length) return 0

  const links = await discoverLinks()
  const results = await Promise.allSettled(projects.map((project) => runWebSync(project, links)))
  results.forEach((r, i) => {
    if (r.status === 'rejected') logger.error(`Web sync failed for ${projects[i].name}:`, r.reason)
  })
  return projects.length
}
