import mongoose from 'mongoose'
import { config } from '../src/config.js'
import { Project } from '../src/models/Project.js'

const storeUrl = (packageName) => `https://play.google.com/store/apps/details?id=${packageName}`

const play = (packageName) => ({ packageName, storeUrl: storeUrl(packageName) })

const projects = [
  { name: 'wyngo', type: 'website', url: 'https://wyngo.co' },
  { name: 'cash cash', type: 'website', url: 'https://cash-game.site', ...play('com.indigenoustech.cash') },
  { name: 'dozone', type: 'website', url: 'https://dozone.site', ...play('com.indigenoustech.dozone') },
  { name: 'onecrew.pro', type: 'website', url: 'https://onecrew.pro' },
  { name: 'onecrew.me', type: 'website', url: 'https://onecrew.me' },
  { name: 'takwira', type: 'app', storeUrl: storeUrl('tn.rebounddev.takwira_flutter') },
  { name: 'koultounsi.com', type: 'website', url: 'https://koultounsi.com' },
  { name: 'tounsy.com', type: 'website', url: 'https://tounsy.com' },
  {
    name: 'ultimate calculator',
    type: 'website',
    url: 'https://ultimatecalculator.site',
    ...play('com.indigenoustech.ultimatecalculators'),
  },
  { name: 'brain gym', type: 'website', url: 'https://brain-gym.site' },
  { name: 'lingomate', type: 'app', ...play('com.indigenoustech.lingora') },
  { name: 'frontend prep', type: 'app', url: 'https://frontendprep.site', ...play('com.indigenoustech.frontendprep') },
  { name: 'renklar.dk', type: 'website', url: 'https://renklar.dk' },
  { name: 'renklar', type: 'app', ...play('com.indigenoustech.renklar') },
  { name: 'dont', type: 'app', ...play('com.indigenoustech.dont') },
  { name: 'renklar (legacy)', type: 'app', showOnSite: false, ...play('com.renklar.app') },
  { name: 'mint studio', type: 'website', url: 'https://mintstudio.io', showOnSite: false },
]

// Fields only filled in when empty, so edits made in the dashboard are kept
const FILL_IF_EMPTY = ['url', 'packageName', 'storeUrl']

// Old placeholder urls replaced by the real domains; any other dashboard edit is kept
const RENAMED_URLS = {
  'https://cashcash.tn': 'https://cash-game.site',
  'https://braingym.tn': 'https://brain-gym.site',
  'https://ultimatecalculator.app': 'https://ultimatecalculator.site',
  'https://dozone.io': 'https://dozone.site',
}

// Urls that now belong to their own project, removed from the project that held them before
const MOVED_URLS = {
  renklar: 'https://renklar.dk',
}

await mongoose.connect(config.mongoUri)

const last = await Project.findOne().sort({ order: -1 }).select('order').lean()
let nextOrder = last ? last.order + 1 : 0
let created = 0
let updated = 0

for (const seed of projects) {
  const existing = await Project.findOne({ name: seed.name })

  if (!existing) {
    await Project.create({ showOnSite: true, ...seed, order: nextOrder++ })
    created += 1
    continue
  }

  const missing = FILL_IF_EMPTY.filter((key) => seed[key] && !existing[key])
  const renamed = RENAMED_URLS[existing.url]
  const moved = existing.url && MOVED_URLS[existing.name] === existing.url
  if (missing.length || renamed || moved) {
    for (const key of missing) existing[key] = seed[key]
    if (renamed || moved) {
      existing.url = moved ? undefined : renamed
      existing.web = undefined
    }
    await existing.save()
    updated += 1
  }
}

console.log(`Seed: ${created} created, ${updated} updated, ${projects.length - created - updated} unchanged`)
await mongoose.disconnect()
