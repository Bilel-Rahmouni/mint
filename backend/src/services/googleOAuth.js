import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { Integration } from '../models/Integration.js'
import { Project } from '../models/Project.js'
import { decrypt, encrypt } from '../utils/crypto.js'
import { callGoogle } from './googleAuth.js'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const PROVIDER = 'google'
const STATE_PURPOSE = 'google-oauth'

export const ADMOB_SCOPE = 'https://www.googleapis.com/auth/admob.readonly'
export const ADSENSE_SCOPE = 'https://www.googleapis.com/auth/adsense.readonly'
export const ADS_SCOPE = 'https://www.googleapis.com/auth/adwords'
const SCOPES = ['openid', 'email', ADMOB_SCOPE, ADSENSE_SCOPE, ADS_SCOPE]

export class NotConnectedError extends Error {}

let cached = { token: null, expiresAt: 0 }

export function buildAuthUrl(adminId, returnTo) {
  const state = jwt.sign({ id: String(adminId), returnTo, purpose: STATE_PURPOSE }, config.jwtSecret, { expiresIn: '10m' })
  const params = new URLSearchParams({
    client_id: config.googleOAuth.clientId,
    redirect_uri: config.googleOAuth.redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    // Forces a fresh refresh token even when the account already granted access
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `${AUTH_URL}?${params}`
}

export function readState(state) {
  const payload = jwt.verify(state, config.jwtSecret)
  if (payload.purpose !== STATE_PURPOSE) throw new Error('Invalid state')
  return payload
}

async function tokenRequest(params) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.googleOAuth.clientId,
      client_secret: config.googleOAuth.clientSecret,
      ...params,
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`Google sign-in failed: ${data.error_description || data.error || res.status}`)
    err.code = data.error
    throw err
  }
  return data
}

const emailFromIdToken = (idToken) => {
  try {
    return JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8')).email
  } catch {
    return undefined
  }
}

const remember = (data) => {
  cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
}

export async function connectWithCode(code) {
  const data = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: config.googleOAuth.redirectUri })
  if (!data.refresh_token) throw new Error('Google did not return a refresh token')
  remember(data)

  return Integration.findOneAndUpdate(
    { provider: PROVIDER },
    {
      $set: {
        email: data.id_token ? emailFromIdToken(data.id_token) : undefined,
        refreshToken: encrypt(data.refresh_token),
        scopes: (data.scope || '').split(' ').filter(Boolean),
        connectedAt: new Date(),
      },
      $unset: { error: 1 },
    },
    { upsert: true, new: true },
  )
}

async function markDisconnected(message) {
  cached = { token: null, expiresAt: 0 }
  await Integration.updateOne({ provider: PROVIDER }, { $unset: { refreshToken: 1 }, $set: { error: message } })
  throw new NotConnectedError(message)
}

async function getAccessToken() {
  if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token

  const integration = await Integration.findOne({ provider: PROVIDER }).select('+refreshToken')
  if (!integration?.refreshToken) throw new NotConnectedError('Google account is not connected')

  let refreshToken
  try {
    refreshToken = decrypt(integration.refreshToken)
  } catch {
    return markDisconnected('Stored Google sign-in can no longer be read, connect again')
  }

  try {
    remember(await tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' }))
    return cached.token
  } catch (err) {
    if (err.code === 'invalid_grant') return markDisconnected('Google access was revoked or expired, connect again')
    throw err
  }
}

export async function userFetch(url, options) {
  return callGoogle(await getAccessToken(), url, options)
}

export async function disconnect() {
  const integration = await Integration.findOne({ provider: PROVIDER }).select('+refreshToken')
  cached = { token: null, expiresAt: 0 }

  if (integration?.refreshToken) {
    try {
      await fetch(`${REVOKE_URL}?token=${encodeURIComponent(decrypt(integration.refreshToken))}`, {
        method: 'POST',
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      // Already revoked or unreadable, nothing left to clean up on Google's side
    }
  }

  await Integration.deleteOne({ provider: PROVIDER })
  await Project.updateMany({ revenue: { $exists: true } }, { $unset: { revenue: 1 } })
}
