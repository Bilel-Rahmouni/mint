import { Logo } from './Logo'
import './Header.css'

export function Header() {
  return (
    <header className="header">
      <Logo />
      <a href="mailto:hello@mintstudio.io" className="header__email">
        hello@mintstudio.io
      </a>
    </header>
  )
}
