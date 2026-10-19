import { useEffect, useMemo, useState } from 'react'
import { CampaignModal } from '../components/CampaignModal'
import { ChannelTag } from '../components/ChannelTag'
import { DataTable, type Column } from '../components/DataTable'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { ProgressBar } from '../components/ProgressBar'
import { StatCard } from '../components/StatCard'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { Tag } from '../components/ui/Tag'
import { useProjects } from '../hooks/useProjects'
import { api } from '../lib/api'
import { formatCount, formatMoney } from '../lib/format'
import { adChannels, campaignStatuses, campaignTone, formatRoas } from '../lib/growth'
import type { Campaign, CampaignStatus } from '../lib/types'
import './CampaignsPage.css'

type StatusFilter = 'All' | CampaignStatus

export function CampaignsPage() {
  const { projects, loading: projectsLoading } = useProjects()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>('All')
  const [editing, setEditing] = useState<Campaign | null | 'new'>(null)

  useEffect(() => {
    api
      .listCampaigns()
      .then(({ campaigns }) => setCampaigns(campaigns))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load campaigns'))
      .finally(() => setLoading(false))
  }, [])

  const nameOf = (id: string) => projects.find((p) => p._id === id)?.name ?? '—'

  const rows = useMemo(
    () => (status === 'All' ? campaigns : campaigns.filter((c) => c.status === status)),
    [campaigns, status],
  )

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, c) => ({
          budget: acc.budget + c.budget,
          spent: acc.spent + c.spent,
          conversions: acc.conversions + c.conversions,
          revenue: acc.revenue + c.revenue,
        }),
        { budget: 0, spent: 0, conversions: 0, revenue: 0 },
      ),
    [rows],
  )

  const toggle = async (campaign: Campaign) => {
    try {
      const { campaign: saved } = await api.toggleCampaign(campaign._id)
      setCampaigns((list) => list.map((c) => (c._id === saved._id ? saved : c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update campaign')
    }
  }

  const columns: Column<Campaign>[] = [
    {
      key: 'campaign',
      header: 'Campaign',
      render: (c) => (
        <span className="campaigns__name">
          <b>{c.name}</b>
          <small>{nameOf(c.projectId)}</small>
        </span>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      hideOnMobile: true,
      render: (c) => <ChannelTag label={adChannels[c.channel].label} color={adChannels[c.channel].color} />,
    },
    {
      key: 'objective',
      header: 'Objective',
      hideOnMobile: true,
      render: (c) => <span className="campaigns__muted">{c.objective}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <Tag tone={campaignTone[c.status]}>{c.status}</Tag>,
    },
    {
      key: 'budget',
      header: 'Spent / Budget',
      hideOnMobile: true,
      render: (c) => (
        <div className="campaigns__budget">
          <span>
            {formatMoney(c.spent)} <small>/ {formatMoney(c.budget)}</small>
          </span>
          <ProgressBar value={c.budget ? c.spent / c.budget : 0} color={adChannels[c.channel].color} />
        </div>
      ),
    },
    {
      key: 'roas',
      header: 'ROAS',
      align: 'right',
      render: (c) => <b className="campaigns__roas">{formatRoas(c.revenue, c.spent)}</b>,
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (c) =>
        c.status === 'Live' || c.status === 'Paused' ? (
          <Button
            type="button"
            size="sm"
            icon={c.status === 'Live' ? 'pause' : 'play'}
            aria-label={c.status === 'Live' ? 'Pause' : 'Resume'}
            onClick={(e) => {
              e.stopPropagation()
              toggle(c)
            }}
          />
        ) : null,
    },
  ]

  if (loading || projectsLoading) return <Loader />

  return (
    <div className="campaigns">
      <PageHeader
        title="Campaigns"
        aside={
          <>
            <Segmented
              ariaLabel="Status"
              value={status}
              options={[
                { value: 'All', label: 'All' },
                ...campaignStatuses.map((s) => ({ value: s as StatusFilter, label: s })),
              ]}
              onChange={setStatus}
            />
            <Button variant="primary" size="sm" icon="plus" onClick={() => setEditing('new')}>
              New
            </Button>
          </>
        }
      />

      {error && <p className="campaigns__error">{error}</p>}

      <div className="campaigns__stats">
        <StatCard label="Budget" value={formatMoney(totals.budget)} index={0} />
        <StatCard label="Spent" value={formatMoney(totals.spent)} tone="warn" index={1} />
        <StatCard label="Conversions" value={formatCount(totals.conversions)} index={2} />
        <StatCard label="ROAS" value={formatRoas(totals.revenue, totals.spent)} tone="mint" index={3} />
      </div>

      <Panel title="Flights" index={1} className="campaigns__table">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(c) => c._id}
          empty="No campaigns"
          onRowClick={(c) => setEditing(c)}
        />
      </Panel>

      {editing && (
        <CampaignModal
          campaign={editing === 'new' ? undefined : editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setCampaigns((list) => {
              const exists = list.some((c) => c._id === saved._id)
              return exists ? list.map((c) => (c._id === saved._id ? saved : c)) : [saved, ...list]
            })
            setEditing(null)
          }}
          onDeleted={(id) => {
            setCampaigns((list) => list.filter((c) => c._id !== id))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
