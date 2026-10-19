import { isUnusedProjectUrl } from '../../lib/parkedHosts'
import type { TopListRow } from '../components/TopList'
import type { PlayPoint, Project, SearchQuery, WebPoint } from './types'

function latest(dates: (string | undefined)[]) {
  return dates.filter(Boolean).sort().at(-1)
}

function sum(values: (number | undefined)[]) {
  const present = values.filter((v): v is number => v != null)
  return present.length ? present.reduce((total, n) => total + n, 0) : undefined
}

function weighted(rows: { value?: number; weight?: number }[]) {
  let total = 0
  let weight = 0
  for (const row of rows) {
    if (row.value == null || !row.weight) continue
    total += row.value * row.weight
    weight += row.weight
  }
  return weight ? total / weight : undefined
}

function mergeByDate<T extends { date: string }>(points: T[], add: (into: T, next: T) => void): T[] {
  const byDate = new Map<string, T>()
  for (const point of points) {
    const current = byDate.get(point.date)
    if (!current) {
      byDate.set(point.date, { ...point })
      continue
    }
    add(current, point)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function searchSummary(projects: Project[]) {
  const sites = projects.filter((p) => p.url)
  const clicks = sum(sites.map((p) => p.web?.clicks30d))
  const impressions = sum(sites.map((p) => p.web?.impressions30d))

  const queries = new Map<string, SearchQuery>()
  for (const project of sites) {
    for (const query of project.web?.queries ?? []) {
      const current = queries.get(query.key)
      if (!current) {
        queries.set(query.key, { ...query })
        continue
      }
      current.clicks += query.clicks
      current.impressions += query.impressions
      current.position = current.impressions
        ? (current.position * (current.impressions - query.impressions) + query.position * query.impressions)
          / current.impressions
        : query.position
    }
  }

  return {
    sites: sites.length,
    clicks,
    impressions,
    ctr: clicks != null && impressions ? clicks / impressions : undefined,
    position: weighted(sites.map((p) => ({ value: p.web?.position, weight: p.web?.impressions30d }))),
    syncedAt: latest(sites.map((p) => p.web?.syncedAt)),
    series: mergeByDate(
      sites.flatMap((p) => p.web?.series ?? []),
      (into, next) => {
        into.clicks = (into.clicks ?? 0) + (next.clicks ?? 0)
        into.impressions = (into.impressions ?? 0) + (next.impressions ?? 0)
      },
    ) as WebPoint[],
    topSites: sites
      .filter((p) => (p.web?.clicks30d ?? 0) > 0)
      .map((p) => ({ key: p.name, value: p.web?.clicks30d ?? 0 }))
      .sort((a, b) => b.value - a.value) as TopListRow[],
    topQueries: [...queries.values()]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10)
      .map((q) => ({ key: q.key, value: q.clicks, detail: `#${q.position.toFixed(1)}` })) as TopListRow[],
    errors: sites
      .filter((p) => p.web?.errors?.search && !isUnusedProjectUrl(p.url))
      .map((p) => ({ label: p.name, message: p.web?.errors?.search })),
  }
}

export function trafficSummary(projects: Project[]) {
  const sites = projects.filter((p) => p.url)
  const users = sum(sites.map((p) => p.web?.users30d))
  const sessions = sum(sites.map((p) => p.web?.sessions30d))
  const views = sum(sites.map((p) => p.web?.views30d))

  const sources = new Map<string, number>()
  for (const project of sites) {
    for (const row of project.web?.sources ?? []) {
      sources.set(row.key, (sources.get(row.key) ?? 0) + row.value)
    }
  }

  return {
    sites: sites.length,
    users,
    sessions,
    views,
    engagement: weighted(sites.map((p) => ({ value: p.web?.engagementRate, weight: p.web?.sessions30d }))),
    syncedAt: latest(sites.map((p) => p.web?.syncedAt)),
    series: mergeByDate(
      sites.flatMap((p) => p.web?.series ?? []),
      (into, next) => {
        into.users = (into.users ?? 0) + (next.users ?? 0)
        into.sessions = (into.sessions ?? 0) + (next.sessions ?? 0)
        into.views = (into.views ?? 0) + (next.views ?? 0)
      },
    ) as WebPoint[],
    topSites: sites
      .filter((p) => (p.web?.users30d ?? 0) > 0)
      .map((p) => ({ key: p.name, value: p.web?.users30d ?? 0 }))
      .sort((a, b) => b.value - a.value) as TopListRow[],
    topSources: [...sources.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, value]) => ({ key, value })) as TopListRow[],
    errors: sites
      .filter((p) => p.web?.errors?.analytics && !isUnusedProjectUrl(p.url))
      .map((p) => ({ label: p.name, message: p.web?.errors?.analytics })),
  }
}

export function playSummary(projects: Project[]) {
  const apps = projects.filter((p) => p.packageName)
  const devices = sum(apps.map((p) => p.play?.activeDevices))

  return {
    apps: apps.length,
    rating: weighted(apps.map((p) => ({ value: p.play?.rating, weight: p.play?.activeDevices }))),
    devices,
    installs: sum(apps.map((p) => p.play?.installs30d)),
    uninstalls: sum(apps.map((p) => p.play?.uninstalls30d)),
    totalInstalls: sum(apps.map((p) => p.play?.totalInstalls)),
    crashRate: weighted(apps.map((p) => ({ value: p.play?.crashRate, weight: p.play?.activeDevices }))),
    anrRate: weighted(apps.map((p) => ({ value: p.play?.anrRate, weight: p.play?.activeDevices }))),
    syncedAt: latest(apps.map((p) => p.play?.syncedAt)),
    series: mergeByDate(
      apps.flatMap((p) => p.play?.series ?? []),
      (into, next) => {
        into.installs = (into.installs ?? 0) + (next.installs ?? 0)
        into.uninstalls = (into.uninstalls ?? 0) + (next.uninstalls ?? 0)
      },
    ) as PlayPoint[],
    topApps: apps
      .filter((p) => (p.play?.installs30d ?? 0) > 0)
      .map((p) => ({ key: p.name, value: p.play?.installs30d ?? 0 }))
      .sort((a, b) => b.value - a.value) as TopListRow[],
    errors: apps.flatMap((p) =>
      [
        p.play?.errors?.stats && { label: p.name, message: p.play.errors.stats },
        p.play?.errors?.vitals && { label: `${p.name} vitals`, message: p.play.errors.vitals },
      ].filter(Boolean) as { label: string; message: string }[],
    ),
  }
}
