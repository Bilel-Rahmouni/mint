import './Loader.css'

export function Loader({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    <div className={`loader ${fullscreen ? 'loader--fullscreen' : ''}`} role="status" aria-label="Loading">
      <span className="loader__bar" />
      <span className="loader__bar" />
      <span className="loader__bar" />
    </div>
  )
}
