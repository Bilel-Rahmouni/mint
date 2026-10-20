import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/career-connects.json')

const empty = () => ({ status: 'idle', error: '', people: [] })

let current = null

function cleanPerson(person) {
  const note = String(person?.note || '').replace(/\s+/g, ' ').trim().slice(0, 200)
  return {
    name: String(person?.name || '').trim().slice(0, 80),
    city: String(person?.city || '').trim().slice(0, 80),
    why: String(person?.why || '').trim().slice(0, 160),
    href: String(person?.href || '').trim().slice(0, 500),
    note,
  }
}

function parsePeople(text) {
  const match = String(text || '').match(/\[[\s\S]*\]/)
  if (!match) return []
  try {
    const rows = JSON.parse(match[0])
    if (!Array.isArray(rows)) return []
    return rows.map(cleanPerson).filter((person) => person.name).slice(0, 8)
  } catch {
    return []
  }
}

async function readSaved() {
  try {
    const saved = JSON.parse(await readFile(file, 'utf8'))
    if (saved?.status === 'running') {
      return { ...empty(), ...saved, status: 'error', error: 'Stopped when the server restarted.' }
    }
    return { ...empty(), ...saved, people: Array.isArray(saved.people) ? saved.people : [] }
  } catch {
    return empty()
  }
}

async function writeState(state) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(state, null, 2))
}

export async function careerConnectsStatus() {
  if (current) return current
  current = await readSaved()
  return current
}

async function findPeople(state) {
  let agent
  try {
    if (!config.cursorApiKey) throw new Error('Add CURSOR_API_KEY to the backend env')
    const { Agent } = await import('@cursor/sdk')
    agent = await Agent.create({
      apiKey: config.cursorApiKey,
      model: { id: 'composer-2.5' },
      local: {
        cwd: config.careerOpsDir,
        settingSources: ['all'],
      },
    })
    const prompt = [
      'Find people Bilel should connect with on LinkedIn today.',
      'Read modes/_custom.md, voice-dna.md, data/recruiter-outreach.md, and board/js/data.js.',
      'Do not send invites. Do not message anyone. Do not post.',
      'Gulf technical recruiters first, then Denmark, then the rest. Skip people already in the outreach log.',
      'Skip UAE, company pages, CEOs, SEO, and students. At most 8 people.',
      'Respect the weekly invite cap and the monthly note cap in the outreach file.',
      'If no notes are left this month, set note to an empty string.',
      'A note is at most 200 characters. It sounds like Bilel typed it on his phone.',
      'No slogan. No relocating. Never mention the UAE. No phone number.',
      'Denmark: based in Aarhus. Other cities: based in Denmark, looking for a role in their city.',
      'href is a LinkedIn profile URL only if you opened that profile. Otherwise a LinkedIn people search URL.',
      'Reply with only a JSON array:',
      '[{"name":"","city":"","why":"","href":"","note":""}]',
    ].join('\n')
    const run = await agent.send(prompt)
    const result = await run.wait()
    if (current !== state) return
    const people = parsePeople(result.result)
    if (!people.length) {
      state.status = 'error'
      state.error = result.status === 'error' ? (result.error?.message || 'Could not find people') : 'No people came back'
      return
    }
    state.people = people
    state.status = 'done'
    state.error = ''
  } catch (err) {
    if (current !== state) return
    state.status = 'error'
    state.error = err?.message || 'Could not start'
  } finally {
    if (current === state) await writeState(state).catch(() => {})
    try {
      if (agent && typeof agent[Symbol.asyncDispose] === 'function') await agent[Symbol.asyncDispose]()
    } catch {
      // The list is already stored.
    }
  }
}

export async function startCareerConnects() {
  const state = await careerConnectsStatus()
  if (state.status === 'running') {
    const error = new Error('Already looking')
    error.status = 409
    throw error
  }
  const next = { status: 'running', error: '', people: [] }
  current = next
  await writeState(next)
  void findPeople(next)
  return next
}
