import { useState } from 'react'
import { api } from '../lib/api'
import { stagger } from '../lib/style'
import { Button } from './ui/Button'
import './GoogleConnectCard.css'

type Props = {
  error?: string | null
  index?: number
}

export function GoogleConnectCard({ error, index = 0 }: Props) {
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const connect = async () => {
    setConnecting(true)
    setConnectError(null)
    try {
      const { url } = await api.connectGoogle(window.location.href)
      window.location.assign(url)
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Could not start Google sign-in')
      setConnecting(false)
    }
  }

  const message = connectError ?? error

  return (
    <section className="google-connect reveal" style={stagger(index)}>
      <div className="google-connect__body">
        <h2 className="google-connect__title">Income</h2>
        <div className="google-connect__sources">
          <span className="google-connect__source google-connect__source--admob mono">AdMob</span>
          <span className="google-connect__source google-connect__source--adsense mono">AdSense</span>
        </div>
        {message && <p className="google-connect__error">{message}</p>}
      </div>
      <Button variant="primary" icon="external" loading={connecting} onClick={connect}>
        Connect Google
      </Button>
    </section>
  )
}
