import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGoogleIntegration } from '../hooks/useGoogleIntegration'
import { api } from '../lib/api'
import { formatChange, formatCount, formatMoney, formatShare } from '../lib/format'
import { revenueIssues, topEarners } from '../lib/revenue'
import type { Project } from '../lib/types'
import { DisconnectGoogleModal } from './DisconnectGoogleModal'
import { GoogleConnectCard } from './GoogleConnectCard'
import { IntegrationSection } from './IntegrationSection'
import { Panel } from './Panel'
import { RevenueChart } from './RevenueChart'
import { RevenueIssues } from './RevenueIssues'
import { StatCard } from './StatCard'
import { TopList } from './TopList'
import { Button } from './ui/Button'

type Props = {
  projects: Project[]
  onSynced: () => void
  index?: number
}

const RETURN_MESSAGES: Record<string, string> = {
  denied: 'Google access was not granted',
  error: 'Google sign-in failed, try again',
}

export function IncomePanel({ projects, onSynced, index = 0 }: Props) {
  const { integration, setIntegration } = useGoogleIntegration()
  const [params, setParams] = useSearchParams()
  const [notice, setNotice] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const returned = params.get('google')

  useEffect(() => {
    if (!returned) return
    setParams((next) => {
      next.delete('google')
      return next
    }, { replace: true })

    if (returned !== 'connected') {
      setNotice(RETURN_MESSAGES[returned] ?? RETURN_MESSAGES.error)
      return
    }
    api.syncRevenue()
      .then((next) => {
        setIntegration(next)
        onSynced()
      })
      .catch((err) => setNotice(err instanceof Error ? err.message : 'Income sync failed'))
  }, [returned, setParams, setIntegration, onSynced])

  const revenue = integration?.revenue
  const earners = useMemo(() => topEarners(projects, revenue), [projects, revenue])
  const issues = useMemo(() => revenueIssues(revenue), [revenue])

  if (!integration?.configured) return null
  if (!integration.connected) return <GoogleConnectCard error={notice ?? integration.error} index={index} />

  const currency = revenue?.currency
  const money = (value?: number) => formatMoney(value, currency)
  const growing = (revenue?.earnings30d ?? 0) >= (revenue?.prev30d ?? 0)

  return (
    <>
      <IntegrationSection
        title="Income"
        meta={[integration.email, revenue?.admob?.publisherId].filter(Boolean).join(' · ')}
        syncedAt={revenue?.syncedAt}
        index={index}
        onSync={async () => setIntegration(await api.syncRevenue())}
        onSynced={() => {
          setNotice(null)
          onSynced()
        }}
        actions={<Button variant="subtle" size="sm" icon="logout" aria-label="Disconnect Google" onClick={() => setDisconnecting(true)} />}
        errors={[
          { label: 'Google', message: notice ?? undefined },
          { label: 'AdMob', message: revenue?.errors?.admob },
          { label: 'AdSense', message: revenue?.errors?.adsense },
        ]}
      >
        <div className="integration__stats">
          <StatCard index={index + 1} label="Today" value={money(revenue?.today)} tone={revenue?.today ? 'mint' : 'default'} />
          <StatCard index={index + 2} label="Yesterday" value={money(revenue?.yesterday)} />
          <StatCard
            index={index + 3}
            label="This month"
            value={money(revenue?.thisMonth)}
            detail={revenue?.lastMonth != null ? `${money(revenue.lastMonth)} last month` : undefined}
          />
          <StatCard
            index={index + 4}
            label="Last 30 days"
            value={money(revenue?.earnings30d)}
            detail={formatChange(revenue?.earnings30d, revenue?.prev30d)}
            tone={revenue?.earnings30d ? (growing ? 'mint' : 'warn') : 'default'}
          />
          <StatCard
            index={index + 5}
            label="AdMob 30d"
            value={money(revenue?.admob30d)}
            detail={revenue?.admob?.impressions30d != null
              ? `${formatCount(revenue.admob.impressions30d)} imp · ${formatShare(revenue.admob.matchRate)} match`
              : undefined}
          />
          <StatCard
            index={index + 6}
            label="AdSense 30d"
            value={money(revenue?.adsense30d)}
            detail={revenue?.adsense?.pageViews30d != null ? `${formatCount(revenue.adsense.pageViews30d)} page views` : undefined}
          />
          {revenue?.adsense?.balance && (
            <StatCard index={index + 7} label="AdSense balance" value={revenue.adsense.balance} />
          )}
        </div>

        <div className="integration__layout">
          <Panel title="Earnings · 60d" index={index + 8}>
            <RevenueChart series={revenue?.series ?? []} currency={currency} />
          </Panel>
          <Panel title="Top earners · 30d" index={index + 9}>
            <TopList emptyLabel="No earnings yet" rows={earners} format={money} />
          </Panel>
        </div>

        {issues.length > 0 && (
          <Panel title="Needs attention" index={index + 10}>
            <RevenueIssues issues={issues} />
          </Panel>
        )}
      </IntegrationSection>

      {disconnecting && (
        <DisconnectGoogleModal
          email={integration.email}
          onClose={() => setDisconnecting(false)}
          onDisconnected={(next) => {
            setDisconnecting(false)
            setIntegration(next)
            onSynced()
          }}
        />
      )}
    </>
  )
}
