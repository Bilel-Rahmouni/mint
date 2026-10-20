import { useEffect, useState } from 'react'
import { CareerCommands } from '../components/CareerCommands'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { api } from '../lib/api'
import type { CareerBoard, CareerRun } from '../lib/types'
import './CareerPage.css'

export function CareerPage() {
  const [board, setBoard] = useState<CareerBoard | null>(null)
  const [run, setRun] = useState<CareerRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectKey, setConnectKey] = useState(0)
  const [networkRunning, setNetworkRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshBoard = () => {
    api.getCareer().then(setBoard).catch(() => {})
  }

  useEffect(() => {
    api
      .getCareer()
      .then(setBoard)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load career'))
      .finally(() => setLoading(false))
    api.careerRun().then(setRun).catch(() => {})
  }, [])

  useEffect(() => {
    if (run?.status !== 'running') return undefined
    const timer = window.setInterval(() => {
      api.careerRun().then((next) => {
        setRun(next)
        if (next.status === 'finished') refreshBoard()
      }).catch(() => {})
    }, 2000)
    return () => window.clearInterval(timer)
  }, [run?.status])

  const launch = async (command: { id: string }) => {
    setError(null)
    if (command.id === 'network') {
      try {
        setNetworkRunning(true)
        setConnectKey((key) => key + 1)
        await api.startCareerConnects()
        setConnectKey((key) => key + 1)
      } catch (err) {
        setNetworkRunning(false)
        setError(err instanceof Error ? err.message : 'Could not start')
      }
      return
    }
    try {
      setRun(await api.startCareerRun(command.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start')
    }
  }

  if (loading) return <Loader />

  return (
    <div className="career">
      <PageHeader title="Career" aside={board?.asOf ? <span className="mono">{board.asOf}</span> : null} />
      {error && <p className="career__error">{error}</p>}
      {board && (
        <>
          <CareerCommands
            commands={board.commands}
            run={run}
            queue={board.queue}
            networkRunning={networkRunning}
            connectKey={connectKey}
            onNetworkStatus={(status) => setNetworkRunning(status === 'running')}
            onRun={launch}
          />
          <div className="career__stats">
            <StatCard
              label="Jobs scored"
              value={board.kpis.scored}
              detail={`${board.kpis.evaluated} scored · ${board.kpis.applied} sent`}
              index={0}
            />
            <StatCard label="Good enough" value={board.kpis.good} detail="Score 4.0 or more" tone="mint" index={1} />
            <StatCard
              label="Waiting on you"
              value={board.kpis.waiting}
              detail={board.kpis.waiting ? board.queue[0]?.company : 'None'}
              tone={board.kpis.waiting ? 'warn' : 'default'}
              index={2}
            />
            <StatCard
              label="Notes left"
              value={board.kpis.notesLeft}
              detail={`${board.kpis.invitesThisWeek} of ${board.kpis.inviteCap} invites this week`}
              index={3}
            />
          </div>
        </>
      )}
    </div>
  )
}
