import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import './Field.css'

type BaseProps = {
  label: string
  hint?: string
  className?: string
}

export function Field({ label, hint, className = '', ...input }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      <input className="field__control" {...input} />
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function SelectField({
  label,
  hint,
  className = '',
  children,
  ...select
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      <select className="field__control field__control--select" {...select}>
        {children}
      </select>
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

export function TextAreaField({
  label,
  hint,
  className = '',
  ...textarea
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      <textarea className="field__control field__control--area" {...textarea} />
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}
