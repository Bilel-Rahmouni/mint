import { useState } from 'react'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { PortfolioRow } from '../components/PortfolioRow'
import '../components/ui/Button.css'
import { Icon } from '../components/ui/Icon'
import { useProjects } from '../hooks/useProjects'
import { api } from '../lib/api'
import { stagger } from '../lib/style'
import type { Project } from '../lib/types'
import './PortfolioPage.css'

export function PortfolioPage() {
  const { projects, setProjects, loading, error, reload } = useProjects()
  const [saveError, setSaveError] = useState<string | null>(null)

  const visibleCount = projects.filter((p) => p.showOnSite).length

  const persist = async (action: () => Promise<unknown>, optimistic: Project[]) => {
    const previous = projects
    setProjects(optimistic)
    setSaveError(null)
    try {
      await action()
    } catch (err) {
      setProjects(previous)
      setSaveError(err instanceof Error ? err.message : 'Could not save')
      reload()
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    const next = [...projects]
    const [item] = next.splice(index, 1)
    next.splice(index + direction, 0, item)
    const reordered = next.map((p, i) => ({ ...p, order: i }))
    persist(() => api.reorderProjects(reordered.map((p) => p._id)), reordered)
  }

  const toggleVisible = (project: Project, showOnSite: boolean) => {
    persist(
      () => api.updateProject(project._id, { showOnSite }),
      projects.map((p) => (p._id === project._id ? { ...p, showOnSite } : p)),
    )
  }

  return (
    <>
      <PageHeader
        title={
          <>
            Portfolio <span className="portfolio__count mono">{visibleCount}</span>
          </>
        }
        aside={
          <a href="/" target="_blank" rel="noreferrer" className="btn btn--ghost btn--md">
            <Icon name="external" size={16} />
            <span>View site</span>
          </a>
        }
      />

      {saveError && <p className="portfolio__error">{saveError}</p>}

      {loading ? (
        <Loader />
      ) : error ? (
        <p className="portfolio__error">{error}</p>
      ) : (
        <ol className="portfolio__list reveal" style={stagger(1)}>
          {projects.map((project, i) => (
            <PortfolioRow
              key={project._id}
              project={project}
              position={i}
              isFirst={i === 0}
              isLast={i === projects.length - 1}
              onMove={(direction) => move(i, direction)}
              onToggleVisible={(visible) => toggleVisible(project, visible)}
            />
          ))}
        </ol>
      )}
    </>
  )
}
