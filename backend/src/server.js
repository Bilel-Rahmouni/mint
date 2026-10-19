import mongoose from 'mongoose'
import { app } from './app.js'
import { config } from './config.js'
import { startMonitorJob } from './jobs/monitorJob.js'
import { logger } from './utils/logger.js'

try {
  await mongoose.connect(config.mongoUri)
  logger.info('MongoDB connected')
} catch (err) {
  logger.error('MongoDB connection failed:', err.message)
  process.exit(1)
}

startMonitorJob()

const server = app.listen(config.port, () => {
  logger.info(`Mint API listening on port ${config.port} (${config.env})`)
})

const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down`)
  server.close(async () => {
    await mongoose.disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
