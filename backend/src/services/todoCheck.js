import { googleEnabled } from '../config.js'
import { isUnusedUrl } from '../lib/unusedHosts.js'
import { Campaign } from '../models/Campaign.js'
import { Keyword } from '../models/Keyword.js'
import { Project } from '../models/Project.js'
import { Todo } from '../models/Todo.js'
import { logger } from '../utils/logger.js'
import { fetchOpportunityRows, loadSearchSites } from './web.js'

const hostOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function seoTitle(query) {
  const position = Math.round(query.position)
  const impressions = Math.round(query.impressions)
  const where = query.page || 'the page that ranks for it'
  return `“${query.key}” is position ${position} (${impressions} impressions). On ${where}, change the title and the first paragraph so they use “${query.key}”.`
}

function asoTitle(keyword) {
  return `“${keyword.keyword}” is rank ${keyword.rank} on ${keyword.store}. In Play Console, put “${keyword.keyword}” in the title or the first line of the short description.`
}

function adsTitle(spent, income) {
  const money = (value) => Math.round(value)
  return `Ad spend is ${money(spent)} and 30-day ad income is ${money(income)}. In Google Ads, pause the live campaign or lower the budget.`
}

async function remember(drafts) {
  let created = 0
  for (const draft of drafts) {
    const existing = await Todo.findOne({ dedupeKey: draft.dedupeKey }).select('_id')
    if (existing) continue
    await Todo.create(draft)
    created += 1
  }
  return created
}

export async function checkTodos() {
  const [projects, keywords, campaigns] = await Promise.all([
    Project.find(),
    Keyword.find(),
    Campaign.find({ channel: 'google' }),
  ])

  let sites = null
  if (googleEnabled) {
    try {
      sites = await loadSearchSites()
    } catch (err) {
      logger.error('Todo check could not list Search Console sites:', err.message)
    }
  }

  const drafts = []
  for (const project of projects) {
    if (project.url && isUnusedUrl(project.url)) continue
    const projectId = project._id

    if (project.url && !isUnusedUrl(project.url)) {
      let rows = []
      const site = sites?.get(hostOf(project.url))
      if (site) {
        try {
          rows = await fetchOpportunityRows(site)
        } catch (err) {
          logger.error(`Todo check failed for ${project.name}:`, err.message)
        }
      }
      if (!rows.length) {
        rows = (project.web?.queries || [])
          .filter((query) => query.impressions >= 5 && query.position >= 4 && query.position <= 30)
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 3)
          .map((query) => ({ ...query, page: project.url }))
      }
      for (const query of rows) {
        drafts.push({
          projectId,
          area: 'seo',
          dedupeKey: `seo:${projectId}:${query.key}`,
          title: seoTitle(query).slice(0, 500),
        })
      }
    }

    if (project.packageName) {
      const mine = keywords
        .filter((keyword) => String(keyword.projectId) === String(projectId) && keyword.rank > 10)
        .sort((a, b) => (b.volume || 0) - (a.volume || 0) || a.rank - b.rank)
        .slice(0, 3)
      for (const keyword of mine) {
        drafts.push({
          projectId,
          area: 'aso',
          dedupeKey: `aso:${projectId}:${keyword.store}:${keyword.keyword}`,
          title: asoTitle(keyword).slice(0, 500),
        })
      }
    }

    const ads = campaigns.filter((campaign) => String(campaign.projectId) === String(projectId))
    const spent = ads.reduce((sum, campaign) => sum + (campaign.spent || 0), 0)
    const income = project.revenue?.earnings30d || 0
    if (spent >= 10 && spent > income) {
      drafts.push({
        projectId,
        area: 'ads',
        dedupeKey: `ads:${projectId}`,
        title: adsTitle(spent, income),
      })
    }
  }

  const created = await remember(drafts)
  const todos = await Todo.find().sort({ doneAt: 1, createdAt: -1 }).lean()
  return { created, todos }
}
