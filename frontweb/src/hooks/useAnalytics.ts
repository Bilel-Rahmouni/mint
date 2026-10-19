import { useEffect } from 'react'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_ID

function loadAnalytics(id: string) {
  if (window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js only processes the raw `arguments` object, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)
}

export function useAnalytics() {
  useEffect(() => {
    if (MEASUREMENT_ID && import.meta.env.PROD) loadAnalytics(MEASUREMENT_ID)
  }, [])
}
