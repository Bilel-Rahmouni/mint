import type { CSSProperties } from 'react'
import './Segmented.css'

type Option<T extends string> = { value: T; label: string; kind?: 'web' | 'app' }

type Props<T extends string> = {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  ariaLabel: string
}

export function Segmented<T extends string>({ value, options, onChange, ariaLabel }: Props<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  const kind = options[index]?.kind

  return (
    <div
      className="segmented"
      role="radiogroup"
      aria-label={ariaLabel}
      style={
        {
          '--count': options.length,
          '--index': index,
          '--kind': kind === 'web' ? 'var(--kind-web)' : kind === 'app' ? 'var(--kind-app)' : 'var(--color-text-strong)',
          '--kind-line': kind === 'web' ? 'var(--kind-web-line)' : kind === 'app' ? 'var(--kind-app-line)' : 'var(--color-mint-line)',
        } as CSSProperties
      }
    >
      <span className="segmented__indicator" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={`segmented__option ${option.value === value ? 'is-active' : ''}`}
          data-kind={option.kind}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
