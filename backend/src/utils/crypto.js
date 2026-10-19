import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { config } from '../config.js'

const ALGORITHM = 'aes-256-gcm'
const key = createHash('sha256').update(`mint-secrets:${config.jwtSecret}`).digest()

export function encrypt(plain) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64url')).join('.')
}

// Throws when the value was encrypted with a different JWT_SECRET
export function decrypt(sealed) {
  const [iv, tag, data] = sealed.split('.').map((part) => Buffer.from(part, 'base64url'))
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
