export type ProjectType = 'website' | 'app'

export type LastCheck = {
  up: boolean
  statusCode?: number
  responseTimeMs?: number
  error?: string
  checkedAt: string
}

export type SslInfo = {
  validTo?: string
  issuer?: string
  error?: string
  checkedAt?: string
}

export type DomainInfo = {
  name?: string
  expiresAt?: string
  registrar?: string
  error?: string
  checkedAt?: string
}

export type SparkPoint = { t: number | null; up: boolean }

export type UptimeStats = {
  uptimePct: number | null
  avgResponseMs: number | null
}

export type PlayPoint = {
  date: string
  installs?: number
  uninstalls?: number
  activeDevices?: number
  rating?: number
  crashRate?: number
  anrRate?: number
}

export type PlayReview = {
  id: string
  author?: string
  rating?: number
  text?: string
  version?: string
  at?: string
}

export type PlayData = {
  rating?: number
  activeDevices?: number
  totalInstalls?: number
  installs30d?: number
  uninstalls30d?: number
  crashRate?: number
  anrRate?: number
  series?: PlayPoint[]
  reviews?: PlayReview[]
  errors?: { stats?: string; vitals?: string; reviews?: string }
  syncedAt?: string
}

export type WebPoint = {
  date: string
  clicks?: number
  impressions?: number
  users?: number
  sessions?: number
  views?: number
}

export type TopRow = { key: string; value: number }

export type SearchQuery = {
  key: string
  clicks: number
  impressions: number
  position: number
  previousPosition?: number
}

export type WebData = {
  searchSite?: string
  analyticsProperty?: string
  clicks30d?: number
  impressions30d?: number
  ctr?: number
  position?: number
  users30d?: number
  sessions30d?: number
  views30d?: number
  engagementRate?: number
  series?: WebPoint[]
  queries?: SearchQuery[]
  pages?: TopRow[]
  sources?: TopRow[]
  errors?: { search?: string; analytics?: string }
  syncedAt?: string
}

export type RevenuePoint = { date: string; admob?: number; adsense?: number }

export type ProjectRevenue = {
  currency?: string
  earnings30d?: number
  prev30d?: number
  admob30d?: number
  adsense30d?: number
  impressions30d?: number
  ecpm?: number
  admobApps?: string[]
  adsenseDomain?: string
  series?: RevenuePoint[]
  syncedAt?: string
}

export type AdmobApp = {
  appId: string
  name: string
  platform?: string
  packageName?: string
  linked?: boolean
  approval?: string
  projectId?: string
}

export type AdsenseSite = { domain: string; state?: string; projectId?: string }

export type AccountRevenue = {
  currency?: string
  today?: number
  yesterday?: number
  thisMonth?: number
  lastMonth?: number
  earnings30d?: number
  prev30d?: number
  admob30d?: number
  adsense30d?: number
  series?: RevenuePoint[]
  unassigned?: { source: 'admob' | 'adsense'; label: string; earnings30d: number }[]
  admob?: {
    publisherId?: string
    impressions30d?: number
    requests30d?: number
    matchRate?: number
    ecpm?: number
    apps?: AdmobApp[]
  }
  adsense?: {
    accountId?: string
    pageViews30d?: number
    clicks30d?: number
    rpm?: number
    balance?: string
    sites?: AdsenseSite[]
    alerts?: { severity?: string; message?: string }[]
  }
  errors?: { admob?: string; adsense?: string }
  syncedAt?: string
}

export type GoogleIntegration = {
  configured: boolean
  connected: boolean
  email?: string
  connectedAt?: string
  error?: string
  revenue?: AccountRevenue
}

export type Project = {
  _id: string
  name: string
  type: ProjectType
  url?: string
  storeUrl?: string
  client?: string
  stack: string[]
  hosting?: string
  repoUrl?: string
  notes?: string
  showOnSite: boolean
  order: number
  monitoringEnabled: boolean
  lastCheck?: LastCheck
  ssl?: SslInfo
  domain?: DomainInfo
  packageName?: string
  play?: PlayData
  web?: WebData
  revenue?: ProjectRevenue
  adSpend30d?: number
  createdAt: string
  updatedAt: string
  stats24h?: UptimeStats & { sparkline: SparkPoint[] }
}

