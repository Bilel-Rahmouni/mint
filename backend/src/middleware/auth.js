import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { Admin } from '../models/Admin.js'

export const signToken = (adminId) =>
  jwt.sign({ id: adminId }, config.jwtSecret, { expiresIn: config.jwtExpire })

export async function protect(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Not authorized' })

  let payload
  try {
    payload = jwt.verify(token, config.jwtSecret)
  } catch {
    return res.status(401).json({ message: 'Session expired, sign in again' })
  }
  // Single-purpose tokens (OAuth state) share the secret but must never act as a session
  if (payload.purpose) return res.status(401).json({ message: 'Not authorized' })

  const admin = await Admin.findById(payload.id)
  if (!admin || !admin.isActive) return res.status(401).json({ message: 'Not authorized' })

  req.admin = admin
  next()
}
