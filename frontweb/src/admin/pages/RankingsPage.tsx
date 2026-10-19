import { useEffect, useMemo, useState } from 'react'
import { DataTable, type Column } from '../components/DataTable'
import { Delta } from '../components/Delta'
import { KeywordModal } from '../components/KeywordModal'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { Panel } from '../components/Panel'
import { RankPill } from '../components/RankPill'
import { StatCard } from '../components/StatCard'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { useProjects } from '../hooks/useProjects'
import { api } from '../lib/api'
import { formatCount, formatPosition } from '../lib/format'
import type { AsoKeyword } from '../lib/types'
import './RankingsPage.css'

type Source = 'aso' | 'seo'

type SeoRow = {
  key: string
  keyword: string
  projectId: string
  projectName: string
  clicks: number
  impressions: number
  position: number
}

function summarize(rows: { rank: number; change: number }[]) {
  const avg = rows.reduce((s, r) => s + r.rank, 0) / (rows.length || 1)
  return {
    avg: rows.length ? avg.toFixed(1) : '—',
    top10: rows.filter((r) => r.rank <= 10).length,
    improved: rows.filter((r) => r.change > 0).length,
  }
}

export function RankingsPage() {
  const { projects, loading: projectsLoading } = useProjects()
  const [keywords, setKeywords] = useState<AsoKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<Source>('seo')
  const [editing, setEditing] = useState<AsoKeyword | null | 'new'>(null)

  useEffect(() => {
    api
      .listKeywords()
      .then(({ keywords }) => setKeywords(keywords))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load keywords'))
      .finally(() => setLoading(false))
  }, [])

  const nameOf = (id: string) => projects.find((p) => p._id === id)?.name ?? '—'

  const seoRows = useMemo<SeoRow[]>(
    () =>
      projects
        .flatMap((p) =>
          (p.web?.queries ?? []).map((q) => ({
            key: `${p._id}-${q.key}`,
            keyword: q.key,
            projectId: p._id,
            projectName: p.name,
            clicks: q.clicks,
            impressions: q.impressions,
            position: q.position,
          })),
        )
        .sort((a, b) => a.position - b.position),
    [projects],
  )

  const asoRows = useMemo(() => [...keywords].sort((a, b) => a.rank - b.rank), [keywords])

  const summary = useMemo(
    () =>
      source === 'aso'
        ? summarize(asoRows.map((k) => ({ rank: k.rank, change: k.change })))
        : summarize(seoRows.map((k) => ({ rank: k.position, change: 0 }))),
    [source, asoRows, seoRows],
  )

  const asoColumns: Column<AsoKeyword>[] = [
    { key: 'keyword', header: 'Keyword', render: (k) => <span className="rankings__keyword">{k.keyword}</span> },
    { key: 'product', header: 'App', hideOnMobile: true, render: (k) => nameOf(k.projectId) },
    { key: 'store', header: 'Store', hideOnMobile: true, render: (k) => <span className="rankings__muted">{k.store}</span> },
    { key: 'volume', header: 'Volume', align: 'right', hideOnMobile: true, render: (k) => formatCount(k.volume) },
    { key: 'change', header: 'Move', align: 'right', render: (k) => <Delta value={k.change} /> },
    { key: 'rank', header: 'Rank', align: 'right', render: (k) => <RankPill rank={k.rank} /> },
  ]

  const seoColumns: Column<SeoRow>[] = [
    { key: 'keyword', header: 'Keyword', render: (k) => <span className="rankings__keyword">{k.keyword}</span> },
    { key: 'product', header: 'Site', hideOnMobile: true, render: (k) => k.projectName },
    { key: 'clicks', header: 'Clicks', align: 'right', hideOnMobile: true, render: (k) => formatCount(k.clicks) },
    { key: 'impressions', header: 'Impr.', align: 'right', hideOnMobile: true, render: (k) => formatCount(k.impressions) },
    { key: 'position', header: 'Position', align: 'right', render: (k) => <RankPill rank={Math.round(k.position)} /> },
  ]

  if (loading || projectsLoading) return <Loader />

  return (
    <div className="rankings">
      <PageHeader
        title="Rankings"
        aside={
          <>
            <Segmented
              ariaLabel="Source"
              value={source}
              options={[
                { value: 'seo', label: 'Google' },
                { value: 'aso', label: 'App stores' },
              ]}
              onChange={setSource}
            />
            {source === 'aso' && (
              <Button variant="primary" size="sm" icon="plus" onClick={() => setEditing('new')}>
                Track
              </Button>
            )}
          </>
        }
      />

      {error && <p className="rankings__error">{error}</p>}

      <div className="rankings__stats">
        <StatCard label="Avg. position" value={summary.avg} index={0} />
        <StatCard label="In top 10" value={String(summary.top10)} tone="mint" index={1} />
        {source === 'aso' ? (
          <StatCard label="Moved up" value={String(summary.improved)} index={2} />
        ) : (
          <StatCard
            label="Keywords"
            value={formatCount(seoRows.length)}
            detail={seoRows.length ? `avg ${formatPosition(Number(summary.avg))}` : undefined}
            index={2}
          />
        )}
      </div>

      <Panel title={source === 'aso' ? 'Tracked keywords' : 'Search Console'} index={1} className="rankings__table">
        {source === 'aso' ? (
          <DataTable
            columns={asoColumns}
            rows={asoRows}
            rowKey={(k) => k._id}
            empty="No tracked keywords"
            onRowClick={(k) => setEditing(k)}
          />
        ) : (
          <DataTable columns={seoColumns} rows={seoRows} rowKey={(k) => k.key} empty="No Search Console queries yet" />
        )}
      </Panel>

      {editing && (
        <KeywordModal
          keyword={editing === 'new' ? undefined : editing}
          projects={projects}
          onClose={() => setEditing(null)}
          onSaved={(saved) => {
            setKeywords((list) => {
              const exists = list.some((k) => k._id === saved._id)
              return exists ? list.map((k) => (k._id === saved._id ? saved : k)) : [saved, ...list]
            })
            setEditing(null)
          }}
          onDeleted={(id) => {
            setKeywords((list) => list.filter((k) => k._id !== id))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
