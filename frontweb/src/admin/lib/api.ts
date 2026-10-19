import type { AdminUser, GoogleIntegration, Project, ProjectDetail, ProjectInput, Range } from './types'

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const TOKEN_KEY = 'mint_admin_token'

export const UNAUTHORIZED_EVENT = 'mint:unauthorized'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

async function request<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const token = tokenStore.get()
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server', 0)
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(data.message || data.error || `Request failed (${res.status})`, res.status)
  }
  return data as T
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: () => request<{ user: AdminUser }>('/api/auth/me'),

  listProjects: () => request<{ projects: Project[] }>('/api/projects'),

  getProject: (id: string, range: Range) =>
    request<ProjectDetail>(`/api/projects/${id}?range=${range}`),

  createProject: (input: ProjectInput) =>
    request<{ project: Project }>('/api/projects', { method: 'POST', body: input }),

  updateProject: (id: string, input: Partial<ProjectInput>) =>
    request<{ project: Project }>(`/api/projects/${id}`, { method: 'PUT', body: input }),

  deleteProject: (id: string) =>
    request<{ success: true }>(`/api/projects/${id}`, { method: 'DELETE' }),

  checkProject: (id: string) =>
    request<{ project: Project }>(`/api/projects/${id}/check`, { method: 'POST' }),

  syncPlay: (id: string) =>
    request<{ project: Project }>(`/api/projects/${id}/play-sync`, { method: 'POST' }),

  syncWeb: (id: string) =>
    request<{ project: Project }>(`/api/projects/${id}/web-sync`, { method: 'POST' }),

  reorderProjects: (ids: string[]) =>
    request<{ success: true }>('/api/projects/order', { method: 'PUT', body: { ids } }),

  getGoogleIntegration: () => request<GoogleIntegration>('/api/integrations/google'),

  connectGoogle: (returnTo: string) =>
    request<{ url: string }>(`/api/integrations/google/connect?returnTo=${encodeURIComponent(returnTo)}`),

  syncRevenue: () => request<GoogleIntegration>('/api/integrations/google/sync', { method: 'POST' }),

  disconnectGoogle: () => request<GoogleIntegration>('/api/integrations/google', { method: 'DELETE' }),
}
