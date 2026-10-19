import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { body } from 'express-validator'
import { protect, signToken } from '../middleware/auth.js'
import { rejectInvalid } from '../middleware/validate.js'
import { Admin } from '../models/Admin.js'

const router = Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, try again later' },
})

router.post(
  '/login',
  loginLimiter,
  body('email').trim().isEmail().withMessage('Enter a valid email').toLowerCase(),
  body('password').isString().notEmpty().withMessage('Password is required'),
  rejectInvalid,
  async (req, res) => {
    const admin = await Admin.findOne({ email: req.body.email }).select('+password')
    const valid = admin && admin.isActive && await admin.comparePassword(req.body.password)
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' })

    admin.lastLoginAt = new Date()
    await admin.save()

    res.json({ token: signToken(admin._id), user: admin.toPublic() })
  },
)

router.get('/me', protect, (req, res) => {
  res.json({ user: req.admin.toPublic() })
})

export default router
