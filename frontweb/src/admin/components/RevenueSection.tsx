import { api } from '../lib/api'
import { formatChange, formatCount, formatMoney } from '../lib/format'
import type { Project } from '../lib/types'
import { IntegrationSection } from './IntegrationSection'
import { Panel } from './Panel'
import { RevenueChart } from './RevenueChart'
import { StatCard } from './StatCard'

type Props = {
  project: Project
  onSynced: () => void
  index?: number
}

export function RevenueSection({ project, onSynced, index = 0 }: Props) {
  const revenue = project.revenue ?? {}
  const money = (value?: number) => formatMoney(value, revenue.currency)
  const growing = (revenue.earnings30d ?? 0) >= (revenue.prev30d ?? 0)

  return (
    <IntegrationSection
      title="Revenue"
      meta={[...(revenue.admobApps ?? []), revenue.adsenseDomain].filter(Boolean).join(' · ')}
      syncedAt={revenue.syncedAt}
      index={index}
      onSync={() => api.syncRevenue()}
      onSynced={onSynced}
      errors={[]}
    >
      <div className="integration__stats">
        <StatCard
          index={index + 1}
          label="Earnings 30d"
          value={money(revenue.earnings30d)}
          detail={formatChange(revenue.earnings30d, revenue.prev30d)}
          tone={revenue.earnings30d ? (growing ? 'mint' : 'warn') : 'default'}
        />
        {revenue.admobApps?.length ? (
          <>
            <StatCard index={index + 2} label="AdMob 30d" value={money(revenue.admob30d)} />
            <StatCard index={index + 3} label="eCPM" value={money(revenue.ecpm)} />
            <StatCard index={index + 4} label="Impressions 30d" value={formatCount(revenue.impressions30d)} />
          </>
        ) : null}
        {revenue.adsenseDomain && <StatCard index={index + 5} label="AdSense 30d" value={money(revenue.adsense30d)} />}
      </div>

      <Panel title="Earnings · 60d" index={index + 6}>
        <RevenueChart series={revenue.series ?? []} currency={revenue.currency} />
      </Panel>
    </IntegrationSection>
  )
}
