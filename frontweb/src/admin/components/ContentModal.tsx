import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../lib/api'
import { daysFromToday } from '../lib/dates'
import { postStatuses, socials } from '../lib/growth'
import type { ContentInput, ContentPost, PostStatus, Project, PubloraConnection, Social } from '../lib/types'
import { Button } from './ui/Button'
import { Field, SelectField, TextAreaField } from './ui/Field'
import { Modal } from './ui/Modal'
import './ContentModal.css'

type Props = {
  post?: ContentPost
  preset?: Partial<ContentInput>
  projects: Project[]
  onClose: () => void
  onSaved: (post: ContentPost) => void
  onDeleted?: (id: string) => void
}

function toForm(post?: ContentPost, preset?: Partial<ContentInput>, projectId = ''): ContentInput {
  return {
    title: post?.title ?? preset?.title ?? '',
    projectId: post?.projectId ?? preset?.projectId ?? projectId,
    social: post?.social ?? preset?.social ?? 'instagram',
    status: post?.status ?? preset?.status ?? 'Scheduled',
    date: post?.date ?? preset?.date ?? daysFromToday(0),
    time: post?.time ?? preset?.time ?? '10:00',
    body: post?.body ?? '',
    link: post?.link ?? '',
    mediaUrl: post?.mediaUrl ?? '',
    platformId: post?.platformId ?? '',
  }
}

export function ContentModal({ post, preset, projects, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState<ContentInput>(() => toForm(post, preset, projects[0]?._id ?? ''))
  const [connections, setConnections] = useState<PubloraConnection[]>([])
  const [publoraNote, setPubloraNote] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ContentInput>(key: K, value: ContentInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    let active = true
    api.listPubloraConnections()
      .then((result) => {
        if (!active) return
        setConnections(result.connections)
        setPubloraNote(result.configured ? null : result.message || 'Publora is not configured')
      })
      .catch((err) => {
        if (active) setPubloraNote(err instanceof Error ? err.message : 'Publora is not configured')
      })
    return () => {
      active = false
    }
  }, [])

  const NEEDS_MEDIA = form.social === 'instagram' || form.social === 'tiktok' || form.social === 'youtube'
  const prefix = form.social === 'x' ? 'twitter' : form.social
  const accounts = connections.filter(
    (row) => row.platform === prefix || row.platformId.startsWith(`${prefix}-`) || row.platformId.startsWith(prefix),
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { post: saved } = post ? await api.updateContent(post._id, form) : await api.createContent(form)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save post')
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!post) return
    setSaving(true)
    try {
      await api.deleteContent(post._id)
      onDeleted?.(post._id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete post')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={post ? 'Edit post' : 'New post'}
      onClose={onClose}
      footer={
        <>
          {post && (
            <Button type="button" variant="danger" onClick={remove} disabled={saving}>
              Delete
            </Button>
          )}
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="content-form" variant="primary" loading={saving}>
            {post ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="content-form" className="content-modal" onSubmit={submit}>
        <Field
          label="Title"
          className="content-modal__full"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />
        <SelectField label="Project" value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Channel" value={form.social} onChange={(e) => set('social', e.target.value as Social)}>
          {(Object.keys(socials) as Social[]).map((key) => (
            <option key={key} value={key}>
              {socials[key].label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          value={form.status ?? 'Scheduled'}
          onChange={(e) => set('status', e.target.value as PostStatus)}
        >
          {postStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
        <Field label="Date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
        <Field label="Time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} required />
        <TextAreaField
          className="content-modal__full"
          label="Body"
          rows={5}
          value={form.body ?? ''}
          onChange={(e) => set('body', e.target.value)}
        />
        <Field
          className="content-modal__full"
          label="Link"
          type="url"
          value={form.link ?? ''}
          onChange={(e) => set('link', e.target.value)}
        />
        <Field
          className="content-modal__full"
          label="Media URL"
          type="url"
          hint={NEEDS_MEDIA ? 'Needed to publish' : undefined}
          value={form.mediaUrl ?? ''}
          onChange={(e) => set('mediaUrl', e.target.value)}
        />
        {form.social !== 'blog' && (
          <SelectField
            className="content-modal__full"
            label="Publora account"
            hint={publoraNote || post?.publishError || undefined}
            value={form.platformId ?? ''}
            onChange={(e) => set('platformId', e.target.value)}
          >
            <option value="">Automatic</option>
            {accounts.map((row) => (
              <option key={row.platformId} value={row.platformId}>
                {row.name || row.platformId}
              </option>
            ))}
            {form.platformId && !accounts.some((row) => row.platformId === form.platformId) && (
              <option value={form.platformId}>{form.platformId}</option>
            )}
          </SelectField>
        )}
        {error && <p className="content-modal__error">{error}</p>}
      </form>
    </Modal>
  )
}
