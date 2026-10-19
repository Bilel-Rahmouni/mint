import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { GoogleIntegration } from '../lib/types'

export function useGoogleIntegration() {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setIntegration(await api.getGoogleIntegration())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load income')
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { integration, setIntegration, error, reload }
}
