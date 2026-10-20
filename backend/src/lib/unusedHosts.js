// Keep in sync with frontweb/src/lib/parkedHosts.ts
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

export function isUnusedUrl(url) {
  if (!url) return false
  try {
    return UNUSED_HOSTS.has(new URL(url).hostname.toLowerCase())
  } catch {
    return false
  }
}
