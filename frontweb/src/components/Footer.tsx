import './Footer.css'

export function Footer() {
  return (
    <footer className="footer">
      <span>&copy; {new Date().getFullYear()}</span>
    </footer>
  )
}
