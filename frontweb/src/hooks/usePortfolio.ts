import { useEffect, useState } from 'react'

export type PortfolioProject = {
  name: string
  href: string
}

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export function usePortfolio(fallback: PortfolioProject[]) {
  const [projects, setProjects] = useState(fallback)

  useEffect(() => {
    const controller = new AbortController()

    fetch(`${API_URL}/api/portfolio`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { projects?: PortfolioProject[] }) => {
        if (Array.isArray(data.projects)) setProjects(data.projects)
      })
      .catch(() => {})

    return () => controller.abort()
  }, [])

  return projects
}
