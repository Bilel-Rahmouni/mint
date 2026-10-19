import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../lib/api'
import { daysBetween, daysFromToday } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { adChannels, campaignObjectives } from '../lib/growth'
import type { AdChannel, Campaign, CampaignInput, CampaignObjective, Project } from '../lib/types'
import { Button } from './ui/Button'
import { Field, SelectField } from './ui/Field'
import { Modal } from './ui/Modal'
import './CampaignModal.css'

type Props = {
  campaign?: Campaign
  projects: Project[]
  onClose: () => void
  onSaved: (campaign: Campaign) => void
  onDeleted?: (id: string) => void
}

function toForm(campaign?: Campaign, projectId = ''): CampaignInput {
  return {
    name: campaign?.name ?? '',
    projectId: campaign?.projectId ?? projectId,
    channel: campaign?.channel ?? 'meta',
    objective: campaign?.objective ?? 'Installs',
    budget: campaign?.budget ?? 1000,
    spent: campaign?.spent ?? 0,
    conversions: campaign?.conversions ?? 0,
    revenue: campaign?.revenue ?? 0,
    start: campaign?.start ?? daysFromToday(0),
    end: campaign?.end ?? daysFromToday(30),
  }
}

export function CampaignModal({ campaign, projects, onClose, onSaved, onDeleted }: Props) {
  const [form, setForm] = useState<CampaignInput>(() => toForm(campaign, projects[0]?._id ?? ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const days = Math.max(daysBetween(form.start, form.end), 1)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { campaign: saved } = campaign
        ? await api.updateCampaign(campaign._id, form)
        : await api.createCampaign(form)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save campaign')
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!campaign) return
    setSaving(true)
    try {
      await api.deleteCampaign(campaign._id)
      onDeleted?.(campaign._id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete campaign')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={campaign ? campaign.name : 'New campaign'}
      onClose={onClose}
      footer={
        <>
          {campaign && (
            <Button type="button" variant="danger" onClick={remove} disabled={saving}>
              Delete
            </Button>
          )}
          <span className="campaign-modal__summary">
            {formatMoney(form.budget / days)}/day · {days}d
          </span>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="campaign-form" variant="primary" loading={saving}>
            {campaign ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form id="campaign-form" className="campaign-modal" onSubmit={submit}>
        <Field
          label="Name"
          className="campaign-modal__full"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
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
          label="Channel"
          value={form.channel}
          onChange={(e) => set('channel', e.target.value as AdChannel)}
        >
          {(Object.keys(adChannels) as AdChannel[]).map((key) => (
            <option key={key} value={key}>
              {adChannels[key].label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Objective"
          value={form.objective}
          onChange={(e) => set('objective', e.target.value as CampaignObjective)}
        >
          {campaignObjectives.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </SelectField>
        <Field
          label="Budget"
          type="number"
          min={0}
          step={50}
          value={form.budget}
          onChange={(e) => set('budget', Number(e.target.value))}
          required
        />
        <Field
          label="Spent"
          type="number"
          min={0}
          step={10}
          value={form.spent ?? 0}
          onChange={(e) => set('spent', Number(e.target.value))}
        />
        <Field
          label="Conversions"
          type="number"
          min={0}
          step={1}
          value={form.conversions ?? 0}
          onChange={(e) => set('conversions', Number(e.target.value))}
        />
        <Field
          label="Revenue"
          type="number"
          min={0}
          step={10}
          value={form.revenue ?? 0}
          onChange={(e) => set('revenue', Number(e.target.value))}
        />
        <Field
          label="Start"
          type="date"
          value={form.start}
          onChange={(e) => set('start', e.target.value)}
          required
        />
        <Field
          label="End"
          type="date"
          min={form.start}
          value={form.end}
          onChange={(e) => set('end', e.target.value)}
          required
        />
        {error && <p className="campaign-modal__error">{error}</p>}
      </form>
    </Modal>
  )
}
