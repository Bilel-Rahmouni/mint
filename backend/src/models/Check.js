import mongoose from 'mongoose'

const RETENTION_DAYS = 30

const checkSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  up: { type: Boolean, required: true },
  statusCode: Number,
  responseTimeMs: Number,
  error: String,
  checkedAt: { type: Date, default: Date.now },
})

checkSchema.index({ projectId: 1, checkedAt: -1 })
checkSchema.index({ checkedAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 })

export const Check = mongoose.model('Check', checkSchema)
