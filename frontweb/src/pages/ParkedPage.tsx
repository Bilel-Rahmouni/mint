import { useEffect } from 'react'
import { ParkedNotice } from '../components/ParkedNotice'
import { parkedDomain } from '../lib/parkedHosts'

export function ParkedPage() {
  const domain = parkedDomain()

  useEffect(() => {
    const previous = document.title
    document.title = domain
    return () => {
      document.title = previous
    }
  }, [domain])

  return <ParkedNotice domain={domain} />
}
