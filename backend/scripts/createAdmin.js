import mongoose from 'mongoose'
import { config } from '../src/config.js'
import { Admin } from '../src/models/Admin.js'

const [email, password, name = 'Mint Admin'] = process.argv.slice(2)

if (!email || !password) {
  console.error('Usage: npm run create-admin -- <email> <password> [name]')
  process.exit(1)
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters')
  process.exit(1)
}

await mongoose.connect(config.mongoUri)

const existing = await Admin.findOne({ email: email.toLowerCase() })
if (existing) {
  existing.password = password
  existing.isActive = true
  await existing.save()
  console.log(`Password reset for ${existing.email}`)
} else {
  const admin = await Admin.create({ email, password, name })
  console.log(`Admin created: ${admin.email}`)
}

await mongoose.disconnect()
