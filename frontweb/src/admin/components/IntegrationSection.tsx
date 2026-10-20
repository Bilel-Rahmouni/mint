import { useState } from 'react'
import type { ReactNode } from 'react'
import { relativeTime } from '../lib/format'
import { stagger } from '../lib/style'
import { Button } from './ui/Button'
import './IntegrationSection.css'

export type SyncError = { label: string; message?: string }

type Props = {
  title: string
  meta?: string
  syncedAt?: string
  errors: SyncError[]
  index?: number
  onSync: () => Promise<unknown>
  onSynced: () => void
  actions?: ReactNode
  kind?: 'web' | 'app'
  children: ReactNode
}

export function IntegrationSection({ title, meta, syncedAt, errors, index = 0, onSync, onSynced, actions, kind, children }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const sync = async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      await onSync()
      onSynced()
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const visibleErrors = errors.filter((e) => e.message)

  return (
    <section className={`integration${kind ? ` integration--${kind}` : ''}`}>
      <header className="integration__head reveal" style={stagger(index)}>
        <div className="integration__heading">
          <h2 className="integration__title">{title}</h2>
          <span className="integration__meta mono">
            {[meta, syncedAt && relativeTime(syncedAt)].filter(Boolean).join(' · ')}
          </span>
        </div>
        <div className="integration__actions">
          {actions}
          <Button icon="refresh" size="sm" loading={syncing} onClick={sync}>
            Sync
          </Button>
        </div>
      </header>

      {(syncError || visibleErrors.length > 0) && (
        <ul className="integration__errors">
          {syncError && <li>{syncError}</li>}
          {visibleErrors.map((e) => (
            <li key={e.label}>
              <span className="mono">{e.label}</span> {e.message}
            </li>
          ))}
        </ul>
      )}

      {children}
    </section>
  )
}