export type ProjectInput = {
  name: string
  type: ProjectType
  url: string
  storeUrl: string
  client: string
  stack: string[]
  hosting: string
  repoUrl: string
  notes: string
  showOnSite: boolean
  monitoringEnabled: boolean
  packageName: string
}

export type Check = {
  up: boolean
  statusCode?: number
  responseTimeMs?: number
  error?: string
  checkedAt: string
}

export type Range = '24h' | '7d' | '30d'

export type ProjectDetail = {
  project: Project
  range: Range
  checks: Check[]
  stats: Record<Range, UptimeStats>
}

export type TodoArea = 'seo' | 'aso' | 'ads' | 'content' | 'launch' | 'general'

export type StudioTodo = {
  _id: string
  projectId: string
  title: string
  area: TodoArea
  doneAt?: string | null
  createdAt: string
}

export type InboxAlert = {
  _id: string
  projectId?: string
  kind: 'down' | 'up' | 'ssl' | 'domain' | 'revenue' | 'publish'
  title: string
  readAt?: string
  createdAt: string
}

export type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  profileImage?: string
}

export type AdChannel = 'meta' | 'google' | 'tiktok' | 'asa' | 'influencer' | 'email'
export type CampaignObjective = 'Installs' | 'Signups' | 'Traffic' | 'Sales' | 'Awareness'
export type CampaignStatus = 'Live' | 'Scheduled' | 'Paused' | 'Ended'
export type Social = 'instagram' | 'tiktok' | 'linkedin' | 'x' | 'youtube' | 'blog'
export type PostStatus = 'Draft' | 'Scheduled' | 'Published'
export type LaunchStage = 'Idea' | 'Building' | 'Pre-launch' | 'Launched'
export type AppStore = 'App Store' | 'Google Play'

export type Campaign = {
  _id: string
  name: string
  projectId: string
  channel: AdChannel
  objective: CampaignObjective
  status: CampaignStatus
  budget: number
  spent: number
  conversions: number
  revenue: number
  start: string
  end: string
  googleCampaignId?: string
}

export type CampaignInput = {
  name: string
  projectId: string
  channel: AdChannel
  objective: CampaignObjective
  status?: CampaignStatus
  budget: number
  spent?: number
  conversions?: number
  revenue?: number
  start: string
  end: string
  googleCampaignId?: string
}

export type GoogleAdsCampaign = {
  id: string
  name: string
  status: string
}

export type ContentPost = {
  _id: string
  title: string
  projectId: string
  social: Social
  status: PostStatus
  date: string
  time: string
  body?: string
  link?: string
  mediaUrl?: string
  platformId?: string
  externalId?: string
  publishError?: string
}

export type ContentInput = {
  title: string
  projectId: string
  social: Social
  status?: PostStatus
  date: string
  time: string
  body?: string
  link?: string
  mediaUrl?: string
  platformId?: string
}

export type PubloraConnection = {
  platformId: string
  platform: string
  name: string
}

export type LaunchTask = {
  _id?: string
  title: string
  done: boolean
}

export type Launch = {
  _id: string
  title: string
  projectId: string
  stage: LaunchStage
  date: string
  tasks: LaunchTask[]
  tasksDone: number
  tasksTotal: number
  channels: AdChannel[]
}

export type LaunchInput = {
  title: string
  projectId: string
  stage?: LaunchStage
  date: string
  tasks?: LaunchTask[]
  channels?: AdChannel[]
}

export type AsoKeyword = {
  _id: string
  keyword: string
  projectId: string
  store: AppStore
  rank: number
  previousRank?: number
  volume?: number
  change: number
}

export type KeywordInput = {
  keyword: string
  projectId: string
  store: AppStore
  rank: number
  volume?: number
}
