import { useEffect } from 'react'

export function useAdminDocument() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'mint. control'

    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)

    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    const previousIcon = icon?.href
    if (icon) icon.href = '/admin-favicon.svg'

    return () => {
      document.title = previousTitle
      robots.remove()
      if (icon && previousIcon) icon.href = previousIcon
    }
  }, [])
}
