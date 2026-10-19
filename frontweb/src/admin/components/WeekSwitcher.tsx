import { formatWeekRange } from '../lib/dates'
import { Button } from './ui/Button'
import './WeekSwitcher.css'

type Props = {
  weekStart: Date
  isCurrent: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function WeekSwitcher({ weekStart, isCurrent, onPrev, onNext, onToday }: Props) {
  return (
    <div className="week-switcher">
      <Button type="button" size="sm" onClick={onPrev} aria-label="Previous week">
        ←
      </Button>
      <span className="week-switcher__label">{formatWeekRange(weekStart)}</span>
      <Button type="button" size="sm" onClick={onNext} aria-label="Next week">
        →
      </Button>
      {!isCurrent && (
        <Button type="button" size="sm" variant="subtle" onClick={onToday}>
          Today
        </Button>
      )}
    </div>
  )
}
