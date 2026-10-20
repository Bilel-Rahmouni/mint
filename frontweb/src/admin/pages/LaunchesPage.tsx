import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { LaunchCard } from '../components/LaunchCard'
import { LaunchModal } from '../components/LaunchModal'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { TodoBoard } from '../components/TodoBoard'
import { Button } from '../components/ui/Button'
import { useProjects } from '../hooks/useProjects'
import { api } from '../lib/api'
import { launchColor, launchStages } from '../lib/growth'
import type { Launch } from '../lib/types'
import './LaunchesPage.css'

export function LaunchesPage() {
  const { projects, loading: projectsLoading } = useProjects()
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Launch | null | 'new'>(null)

  useEffect(() => {
    api
      .listLaunches()
      .then(({ launches }) => setLaunches(launches))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load launches'))
      .finally(() => setLoading(false))
  }, [])

  const projectOf = (id: string) => projects.find((p) => p._id === id)

  if (loading || projectsLoading) return <Loader />

  return (
    <div className="launches">
      <PageHeader
        title="Launches"
        aside={
          <Button variant="primary" size="sm" icon="plus" onClick={() => setEditing('new')}>
            New
          </Button>
        }
      />

      {error && <p className="launches__error">{error}</p>}

      <TodoBoard projects={projects} area="launch" areas={['launch']} />

      <div className="launches__board">
        {launchStages.map((stage, col) => {
          const items = launches
            .filter((l) => l.stage === stage)
            .sort((a, b) => (stage === 'Launched' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))
          return (
            <section
              key={stage}
              className="launches__column"
              style={{ '--stage-color': launchColor[stage], '--i': col } as CSSProperties}
            >
              <header className="launches__head">
                <span className="launches__dot" />
                {stage}
                <small>{items.length}</small>
              </header>
              <div className="launches__cards">
                {items.map((launch, i) => (
                  <LaunchCard
                    key={launch._id}
                    launch={launch}
                    project={projectOf(launch.projectId)}
                    index={col + i}
                    onClick={() => setEditing(launch)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {editing && (
        <LaunchModal
          launch={editing === 'new' ? undefined : editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setLaunches((list) => {
              const exists = list.some((l) => l._id === saved._id)
              return exists ? list.map((l) => (l._id === saved._id ? saved : l)) : [saved, ...list]
            })
            setEditing(null)
          }}
          onDeleted={(id) => {
            setLaunches((list) => list.filter((l) => l._id !== id))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
