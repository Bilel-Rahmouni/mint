import mongoose from 'mongoose'
import { config } from '../src/config.js'
import { isUnusedUrl } from '../src/lib/unusedHosts.js'
import { Alert } from '../src/models/Alert.js'
import { Campaign } from '../src/models/Campaign.js'
import { Check } from '../src/models/Check.js'
import { ContentPost } from '../src/models/ContentPost.js'
import { Keyword } from '../src/models/Keyword.js'
import { Launch } from '../src/models/Launch.js'
import { Project } from '../src/models/Project.js'
import { Todo } from '../src/models/Todo.js'

const storeUrl = (packageName) => `https://play.google.com/store/apps/details?id=${packageName}`

const play = (packageName) => ({ packageName, storeUrl: storeUrl(packageName) })

const projects = [
  { name: 'wyngo', type: 'website', url: 'https://wyngo.co' },
  { name: 'cash cash', type: 'website', url: 'https://cash-game.site', ...play('com.indigenoustech.cash') },
  { name: 'dozone', type: 'website', url: 'https://dozone.site', ...play('com.indigenoustech.dozone') },
  { name: 'onecrew.pro', type: 'website', url: 'https://onecrew.pro' },
  { name: 'onecrew.me', type: 'website', url: 'https://onecrew.me' },
  { name: 'takwira', type: 'app', url: 'https://takwira.site', storeUrl: storeUrl('tn.rebounddev.takwira_flutter') },
  { name: 'koultounsi.com', type: 'website', url: 'https://koultounsi.com' },
  { name: 'tounsy.com', type: 'website', url: 'https://tounsy.com' },
  {
    name: 'ultimate calculator',
    type: 'website',
    url: 'https://ultimatecalculator.site',
    ...play('com.indigenoustech.ultimatecalculators'),
  },
  { name: 'lingomate', type: 'app', url: 'https://lingomate.site', ...play('com.indigenoustech.lingora') },
  { name: 'frontend prep', type: 'app', url: 'https://frontendprep.site', ...play('com.indigenoustech.frontendprep') },
  { name: 'renklar', type: 'website', url: 'https://renklar.dk', ...play('com.indigenoustech.renklar') },
  { name: 'dont', type: 'app', url: 'https://dontapp.site', ...play('com.indigenoustech.dont') },
  { name: 'bilelrahmouni.com', type: 'website', url: 'https://bilelrahmouni.com' },
  { name: 'mint studio', type: 'website', url: 'https://mintstudio.io', showOnSite: false },
]

// Fields only filled in when empty, so edits made in the dashboard are kept
const FILL_IF_EMPTY = ['url', 'packageName', 'storeUrl']

// Old placeholder urls replaced by the real domains; any other dashboard edit is kept
const RENAMED_URLS = {
  'https://cashcash.tn': 'https://cash-game.site',
  'https://ultimatecalculator.app': 'https://ultimatecalculator.site',
  'https://dozone.io': 'https://dozone.site',
  'https://lingora.site': 'https://lingomate.site',
}

// Duplicate rows folded into the real project (name → keep)
const MERGE_INTO = {
  'renklar.dk': 'renklar',
}

const REMOVE = [
  { name: 'renklar (legacy)' },
  { packageName: 'com.renklar.app' },
  { name: 'brain gym' },
]

await mongoose.connect(config.mongoUri)

const last = await Project.findOne().sort({ order: -1 }).select('order').lean()
let nextOrder = last ? last.order + 1 : 0
let created = 0
let updated = 0

for (const seed of projects) {
  const existing = await Project.findOne({ name: seed.name })

  if (!existing) {
    await Project.create({
      showOnSite: true,
      monitoringEnabled: !isUnusedUrl(seed.url),
      ...seed,
      order: nextOrder++,
    })
    created += 1
    continue
  }

  const missing = FILL_IF_EMPTY.filter((key) => seed[key] && !existing[key])
  const renamed = RENAMED_URLS[existing.url]
  const typeChanged = seed.type && existing.type !== seed.type
  const unused = isUnusedUrl(existing.url || seed.url)
  const monitor = !unused
  const monitorChanged = existing.monitoringEnabled !== monitor
  if (missing.length || renamed || typeChanged || monitorChanged) {
    for (const key of missing) existing[key] = seed[key]
    if (renamed) existing.url = renamed
    if (typeChanged) existing.type = seed.type
    if (monitorChanged) existing.monitoringEnabled = monitor
    await existing.save()
    updated += 1
  }
}

let merged = 0
for (const [fromName, intoName] of Object.entries(MERGE_INTO)) {
  const from = await Project.findOne({ name: fromName })
  const into = await Project.findOne({ name: intoName })
  if (!from || !into) continue
  if (!into.url && from.url) into.url = from.url
  if (!into.web?.analyticsProperty && from.web) into.web = from.web
  if (!into.lastCheck?.checkedAt && from.lastCheck) into.lastCheck = from.lastCheck
  if (!into.ssl?.checkedAt && from.ssl) into.ssl = from.ssl
  if (!into.domain?.checkedAt && from.domain) into.domain = from.domain
  await into.save()
  await from.deleteOne()
  merged += 1
}

let removed = 0
for (const query of REMOVE) {
  const matches = await Project.find(query)
  for (const project of matches) {
    await Promise.all([
      Alert.deleteMany({ projectId: project._id }),
      Campaign.deleteMany({ projectId: project._id }),
      Check.deleteMany({ projectId: project._id }),
      ContentPost.deleteMany({ projectId: project._id }),
      Keyword.deleteMany({ projectId: project._id }),
      Launch.deleteMany({ projectId: project._id }),
      Todo.deleteMany({ projectId: project._id }),
    ])
    await project.deleteOne()
    removed += 1
  }
}

console.log(`Seed: ${created} created, ${updated} updated, ${merged} merged, ${removed} removed, ${projects.length - created - updated} unchanged`)
await mongoose.disconnect()
