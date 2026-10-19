import { useState } from 'react'
import { api } from '../lib/api'
import type { GoogleIntegration } from '../lib/types'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import './DisconnectGoogleModal.css'

type Props = {
  email?: string
  onClose: () => void
  onDisconnected: (integration: GoogleIntegration) => void
}

export function DisconnectGoogleModal({ email, onClose, onDisconnected }: Props) {
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDisconnect = async () => {
    setWorking(true)
    setError(null)
    try {
      onDisconnected(await api.disconnectGoogle())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect')
      setWorking(false)
    }
  }

  return (
    <Modal
      title="Disconnect Google"
      onClose={onClose}
      width="sm"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" icon="logout" loading={working} onClick={handleDisconnect}>
            Disconnect
          </Button>
        </>
      }
    >
      <p className="disconnect-google__text">
        Revokes AdMob and AdSense access{email ? ` for ${email}` : ''} and clears all income data from the dashboard.
      </p>
      {error && <p className="disconnect-google__error">{error}</p>}
    </Modal>
  )
}
