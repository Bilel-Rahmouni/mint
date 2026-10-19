import { Router } from 'express'
import { body } from 'express-validator'
import mongoose from 'mongoose'
import { protect } from '../middleware/auth.js'
import { rejectInvalid } from '../middleware/validate.js'
import { Check } from '../models/Check.js'
import { Project } from '../models/Project.js'
import { googleEnabled } from '../config.js'
import { runFullCheck } from '../services/monitor.js'
import { runPlaySync } from '../services/play.js'
import { runWebSync } from '../services/web.js'
import { logger } from '../utils/logger.js'

const router = Router()
router.use(protect)

const DAY_MS = 24 * 60 * 60 * 1000
const SPARKLINE_POINTS = 48
const RANGES = { '24h': DAY_MS, '7d': 7 * DAY_MS, '30d': 30 * DAY_MS }

const EDITABLE_FIELDS = [
  'name', 'type', 'url', 'storeUrl', 'client', 'stack', 'hosting',
  'repoUrl', 'notes', 'showOnSite', 'order', 'monitoringEnabled', 'packageName',
]

const pickEditable = (source) =>
  Object.fromEntries(EDITABLE_FIELDS.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]))

const optionalUrl = (field) =>
  body(field).optional({ values: 'falsy' }).trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage(`${field} must be a valid http(s) URL`)

const projectValidators = (isCreate) => [
  isCreate
    ? body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Name is required (max 80 characters)')
    : body('name').optional().trim().isLength({ min: 1, max: 80 }).withMessage('Name must be 1-80 characters'),
  body('type').optional().isIn(['website', 'app']).withMessage('Type must be website or app'),
  optionalUrl('url'),
  optionalUrl('storeUrl'),
  optionalUrl('repoUrl'),
  body('client').optional().trim().isLength({ max: 120 }),
  body('hosting').optional().trim().isLength({ max: 80 }),
  body('notes').optional().trim().isLength({ max: 4000 }),
  body('stack').optional().isArray({ max: 20 }).withMessage('Stack must be a list'),
  body('stack.*').optional().isString().trim().isLength({ max: 40 }),
  body('showOnSite').optional().isBoolean().toBoolean(),
  body('monitoringEnabled').optional().isBoolean().toBoolean(),
  body('order').optional().isInt({ min: 0 }).toInt(),
  body('packageName').optional({ values: 'falsy' }).trim()
    .matches(/^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/)
    .withMessage('Package name must look like com.company.app'),
]

const checkInBackground = (project) => {
  runFullCheck(project).catch((err) => logger.error(`Initial check failed for ${project.name}:`, err))
}

const syncPlayInBackground = (project) => {
  runPlaySync(project).catch((err) => logger.error(`Play sync failed for ${project.name}:`, err))
}

const syncWebInBackground = (project) => {
  runWebSync(project).catch((err) => logger.error(`Web sync failed for ${project.name}:`, err))
}

async function uptimeStatsSince(since, projectIds) {
  const match = { checkedAt: { $gte: since } }
  if (projectIds) match.projectId = { $in: projectIds }

  const rows = await Check.aggregate([
    { $match: match },
    { $sort: { checkedAt: -1 } },
    {
      $group: {
        _id: '$projectId',
        total: { $sum: 1 },
        up: { $sum: { $cond: ['$up', 1, 0] } },
        avgResponseMs: { $avg: '$responseTimeMs' },
        recent: { $push: { t: '$responseTimeMs', up: '$up' } },
      },
    },
    { $project: { total: 1, up: 1, avgResponseMs: 1, recent: { $slice: ['$recent', SPARKLINE_POINTS] } } },
  ])

  return new Map(rows.map((r) => [String(r._id), {
    uptimePct: r.total ? (r.up / r.total) * 100 : null,
    avgResponseMs: r.avgResponseMs != null ? Math.round(r.avgResponseMs) : null,
    sparkline: r.recent.reverse(),
  }]))
}

// GET /api/projects — all projects with latest status and 24h stats
router.get('/', async (req, res) => {
  const projects = await Project.find()
    .sort({ order: 1, createdAt: 1 })
    .select('-play.series -play.reviews -web.series -web.queries -web.pages -web.sources -revenue.series')
    .lean()
  const stats = await uptimeStatsSince(new Date(Date.now() - DAY_MS))

  res.json({
    projects: projects.map((p) => ({
      ...p,
      stats24h: stats.get(String(p._id)) || { uptimePct: null, avgResponseMs: null, sparkline: [] },
    })),
  })
})

