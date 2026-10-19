import type { AdChannel, AppStore, CampaignObjective, CampaignStatus, LaunchStage, PostStatus, Social } from './types'

export const adChannels: Record<AdChannel, { label: string; color: string }> = {
  meta: { label: 'Meta Ads', color: 'var(--color-sky)' },
  google: { label: 'Google Ads', color: 'var(--color-mint)' },
  tiktok: { label: 'TikTok Ads', color: 'var(--color-danger)' },
  asa: { label: 'Apple Search Ads', color: 'var(--color-mint-strong)' },
  influencer: { label: 'Influencers', color: 'var(--color-warn)' },
  email: { label: 'Email', color: 'var(--color-muted-soft)' },
}

export const socials: Record<Social, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: 'var(--color-danger)' },
  tiktok: { label: 'TikTok', color: 'var(--color-mint-strong)' },
  linkedin: { label: 'LinkedIn', color: 'var(--color-sky)' },
  x: { label: 'X', color: 'var(--color-muted-soft)' },
  youtube: { label: 'YouTube', color: 'var(--color-warn)' },
  blog: { label: 'Blog', color: 'var(--color-mint)' },
}

export const campaignObjectives: CampaignObjective[] = ['Installs', 'Signups', 'Traffic', 'Sales', 'Awareness']
export const campaignStatuses: CampaignStatus[] = ['Live', 'Scheduled', 'Paused', 'Ended']
export const postStatuses: PostStatus[] = ['Draft', 'Scheduled', 'Published']
export const launchStages: LaunchStage[] = ['Idea', 'Building', 'Pre-launch', 'Launched']
export const appStores: AppStore[] = ['Google Play', 'App Store']

export const campaignTone: Record<CampaignStatus, 'mint' | 'warn' | 'neutral' | 'danger'> = {
  Live: 'mint',
  Scheduled: 'warn',
  Paused: 'neutral',
  Ended: 'danger',
}

export const postTone: Record<PostStatus, 'mint' | 'warn' | 'neutral'> = {
  Published: 'mint',
  Scheduled: 'warn',
  Draft: 'neutral',
}

export const launchColor: Record<LaunchStage, string> = {
  Idea: 'var(--color-muted-soft)',
  Building: 'var(--color-sky)',
  'Pre-launch': 'var(--color-warn)',
  Launched: 'var(--color-mint)',
}

export function formatRoas(revenue: number, spent: number) {
  if (!spent) return '—'
  return `${(revenue / spent).toFixed(2)}x`
}
