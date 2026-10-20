import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'

const jobsFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/career-jobs.json')

let jobs = null

async function readJobs() {
  if (jobs) return jobs
  try {
    jobs = JSON.parse(await readFile(jobsFile, 'utf8'))
    if (!Array.isArray(jobs)) jobs = []
  } catch {
    jobs = []
  }
  return jobs
}

async function writeJobs() {
  await mkdir(path.dirname(jobsFile), { recursive: true })
  await writeFile(jobsFile, JSON.stringify(jobs, null, 2))
}

function parseScore(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const data = JSON.parse(match[0])
    const score = Number(data.score)
    const verdict = data.verdict === 'apply' ? 'apply' : 'skip'
    return {
      company: String(data.company || '').slice(0, 120),
      role: String(data.role || '').slice(0, 160),
      url: String(data.url || '').slice(0, 500),
      score: Number.isFinite(score) ? Math.round(score * 10) / 10 : null,
      verdict: Number.isFinite(score) && score >= 4 && verdict === 'apply' ? 'apply' : 'skip',
      reason: String(data.reason || '').slice(0, 500),
    }
  } catch {
    return null
  }
}

async function scoreJob(job) {
  let agent
  try {
    if (!config.cursorApiKey) throw new Error('Add CURSOR_API_KEY to the backend env')
    const { Agent } = await import('@cursor/sdk')
    agent = await Agent.create({
      apiKey: config.cursorApiKey,
      model: { id: 'composer-2.5' },
      local: {
        cwd: config.careerOpsDir,
        settingSources: ['project'],
      },
    })
    const prompt = [
      'Score this job for Bilel. Read cv.md, modes/_custom.md, and modes/_profile.md. Do not apply. Do not open LinkedIn. Do not send anything.',
      '',
      'Job:',
      job.text,
      '',
      'Reply with only this JSON, no markdown:',
      '{"company":"","role":"","url":"","score":0,"verdict":"skip","reason":""}',
      '',
      'verdict is "apply" only when the score is 4.0 or higher and the house rules say apply. Otherwise "skip". score is 0 to 5 with one decimal. reason is one or two short sentences.',
    ].join('\n')
    const run = await agent.send(prompt)
    const result = await run.wait()
    const scored = parseScore(result.result)
    if (!scored) {
      job.status = 'error'
      job.error = 'No score came back'
      return
    }
    Object.assign(job, scored, { status: 'scored', error: '' })
  } catch (err) {
    job.status = 'error'
    job.error = err?.message || 'Could not score'
  } finally {
    await writeJobs()
    try {
      if (agent && typeof agent[Symbol.asyncDispose] === 'function') await agent[Symbol.asyncDispose]()
    } catch {
      // The score is already stored.
    }
  }
}

export async function listCareerJobs() {
  return readJobs()
}

export async function addCareerJob(text) {
  const body = String(text || '').trim()
  if (!body) {
    const error = new Error('Paste a job')
    error.status = 400
    throw error
  }
  if (body.length > 20000) {
    const error = new Error('That is too long')
    error.status = 400
    throw error
  }
  await readJobs()
  const job = {
    id: randomUUID(),
    text: body,
    createdAt: new Date().toISOString(),
    status: 'scoring',
    company: '',
    role: '',
    url: '',
    score: null,
    verdict: '',
    reason: '',
    error: '',
  }
  jobs.unshift(job)
  jobs = jobs.slice(0, 30)
  await writeJobs()
  void scoreJob(job)
  return job
}
