import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { CareerIntros } from '../lib/types'
import { Button } from './ui/Button'
import './CareerConnects.css'

type Props = {
  refreshKey?: number
  onStatus?: (status: CareerIntros['status']) => void
}

export function CareerConnects({ refreshKey = 0, onStatus }: Props) {
  const [list, setList] = useState<CareerIntros | null>(null)
  const [copied, setCopied] = useState('')

  const load = () => {
    api.careerConnects().then((next) => {
      setList(next)
      onStatus?.(next.status)
    }).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [refreshKey])

  useEffect(() => {
    if (list?.status !== 'running') return undefined
    const timer = window.setInterval(load, 2000)
    return () => window.clearInterval(timer)
  }, [list?.status])

  const copy = async (name: string, note: string) => {
    try {
      await navigator.clipboard.writeText(note)
      setCopied(name)
      window.setTimeout(() => setCopied((current) => (current === name ? '' : current)), 1400)
    } catch {
      setCopied('')
    }
  }

  const quiet = !list || (list.status !== 'error' && list.status !== 'running' && list.people.length === 0)
  if (quiet) return null

  return (
    <div className="career-command__extra">
      {list?.status === 'error' && list.error && <p className="career-connects__error">{list.error}</p>}
      {list?.status === 'running' && <p className="career-connects__detail">Running</p>}
      {list && list.people.length > 0 && (
        <ul className="career-connects">
          {list.people.map((person) => (
            <li key={person.name} className="career-connects__person">
              <div className="career-connects__head">
                {person.href ? (
                  <a className="career-connects__name" href={person.href} target="_blank" rel="noreferrer">
                    {person.name}
                  </a>
                ) : (
                  <span className="career-connects__name">{person.name}</span>
                )}
                {person.note && (
                  <Button size="sm" onClick={() => void copy(person.name, person.note)}>
                    {copied === person.name ? 'Copied' : 'Copy note'}
                  </Button>
                )}
              </div>
              <span className="career-connects__detail">
                {[person.city, person.why].filter(Boolean).join(' · ')}
              </span>
              {person.note && <p className="career-connects__note">{person.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
