import './Toggle.css'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  ariaLabel?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, ariaLabel, disabled }: Props) {
  return (
    <label className={`toggle ${disabled ? 'toggle--disabled' : ''}`}>
      <input
        type="checkbox"
        className="toggle__input"
        checked={checked}
        disabled={disabled}
        aria-label={label ? undefined : ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
      {label && <span className="toggle__label">{label}</span>}
    </label>
  )
}
