import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatCount, formatShare } from '../lib/format'
import { trafficSummary } from '../lib/portfolio'
import type { Project } from '../lib/types'
import { IntegrationSection } from './IntegrationSection'
import { Panel } from './Panel'
import { StatCard } from './StatCard'
import { TopList } from './TopList'
import { Segmented } from './ui/Segmented'
import { WEB_METRICS, WebTrendChart } from './WebTrendChart'
import type { WebMetric } from './WebTrendChart'

type Props = {
  projects: Project[]
  onSynced: () => void
  index?: number
}

export function TrafficPanel({ projects, onSynced, index = 0 }: Props) {
  const traffic = useMemo(() => trafficSummary(projects), [projects])
  const [metric, setMetric] = useState<WebMetric>('users')

  if (!traffic.sites) return null

  return (
    <IntegrationSection
      title="Analytics"
      meta={`${traffic.sites} sites`}
      syncedAt={traffic.syncedAt}
      index={index}
      onSync={() => api.syncAllWeb()}
      onSynced={onSynced}
      errors={traffic.errors}
    >
      <div className="integration__stats">
        <StatCard
          index={index + 1}
          label="Visitors 30d"
          value={formatCount(traffic.users)}
          detail={traffic.sessions != null ? `${formatCount(traffic.sessions)} sessions` : undefined}
          tone={traffic.users ? 'mint' : 'default'}
        />
        <StatCard index={index + 2} label="Page views 30d" value={formatCount(traffic.views)} />
        <StatCard index={index + 3} label="Engagement" value={formatShare(traffic.engagement)} />
      </div>

      <div className="integration__layout">
        <Panel
          title="Trend · 60d"
          index={index + 4}
          aside={
            <Segmented
              value={metric}
              options={WEB_METRICS.filter((m) => m.value === 'users' || m.value === 'views')}
              onChange={setMetric}
              ariaLabel="Metric"
            />
          }
        >
          <WebTrendChart series={traffic.series} metric={metric} />
        </Panel>
        <Panel title="Sites · 30d" index={index + 5}>
          <TopList emptyLabel="0 visitors" rows={traffic.topSites} />
        </Panel>
      </div>

      <Panel title="Sources · 30d" index={index + 6}>
        <TopList emptyLabel="0 sources" rows={traffic.topSources} />
      </Panel>
    </IntegrationSection>
  )
}
