import mongoose from 'mongoose'

const KINDS = ['down', 'up', 'ssl', 'domain', 'revenue', 'publish']

const alertSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  kind: { type: String, enum: KINDS, required: true },
  dedupeKey: { type: String, required: true, unique: true },
  title: { type: String, required: true, maxlength: 180 },
  readAt: Date,
}, { timestamps: true })

alertSchema.index({ readAt: 1, createdAt: -1 })

export const ALERT_KINDS = KINDS
export const Alert = mongoose.model('Alert', alertSchema)
