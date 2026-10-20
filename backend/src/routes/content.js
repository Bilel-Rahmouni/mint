import { Router } from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth.js'
import { rejectInvalid } from '../middleware/validate.js'
import { CONTENT_SOCIALS, CONTENT_STATUSES, ContentPost } from '../models/ContentPost.js'
import { Project } from '../models/Project.js'
import { isObjectId } from '../lib/objectId.js'
import { listPubloraConnections } from '../services/publish.js'

const router = Router()
router.use(protect)

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}(:\d{2})?$/

const validators = [
  body('title').trim().isLength({ min: 1, max: 140 }).withMessage('Title is required'),
  body('projectId').custom(isObjectId).withMessage('Pick a project'),
  body('social').isIn(CONTENT_SOCIALS).withMessage('Channel is invalid'),
  body('status').optional().isIn(CONTENT_STATUSES),
  body('date').matches(DATE).withMessage('Date is required'),
  body('time').matches(TIME).withMessage('Time must be HH:MM')
    .customSanitizer((value) => String(value).slice(0, 5)),
  body('body').optional({ values: 'falsy' }).isLength({ max: 5000 }),
  body('link').optional({ values: 'falsy' }).trim().isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('mediaUrl').optional({ values: 'falsy' }).trim().isURL({ protocols: ['http', 'https'], require_protocol: true }),
  body('platformId').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
]

function postFields(body) {
  return {
    title: body.title,
    projectId: body.projectId,
    social: body.social,
    status: body.status || 'Scheduled',
    date: body.date,
    time: String(body.time).slice(0, 5),
    body: body.body || '',
    link: body.link || '',
    mediaUrl: body.mediaUrl || '',
    platformId: body.platformId || '',
    publishError: '',
    ...((body.status || 'Scheduled') !== 'Published' ? { externalId: '' } : {}),
  }
}

router.get('/connections', async (_req, res) => {
  try {
    res.json(await listPubloraConnections())
  } catch (err) {
    res.status(502).json({ configured: true, message: err.message, connections: [] })
  }
})

router.get('/', async (_req, res) => {
  const posts = await ContentPost.find().sort({ date: 1, time: 1 }).lean()
  res.json({ posts })
})

router.post('/', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  const post = await ContentPost.create(postFields(req.body))
  res.status(201).json({ post })
})

router.put('/:id', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  const post = await ContentPost.findByIdAndUpdate(req.params.id, postFields(req.body), { new: true, runValidators: true })
  if (!post) return res.status(404).json({ message: 'Post not found' })
  res.json({ post })
})

router.delete('/:id', async (req, res) => {
  const post = await ContentPost.findByIdAndDelete(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  res.json({ success: true })
})

export default router
