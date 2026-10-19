import { Router } from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth.js'
import { rejectInvalid } from '../middleware/validate.js'
import { LAUNCH_STAGES, Launch } from '../models/Launch.js'
import { Project } from '../models/Project.js'
import { isObjectId } from '../lib/objectId.js'
import { CAMPAIGN_CHANNELS } from '../models/Campaign.js'

const router = Router()
router.use(protect)

const DATE = /^\d{4}-\d{2}-\d{2}$/

const validators = [
  body('title').trim().isLength({ min: 1, max: 80 }).withMessage('Title is required'),
  body('projectId').custom(isObjectId).withMessage('Pick a project'),
  body('stage').optional().isIn(LAUNCH_STAGES),
  body('date').matches(DATE).withMessage('Date is required'),
  body('tasksDone').optional().isInt({ min: 0 }).toInt(),
  body('tasksTotal').optional().isInt({ min: 0 }).toInt(),
  body('channels').optional().isArray({ max: 8 }),
  body('channels.*').optional().isIn(CAMPAIGN_CHANNELS),
]

router.get('/', async (_req, res) => {
  const launches = await Launch.find().sort({ date: 1 }).lean()
  res.json({ launches })
})

router.post('/', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  const tasksTotal = req.body.tasksTotal ?? 0
  const tasksDone = Math.min(req.body.tasksDone ?? 0, tasksTotal)
  const launch = await Launch.create({
    ...req.body,
    stage: req.body.stage || 'Idea',
    tasksDone,
    tasksTotal,
    channels: req.body.channels || [],
  })
  res.status(201).json({ launch })
})

router.put('/:id', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  const tasksTotal = req.body.tasksTotal ?? 0
  const tasksDone = Math.min(req.body.tasksDone ?? 0, tasksTotal)
  const launch = await Launch.findByIdAndUpdate(
    req.params.id,
    { ...req.body, tasksDone, tasksTotal, channels: req.body.channels || [] },
    { new: true, runValidators: true },
  )
  if (!launch) return res.status(404).json({ message: 'Launch not found' })
  res.json({ launch })
})

router.delete('/:id', async (req, res) => {
  const launch = await Launch.findByIdAndDelete(req.params.id)
  if (!launch) return res.status(404).json({ message: 'Launch not found' })
  res.json({ success: true })
})

export default router
