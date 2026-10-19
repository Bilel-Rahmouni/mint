import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { CalendarPost } from '../components/CalendarPost'
import { ContentModal } from '../components/ContentModal'
import { Loader } from '../components/Loader'
import { PageHeader } from '../components/PageHeader'
import { WeekSwitcher } from '../components/WeekSwitcher'
import { Button } from '../components/ui/Button'
import { Segmented } from '../components/ui/Segmented'
import { useProjects } from '../hooks/useProjects'
import { api } from '../lib/api'
import { addDays, formatWeekday, startOfWeek, toISODay, today } from '../lib/dates'
import { socials } from '../lib/growth'
import type { ContentInput, ContentPost, Social } from '../lib/types'
import './ContentPage.css'

type SocialFilter = 'all' | Social

export function ContentPage() {
  const { projects, loading: projectsLoading } = useProjects()
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [social, setSocial] = useState<SocialFilter>('all')
  const [editing, setEditing] = useState<ContentPost | null>(null)
  const [preset, setPreset] = useState<Partial<ContentInput> | null>(null)

  useEffect(() => {
    api
      .listContent()
      .then(({ posts }) => setPosts(posts))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load content'))
      .finally(() => setLoading(false))
  }, [])

  const todayIso = toISODay(today())
  const weekStart = useMemo(() => addDays(startOfWeek(today()), weekOffset * 7), [weekOffset])

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i)
        const iso = toISODay(date)
        return {
          date,
          iso,
          posts: posts
            .filter((p) => p.date === iso && (social === 'all' || p.social === social))
            .sort((a, b) => a.time.localeCompare(b.time)),
        }
      }),
    [weekStart, social, posts],
  )

  const projectOf = (id: string) => projects.find((p) => p._id === id)

  if (loading || projectsLoading) return <Loader />

  return (
    <div className="content-page">
      <PageHeader
        title="Content"
        aside={
          <>
            <WeekSwitcher
              weekStart={weekStart}
              isCurrent={weekOffset === 0}
              onPrev={() => setWeekOffset((w) => w - 1)}
              onNext={() => setWeekOffset((w) => w + 1)}
              onToday={() => setWeekOffset(0)}
            />
            <Button variant="primary" size="sm" icon="plus" onClick={() => setPreset({})}>
              New
            </Button>
          </>
        }
      >
        <Segmented
          ariaLabel="Channel"
          value={social}
          options={[
            { value: 'all', label: 'All' },
            ...(Object.keys(socials) as Social[]).map((key) => ({ value: key as SocialFilter, label: socials[key].label })),
          ]}
          onChange={setSocial}
        />
      </PageHeader>

      {error && <p className="content-page__error">{error}</p>}

      <div className="content-page__scroller">
        <div className="content-page__week">
          {days.map((day, i) => (
            <section
              key={day.iso}
              className={`content-page__day ${day.iso === todayIso ? 'is-today' : ''} ${day.iso < todayIso ? 'is-past' : ''}`}
              style={{ '--i': i } as CSSProperties}
            >
              <header className="content-page__day-head">
                <span>{formatWeekday(day.date)}</span>
                <b>{day.date.getDate()}</b>
                <button
                  type="button"
                  className="content-page__add"
                  aria-label={`Add post on ${day.iso}`}
                  onClick={() => setPreset({ date: day.iso })}
                >
                  +
                </button>
              </header>
              <div className="content-page__posts">
                {day.posts.map((post, j) => (
                  <CalendarPost
                    key={post._id}
                    post={post}
                    project={projectOf(post.projectId)}
                    index={i + j}
                    onClick={() => setEditing(post)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {(editing || preset) && (
        <ContentModal
          post={editing ?? undefined}
          preset={preset ?? undefined}
          projects={projects}
          onClose={() => {
            setEditing(null)
            setPreset(null)
          }}
          onSaved={(saved) => {
            setPosts((list) => {
              const exists = list.some((p) => p._id === saved._id)
              return exists ? list.map((p) => (p._id === saved._id ? saved : p)) : [...list, saved]
            })
            setEditing(null)
            setPreset(null)
          }}
          onDeleted={(id) => {
            setPosts((list) => list.filter((p) => p._id !== id))
            setEditing(null)
            setPreset(null)
          }}
        />
      )}
    </div>
  )
}
