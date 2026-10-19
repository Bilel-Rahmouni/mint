import { Router } from 'express'
import { config, googleOAuthEnabled } from '../config.js'
import { protect } from '../middleware/auth.js'
import { Admin } from '../models/Admin.js'
import { Integration } from '../models/Integration.js'
import { buildAuthUrl, connectWithCode, disconnect, NotConnectedError, readState } from '../services/googleOAuth.js'
import { runRevenueSync } from '../services/revenue.js'
import { logger } from '../utils/logger.js'

const router = Router()

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

// Only send people back to our own dashboard after Google sign-in
function safeReturnTo(value) {
  try {
    const url = new URL(value)
    const trusted = config.corsOrigins.includes(url.origin) || (!config.isProd && LOCAL_HOSTS.has(url.hostname))
    return trusted && url.pathname.startsWith('/admin') ? url : null
  } catch {
    return null
  }
}

async function googleStatus() {
  const integration = await Integration.findOne({ provider: 'google' }).select('+refreshToken').lean()
  return {
    configured: googleOAuthEnabled,
    connected: Boolean(integration?.refreshToken),
    email: integration?.email,
    connectedAt: integration?.connectedAt,
    error: integration?.error,
    revenue: integration?.revenue,
  }
}

const syncInBackground = () => {
  runRevenueSync().catch((err) => logger.error('Revenue sync failed:', err.message))
}

// Google redirects here without our bearer token, so the signed state proves who started it
router.get('/google/callback', async (req, res) => {
  let state
  try {
    state = readState(String(req.query.state || ''))
  } catch {
    return res.status(400).send('This sign-in link expired. Start again from the dashboard.')
  }

  const returnTo = safeReturnTo(state.returnTo)
  const finish = (status) => {
    if (!returnTo) return res.send(`Google ${status}. You can close this tab.`)
    returnTo.searchParams.set('google', status)
    return res.redirect(returnTo.href)
  }

  const admin = await Admin.findById(state.id)
  if (!admin?.isActive) return res.status(403).send('Not authorized')
  if (req.query.error || !req.query.code) return finish('denied')

  try {
    await connectWithCode(String(req.query.code))
    syncInBackground()
    return finish('connected')
  } catch (err) {
    logger.error('Google connect failed:', err.message)
    return finish('error')
  }
})

router.use(protect)

// GET /api/integrations/google — connection state and account-wide revenue
router.get('/google', async (req, res) => {
  res.json(await googleStatus())
})

// GET /api/integrations/google/connect?returnTo= — Google consent URL
router.get('/google/connect', (req, res) => {
  if (!googleOAuthEnabled) return res.status(503).json({ message: 'Google sign-in is not configured on the server' })
  const returnTo = safeReturnTo(String(req.query.returnTo || ''))
  if (!returnTo) return res.status(400).json({ message: 'Invalid return address' })
  res.json({ url: buildAuthUrl(req.admin._id, returnTo.href) })
})

// POST /api/integrations/google/sync — pull AdMob and AdSense now
router.post('/google/sync', async (req, res) => {
  if (!googleOAuthEnabled) return res.status(503).json({ message: 'Google sign-in is not configured on the server' })
  try {
    await runRevenueSync()
  } catch (err) {
    if (err instanceof NotConnectedError) return res.status(409).json({ message: err.message })
    throw err
  }
  res.json(await googleStatus())
})

// DELETE /api/integrations/google — revoke access and drop revenue data
router.delete('/google', async (req, res) => {
  await disconnect()
  res.json(await googleStatus())
})

export default router
