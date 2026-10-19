import mongoose from 'mongoose'

const STORES = ['App Store', 'Google Play']

const keywordSchema = new mongoose.Schema({
  keyword: { type: String, required: true, trim: true, maxlength: 80 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  store: { type: String, enum: STORES, required: true },
  rank: { type: Number, required: true, min: 1, max: 500 },
  previousRank: { type: Number, min: 1, max: 500 },
  volume: { type: Number, min: 0 },
}, { timestamps: true })

keywordSchema.index({ projectId: 1, keyword: 1, store: 1 }, { unique: true })

export const KEYWORD_STORES = STORES
export const Keyword = mongoose.model('Keyword', keywordSchema)
