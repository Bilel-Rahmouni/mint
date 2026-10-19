import type { ButtonHTMLAttributes } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import './Button.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
  size?: 'sm' | 'md'
  icon?: IconName
  loading?: boolean
}

export function Button({
  variant = 'ghost',
  size = 'md',
  icon,
  loading = false,
  className = '',
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} className="btn__icon" />}
      {children && <span>{children}</span>}
    </button>
  )
}
