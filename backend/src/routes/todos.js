import { Router } from 'express'
import { body } from 'express-validator'
import { isObjectId } from '../lib/objectId.js'
import { protect } from '../middleware/auth.js'
import { rejectInvalid } from '../middleware/validate.js'
import { Project } from '../models/Project.js'
import { TODO_AREAS, Todo } from '../models/Todo.js'
import { checkTodos } from '../services/todoCheck.js'

const router = Router()
router.use(protect)

router.get('/', async (_req, res) => {
  const todos = await Todo.find().sort({ doneAt: 1, createdAt: -1 }).lean()
  res.json({ todos })
})

router.post('/check', async (_req, res) => {
  const result = await checkTodos()
  res.json(result)
})

router.post('/', [
  body('projectId').custom(isObjectId).withMessage('Pick a project'),
  body('title').trim().isLength({ min: 1, max: 500 }).withMessage('Todo is required'),
  body('area').optional().isIn(TODO_AREAS),
], rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })
  const todo = await Todo.create({
    projectId: req.body.projectId,
    title: req.body.title,
    area: req.body.area || 'general',
  })
  res.status(201).json({ todo })
})

router.post('/:id/toggle', async (req, res) => {
  const todo = await Todo.findById(req.params.id)
  if (!todo) return res.status(404).json({ message: 'Todo not found' })
  todo.doneAt = todo.doneAt ? null : new Date()
  await todo.save()
  res.json({ todo })
})

export default router
