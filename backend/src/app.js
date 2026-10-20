import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { config } from './config.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import alertRoutes from './routes/alerts.js'
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import contentRoutes from './routes/content.js'
import integrationRoutes from './routes/integrations.js'
import keywordRoutes from './routes/keywords.js'
import launchRoutes from './routes/launches.js'
import portfolioRoutes from './routes/portfolio.js'
import projectRoutes from './routes/projects.js'
import todoRoutes from './routes/todos.js'

export const app = express()

app.set('trust proxy', 1)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use((req, res, next) => {
  if (req.headers['access-control-request-private-network']) {
    res.setHeader('Access-Control-Allow-Private-Network', 'true')
  }
  next()
})
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
app.use('/api/alerts', alertRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/todos', todoRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/launches', launchRoutes)
app.use('/api/keywords', keywordRoutes)

app.use(notFound)
app.use(errorHandler)
