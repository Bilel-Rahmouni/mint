import mongoose from 'mongoose'

const earningsPoint = { _id: false, date: String, admob: Number, adsense: Number }

const integrationSchema = new mongoose.Schema({
  provider: { type: String, required: true, unique: true, enum: ['google'] },
  email: String,
  refreshToken: { type: String, select: false },
  scopes: [String],
  connectedAt: Date,
  error: String,

  revenue: {
    currency: String,
    today: Number,
    yesterday: Number,
    thisMonth: Number,
    lastMonth: Number,
    earnings30d: Number,
    prev30d: Number,
    admob30d: Number,
    adsense30d: Number,
    series: [earningsPoint],
    unassigned: [{ _id: false, source: String, label: String, earnings30d: Number }],
    admob: {
      publisherId: String,
      impressions30d: Number,
      requests30d: Number,
      matchRate: Number,
      ecpm: Number,
      apps: [{
        _id: false,
        appId: String,
        name: String,
        platform: String,
        packageName: String,
        linked: Boolean,
        approval: String,
        projectId: mongoose.Schema.Types.ObjectId,
      }],
    },
    adsense: {
      accountId: String,
      pageViews30d: Number,
      clicks30d: Number,
      rpm: Number,
      balance: String,
      sites: [{ _id: false, domain: String, state: String, projectId: mongoose.Schema.Types.ObjectId }],
      alerts: [{ _id: false, severity: String, message: String }],
    },
    errors: {
      admob: String,
      adsense: String,
    },
    syncedAt: Date,
  },
}, { timestamps: true })

export const Integration = mongoose.model('Integration', integrationSchema)
