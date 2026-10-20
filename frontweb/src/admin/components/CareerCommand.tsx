import type { ReactNode } from 'react'
import type { CareerCommand as CareerCommandType } from '../lib/types'
import { Button } from './ui/Button'
import { Tag } from './ui/Tag'
import './CareerCommand.css'

type Props = {
  command: CareerCommandType
  running?: boolean
  busy?: boolean
  onRun?: (command: CareerCommandType) => void
  children?: ReactNode
}

export function CareerCommand({ command, running = false, busy = false, onRun, children }: Props) {
  return (
    <article className="career-command">
      <header className="career-command__head">
        <h2 className="career-command__name">{command.say}</h2>
        {onRun && (
          <Button variant="primary" size="sm" disabled={busy} onClick={() => onRun(command)}>
            {running ? 'Running' : 'Run'}
          </Button>
        )}
      </header>
      <p className="career-command__what">{command.what}</p>
      {command.also.length > 0 && (
        <div className="career-command__also">
          {command.also.map((alias) => (
            <Tag key={alias}>{alias}</Tag>
          ))}
        </div>
      )}
      {command.loop.length > 0 && (
        <ol className="career-command__loop">
          {command.loop.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      {children}
    </article>
  )
}
