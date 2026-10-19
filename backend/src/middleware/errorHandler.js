import { config } from '../config.js'
import { logger } from '../utils/logger.js'

export function notFound(req, res) {
  res.status(404).json({ message: 'Not found' })
}

// Express needs all four arguments to treat this as an error handler
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500
  let message = err.message || 'Server error'

  if (err.name === 'CastError') {
    status = 404
    message = 'Not found'
  } else if (err.name === 'ValidationError') {
    status = 400
    message = Object.values(err.errors).map((e) => e.message).join(', ')
  } else if (err.code === 11000) {
    status = 409
    message = 'Already exists'
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, err)
    if (config.isProd) message = 'Server error'
  }

  res.status(status).json({ message })
}
