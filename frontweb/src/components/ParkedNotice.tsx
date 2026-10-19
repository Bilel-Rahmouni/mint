import { PARKED_EMAIL } from '../lib/parkedHosts'
import './ParkedNotice.css'

type Props = {
  domain: string
}

export function ParkedNotice({ domain }: Props) {
  return (
    <div className="parked-notice">
      <p className="parked-notice__mark">Available</p>
      <h1 className="parked-notice__domain">{domain}</h1>
      <a className="parked-notice__mail" href={`mailto:${PARKED_EMAIL}`}>
        {PARKED_EMAIL}
      </a>
    </div>
  )
}
