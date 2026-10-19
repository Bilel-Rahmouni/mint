import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import './Modal.css'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: 'sm' | 'md'
}

export function Modal({ title, onClose, children, footer, width = 'md' }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    ;(panel?.querySelector<HTMLElement>('.modal__body input, .modal__body textarea') ??
      panel?.querySelector<HTMLElement>('.modal__footer button'))?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Portal into the admin root so the scoped admin theme still applies
  const container = document.querySelector('.admin') ?? document.body

  return createPortal(
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panelRef} className={`modal__panel modal__panel--${width}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    container,
  )
}
