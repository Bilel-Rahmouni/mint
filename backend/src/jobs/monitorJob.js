import cron from 'node-cron'
import { googleEnabled, googleOAuthEnabled } from '../config.js'
import { runAllCertificateChecks, runAllUptimeChecks } from '../services/monitor.js'
import { runAllPlaySyncs } from '../services/play.js'
import { runScheduledRevenueSync } from '../services/revenue.js'
import { runAllWebSyncs } from '../services/web.js'
import { logger } from '../utils/logger.js'

const TIMEZONE = 'Europe/Copenhagen'

async function syncPlay() {
  try {
    const count = await runAllPlaySyncs()
    logger.info(`Play job: synced ${count} apps`)
  } catch (err) {
    logger.error('Play job error:', err)
  }
}

async function syncWeb() {
  try {
    const count = await runAllWebSyncs()
    logger.info(`Web job: synced ${count} sites`)
  } catch (err) {
    logger.error('Web job error:', err)
  }
}

export function startMonitorJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runAllUptimeChecks()
    } catch (err) {
      logger.error('Uptime job error:', err)
    }
  })

  cron.schedule('0 6 * * *', async () => {
    try {
      const count = await runAllCertificateChecks()
      logger.info(`Certificate job: checked ${count} projects`)
    } catch (err) {
      logger.error('Certificate job error:', err)
    }
  }, { timezone: TIMEZONE })

  if (googleEnabled) {
    cron.schedule('0 7 * * *', syncPlay, { timezone: TIMEZONE })
    cron.schedule('15 7 * * *', syncWeb, { timezone: TIMEZONE })
    syncPlay()
    syncWeb()
  }

  if (googleOAuthEnabled) {
    cron.schedule('20 */3 * * *', runScheduledRevenueSync, { timezone: TIMEZONE })
    runScheduledRevenueSync()
  }

  logger.info(
    `Monitor scheduled: uptime every 5 min, SSL + domain daily at 06:00${
      googleEnabled ? ', Google Play at 07:00, Search Console + Analytics at 07:15' : ''
    }${googleOAuthEnabled ? ', AdMob + AdSense every 3h' : ''}`,
  )
}
