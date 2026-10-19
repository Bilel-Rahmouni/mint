import mongoose from 'mongoose'

const CHANNELS = ['meta', 'google', 'tiktok', 'asa', 'influencer', 'email']
const OBJECTIVES = ['Installs', 'Signups', 'Traffic', 'Sales', 'Awareness']
const STATUSES = ['Live', 'Scheduled', 'Paused', 'Ended']

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  channel: { type: String, enum: CHANNELS, required: true },
  objective: { type: String, enum: OBJECTIVES, required: true },
  status: { type: String, enum: STATUSES, default: 'Scheduled' },
  budget: { type: Number, required: true, min: 0 },
  spent: { type: Number, default: 0, min: 0 },
  conversions: { type: Number, default: 0, min: 0 },
  revenue: { type: Number, default: 0, min: 0 },
  start: { type: String, required: true },
  end: { type: String, required: true },
}, { timestamps: true })

campaignSchema.index({ status: 1, start: 1 })

export const CAMPAIGN_CHANNELS = CHANNELS
export const CAMPAIGN_OBJECTIVES = OBJECTIVES
export const CAMPAIGN_STATUSES = STATUSES
export const Campaign = mongoose.model('Campaign', campaignSchema)
