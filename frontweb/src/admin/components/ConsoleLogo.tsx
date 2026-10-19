import { Logo } from '../../components/Logo'
import './ConsoleLogo.css'

export function ConsoleLogo() {
  return (
    <span className="console-logo">
      <Logo />
      <span className="console-logo__suffix">control</span>
    </span>
  )
}
