import type { CSSProperties } from 'react'
import './Segmented.css'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  ariaLabel: string
}

export function Segmented<T extends string>({ value, options, onChange, ariaLabel }: Props<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))

  return (
    <div
      className="segmented"
      role="radiogroup"
      aria-label={ariaLabel}
      style={{ '--count': options.length, '--index': index } as CSSProperties}
    >
      <span className="segmented__indicator" aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={`segmented__option ${option.value === value ? 'is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
