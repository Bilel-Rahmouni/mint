import { Router } from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth.js'
import { rejectInvalid } from '../middleware/validate.js'
import { KEYWORD_STORES, Keyword } from '../models/Keyword.js'
import { Project } from '../models/Project.js'
import { isObjectId } from '../lib/objectId.js'

const router = Router()
router.use(protect)

const validators = [
  body('keyword').trim().isLength({ min: 1, max: 80 }).withMessage('Keyword is required'),
  body('projectId').custom(isObjectId).withMessage('Pick a project'),
  body('store').isIn(KEYWORD_STORES).withMessage('Store is invalid'),
  body('rank').isInt({ min: 1, max: 500 }).toInt().withMessage('Rank must be 1-500'),
  body('volume').optional({ values: 'falsy' }).isInt({ min: 0 }).toInt(),
]

router.get('/', async (_req, res) => {
  const keywords = await Keyword.find().sort({ rank: 1 }).lean()
  res.json({
    keywords: keywords.map((k) => ({
      ...k,
      change: k.previousRank != null ? k.previousRank - k.rank : 0,
    })),
  })
})

router.post('/', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  try {
    const keyword = await Keyword.create(req.body)
    res.status(201).json({ keyword: { ...keyword.toObject(), change: 0 } })
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'That keyword is already tracked for this store' })
    throw err
  }
})

router.put('/:id', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  const existing = await Keyword.findById(req.params.id)
  if (!existing) return res.status(404).json({ message: 'Keyword not found' })
  const previousRank = existing.rank !== req.body.rank ? existing.rank : existing.previousRank
  existing.set({ ...req.body, previousRank })
  try {
    await existing.save()
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'That keyword is already tracked for this store' })
    throw err
  }
  res.json({
    keyword: { ...existing.toObject(), change: previousRank != null ? previousRank - existing.rank : 0 },
  })
})

router.delete('/:id', async (req, res) => {
  const keyword = await Keyword.findByIdAndDelete(req.params.id)
  if (!keyword) return res.status(404).json({ message: 'Keyword not found' })
  res.json({ success: true })
})

export default router
