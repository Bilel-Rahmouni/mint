import { useState } from 'react'
import type { CareerCommand as CareerCommandType, CareerIntros, CareerQueueJob, CareerRun } from '../lib/types'
import { CareerCommand } from './CareerCommand'
import { CareerCv } from './CareerCv'
import { CareerConnects } from './CareerConnects'
import { CareerInbox } from './CareerInbox'
import { CareerQueue } from './CareerQueue'
import { CareerResult } from './CareerResult'
import './CareerCommands.css'

const scoreCommand: CareerCommandType = {
  id: 'score',
  say: 'score',
  also: [],
  what: 'Paste a job. Nothing is sent.',
  loop: ['Paste the posting', 'Score stays here'],
}

type Props = {
  commands: CareerCommandType[]
  run: CareerRun | null
  queue: CareerQueueJob[]
  networkRunning?: boolean
  connectKey?: number
  onNetworkStatus?: (status: CareerIntros['status']) => void
  onRun: (command: CareerCommandType) => void
}

const hiddenCommands = new Set(['renklar', 'weekly-renklar'])

function withScore(commands: CareerCommandType[]) {
  const next = commands.filter((command) => !hiddenCommands.has(command.id))
  if (next.some((command) => command.id === 'score')) return next
  const networkAt = next.findIndex((command) => command.id === 'network')
  next.splice(networkAt === -1 ? next.length : networkAt + 1, 0, scoreCommand)
  return next
}

export function CareerCommands({
  commands,
  run,
  queue,
  networkRunning = false,
  connectKey = 0,
  onNetworkStatus,
  onRun,
}: Props) {
  const busy = run?.status === 'running' || networkRunning
  const list = withScore(commands)
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = list.find((command) => command.id === activeId) ?? null

  return (
    <section className="career-commands">
      <nav className="career-commands__nav" aria-label="Commands">
        <button
          type="button"
          className={`career-commands__tab ${activeId === 'cv' ? 'is-active' : ''}`}
          aria-pressed={activeId === 'cv'}
          onClick={() => setActiveId(activeId === 'cv' ? null : 'cv')}
        >
          CV
        </button>
        {list.map((command) => {
          const running =
            (networkRunning && command.id === 'network') || (run?.status === 'running' && run.id === command.id)
          const selected = command.id === activeId
          return (
            <button
              key={command.id}
              type="button"
              className={`career-commands__tab ${selected ? 'is-active' : ''} ${running ? 'is-running' : ''}`}
              aria-pressed={selected}
              onClick={() => setActiveId(selected ? null : command.id)}
            >
              {command.say}
            </button>
          )
        })}
      </nav>
      {activeId === 'cv' && (
        <article className="career-command">
          <CareerCv />
        </article>
      )}
      {active && (
        <CareerCommand
          command={active}
          running={
            (networkRunning && active.id === 'network') || (run?.status === 'running' && run?.id === active.id)
          }
          busy={busy}
          onRun={active.id === 'score' ? undefined : onRun}
        >
          {active.id === 'score' && (
            <div className="career-command__extra">
              <CareerInbox />
            </div>
          )}
          {active.id === 'network' && (
            <CareerConnects refreshKey={connectKey} onStatus={onNetworkStatus} />
          )}
          {active.id === 'hunt' && queue.length > 0 && (
            <div className="career-command__extra">
              <h3 className="career-command__label">To apply</h3>
              <CareerQueue jobs={queue} />
            </div>
          )}
          {run && run.id === active.id && run.status !== 'idle' && (
            <div className="career-command__extra">
              <CareerResult run={run} plain />
            </div>
          )}
        </CareerCommand>
      )}
    </section>
  )
}
