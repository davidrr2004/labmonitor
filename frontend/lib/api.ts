const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

interface RequestOptions {
  skipAuthRedirect?: boolean
}

async function request<T>(
  path: string,
  options: RequestInit & RequestOptions = {}
): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    if (res.status === 401 && !skipAuthRedirect && typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user")
      window.location.href = "/login"
      throw new Error("Unauthorized")
    }
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.error || `Request failed with status ${res.status}`)
  }

  return res.json()
}

// Auth
export async function login(username: string, password: string) {
  const data = await request<{ token: string; user: Record<string, unknown> }>(
    "/api/v1/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
      skipAuthRedirect: true,
    }
  )
  localStorage.setItem("auth_token", data.token)
  localStorage.setItem("user", JSON.stringify(data.user))
  return data
}

export async function register(fields: {
  username: string
  password: string
  role: string
}) {
  const data = await request<{ token: string; user: Record<string, unknown> }>(
    "/api/v1/signup",
    {
      method: "POST",
      body: JSON.stringify(fields),
      skipAuthRedirect: true,
    }
  )
  localStorage.setItem("auth_token", data.token)
  localStorage.setItem("user", JSON.stringify(data.user))
  return data
}

export function logout() {
  localStorage.removeItem("auth_token")
  localStorage.removeItem("user")
  window.location.href = "/login"
}

export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Dashboard
export async function getDashboardSummary() {
  return request<{
    total_systems: number
    online_systems: number
    avg_cpu: number
    avg_memory: number
    active_alerts: number
    recent_alerts: Array<{
      id: string
      computer_id: string
      type: string
      message: string
      timestamp: string
      resolved: boolean
    }>
  }>("/api/v1/dashboard")
}

// Computers
export async function getComputers() {
  return request<{
    data: Array<{
      id: string
      system_id: string
      college: string
      lab_name: string
      last_seen: string
      is_online: boolean
      created_at: string
    }>
  }>("/api/v1/computers")
}

// Resources / Metrics
export async function getResourceHistory(computerId: string, page = 1, limit = 50) {
  return request<{
    data: Array<{
      id: string
      computer_id: string
      cpu: number
      memory: number
      network_in: number
      network_out: number
      timestamp: string
    }>
    pagination: {
      current_page: number
      total_pages: number
      total_items: number
      per_page: number
    }
  }>(`/api/v1/resources/history?computer_id=${computerId}&page=${page}&limit=${limit}`)
}

// Alerts
export async function getAlerts(params?: { computer_id?: string; type?: string; resolved?: string }) {
  const q = new URLSearchParams()
  if (params?.computer_id) q.set("computer_id", params.computer_id)
  if (params?.type) q.set("type", params.type)
  if (params?.resolved) q.set("resolved", params.resolved)
  const qs = q.toString()
  return request<{
    data: Array<{
      id: string
      computer_id: string
      type: string
      message: string
      timestamp: string
      resolved: boolean
    }>
    pagination: {
      current_page: number
      total_pages: number
      total_items: number
      per_page: number
    }
  }>(`/api/v1/alerts${qs ? `?${qs}` : ""}`)
}

export async function getActiveAlerts() {
  return request<{
    data: Array<{
      id: string
      computer_id: string
      type: string
      message: string
      timestamp: string
      resolved: boolean
    }>
  }>("/api/v1/alerts/active")
}

export async function getAlertStats() {
  return request<{
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
  }>("/api/v1/alerts/stats")
}

export async function resolveAlert(alertId: string) {
  return request<{ message: string }>(`/api/v1/alerts/${alertId}/resolve`, {
    method: "PUT",
  })
}
