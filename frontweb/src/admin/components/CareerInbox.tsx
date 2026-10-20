import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { CareerJob } from '../lib/types'
import { CareerJobRow } from './CareerJobRow'
import { Button } from './ui/Button'
import { TextAreaField } from './ui/Field'
import './CareerInbox.css'
import './CareerJobRow.css'

export function CareerInbox() {
  const [jobs, setJobs] = useState<CareerJob[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scoring = jobs.some((job) => job.status === 'scoring')

  const load = () => {
    api.listCareerJobs().then(({ jobs: next }) => setJobs(next)).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!scoring) return undefined
    const timer = window.setInterval(load, 2000)
    return () => window.clearInterval(timer)
  }, [scoring])

  const submit = async () => {
    const body = text.trim()
    if (!body) return
    setSending(true)
    setError(null)
    try {
      const { job } = await api.addCareerJob(body)
      setJobs((list) => [job, ...list.filter((item) => item.id !== job.id)])
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not score')
    } finally {
      setSending(false)
    }
  }

  const latest = jobs[0]
  const earlier = jobs.slice(1)

  return (
    <>
      <form
        className="career-inbox__form"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <TextAreaField
          label="Job"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
        />
        <Button type="submit" variant="primary" disabled={sending || !text.trim()}>
          Score
        </Button>
      </form>
      {error && <p className="career-inbox__error">{error}</p>}
      {latest && (
        <div className="career-inbox__latest">
          <CareerJobRow job={latest} />
        </div>
      )}
      {earlier.length > 0 && (
        <details className="career-inbox__earlier">
          <summary>Earlier · {earlier.length}</summary>
          <ul className="career-inbox__scroll">
            {earlier.map((job) => (
              <li key={job.id}>
                <CareerJobRow job={job} compact />
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
