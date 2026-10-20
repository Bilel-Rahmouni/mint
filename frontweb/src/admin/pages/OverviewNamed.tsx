import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertStrip } from '../components/AlertStrip'
import { IncomePanel } from '../components/IncomePanel'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { PlayOverview } from '../components/PlayOverview'
import { ProjectFormModal } from '../components/ProjectFormModal'
import { ProjectTile } from '../components/ProjectTile'
import { SearchPanel } from '../components/SearchPanel'
import { StatusBar } from '../components/StatusBar'
import { TrafficPanel } from '../components/TrafficPanel'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { useProjects } from '../hooks/useProjects'
import { adminPath } from '../lib/paths'
import { collectAlerts } from '../lib/status'
import type { ProjectType } from '../lib/types'
import './OverviewPage.css'

type Filter = 'all' | ProjectType

const FILTERS: { value: Filter; label: string; kind?: 'web' | 'app' }[] = [
  { value: 'all', label: 'All' },
  { value: 'website', label: 'Websites', kind: 'web' as const },
  { value: 'app', label: 'Apps', kind: 'app' as const },
]

export function OverviewPage() {
  const { projects, loading, error, reload } = useProjects()
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const alerts = useMemo(() => collectAlerts(projects), [projects])
  const visible = filter === 'all' ? projects : projects.filter((p) => p.type === filter)

  return (
    <>
      <PageHeader
        title="Overview"
        aside={
          <>
            <Segmented ariaLabel="Filter projects" value={filter} options={FILTERS} onChange={setFilter} />
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
              New project
            </Button>
          </>
        }
      />

      {loading ? (
        <Loader />
      ) : error ? (
        <p className="overview__error">{error}</p>
      ) : (
        <>
          <StatusBar projects={projects} />
          <AlertStrip alerts={alerts} />
          <div className="overview__grid">
            {visible.map((project, i) => (
              <ProjectTile key={project._id} project={project} index={i} />
            ))}
          </div>
          <SearchPanel projects={projects} onSynced={reload} index={6} />
          <TrafficPanel projects={projects} onSynced={reload} index={7} />
          <PlayOverview projects={projects} onSynced={reload} index={8} />
          <IncomePanel projects={projects} onSynced={reload} index={9} />
        </>
      )}

      {creating && (
        <ProjectFormModal
          onClose={() => setCreating(false)}
          onSaved={(project) => navigate(adminPath.project(project._id))}
        />
      )}
    </>
  )
}
