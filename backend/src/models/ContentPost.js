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
  body: { type: String, maxlength: 5000, default: '' },
  link: { type: String, maxlength: 500, default: '' },
  mediaUrl: { type: String, maxlength: 500, default: '' },
  platformId: { type: String, maxlength: 120, default: '' },
  externalId: { type: String, maxlength: 80, default: '' },
  publishError: { type: String, maxlength: 300, default: '' },
}, { timestamps: true })

export const CONTENT_SOCIALS = SOCIALS
export const CONTENT_STATUSES = STATUSES
export const ContentPost = mongoose.model('ContentPost', contentPostSchema)
