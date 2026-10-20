import jwt from 'jsonwebtoken'
import { config } from '../config.js'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPES = [
  'https://www.googleapis.com/auth/androidpublisher',
  'https://www.googleapis.com/auth/playdeveloperreporting',
  'https://www.googleapis.com/auth/devstorage.read_only',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
].join(' ')

let cached = { token: null, expiresAt: 0 }

async function getAccessToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token

  const assertion = jwt.sign(
    { iss: config.google.clientEmail, scope: SCOPES, aud: TOKEN_URL },
    config.google.privateKey,
    { algorithm: 'RS256', expiresIn: '1h' },
  )

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    signal: AbortSignal.timeout(15_000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Google auth failed: ${data.error_description || data.error || res.status}`)

  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cached.token
}

export class GoogleApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function googleFetch(url, options) {
  return callGoogle(await getAccessToken(), url, options)
}

export async function callGoogle(token, url, { method = 'GET', body, raw = false, headers = {} } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new GoogleApiError(data.error?.message || `Google API ${res.status}`, res.status)
  }
  return raw ? Buffer.from(await res.arrayBuffer()) : res.json()
}
