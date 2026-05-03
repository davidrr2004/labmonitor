const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws"

// ─── Auth helpers ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  username: string
  role: string
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function setToken(token: string) {
  localStorage.setItem("token", token)
}

export function clearAuth() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem("user", JSON.stringify(user))
}

// ─── Fetch wrapper ──────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed with status ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ─── Auth API ───────────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  return apiFetch("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

export async function signup(
  username: string,
  password: string,
  role: string = "admin",
): Promise<{ message: string; user: AuthUser }> {
  return apiFetch("/signup", {
    method: "POST",
    body: JSON.stringify({ username, password, role }),
  })
}

// ─── Computer API ───────────────────────────────────────────────────────────

export interface Computer {
  id: string
  system_id: string
  college: string
  lab_name: string
  last_seen: string
  is_online: boolean
  created_at: string
}

export async function getComputers(): Promise<{ data: Computer[] }> {
  return apiFetch("/computers")
}

// ─── Resource API ───────────────────────────────────────────────────────────

export interface ResourceLog {
  id: string
  computer_id: string
  timestamp: string
  cpu: number
  memory: number
  network_in: number
  network_out: number
}

export interface Pagination {
  current_page: number
  total_pages: number
  total_items: number
  per_page: number
}

export interface ResourceSummary {
  total_systems: number
  online_count: number
  averages: {
    cpu: number
    memory: number
    network: number
  }
  latest: Array<{
    computer_id: string
    cpu: number
    memory: number
    network_in: number
    network_out: number
    timestamp: string
  }> | null
}

export async function getResourceSummary(): Promise<ResourceSummary> {
  return apiFetch("/resources/summary")
}

export async function getResourceHistory(
  computerId?: string,
  page: number = 1,
  limit: number = 50,
): Promise<{ data: ResourceLog[]; pagination: Pagination }> {
  const params = new URLSearchParams()
  if (computerId) params.set("computer_id", computerId)
  params.set("page", String(page))
  params.set("limit", String(limit))
  return apiFetch(`/resources/history?${params.toString()}`)
}

// ─── Alert API ──────────────────────────────────────────────────────────────

export interface Alert {
  id: string
  computer_id: string
  type: string
  message: string
  timestamp: string
  resolved: boolean
}

export interface AlertStats {
  total_stats: {
    total_alerts: number
    active_alerts: number
    resolved_alerts: number
    high_cpu_alerts: number
    high_memory_alerts: number
  }
  last_24h: {
    total_alerts: number
  }
}

export async function getActiveAlerts(): Promise<{ data: Alert[] }> {
  return apiFetch("/alerts/active")
}

export async function getAlerts(params?: {
  computer_id?: string
  type?: string
  resolved?: string
  page?: number
  limit?: number
}): Promise<{ data: Alert[]; pagination: Pagination }> {
  const qs = new URLSearchParams()
  if (params?.computer_id) qs.set("computer_id", params.computer_id)
  if (params?.type) qs.set("type", params.type)
  if (params?.resolved) qs.set("resolved", params.resolved)
  if (params?.page) qs.set("page", String(params.page))
  if (params?.limit) qs.set("limit", String(params.limit))
  return apiFetch(`/alerts?${qs.toString()}`)
}

export async function getAlertStats(): Promise<AlertStats> {
  return apiFetch("/alerts/stats")
}

export async function resolveAlert(
  id: string,
): Promise<{ message: string; data: Alert }> {
  return apiFetch(`/alerts/${id}/resolve`, { method: "PUT" })
}

// ─── WebSocket ──────────────────────────────────────────────────────────────

export type WSMessage =
  | { type: "resource_update"; data: ResourceLog }
  | { type: "alert"; data: Alert }
  | { type: "alert_resolved"; data: Alert }

export function connectWebSocket(
  onMessage: (msg: WSMessage) => void,
): WebSocket | null {
  if (typeof window === "undefined") return null

  const ws = new WebSocket(`${WS_BASE}/resources`)

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as WSMessage
      onMessage(msg)
    } catch {
      // ignore malformed messages
    }
  }

  ws.onerror = () => {
    // silent reconnect handled by caller
  }

  return ws
}
