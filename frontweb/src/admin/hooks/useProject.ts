import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ProjectDetail, Range } from '../lib/types'

export function useProject(id: string, range: Range) {
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setData(await api.getProject(id, range))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [id, range])

  useEffect(() => {
    setLoading(true)
    reload()
  }, [reload])

  return { data, loading, error, reload }
}
