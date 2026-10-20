import { Router } from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth.js'
import { rejectInvalid } from '../middleware/validate.js'
import { CAMPAIGN_CHANNELS, CAMPAIGN_OBJECTIVES, CAMPAIGN_STATUSES, Campaign } from '../models/Campaign.js'
import { Project } from '../models/Project.js'
import { isObjectId } from '../lib/objectId.js'
import { listGoogleCampaigns, syncLinkedCampaigns } from '../services/googleAds.js'

const router = Router()
router.use(protect)

const DATE = /^\d{4}-\d{2}-\d{2}$/

function deriveStatus(start, end, fallback) {
  const today = new Date().toISOString().slice(0, 10)
  if (end < today) return 'Ended'
  if (start > today) return 'Scheduled'
  return fallback === 'Paused' ? 'Paused' : 'Live'
}

const validators = [
  body('name').trim().isLength({ min: 1, max: 80 }).withMessage('Name is required'),
  body('projectId').custom(isObjectId).withMessage('Pick a project'),
  body('channel').isIn(CAMPAIGN_CHANNELS).withMessage('Channel is invalid'),
  body('objective').isIn(CAMPAIGN_OBJECTIVES).withMessage('Objective is invalid'),
  body('status').optional().isIn(CAMPAIGN_STATUSES),
  body('budget').isFloat({ min: 0 }).toFloat().withMessage('Budget must be a number'),
  body('spent').optional().isFloat({ min: 0 }).toFloat(),
  body('conversions').optional().isFloat({ min: 0 }).toFloat(),
  body('revenue').optional().isFloat({ min: 0 }).toFloat(),
  body('start').matches(DATE).withMessage('Start date is required'),
  body('end').matches(DATE).withMessage('End date is required')
    .custom((end, { req }) => end >= req.body.start).withMessage('End must be after start'),
  body('googleCampaignId').optional({ values: 'falsy' }).matches(/^\d{1,20}$/).withMessage('Google campaign id is invalid'),
]

function campaignFields(body) {
  const googleCampaignId = body.channel === 'google' ? (body.googleCampaignId || '') : ''
  return { ...body, googleCampaignId }
}

router.get('/google', async (_req, res) => {
  res.json(await listGoogleCampaigns())
})

router.post('/google/sync', async (_req, res) => {
  try {
    const result = await syncLinkedCampaigns()
    if (!result.configured) return res.json({ ...result, campaigns: [] })
    const campaigns = await Campaign.find().sort({ start: -1, createdAt: -1 }).lean()
    res.json({ configured: true, campaigns })
  } catch (err) {
    res.status(502).json({ message: err.message || 'Google Ads sync failed' })
  }
})

router.get('/', async (_req, res) => {
  const campaigns = await Campaign.find().sort({ start: -1, createdAt: -1 }).lean()
  res.json({ campaigns })
})

router.post('/', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })

  const campaign = await Campaign.create({
    ...campaignFields(req.body),
    status: deriveStatus(req.body.start, req.body.end, req.body.status),
    spent: req.body.spent ?? 0,
    conversions: req.body.conversions ?? 0,
    revenue: req.body.revenue ?? 0,
  })
  res.status(201).json({ campaign })
})

router.put('/:id', validators, rejectInvalid, async (req, res) => {
  const project = await Project.findById(req.body.projectId).select('_id')
  if (!project) return res.status(400).json({ message: 'Project not found' })

  const campaign = await Campaign.findByIdAndUpdate(
    req.params.id,
    {
      ...campaignFields(req.body),
      status: req.body.status === 'Paused' || req.body.status === 'Ended'
        ? req.body.status
        : deriveStatus(req.body.start, req.body.end, req.body.status),
    },
    { new: true, runValidators: true },
  )
  if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
  res.json({ campaign })
})

router.post('/:id/toggle', async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
  if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
  if (campaign.status === 'Live') campaign.status = 'Paused'
  else if (campaign.status === 'Paused') campaign.status = deriveStatus(campaign.start, campaign.end, 'Live')
  else return res.status(400).json({ message: 'Only live or paused campaigns can be toggled' })
  await campaign.save()
  res.json({ campaign })
})

router.delete('/:id', async (req, res) => {
  const campaign = await Campaign.findByIdAndDelete(req.params.id)
  if (!campaign) return res.status(404).json({ message: 'Campaign not found' })
  res.json({ success: true })
})

export default router
