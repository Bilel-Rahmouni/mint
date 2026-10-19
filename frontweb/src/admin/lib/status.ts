import { isUnusedProjectUrl } from '../../lib/parkedHosts'
import { daysUntil } from './format'
import type { Project } from './types'

export type Status = 'up' | 'warning' | 'down' | 'pending' | 'idle' | 'parked'

export const SSL_WARN_DAYS = 21
export const DOMAIN_WARN_DAYS = 30

export const STATUS_LABEL: Record<Status, string> = {
  up: 'Operational',
  warning: 'Attention',
  down: 'Down',
  pending: 'Pending',
  idle: 'Not monitored',
  parked: 'No site yet',
}

export function isMonitored(project: Project) {
  return Boolean(project.url) && project.monitoringEnabled && !isUnusedProjectUrl(project.url)
}

export function projectStatus(project: Project): Status {
  if (isUnusedProjectUrl(project.url)) return 'parked' // domain only, no product site
  if (!isMonitored(project)) return 'idle'
  if (!project.lastCheck) return 'pending'
  if (!project.lastCheck.up) return 'down'
  const ssl = daysUntil(project.ssl?.validTo)
  const domain = daysUntil(project.domain?.expiresAt)
  if (project.ssl?.error || (ssl != null && ssl <= SSL_WARN_DAYS) || (domain != null && domain <= DOMAIN_WARN_DAYS)) {
    return 'warning'
  }
  return 'up'
}

export type Alert = {
  id: string
  projectId: string
  level: 'danger' | 'warn'
  project: string
  message: string
}

export function collectAlerts(projects: Project[]): Alert[] {
  const alerts: Alert[] = []

  for (const p of projects) {
    if (!isMonitored(p)) continue

    if (p.lastCheck && !p.lastCheck.up) {
      alerts.push({
        id: `${p._id}-down`,
        projectId: p._id,
        level: 'danger',
        project: p.name,
        message: p.lastCheck.statusCode ? `Down · HTTP ${p.lastCheck.statusCode}` : `Down · ${p.lastCheck.error ?? 'No response'}`,
      })
    }

    const ssl = daysUntil(p.ssl?.validTo)
    if (ssl != null && ssl <= SSL_WARN_DAYS) {
      alerts.push({
        id: `${p._id}-ssl`,
        projectId: p._id,
        level: ssl <= 7 ? 'danger' : 'warn',
        project: p.name,
        message: ssl < 0 ? 'SSL expired' : `SSL expires in ${ssl}d`,
      })
    } else if (p.ssl?.error) {
      alerts.push({
        id: `${p._id}-ssl-error`,
        projectId: p._id,
        level: 'warn',
        project: p.name,
        message: `SSL · ${p.ssl.error}`,
      })
    }

    const domain = daysUntil(p.domain?.expiresAt)
    if (domain != null && domain <= DOMAIN_WARN_DAYS) {
      alerts.push({
        id: `${p._id}-domain`,
        projectId: p._id,
        level: domain <= 7 ? 'danger' : 'warn',
        project: p.name,
        message: domain < 0 ? 'Domain expired' : `Domain renews in ${domain}d`,
      })
    }
  }

  return alerts.sort((a, b) => (a.level === b.level ? 0 : a.level === 'danger' ? -1 : 1))
}
