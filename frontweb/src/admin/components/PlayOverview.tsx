import { useMemo } from 'react'
import { api } from '../lib/api'
import { formatCount, formatRate, formatRating } from '../lib/format'
import { ANR_RATE_LIMIT, CRASH_RATE_LIMIT, ratingTone, vitalTone } from '../lib/play'
import { playSummary } from '../lib/portfolio'
import type { Project } from '../lib/types'
import { IntegrationSection } from './IntegrationSection'
import { Panel } from './Panel'
import { PlayTrendChart } from './PlayTrendChart'
import { StatCard } from './StatCard'
import { TopList } from './TopList'

type Props = {
  projects: Project[]
  onSynced: () => void
  index?: number
}

export function PlayOverview({ projects, onSynced, index = 0 }: Props) {
  const play = useMemo(() => playSummary(projects), [projects])

  if (!play.apps) return null

  return (
    <IntegrationSection
      title="Play"
      kind="app"
      meta={`${play.apps} apps`}
      syncedAt={play.syncedAt}
      index={index}
      onSync={() => api.syncAllPlay()}
      onSynced={onSynced}
      errors={play.errors}
    >
      <div className="integration__stats">
        <StatCard index={index + 1} label="Rating" value={formatRating(play.rating)} tone={ratingTone(play.rating)} />
        <StatCard index={index + 2} label="Active devices" value={formatCount(play.devices)} />
        <StatCard
          index={index + 3}
          label="Installs 30d"
          value={formatCount(play.installs)}
          detail={play.totalInstalls != null ? `${formatCount(play.totalInstalls)} total` : undefined}
          tone={play.installs ? 'mint' : 'default'}
        />
        <StatCard index={index + 4} label="Uninstalls 30d" value={formatCount(play.uninstalls)} />
        <StatCard
          index={index + 5}
          label="Crash rate"
          value={formatRate(play.crashRate)}
          tone={vitalTone(play.crashRate, CRASH_RATE_LIMIT)}
        />
        <StatCard
          index={index + 6}
          label="ANR rate"
          value={formatRate(play.anrRate)}
          tone={vitalTone(play.anrRate, ANR_RATE_LIMIT)}
        />
      </div>

      <div className="integration__layout">
        <Panel title="Installs · 60d" index={index + 7}>
          <PlayTrendChart series={play.series} />
        </Panel>
        <Panel title="Apps · 30d" index={index + 8}>
          <TopList emptyLabel="0 installs" rows={play.topApps} />
        </Panel>
      </div>
    </IntegrationSection>
  )
}
