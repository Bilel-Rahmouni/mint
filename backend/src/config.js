import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !process.env[key])
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`)
  process.exit(1)
}

function readGoogleKeyFile() {
  const path = process.env.GOOGLE_KEY_FILE
  if (!path || !existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    console.error(`GOOGLE_KEY_FILE ${path} is not valid JSON`)
    return {}
  }
}

const googleKey = readGoogleKeyFile()
const port = Number(process.env.PORT) || 4600
const srcDir = path.dirname(fileURLToPath(import.meta.url))

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  corsOrigins: (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  google: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL || googleKey.client_email || '',
    // .env files store the PEM on one line with literal "\n"
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || googleKey.private_key || '').replace(/\\n/g, '\n'),
    reportsBucket: process.env.PLAY_REPORTS_BUCKET || '',
  },
  googleOAuth: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || `http://localhost:${port}/api/integrations/google/callback`,
  },
  googleAds: {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    customerId: (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/\D/g, ''),
    loginCustomerId: (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/\D/g, ''),
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.ALERT_FROM || '',
  },
  publoraApiKey: process.env.PUBLORA_API_KEY || '',
  careerOpsDir: process.env.CAREER_OPS_DIR || path.resolve(srcDir, '../../../career-ops-main'),
  cursorApiKey: process.env.CURSOR_API_KEY || '',
}

export const googleEnabled = Boolean(config.google.clientEmail && config.google.privateKey)
export const googleOAuthEnabled = Boolean(config.googleOAuth.clientId && config.googleOAuth.clientSecret)
export const googleAdsEnabled = Boolean(
  googleOAuthEnabled && config.googleAds.developerToken && config.googleAds.customerId,
)
