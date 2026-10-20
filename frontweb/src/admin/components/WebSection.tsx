import { useState } from 'react'
import { api } from '../lib/api'
import { formatCount, formatPosition, formatShare, hostOf } from '../lib/format'
import type { Project } from '../lib/types'
import { IntegrationSection } from './IntegrationSection'
import { Panel } from './Panel'
import { StatCard } from './StatCard'
import { TopList } from './TopList'
import { Segmented } from './ui/Segmented'
import { WEB_METRICS, WebTrendChart } from './WebTrendChart'
import type { WebMetric } from './WebTrendChart'

type Props = {
  project: Project
  onSynced: () => void
  index?: number
}

export function WebSection({ project, onSynced, index = 0 }: Props) {
  const web = project.web ?? {}
  const [metric, setMetric] = useState<WebMetric>(web.analyticsProperty || !web.searchSite ? 'users' : 'clicks')

  return (
    <IntegrationSection
      title="Search & traffic"
      kind="web"
      meta={hostOf(project.url)}
      syncedAt={web.syncedAt}
      index={index}
      onSync={() => api.syncWeb(project._id)}
      onSynced={onSynced}
      errors={[
        { label: 'Search Console', message: web.errors?.search },
        { label: 'Analytics', message: web.errors?.analytics },
      ]}
    >
      <div className="integration__stats">
        <StatCard
          index={index + 1}
          label="Visitors 30d"
          value={formatCount(web.users30d)}
          detail={web.sessions30d != null ? `${formatCount(web.sessions30d)} sessions` : undefined}
          tone={web.users30d ? 'mint' : 'default'}
        />
        <StatCard index={index + 2} label="Page views 30d" value={formatCount(web.views30d)} />
        <StatCard index={index + 3} label="Engagement" value={formatShare(web.engagementRate)} />
        <StatCard
          index={index + 4}
          label="Search clicks 30d"
          value={formatCount(web.clicks30d)}
          detail={web.impressions30d != null ? `${formatCount(web.impressions30d)} impressions` : undefined}
        />
        <StatCard index={index + 5} label="CTR" value={formatShare(web.ctr)} />
        <StatCard index={index + 6} label="Avg position" value={formatPosition(web.position)} />
      </div>

      <div className="integration__layout">
        <Panel
          title="Trend · 60d"
          index={index + 7}
          aside={<Segmented value={metric} options={WEB_METRICS} onChange={setMetric} ariaLabel="Metric" />}
        >
          <WebTrendChart series={web.series ?? []} metric={metric} />
        </Panel>
        <Panel title="Search terms · 30d" index={index + 8}>
          <TopList
            emptyLabel="0 search terms"
            rows={(web.queries ?? []).map((q) => ({
              key: q.key,
              value: q.clicks,
              detail: `#${formatPosition(q.position)}`,
            }))}
          />
        </Panel>
      </div>

      <div className="integration__layout integration__layout--even">
        <Panel title="Top pages · 30d" index={index + 9}>
          <TopList emptyLabel="0 pages" rows={web.pages ?? []} />
        </Panel>
        <Panel title="Traffic sources · 30d" index={index + 10}>
          <TopList emptyLabel="0 sources" rows={web.sources ?? []} />
        </Panel>
      </div>
    </IntegrationSection>
  )
}
