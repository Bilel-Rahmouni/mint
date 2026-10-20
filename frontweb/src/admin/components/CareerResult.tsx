import type { CareerRun } from '../lib/types'
import './CareerResult.css'

type Props = {
  run: CareerRun | null
  plain?: boolean
}

export function CareerResult({ run, plain = false }: Props) {
  if (!run || run.status === 'idle') return null

  const title = run.say || 'Result'
  const body = run.status === 'error' && !run.summary ? run.error : run.summary

  return (
    <section className={`career-result ${plain ? 'career-result--plain' : ''}`}>
      <header className="career-result__head">
        <h2 className="career-result__title">{title}</h2>
        <span className={`career-result__state career-result__state--${run.status}`}>
          {run.status === 'running' ? 'Running' : run.status === 'error' ? 'Failed' : 'Done'}
        </span>
      </header>
      {body ? (
        <pre className="career-result__body">{body}</pre>
      ) : (
        <p className="career-result__wait">Running</p>
      )}
      {run.status === 'error' && run.summary && run.error && (
        <p className="career-result__error">{run.error}</p>
      )}
    </section>
  )
}
