import mongoose from 'mongoose'

const AREAS = ['seo', 'aso', 'ads', 'content', 'launch', 'general']

const todoSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 500 },
  area: { type: String, enum: AREAS, default: 'general' },
  doneAt: Date,
  dedupeKey: { type: String, unique: true, sparse: true },
}, { timestamps: true })

todoSchema.index({ doneAt: 1, createdAt: -1 })

export const TODO_AREAS = AREAS
export const Todo = mongoose.model('Todo', todoSchema)
