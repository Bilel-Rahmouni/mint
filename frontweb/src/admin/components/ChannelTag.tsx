import type { CSSProperties } from 'react'
import './ChannelTag.css'

type Props = {
  label: string
  color: string
}

export function ChannelTag({ label, color }: Props) {
  return (
    <span className="channel-tag" style={{ '--chip': color } as CSSProperties}>
      {label}
    </span>
  )
}
