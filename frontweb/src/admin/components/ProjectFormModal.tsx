import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../lib/api'
import type { Project, ProjectInput, ProjectType } from '../lib/types'
import { Button } from './ui/Button'
import { Field, TextAreaField } from './ui/Field'
import { Modal } from './ui/Modal'
import { Segmented } from './ui/Segmented'
import { Toggle } from './ui/Toggle'
import './ProjectFormModal.css'

type Props = {
  project?: Project
  onClose: () => void
  onSaved: (project: Project) => void
}

const TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: 'website', label: 'Website' },
  { value: 'app', label: 'App' },
]

function toInput(project?: Project): ProjectInput {
  return {
    name: project?.name ?? '',
    type: project?.type ?? 'website',
    url: project?.url ?? '',
    storeUrl: project?.storeUrl ?? '',
    client: project?.client ?? '',
    stack: project?.stack ?? [],
    hosting: project?.hosting ?? '',
    repoUrl: project?.repoUrl ?? '',
    notes: project?.notes ?? '',
    showOnSite: project?.showOnSite ?? true,
    monitoringEnabled: project?.monitoringEnabled ?? true,
    packageName: project?.packageName ?? '',
  }
}

export function ProjectFormModal({ project, onClose, onSaved }: Props) {
  const [form, setForm] = useState<ProjectInput>(() => toInput(project))
  const [stackText, setStackText] = useState(() => (project?.stack ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload: ProjectInput = {
      ...form,
      stack: stackText.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      const { project: saved } = project
        ? await api.updateProject(project._id, payload)
        : await api.createProject(payload)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save project')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={project ? `Edit ${project.name}` : 'New project'}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" variant="primary" loading={saving}>
            {project ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="project-form" className="project-form" onSubmit={handleSubmit}>
        <div className="project-form__row project-form__row--lead">
          <Field
            label="Name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            maxLength={80}
            autoComplete="off"
          />
          <div className="project-form__type">
            <span className="project-form__label">Type</span>
            <Segmented ariaLabel="Project type" value={form.type} options={TYPE_OPTIONS} onChange={(v) => set('type', v)} />
          </div>
        </div>

        <div className="project-form__row">
          <Field
            label="URL"
            type="url"
            placeholder="https://"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
          />
          {form.type === 'app' && (
            <Field
              label="Store link"
              type="url"
              placeholder="https://play.google.com/…"
              value={form.storeUrl}
              onChange={(e) => set('storeUrl', e.target.value)}
            />
          )}
        </div>

        <div className="project-form__row">
          <Field
            label="Play package"
            placeholder="com.company.app"
            value={form.packageName}
            onChange={(e) => set('packageName', e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="project-form__row">
          <Field label="Client" value={form.client} onChange={(e) => set('client', e.target.value)} />
          <Field label="Hosting" value={form.hosting} onChange={(e) => set('hosting', e.target.value)} />
        </div>

        <div className="project-form__row">
          <Field
            label="Stack"
            placeholder="React, Node, MongoDB"
            value={stackText}
            onChange={(e) => setStackText(e.target.value)}
          />
          <Field
            label="Repository"
            type="url"
            placeholder="https://github.com/…"
            value={form.repoUrl}
            onChange={(e) => set('repoUrl', e.target.value)}
          />
        </div>

        <TextAreaField label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={4000} />

        <div className="project-form__toggles">
          <Toggle checked={form.showOnSite} onChange={(v) => set('showOnSite', v)} label="Show on mintstudio.io" />
          <Toggle
            checked={form.monitoringEnabled}
            onChange={(v) => set('monitoringEnabled', v)}
            label="Monitor uptime"
          />
        </div>

        {error && <p className="project-form__error">{error}</p>}
      </form>
    </Modal>
  )
}
