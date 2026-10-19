import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  isActive: { type: Boolean, default: true },
  lastLoginAt: Date,
}, { timestamps: true })

adminSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

adminSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

adminSchema.methods.toPublic = function toPublic() {
  return { id: this._id, name: this.name, email: this.email, role: 'admin' }
}

export const Admin = mongoose.model('Admin', adminSchema)
