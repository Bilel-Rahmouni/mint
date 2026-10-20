import { config, googleAdsEnabled } from '../config.js'
import { Campaign } from '../models/Campaign.js'
import { GoogleApiError } from './googleAuth.js'
import { NotConnectedError, userFetch } from './googleOAuth.js'

const NOT_CONFIGURED = 'Google Ads is not configured'
const API = 'https://googleads.googleapis.com/v21'

function headers() {
  return {
    'developer-token': config.googleAds.developerToken,
    ...(config.googleAds.loginCustomerId ? { 'login-customer-id': config.googleAds.loginCustomerId } : {}),
  }
}

function explain(err) {
  const message = err?.message || 'Google Ads request failed'
  if (/scope|permission|denied|unauthenticated/i.test(message)) {
    return `${message}. Reconnect Google to allow Ads.`
  }
  return message
}

async function search(query) {
  const customerId = config.googleAds.customerId
  const data = await userFetch(`${API}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: headers(),
    body: { query },
  })
  return data.results || []
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function statusFromGoogle(googleStatus, start, end) {
  if (googleStatus === 'REMOVED') return 'Ended'
  if (googleStatus === 'PAUSED') return 'Paused'
  const day = today()
  if (end && end < day) return 'Ended'
  if (start && start > day) return 'Scheduled'
  return 'Live'
}

export async function listGoogleCampaigns() {
  if (!googleAdsEnabled) return { configured: false, message: NOT_CONFIGURED, campaigns: [] }
  try {
    const rows = await search(`
      SELECT campaign.id, campaign.name, campaign.status
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
      LIMIT 200
    `)
    return {
      configured: true,
      campaigns: rows.map((row) => ({
        id: String(row.campaign?.id || ''),
        name: row.campaign?.name || 'Campaign',
        status: row.campaign?.status || '',
      })).filter((row) => row.id),
    }
  } catch (err) {
    if (err instanceof GoogleApiError || err instanceof NotConnectedError) {
      return { configured: true, message: explain(err), campaigns: [] }
    }
    throw err
  }
}

function sumMetrics(rows) {
  return rows.reduce((total, row) => {
    const metrics = row.metrics || {}
    return {
      spent: total.spent + Number(metrics.costMicros || metrics.cost_micros || 0) / 1_000_000,
      conversions: total.conversions + Number(metrics.conversions || 0),
      revenue: total.revenue + Number(metrics.conversionsValue || metrics.conversions_value || 0),
    }
  }, { spent: 0, conversions: 0, revenue: 0 })
}

const round = (value) => Math.round(value * 100) / 100

export async function syncLinkedCampaigns() {
  if (!googleAdsEnabled) return { configured: false, message: NOT_CONFIGURED, updated: 0 }
  try {
    const linked = await Campaign.find({ channel: 'google', googleCampaignId: { $nin: [null, ''] } })
    const day = today()
    for (const campaign of linked) {
      const id = String(campaign.googleCampaignId).replace(/\D/g, '')
      if (!id) continue
      const end = campaign.end && campaign.end < day ? campaign.end : day
      const dayOk = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '')
      const ranged = dayOk(campaign.start) && dayOk(end) && campaign.start <= end
      const query = ranged
        ? `
          SELECT campaign.id, campaign.status, campaign.start_date, campaign.end_date,
            metrics.cost_micros, metrics.conversions, metrics.conversions_value
          FROM campaign
          WHERE campaign.id = ${id}
            AND segments.date BETWEEN '${campaign.start}' AND '${end}'
        `
        : `
          SELECT campaign.id, campaign.status, campaign.start_date, campaign.end_date
          FROM campaign
          WHERE campaign.id = ${id}
        `
      const rows = await search(query)
      if (!rows.length) continue
      const info = rows[0].campaign || {}
      const metrics = sumMetrics(rows)
      const startDate = info.startDate || info.start_date
      const endDate = info.endDate || info.end_date
      if (startDate) campaign.start = startDate
      if (endDate && endDate < '2037-01-01') campaign.end = endDate
      if (ranged) {
        campaign.spent = round(metrics.spent)
        campaign.conversions = round(metrics.conversions)
        campaign.revenue = round(metrics.revenue)
      }
      campaign.status = statusFromGoogle(info.status, campaign.start, campaign.end)
      await campaign.save()
    }
    return { configured: true, updated: linked.length }
  } catch (err) {
    if (err instanceof GoogleApiError || err instanceof NotConnectedError) throw new Error(explain(err))
    throw err
  }
}