// POST /api/projects
router.post('/', projectValidators(true), rejectInvalid, async (req, res) => {
  const data = pickEditable(req.body)
  if (data.order === undefined) {
    const last = await Project.findOne().sort({ order: -1 }).select('order').lean()
    data.order = last ? last.order + 1 : 0
  }
  const project = await Project.create(data)
  if (project.url) {
    checkInBackground(project)
    syncWebInBackground(project)
  }
  if (project.packageName) syncPlayInBackground(project)

  res.status(201).json({ project })
})

// PUT /api/projects/order — persist portfolio order from an ordered list of ids
router.put('/order', [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty list'),
  body('ids.*').custom((id) => mongoose.isValidObjectId(id)).withMessage('Invalid project id'),
], rejectInvalid, async (req, res) => {
  await Project.bulkWrite(req.body.ids.map((id, index) => ({
    updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
  })))
  res.json({ success: true })
})

// GET /api/projects/:id?range=24h|7d|30d — detail with check history
router.get('/:id', async (req, res) => {
  const project = await Project.findById(req.params.id).lean()
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const range = RANGES[req.query.range] ? req.query.range : '24h'
  const now = Date.now()
  const ids = [project._id]

  const [checks, s24, s7, s30] = await Promise.all([
    Check.find({ projectId: project._id, checkedAt: { $gte: new Date(now - RANGES[range]) } })
      .sort({ checkedAt: 1 })
      .select('up statusCode responseTimeMs error checkedAt -_id')
      .lean(),
    uptimeStatsSince(new Date(now - RANGES['24h']), ids),
    uptimeStatsSince(new Date(now - RANGES['7d']), ids),
    uptimeStatsSince(new Date(now - RANGES['30d']), ids),
  ])

  const key = String(project._id)
  const summary = (map) => {
    const s = map.get(key)
    return { uptimePct: s?.uptimePct ?? null, avgResponseMs: s?.avgResponseMs ?? null }
  }

  res.json({
    project,
    range,
    checks,
    stats: { '24h': summary(s24), '7d': summary(s7), '30d': summary(s30) },
  })
})

// PUT /api/projects/:id
router.put('/:id', projectValidators(false), rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.params.id)
  if (!project) return res.status(404).json({ message: 'Project not found' })

  const urlChanged = req.body.url !== undefined && req.body.url !== project.url
  const packageChanged = req.body.packageName !== undefined && req.body.packageName !== project.packageName
  project.set(pickEditable(req.body))
  if (urlChanged && !project.url) {
    project.lastCheck = undefined
    project.ssl = undefined
    project.domain = undefined
  }
  if (urlChanged) project.web = undefined
  if (packageChanged) project.play = undefined
  await project.save()

  if (urlChanged && project.url) {
    checkInBackground(project)
    syncWebInBackground(project)
  }
  if (packageChanged && project.packageName) syncPlayInBackground(project)

  res.json({ project })
})

// DELETE /api/projects/:id — also removes its check history
router.delete('/:id', async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  await Check.deleteMany({ projectId: project._id })
  res.json({ success: true })
})

// POST /api/projects/:id/check — run uptime, SSL and domain checks now
router.post('/:id/check', async (req, res) => {
  const project = await Project.findById(req.params.id)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  if (!project.url) return res.status(400).json({ message: 'Project has no URL to check' })

  await runFullCheck(project)
  res.json({ project })
})

// POST /api/projects/:id/play-sync — pull Google Play stats, vitals and reviews now
router.post('/:id/play-sync', async (req, res) => {
  if (!googleEnabled) return res.status(503).json({ message: 'Google is not configured on the server' })
  const project = await Project.findById(req.params.id)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  if (!project.packageName) return res.status(400).json({ message: 'Project has no package name' })

  await runPlaySync(project)
  res.json({ project })
})

// POST /api/projects/:id/web-sync — pull Search Console and Analytics data now
router.post('/:id/web-sync', async (req, res) => {
  if (!googleEnabled) return res.status(503).json({ message: 'Google is not configured on the server' })
  const project = await Project.findById(req.params.id)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  if (!project.url) return res.status(400).json({ message: 'Project has no URL' })

  await runWebSync(project)
  res.json({ project })
})

export default router
