import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import './Footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <a
        className="footer__brand"
        href="https://mintstudio.io"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Logo />
      </a>
      <span className="footer__meta">
        <Link to="/privacy" className="footer__link">
          Privacy
        </Link>
        <span>&copy; {new Date().getFullYear()}</span>
      </span>
    </footer>
  )
}
