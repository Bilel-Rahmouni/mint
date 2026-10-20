import { config } from '../config.js'
import { ContentPost } from '../models/ContentPost.js'
import { Project } from '../models/Project.js'
import { logger } from '../utils/logger.js'
import { raiseAlert } from './alerts.js'

const API = 'https://api.publora.com/api/v1'
const ZONE = 'Europe/Copenhagen'
const NEEDS_MEDIA = new Set(['instagram', 'tiktok', 'youtube'])
const PLATFORM = {
  instagram: 'instagram',
  tiktok: 'tiktok',
  linkedin: 'linkedin',
  x: 'twitter',
  youtube: 'youtube',
}

function configured() {
  return Boolean(config.publoraApiKey)
}

function normalizeConnections(data) {
  const list = Array.isArray(data) ? data : data.connections || data.platforms || data.data || []
  return list
    .map((row) => ({
      platformId: String(row.platformId || row.id || ''),
      platform: String(row.platform || row.type || '').toLowerCase(),
      name: String(row.name || row.username || row.displayName || row.platformId || row.id || ''),
    }))
    .filter((row) => row.platformId)
}

export async function listPubloraConnections() {
  if (!configured()) {
    return { configured: false, message: 'Publora is not configured', connections: [] }
  }
  const res = await fetch(`${API}/platform-connections`, {
    headers: { 'x-publora-key': config.publoraApiKey },
    signal: AbortSignal.timeout(15_000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data.message || data.error || `Publora ${res.status}`
    throw new Error(typeof message === 'string' ? message : 'Publora connection list failed')
  }
  return { configured: true, connections: normalizeConnections(data) }
}

function dueAt(date, time) {
  const utc = Date.parse(`${date}T${time}:00Z`)
  if (Number.isNaN(utc)) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(utc))
  const bag = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const hour = bag.hour === '24' ? '00' : bag.hour
  const shown = Date.parse(`${bag.year}-${bag.month}-${bag.day}T${hour}:${bag.minute}:00Z`)
  return new Date(utc - (shown - utc))
}

function matchingAccount(post, connections) {
  if (post.platformId) return post.platformId
  const prefix = PLATFORM[post.social]
  if (!prefix) return ''
  const matches = connections.filter((row) => row.platform === prefix || row.platformId.startsWith(`${prefix}-`) || row.platformId.startsWith(prefix))
  return matches.length === 1 ? matches[0].platformId : ''
}

async function fail(post, message) {
  const dedupeKey = `publish:${post._id}:${post.updatedAt ? new Date(post.updatedAt).toISOString() : 'new'}`
  post.publishError = message.slice(0, 300)
  await post.save()
  const project = await Project.findById(post.projectId).select('name')
  await raiseAlert({
    projectId: post.projectId,
    kind: 'publish',
    dedupeKey,
    title: `${project?.name || 'Post'} · ${post.title} failed to publish`,
  })
}

export async function publishDuePosts() {
  if (!configured()) return 0
  const posts = await ContentPost.find({
    status: 'Scheduled',
    social: { $ne: 'blog' },
    externalId: { $in: [null, ''] },
    publishError: { $in: [null, ''] },
  }).limit(20)

  const due = posts.filter((post) => {
    const at = dueAt(post.date, post.time)
    return at && at.getTime() <= Date.now()
  })
  if (!due.length) return 0

  let connections = []
  try {
    connections = (await listPubloraConnections()).connections
  } catch (err) {
    logger.error('Publora connections failed:', err.message)
    return 0
  }

  let published = 0
  for (const post of due) {
    try {
      if (NEEDS_MEDIA.has(post.social) && !post.mediaUrl) {
        await fail(post, 'This channel needs a media URL')
        continue
      }
      const platformId = matchingAccount(post, connections)
      if (!platformId) {
        await fail(post, 'No Publora account for this channel')
        continue
      }
      const content = [post.body?.trim() || post.title, post.link?.trim()].filter(Boolean).join('\n\n')
      const res = await fetch(`${API}/create-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publora-key': config.publoraApiKey,
          'Idempotency-Key': `${post._id}-${new Date(post.updatedAt).getTime()}`,
        },
        body: JSON.stringify({
          content,
          platforms: [platformId],
          scheduledTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
          ...(post.mediaUrl ? { mediaUrls: [post.mediaUrl] } : {}),
        }),
        signal: AbortSignal.timeout(20_000),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.success === false) {
        const message = data.message || data.error || `Publora ${res.status}`
        await fail(post, typeof message === 'string' ? message : 'Publora rejected the post')
        continue
      }
      post.status = 'Published'
      post.externalId = String(data.postGroupId || 'publora')
      post.platformId = platformId
      post.publishError = ''
      await post.save()
      published += 1
    } catch (err) {
      logger.error(`Publish failed for ${post.title}:`, err.message)
      await fail(post, err.message || 'Publish failed')
    }
  }
  if (published) logger.info(`Publish job: published ${published} posts`)
  return published
}
