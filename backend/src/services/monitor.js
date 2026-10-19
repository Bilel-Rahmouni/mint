import tls from 'node:tls'
import { isUnusedUrl } from '../lib/unusedHosts.js'
import { Check } from '../models/Check.js'
import { Project } from '../models/Project.js'
import { logger } from '../utils/logger.js'

const REQUEST_TIMEOUT_MS = 10_000
const USER_AGENT = 'MintMonitor/1.0 (+https://mintstudio.io)'
const TWO_LEVEL_SUFFIXES = ['com.tn', 'org.tn', 'net.tn', 'co.uk', 'org.uk', 'com.au', 'co.za']

const hostnameOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

const registrableDomain = (hostname) => {
  const labels = hostname.replace(/^www\./, '').split('.')
  const lastTwo = labels.slice(-2).join('.')
  const keep = TWO_LEVEL_SUFFIXES.includes(lastTwo) ? 3 : 2
  return labels.slice(-keep).join('.')
}

async function checkUptime(url) {
  const started = Date.now()
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT },
    })
    // Drain the body so the socket is released
    await res.arrayBuffer().catch(() => {})
    return { up: res.status < 400, statusCode: res.status, responseTimeMs: Date.now() - started }
  } catch (err) {
    return {
      up: false,
      responseTimeMs: Date.now() - started,
      error: err.name === 'TimeoutError' ? 'Timeout' : (err.cause?.code || err.message),
    }
  }
}

function checkSsl(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
      timeout: REQUEST_TIMEOUT_MS,
    })

    const done = (result) => {
      socket.destroy()
      resolve({ ...result, checkedAt: new Date() })
    }

    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate()
      if (!cert?.valid_to) return done({ error: 'No certificate' })
      done({
        validTo: new Date(cert.valid_to),
        issuer: cert.issuer?.O || cert.issuer?.CN,
        error: socket.authorized ? undefined : String(socket.authorizationError),
      })
    })
    socket.once('timeout', () => done({ error: 'Timeout' }))
    socket.once('error', (err) => done({ error: err.code || err.message }))
  })
}

async function checkDomain(hostname) {
  const name = registrableDomain(hostname)
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(name)}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: 'application/rdap+json', 'User-Agent': USER_AGENT },
    })
    if (!res.ok) return { name, error: `RDAP ${res.status}`, checkedAt: new Date() }

    const data = await res.json()
    const expiration = (data.events || []).find((e) => e.eventAction === 'expiration')
    const registrarEntity = (data.entities || []).find((e) => (e.roles || []).includes('registrar'))
    const registrar = registrarEntity?.vcardArray?.[1]?.find((f) => f[0] === 'fn')?.[3]
    return {
      name,
      expiresAt: expiration ? new Date(expiration.eventDate) : undefined,
      registrar,
      error: expiration ? undefined : 'No expiration date published',
      checkedAt: new Date(),
    }
  } catch (err) {
    return { name, error: err.name === 'TimeoutError' ? 'Timeout' : err.message, checkedAt: new Date() }
  }
}

export async function runUptimeCheck(project) {
  if (!project.url || isUnusedUrl(project.url)) return null
  const result = await checkUptime(project.url)
  const checkedAt = new Date()
  await Check.create({ projectId: project._id, ...result, checkedAt })
  project.lastCheck = { ...result, checkedAt }
  await project.save()
  return project.lastCheck
}

export async function runCertificateChecks(project) {
  if (isUnusedUrl(project.url)) return
  const hostname = project.url && hostnameOf(project.url)
  if (!hostname) return
  const [ssl, domain] = await Promise.all([checkSsl(hostname), checkDomain(hostname)])
  project.ssl = ssl
  project.domain = domain
  await project.save()
}

export async function runFullCheck(project) {
  await runUptimeCheck(project)
  await runCertificateChecks(project)
  return project
}

async function forEachMonitored(label, fn) {
  const projects = (await Project.find({ monitoringEnabled: true, url: { $nin: [null, ''] } }))
    .filter((project) => !isUnusedUrl(project.url))
  const results = await Promise.allSettled(projects.map(fn))
  results.forEach((r, i) => {
    if (r.status === 'rejected') logger.error(`${label} failed for ${projects[i].name}:`, r.reason)
  })
  return projects.length
}

export const runAllUptimeChecks = () => forEachMonitored('Uptime check', runUptimeCheck)
export const runAllCertificateChecks = () => forEachMonitored('Certificate check', runCertificateChecks)
