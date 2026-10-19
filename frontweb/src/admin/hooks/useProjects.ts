import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Project } from '../lib/types'

const REFRESH_MS = 60_000

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const { projects } = await api.listProjects()
      setProjects(projects)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    const timer = window.setInterval(reload, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [reload])

  return { projects, setProjects, loading, error, reload }
}
