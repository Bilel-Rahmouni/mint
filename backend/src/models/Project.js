import mongoose from 'mongoose'

const httpUrl = {
  validator: (v) => !v || /^https?:\/\/\S+$/i.test(v),
  message: 'Must be a valid http(s) URL',
}

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  type: { type: String, enum: ['website', 'app'], default: 'website' },
  url: { type: String, trim: true, validate: httpUrl },
  storeUrl: { type: String, trim: true, validate: httpUrl },
  client: { type: String, trim: true, maxlength: 120 },
  stack: [{ type: String, trim: true, maxlength: 40 }],
  hosting: { type: String, trim: true, maxlength: 80 },
  repoUrl: { type: String, trim: true, validate: httpUrl },
  notes: { type: String, trim: true, maxlength: 4000 },

  showOnSite: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  monitoringEnabled: { type: Boolean, default: true },

  lastCheck: {
    up: Boolean,
    statusCode: Number,
    responseTimeMs: Number,
    error: String,
    checkedAt: Date,
  },
  ssl: {
    validTo: Date,
    issuer: String,
    error: String,
    checkedAt: Date,
  },
  domain: {
    name: String,
    expiresAt: Date,
    registrar: String,
    error: String,
    checkedAt: Date,
  },

  packageName: { type: String, trim: true, maxlength: 150 },
  play: {
    rating: Number,
    activeDevices: Number,
    totalInstalls: Number,
    installs30d: Number,
    uninstalls30d: Number,
    crashRate: Number,
    anrRate: Number,
    series: [{
      _id: false,
      date: String,
      installs: Number,
      uninstalls: Number,
      activeDevices: Number,
      rating: Number,
      crashRate: Number,
      anrRate: Number,
    }],
    reviews: [{
      _id: false,
      id: String,
      author: String,
      rating: Number,
      text: String,
      version: String,
      at: Date,
    }],
    errors: {
      stats: String,
      vitals: String,
      reviews: String,
    },
    syncedAt: Date,
  },

  web: {
    searchSite: String,
    analyticsProperty: String,
    clicks30d: Number,
    impressions30d: Number,
    ctr: Number,
    position: Number,
    users30d: Number,
    sessions30d: Number,
    views30d: Number,
    engagementRate: Number,
    series: [{
      _id: false,
      date: String,
      clicks: Number,
      impressions: Number,
      users: Number,
      sessions: Number,
      views: Number,
    }],
    queries: [{ _id: false, key: String, clicks: Number, impressions: Number, position: Number }],
    pages: [{ _id: false, key: String, value: Number }],
    sources: [{ _id: false, key: String, value: Number }],
    errors: {
      search: String,
      analytics: String,
    },
    syncedAt: Date,
  },

  revenue: {
    currency: String,
    earnings30d: Number,
    prev30d: Number,
    admob30d: Number,
    adsense30d: Number,
    impressions30d: Number,
    ecpm: Number,
    admobApps: [String],
    adsenseDomain: String,
    series: [{ _id: false, date: String, admob: Number, adsense: Number }],
    syncedAt: Date,
  },
}, { timestamps: true })

projectSchema.index({ showOnSite: 1, order: 1 })

export const Project = mongoose.model('Project', projectSchema)
