import { useMemo, useState } from 'react'
import { api } from '../lib/api'
import { formatCount, formatPosition, formatShare } from '../lib/format'
import { searchSummary } from '../lib/portfolio'
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

export function SearchPanel({ projects, onSynced, index = 0 }: Props) {
  const search = useMemo(() => searchSummary(projects), [projects])
  const [metric, setMetric] = useState<WebMetric>('clicks')

  if (!search.sites) return null

  return (
    <IntegrationSection
      title="Search"
      meta={`${search.sites} sites`}
      syncedAt={search.syncedAt}
      index={index}
      onSync={() => api.syncAllWeb()}
      onSynced={onSynced}
      errors={search.errors}
    >
      <div className="integration__stats">
        <StatCard
          index={index + 1}
          label="Clicks 30d"
          value={formatCount(search.clicks)}
          tone={search.clicks ? 'mint' : 'default'}
        />
        <StatCard index={index + 2} label="Impressions 30d" value={formatCount(search.impressions)} />
        <StatCard index={index + 3} label="CTR" value={formatShare(search.ctr)} />
        <StatCard index={index + 4} label="Avg position" value={formatPosition(search.position)} />
      </div>

      <div className="integration__layout">
        <Panel
          title="Trend · 60d"
          index={index + 5}
          aside={
            <Segmented
              value={metric}
              options={WEB_METRICS.filter((m) => m.value === 'clicks' || m.value === 'impressions')}
              onChange={setMetric}
              ariaLabel="Metric"
            />
          }
        >
          <WebTrendChart series={search.series} metric={metric} />
        </Panel>
        <Panel title="Sites · 30d" index={index + 6}>
          <TopList emptyLabel="0 clicks" rows={search.topSites} />
        </Panel>
      </div>

      <Panel title="Search terms · 30d" index={index + 7}>
        <TopList emptyLabel="0 search terms" rows={search.topQueries} />
      </Panel>
    </IntegrationSection>
  )
}
