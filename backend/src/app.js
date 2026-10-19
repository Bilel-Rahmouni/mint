import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { config } from './config.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import integrationRoutes from './routes/integrations.js'
import portfolioRoutes from './routes/portfolio.js'
import projectRoutes from './routes/projects.js'

export const app = express()

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({
  // With no CORS_ORIGINS set every origin is allowed; set it in production
  origin: config.corsOrigins.length ? config.corsOrigins : true,
}))
app.use(express.json({ limit: '100kb' }))

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, slow down' },
}))

app.get('/api/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded' })
})

app.use('/api/auth', authRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/projects', projectRoutes)

app.use(notFound)
app.use(errorHandler)
