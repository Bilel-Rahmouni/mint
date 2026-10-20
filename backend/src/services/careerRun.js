import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'
import { loadCareerOps } from './careerOps.js'

const runFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/career-run.json')

let current = null
let saveTimer = null

function view(run) {
  if (!run) return { status: 'idle', id: null, say: null, summary: '', error: '' }
  return {
    status: run.status,
    id: run.id,
    say: run.say,
    summary: run.summary,
    error: run.error,
  }
}

async function writeRun(run) {
  await mkdir(path.dirname(runFile), { recursive: true })
  await writeFile(runFile, JSON.stringify(view(run)))
}

function scheduleSave(run) {
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    void writeRun(run).catch(() => {})
  }, 800)
}

async function readSaved() {
  try {
    const saved = JSON.parse(await readFile(runFile, 'utf8'))
    if (saved?.status === 'running') {
      return {
        ...saved,
        status: 'error',
        error: saved.summary ? 'Stopped when the server restarted.' : 'The server restarted before this finished.',
      }
    }
    return saved
  } catch {
    return view(null)
  }
}

export async function careerRunStatus() {
  if (current) return view(current)
  return readSaved()
}

async function loadSdk() {
  if (!config.cursorApiKey) {
    const error = new Error('Add CURSOR_API_KEY to the backend env')
    error.status = 503
    throw error
  }
  try {
    return await import('@cursor/sdk')
  } catch {
    const error = new Error('Install @cursor/sdk in the backend, then restart it')
    error.status = 503
    throw error
  }
}

function appendText(run, text) {
  if (!text) return
  run.summary = `${run.summary}${text}`.slice(-20000)
  scheduleSave(run)
}

async function execute(command, run) {
  let agent
  try {
    const { Agent } = await loadSdk()
    agent = await Agent.create({
      apiKey: config.cursorApiKey,
      model: { id: 'composer-2.5' },
      local: {
        cwd: config.careerOpsDir,
        settingSources: ['all'],
      },
    })
    const started = await agent.send(command.say, {
      onDelta: ({ update }) => {
        if (current !== run) return
        if (update?.type === 'text-delta') appendText(run, update.text)
      },
    })
    const result = await started.wait()
    if (current !== run) return
    if (result.result) run.summary = String(result.result).slice(0, 20000)
    if (!run.summary && started.supports?.('conversation')) {
      const turns = await started.conversation()
      const lines = []
      for (const turn of turns || []) {
        const steps = turn?.turn?.steps || turn?.steps || []
        for (const step of steps) {
          if (step?.type === 'assistantMessage' && step.message?.text) lines.push(step.message.text)
        }
      }
      if (lines.length) run.summary = lines.join('\n\n').slice(0, 20000)
    }
    run.status = result.status === 'finished' ? 'finished' : 'error'
    if (run.status === 'error') run.error = result.error?.message || run.error || 'The run failed'
  } catch (err) {
    if (current !== run) return
    run.status = 'error'
    run.error = err?.message || 'Could not start'
    if (err?.name === 'CursorAgentError' && err.isRetryable) {
      run.error = `${run.error} You can try again.`
    }
  } finally {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (current === run) await writeRun(run).catch(() => {})
    try {
      if (agent && typeof agent[Symbol.asyncDispose] === 'function') await agent[Symbol.asyncDispose]()
    } catch {
      // The reply is already stored.
    }
  }
}

export async function startCareerRun(id) {
  if (current?.status === 'running') {
    const error = new Error(`${current.say} is already running`)
    error.status = 409
    throw error
  }

  const board = await loadCareerOps()
  const command = board.commands.find((item) => item.id === id)
  if (!command) {
    const error = new Error('Unknown command')
    error.status = 404
    throw error
  }

  await loadSdk()

  const run = {
    status: 'running',
    id: command.id,
    say: command.say,
    summary: '',
    error: '',
  }
  current = run
  await writeRun(run)
  void execute(command, run)
  return view(run)
}
