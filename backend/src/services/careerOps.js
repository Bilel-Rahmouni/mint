import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { config } from '../config.js'

let cache = { mtimeMs: 0, snapshot: null }

function snapshot(dash) {
  const career = dash?.career || {}
  const apps = Array.isArray(career.applications) ? career.applications : []
  const byStatus = {}
  for (const app of apps) {
    const status = app.status || 'Unknown'
    byStatus[status] = (byStatus[status] || 0) + 1
  }
  const queue = Array.isArray(career.liveQueue) ? career.liveQueue : []

  return {
    asOf: dash?.asOf || null,
    kpis: {
      scored: apps.length,
      evaluated: byStatus.Evaluated || 0,
      applied: byStatus.Applied || 0,
      good: apps.filter((app) => typeof app.score === 'number' && app.score >= 4).length,
      waiting: queue.length,
      notesLeft: career.notesLeft ?? 0,
      invitesThisWeek: career.invitesThisWeek ?? 0,
      inviteCap: career.inviteCap ?? 0,
    },
    queue: queue.map((job) => ({
      company: job.company || '',
      role: job.role || '',
      city: job.city || '',
      apply: job.apply || '',
      note: job.note || '',
    })),
    connects: (Array.isArray(career.nextRecruiters) ? career.nextRecruiters : []).map((person) => ({
      name: person.name || '',
      detail: person.detail || '',
      href: person.href || '',
    })),
    commands: withNetwork(Array.isArray(dash?.commands) ? dash.commands : []),
  }
}

const hiddenCommands = new Set(['renklar', 'weekly-renklar'])

function withNetwork(commands) {
  const list = commands
    .filter((command) => command.id !== 'network' && !hiddenCommands.has(command.id))
    .map((command) => ({
      id: command.id,
      say: command.say,
      also: Array.isArray(command.also) ? command.also : [],
      what: command.what || '',
      loop: Array.isArray(command.loop) ? command.loop : [],
    }))
  const network = {
    id: 'network',
    say: 'network',
    also: [],
    what: 'People to connect with, and a note for each.',
    loop: [
      'Gulf recruiters first, then Denmark, then the rest',
      'Skip people already contacted',
      'A note only if notes are left this month',
      'You send the invite',
    ],
  }
  const huntAt = list.findIndex((command) => command.id === 'hunt')
  list.splice(huntAt + 1, 0, network)
  return list
}

export async function loadCareerCv() {
  const file = path.join(config.careerOpsDir, 'cv.md')
  try {
    return await readFile(file, 'utf8')
  } catch {
    const error = new Error('CV is not on this server')
    error.status = 404
    throw error
  }
}

export async function loadCareerOps() {
  const file = path.join(config.careerOpsDir, 'board', 'js', 'data.js')
  let info
  try {
    info = await stat(file)
  } catch {
    const error = new Error('Career ops folder is not on this server')
    error.status = 404
    throw error
  }

  if (cache.snapshot && cache.mtimeMs === info.mtimeMs) return cache.snapshot

  const code = await readFile(file, 'utf8')
  const sandbox = { window: {} }
  vm.runInNewContext(code, sandbox, { filename: file })
  const next = snapshot(sandbox.window.DASH)
  cache = { mtimeMs: info.mtimeMs, snapshot: next }
  return next
}
