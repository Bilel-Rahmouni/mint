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
const DEFAULT_TASKS = ['Listing', 'Screenshots', 'Privacy', 'First post', 'Ads']
  .map((title) => ({ title, done: false }))

function cleanTasks(tasks, fallback) {
  if (!Array.isArray(tasks)) return fallback
  return tasks
    .map((task) => ({ title: String(task?.title || '').trim(), done: Boolean(task?.done) }))
    .filter((task) => task.title)
    .slice(0, 40)
}

function presentLaunch(launch) {
  const tasks = (launch.tasks || []).map((task) => ({
    _id: task._id,
    title: task.title,
    done: Boolean(task.done),
  }))
  return {
    _id: launch._id,
    title: launch.title,
    projectId: launch.projectId,
    stage: launch.stage,
    date: launch.date,
    channels: launch.channels || [],
    tasks,
    tasksDone: tasks.filter((task) => task.done).length,
    tasksTotal: tasks.length,
    createdAt: launch.createdAt,
    updatedAt: launch.updatedAt,
  }
}

const validators = [
  body('title').trim().isLength({ min: 1, max: 80 }).withMessage('Title is required'),
  body('projectId').custom(isObjectId).withMessage('Pick a project'),
  body('stage').optional().isIn(LAUNCH_STAGES),
  body('date').matches(DATE).withMessage('Date is required'),
  body('tasks').optional().isArray({ max: 40 }),
  body('tasks.*.title').optional().trim().isLength({ min: 1, max: 80 }),
  body('tasks.*.done').optional().isBoolean(),
  body('channels').optional().isArray({ max: 8 }),
  body('channels.*').optional().isIn(CAMPAIGN_CHANNELS),
]

router.get('/', async (_req, res) => {
  const launches = await Launch.find().sort({ date: 1 }).lean()
  res.json({ launches: launches.map(presentLaunch) })
})

router.post('/', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  const launch = await Launch.create({
    title: req.body.title,
    projectId: req.body.projectId,
    stage: req.body.stage || 'Idea',
    date: req.body.date,
    channels: req.body.channels || [],
    tasks: cleanTasks(req.body.tasks, DEFAULT_TASKS),
  })
  res.status(201).json({ launch: presentLaunch(launch) })
})

router.put('/:id', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  const launch = await Launch.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        projectId: req.body.projectId,
        stage: req.body.stage || 'Idea',
        date: req.body.date,
        channels: req.body.channels || [],
        tasks: cleanTasks(req.body.tasks, []),
      },
      $unset: { tasksDone: 1, tasksTotal: 1 },
    },
    { new: true, runValidators: true },
  )
  if (!launch) return res.status(404).json({ message: 'Launch not found' })
  res.json({ launch: presentLaunch(launch) })
})

router.delete('/:id', async (req, res) => {
  const launch = await Launch.findByIdAndDelete(req.params.id)
  if (!launch) return res.status(404).json({ message: 'Launch not found' })
  res.json({ success: true })
})

export default router
