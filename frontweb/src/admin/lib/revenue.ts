import type { AccountRevenue, AdmobApp, Project } from './types'
import type { TopListRow } from '../components/TopList'

export type RevenueIssue = {
  key: string
  source: 'AdMob' | 'AdSense'
  label: string
  state: string
  tone: 'warn' | 'danger'
}

const SITE_STATES: Record<string, Pick<RevenueIssue, 'state' | 'tone'>> = {
  NEEDS_ATTENTION: { state: 'Rejected', tone: 'danger' },
  REQUIRES_REVIEW: { state: 'Review not requested', tone: 'warn' },
  GETTING_READY: { state: 'In review', tone: 'warn' },
}

const ALERT_TONES: Record<string, RevenueIssue['tone']> = { SEVERE: 'danger', WARNING: 'warn' }

// Account-wide policy announcements Google shows every publisher, nothing to act on
const BROADCAST_ALERTS = [/war in ukraine/i]

const PLATFORM_LABEL: Record<string, string> = { ANDROID: 'Android', IOS: 'iOS' }

function appIssue(app: AdmobApp): Pick<RevenueIssue, 'state' | 'tone'> | null {
  if (!app.linked) return { state: 'Not on a store', tone: 'warn' }
  // Store-linked apps stay limited until app-ads.txt on the listing's website is verified
  if (app.approval === 'IN_REVIEW' || app.approval === 'ACTION_REQUIRED') return { state: 'Verify app-ads.txt', tone: 'warn' }
  return null
}

export function revenueIssues(revenue?: AccountRevenue): RevenueIssue[] {
  const issues: RevenueIssue[] = []

  for (const app of revenue?.admob?.apps ?? []) {
    const issue = appIssue(app)
    if (!issue) continue
    const platform = app.platform ? PLATFORM_LABEL[app.platform] : undefined
    issues.push({ key: `app:${app.appId}`, source: 'AdMob', label: [app.name, platform].filter(Boolean).join(' · '), ...issue })
  }

  for (const site of revenue?.adsense?.sites ?? []) {
    const known = site.state ? SITE_STATES[site.state] : undefined
    if (known) issues.push({ key: `site:${site.domain}`, source: 'AdSense', label: site.domain, ...known })
  }

  for (const [i, alert] of (revenue?.adsense?.alerts ?? []).entries()) {
    const tone = alert.severity ? ALERT_TONES[alert.severity] : undefined
    if (tone && alert.message && !BROADCAST_ALERTS.some((pattern) => pattern.test(alert.message ?? ''))) {
      issues.push({ key: `alert:${i}`, source: 'AdSense', label: alert.message, state: tone === 'danger' ? 'Severe' : 'Warning', tone })
    }
  }

  return issues.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'danger' ? -1 : 1))
}

export function topEarners(projects: Project[], revenue?: AccountRevenue): TopListRow[] {
  const matched = projects
    .filter((p) => (p.revenue?.earnings30d ?? 0) > 0)
    .map((p) => ({ key: p.name, value: p.revenue?.earnings30d ?? 0 }))
  const unmatched = (revenue?.unassigned ?? []).map((row) => ({
    key: row.label,
    value: row.earnings30d,
    detail: row.source === 'admob' ? 'AdMob' : 'AdSense',
  }))
  return [...matched, ...unmatched].sort((a, b) => b.value - a.value)
}
