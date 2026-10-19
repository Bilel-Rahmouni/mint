import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../lib/api'
import { appStores } from '../lib/growth'
import type { AppStore, AsoKeyword, KeywordInput, Project } from '../lib/types'
import { Button } from './ui/Button'
import { Field, SelectField } from './ui/Field'
import { Modal } from './ui/Modal'
import './KeywordModal.css'

type Props = {
  keyword?: AsoKeyword
  projects: Project[]
  onClose: () => void
  onSaved: (keyword: AsoKeyword) => void
  onDeleted?: (id: string) => void
}

function toForm(keyword?: AsoKeyword, projectId = ''): KeywordInput {
  return {
    keyword: keyword?.keyword ?? '',
    projectId: keyword?.projectId ?? projectId,
    store: keyword?.store ?? 'Google Play',
    rank: keyword?.rank ?? 20,
    volume: keyword?.volume,
  }
}

export function KeywordModal({ keyword, projects, onClose, onSaved, onDeleted }: Props) {
  const apps = projects.filter((p) => p.packageName || p.type === 'app')
  const choices = apps.length ? apps : projects
  const [form, setForm] = useState<KeywordInput>(() => toForm(keyword, choices[0]?._id ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof KeywordInput>(key: K, value: KeywordInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { keyword: saved } = keyword
        ? await api.updateKeyword(keyword._id, form)
        : await api.createKeyword(form)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save keyword')
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!keyword) return
    setSaving(true)
    try {
      await api.deleteKeyword(keyword._id)
      onDeleted?.(keyword._id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete keyword')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={keyword ? 'Edit keyword' : 'Track keyword'}
      onClose={onClose}
      width="sm"
      footer={
        <>
          {keyword && (
            <Button type="button" variant="danger" onClick={remove} disabled={saving}>
              Delete
            </Button>
          )}
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="keyword-form" variant="primary" loading={saving}>
            {keyword ? 'Save' : 'Track'}
          </Button>
        </>
      }
    >
      <form id="keyword-form" className="keyword-modal" onSubmit={submit}>
        <Field
          label="Keyword"
          value={form.keyword}
          onChange={(e) => set('keyword', e.target.value)}
          required
        />
        <SelectField label="App" value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
          {choices.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Store" value={form.store} onChange={(e) => set('store', e.target.value as AppStore)}>
          {appStores.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
        <Field
          label="Rank"
          type="number"
          min={1}
          max={500}
          value={form.rank}
          onChange={(e) => set('rank', Number(e.target.value))}
          required
        />
        <Field
          label="Volume"
          type="number"
          min={0}
          value={form.volume ?? ''}
          onChange={(e) => set('volume', e.target.value ? Number(e.target.value) : undefined)}
        />
        {error && <p className="keyword-modal__error">{error}</p>}
      </form>
    </Modal>
  )
}
