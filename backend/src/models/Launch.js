import mongoose from 'mongoose'

const STAGES = ['Idea', 'Building', 'Pre-launch', 'Launched']
const CHANNELS = ['meta', 'google', 'tiktok', 'asa', 'influencer', 'email']

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  done: { type: Boolean, default: false },
}, { _id: true })

const launchSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 80 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  stage: { type: String, enum: STAGES, default: 'Idea' },
  date: { type: String, required: true },
  tasks: { type: [taskSchema], default: [] },
  channels: [{ type: String, enum: CHANNELS }],
}, { timestamps: true })

launchSchema.index({ stage: 1, date: 1 })

export const LAUNCH_STAGES = STAGES
export const Launch = mongoose.model('Launch', launchSchema)
