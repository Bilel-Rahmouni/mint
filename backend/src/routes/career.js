import { Router } from 'express'
import { body } from 'express-validator'
import { protect } from '../middleware/auth.js'
import { rejectInvalid } from '../middleware/validate.js'
import { loadCareerCv, loadCareerOps } from '../services/careerOps.js'
import { addCareerJob, listCareerJobs } from '../services/careerJobs.js'
import { careerConnectsStatus, startCareerConnects } from '../services/careerConnects.js'
import { careerRunStatus, startCareerRun } from '../services/careerRun.js'

const router = Router()
router.use(protect)

router.get('/', async (_req, res, next) => {
  try {
    res.json(await loadCareerOps())
  } catch (err) {
    next(err)
  }
})

router.get('/cv', async (_req, res, next) => {
  try {
    res.json({ markdown: await loadCareerCv() })
  } catch (err) {
    next(err)
  }
})

router.get('/run', async (_req, res, next) => {
  try {
    res.json(await careerRunStatus())
  } catch (err) {
    next(err)
  }
})

router.post('/run', [
  body('id').trim().notEmpty().withMessage('Pick a command'),
], rejectInvalid, async (req, res, next) => {
  try {
    res.status(202).json(await startCareerRun(req.body.id))
  } catch (err) {
    next(err)
  }
})

router.get('/jobs', async (_req, res, next) => {
  try {
    res.json({ jobs: await listCareerJobs() })
  } catch (err) {
    next(err)
  }
})

router.post('/jobs', [
  body('text').trim().isLength({ min: 1, max: 20000 }).withMessage('Paste a job'),
], rejectInvalid, async (req, res, next) => {
  try {
    res.status(202).json({ job: await addCareerJob(req.body.text) })
  } catch (err) {
    next(err)
  }
})

router.get('/connects', async (_req, res, next) => {
  try {
    res.json(await careerConnectsStatus())
  } catch (err) {
    next(err)
  }
})

router.post('/connects', async (_req, res, next) => {
  try {
    res.status(202).json(await startCareerConnects())
  } catch (err) {
    next(err)
  }
})

export default router
