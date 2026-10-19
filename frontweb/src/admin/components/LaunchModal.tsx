import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../lib/api'
import { daysFromToday } from '../lib/dates'
import { adChannels, launchStages } from '../lib/growth'
import type { AdChannel, Launch, LaunchInput, LaunchStage, Project } from '../lib/types'
import { Button } from './ui/Button'
import { Field, SelectField } from './ui/Field'
import { Modal } from './ui/Modal'
import './LaunchModal.css'

type Props = {
  launch?: Launch
  projects: Project[]
  onClose: () => void
  onSaved: (launch: Launch) => void
  onDeleted?: (id: string) => void
}

function toForm(launch?: Launch, projectId = ''): LaunchInput {
  return {
    title: launch?.title ?? '',
    projectId: launch?.projectId ?? projectId,
    stage: launch?.stage ?? 'Idea',
    date: launch?.date ?? daysFromToday(14),
    tasksDone: launch?.tasksDone ?? 0,
    tasksTotal: launch?.tasksTotal ?? 0,
    channels: launch?.channels ?? [],
  }
}

export function LaunchModal({ launch, projects, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState<LaunchInput>(() => toForm(launch, projects[0]?._id ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof LaunchInput>(key: K, value: LaunchInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleChannel = (channel: AdChannel) => {
    const current = form.channels ?? []
    set('channels', current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel])
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { launch: saved } = launch ? await api.updateLaunch(launch._id, form) : await api.createLaunch(form)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save launch')
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!launch) return
    setSaving(true)
    try {
      await api.deleteLaunch(launch._id)
      onDeleted?.(launch._id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete launch')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={launch ? launch.title : 'New launch'}
      onClose={onClose}
      footer={
        <>
          {launch && (
            <Button type="button" variant="danger" onClick={remove} disabled={saving}>
              Delete
            </Button>
          )}
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="launch-form" variant="primary" loading={saving}>
            {launch ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="launch-form" className="launch-modal" onSubmit={submit}>
        <Field
          label="Title"
          className="launch-modal__full"
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
        <SelectField
          label="Stage"
          value={form.stage ?? 'Idea'}
          onChange={(e) => set('stage', e.target.value as LaunchStage)}
        >
          {launchStages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
        <Field label="Date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
        <Field
          label="Tasks done"
          type="number"
          min={0}
          value={form.tasksDone ?? 0}
          onChange={(e) => set('tasksDone', Number(e.target.value))}
        />
        <Field
          label="Tasks total"
          type="number"
          min={0}
          value={form.tasksTotal ?? 0}
          onChange={(e) => set('tasksTotal', Number(e.target.value))}
        />
        <fieldset className="launch-modal__channels">
          <legend>Channels</legend>
          {(Object.keys(adChannels) as AdChannel[]).map((key) => (
            <label key={key} className="launch-modal__chip">
              <input
                type="checkbox"
                checked={(form.channels ?? []).includes(key)}
                onChange={() => toggleChannel(key)}
              />
              {adChannels[key].label}
            </label>
          ))}
        </fieldset>
        {error && <p className="launch-modal__error">{error}</p>}
      </form>
    </Modal>
  )
}
