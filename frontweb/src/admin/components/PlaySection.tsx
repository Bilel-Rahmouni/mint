import { api } from '../lib/api'
import { formatCount, formatRate, formatRating } from '../lib/format'
import { ANR_RATE_LIMIT, CRASH_RATE_LIMIT, ratingTone, vitalTone } from '../lib/play'
import type { Project } from '../lib/types'
import { IntegrationSection } from './IntegrationSection'
import { Panel } from './Panel'
import { PlayTrendChart } from './PlayTrendChart'
import { ReviewList } from './ReviewList'
import { StatCard } from './StatCard'

type Props = {
  project: Project
  onSynced: () => void
  index?: number
}

export function PlaySection({ project, onSynced, index = 0 }: Props) {
  const play = project.play ?? {}

  return (
    <IntegrationSection
      title="Google Play"
      meta={project.packageName}
      syncedAt={play.syncedAt}
      index={index}
      onSync={() => api.syncPlay(project._id)}
      onSynced={onSynced}
      errors={[
        { label: 'Installs & ratings', message: play.errors?.stats },
        { label: 'Vitals', message: play.errors?.vitals },
        { label: 'Reviews', message: play.errors?.reviews },
      ]}
    >
      <div className="integration__stats">
        <StatCard index={index + 1} label="Rating" value={formatRating(play.rating)} tone={ratingTone(play.rating)} />
        <StatCard index={index + 2} label="Active devices" value={formatCount(play.activeDevices)} />
        <StatCard
          index={index + 3}
          label="Installs 30d"
          value={formatCount(play.installs30d)}
          detail={play.totalInstalls != null ? `${formatCount(play.totalInstalls)} total` : undefined}
          tone={play.installs30d ? 'mint' : 'default'}
        />
        <StatCard index={index + 4} label="Uninstalls 30d" value={formatCount(play.uninstalls30d)} />
        <StatCard
          index={index + 5}
          label="Crash rate"
          value={formatRate(play.crashRate)}
          detail={`limit ${formatRate(CRASH_RATE_LIMIT)}`}
          tone={vitalTone(play.crashRate, CRASH_RATE_LIMIT)}
        />
        <StatCard
          index={index + 6}
          label="ANR rate"
          value={formatRate(play.anrRate)}
          detail={`limit ${formatRate(ANR_RATE_LIMIT)}`}
          tone={vitalTone(play.anrRate, ANR_RATE_LIMIT)}
        />
      </div>

      <div className="integration__layout">
        <Panel title="Installs · 60d" index={index + 7}>
          <PlayTrendChart series={play.series ?? []} />
        </Panel>
        <Panel title="Reviews" index={index + 8}>
          <ReviewList reviews={play.reviews ?? []} />
        </Panel>
      </div>
    </IntegrationSection>
  )
}
