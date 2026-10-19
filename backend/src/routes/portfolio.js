import { Router } from 'express'
import { Project } from '../models/Project.js'

const router = Router()

// GET /api/portfolio — public list for the Work section of mintstudio.io
router.get('/', async (req, res) => {
  const projects = await Project.find({ showOnSite: true })
    .sort({ order: 1, createdAt: 1 })
    .select('name type url storeUrl')
    .lean()

  res.set('Cache-Control', 'public, max-age=300')
  res.json({
    projects: projects
      .map((p) => ({ id: p._id, name: p.name, type: p.type, href: p.url || p.storeUrl }))
      .filter((p) => p.href),
  })
})

export default router
