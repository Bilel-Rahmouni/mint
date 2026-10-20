const UNUSED_HOSTS = new Set([
  'onecrew.me',
  'www.onecrew.me',
  'takwira.site',
  'www.takwira.site',
  'koultounsi.com',
  'www.koultounsi.com',
  'tounsy.com',
  'www.tounsy.com',
])

export const PARKED_EMAIL = 'indigenoustech001@gmail.com'

export function bareHost(host = window.location.hostname) {
  return host.replace(/^www\./, '').toLowerCase()
}

export function isParkedHost(host = window.location.hostname) {
  return UNUSED_HOSTS.has(host.toLowerCase())
}

export function isUnusedProjectUrl(url?: string) {
  if (!url) return false
  try {
    return isParkedHost(new URL(url).hostname)
  } catch {
    return false
  }
}

export function parkedDomain(host = window.location.hostname) {
  const name = bareHost(host)
  if (name === 'localhost' || name === '127.0.0.1') return 'tounsy.com'
  return name
}
