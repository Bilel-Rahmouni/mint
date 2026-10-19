import mongoose from 'mongoose'

const SOCIALS = ['instagram', 'tiktok', 'linkedin', 'x', 'youtube', 'blog']
const STATUSES = ['Draft', 'Scheduled', 'Published']

const contentPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  social: { type: String, enum: SOCIALS, required: true },
  status: { type: String, enum: STATUSES, default: 'Scheduled' },
  date: { type: String, required: true, index: true },
  time: { type: String, required: true },
}, { timestamps: true })

export const CONTENT_SOCIALS = SOCIALS
export const CONTENT_STATUSES = STATUSES
export const ContentPost = mongoose.model('ContentPost', contentPostSchema)
