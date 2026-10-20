import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { InboxAlert } from '../lib/types'
import { Icon } from './ui/Icon'
import './AlertBell.css'

export function AlertBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [alerts, setAlerts] = useState<InboxAlert[]>([])

  useEffect(() => {
    let active = true
    const load = () => {
      api.listAlerts()
        .then((data) => {
          if (!active) return
          setUnread(data.unread)
        })
        .catch(() => {})
    }
    load()
    const timer = window.setInterval(load, 60_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const toggle = async () => {
    if (open) {
      setOpen(false)
      return
    }
    try {
      const data = await api.listAlerts()
      const fresh = data.alerts.filter((alert) => !alert.readAt)
      setAlerts(fresh)
      setUnread(data.unread)
      setOpen(true)
      if (data.unread) {
        await api.readAlerts()
        setUnread(0)
      }
    } catch {
      setOpen(true)
    }
  }

  return (
    <div className="alert-bell">
      <button type="button" className="alert-bell__button" onClick={toggle} aria-label="Alerts">
        <Icon name="bell" size={16} />
        {unread > 0 && <span className="alert-bell__count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="alert-bell__panel">
          {alerts.length === 0 ? (
            <p className="alert-bell__empty">No unread alerts</p>
          ) : (
            <ul>
              {alerts.map((alert) => (
                <li key={alert._id}>{alert.title}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
