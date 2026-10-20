import { Router } from 'express'
import { protect } from '../middleware/auth.js'
import { Alert } from '../models/Alert.js'

const router = Router()
router.use(protect)

router.get('/', async (_req, res) => {
  const [alerts, unread] = await Promise.all([
    Alert.find({ readAt: null }).sort({ createdAt: -1 }).limit(40).lean(),
    Alert.countDocuments({ readAt: null }),
  ])
  res.json({ alerts, unread })
})

router.post('/read', async (_req, res) => {
  await Alert.updateMany({ readAt: null }, { $set: { readAt: new Date() } })
  res.json({ success: true })
})

router.post('/:id/read', async (req, res) => {
  const alert = await Alert.findByIdAndUpdate(req.params.id, { readAt: new Date() }, { new: true })
  if (!alert) return res.status(404).json({ message: 'Alert not found' })
  res.json({ alert })
})

export default router
