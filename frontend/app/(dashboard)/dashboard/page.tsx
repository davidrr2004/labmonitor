"use client"

import { useEffect, useState, useCallback } from "react"
import { SystemsOverview } from "@/components/systems-overview"
import { UsageSummaryChart } from "@/components/usage-summary-chart"
import { AlertCard } from "@/components/alert-card"
import { SystemStatusCard } from "@/components/system-status-card"
import { Activity, Cpu, Network, Power } from "lucide-react"
import {
  getResourceSummary,
  getActiveAlerts,
  getResourceHistory,
  connectWebSocket,
  type ResourceSummary,
  type Alert,
  type WSMessage,
} from "@/lib/api"

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

function mapAlertSeverity(
  alert: Alert,
): "low" | "medium" | "high" | "critical" {
  if (alert.type === "HIGH_CPU") return "high"
  if (alert.type === "HIGH_MEMORY") return "critical"
  return "medium"
}

function getStatusForValue(
  value: number,
): "normal" | "warning" | "high" | "online" | "offline" {
  if (value >= 80) return "high"
  if (value >= 60) return "warning"
  return "normal"
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<ResourceSummary | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [chartData, setChartData] = useState<
    Array<{ time: string; cpu: number; network: number; power: number }>
  >([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, alertsRes] = await Promise.all([
        getResourceSummary(),
        getActiveAlerts(),
      ])
      setSummary(summaryRes)
      setAlerts(alertsRes.data || [])

      // Fetch recent resource history for the chart
      const historyRes = await getResourceHistory(undefined, 1, 200)
      if (historyRes.data && historyRes.data.length > 0) {
        const buckets = new Map<
          string,
          { cpu: number[]; network: number[]; memory: number[] }
        >()
        for (const log of historyRes.data) {
          const d = new Date(log.timestamp)
          const hour = `${d.getHours().toString().padStart(2, "0")}:00`
          if (!buckets.has(hour)) {
            buckets.set(hour, { cpu: [], network: [], memory: [] })
          }
          const b = buckets.get(hour)!
          b.cpu.push(log.cpu)
          b.network.push((log.network_in + log.network_out) / 2)
          b.memory.push(log.memory)
        }
        const avg = (arr: number[]) =>
          arr.length
            ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
            : 0
        const sorted = Array.from(buckets.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([time, v]) => ({
            time,
            cpu: avg(v.cpu),
            network: avg(v.network),
            power: avg(v.memory),
          }))
        setChartData(sorted)
      }
    } catch {
      // silently handle errors on initial load
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const ws = connectWebSocket((msg: WSMessage) => {
      if (msg.type === "resource_update") {
        fetchData()
      } else if (msg.type === "alert") {
        setAlerts((prev) => [msg.data, ...prev])
      } else if (msg.type === "alert_resolved") {
        setAlerts((prev) => prev.filter((a) => a.id !== msg.data.id))
      }
    })
    return () => {
      ws?.close()
    }
  }, [fetchData])

  const totalSystems = summary?.total_systems ?? 0
  const avgCPU = summary?.averages?.cpu ?? 0
  const avgNetwork = summary?.averages?.network ?? 0
  const avgMemory = summary?.averages?.memory ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SystemStatusCard
          title="Total Systems"
          value={loading ? "..." : String(totalSystems)}
          status="normal"
          icon={<Activity className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="CPU Usage"
          value={loading ? "..." : `${Math.round(avgCPU)}%`}
          status={getStatusForValue(avgCPU)}
          icon={<Cpu className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="Network Load"
          value={loading ? "..." : `${Math.round(avgNetwork)}%`}
          status={getStatusForValue(avgNetwork)}
          icon={<Network className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="Power Usage"
          value={loading ? "..." : `${Math.round(avgMemory)}%`}
          status={getStatusForValue(avgMemory)}
          icon={<Power className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <div className="rounded-xl border bg-card text-card-foreground">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Usage Overview</h3>
            </div>
            <div className="p-6 pt-0">
              <UsageSummaryChart data={chartData.length > 0 ? chartData : undefined} />
            </div>
          </div>
        </div>
        <div className="col-span-3">
          <div className="rounded-xl border bg-card text-card-foreground">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Recent Alerts</h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              {alerts.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">No active alerts</p>
              )}
              {alerts.slice(0, 5).map((alert) => (
                <AlertCard
                  key={alert.id}
                  title={alert.type === "HIGH_CPU" ? "High CPU Usage" : alert.type === "HIGH_MEMORY" ? "High Memory Usage" : alert.type}
                  description={`${alert.computer_id}: ${alert.message}`}
                  timestamp={formatTimeAgo(alert.timestamp)}
                  severity={mapAlertSeverity(alert)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <SystemsOverview />
    </div>
  )
}
