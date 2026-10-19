export const adminPath = {
  overview: '/admin',
  portfolio: '/admin/portfolio',
  login: '/admin/login',
  project: (id: string) => `/admin/projects/${id}`,
}
