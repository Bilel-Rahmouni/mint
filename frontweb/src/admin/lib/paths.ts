export const adminPath = {
  overview: '/admin',
  portfolio: '/admin/portfolio',
  campaigns: '/admin/campaigns',
  content: '/admin/content',
  rankings: '/admin/rankings',
  launches: '/admin/launches',
  career: '/admin/career',
  login: '/admin/login',
  project: (id: string) => `/admin/projects/${id}`,
}
