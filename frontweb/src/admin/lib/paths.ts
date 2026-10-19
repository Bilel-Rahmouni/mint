export const adminPath = {
  overview: '/admin',
  portfolio: '/admin/portfolio',
  campaigns: '/admin/campaigns',
  content: '/admin/content',
  rankings: '/admin/rankings',
  launches: '/admin/launches',
  login: '/admin/login',
  project: (id: string) => `/admin/projects/${id}`,
}
