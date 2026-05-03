"use client"

import { useEffect, useState } from "react"
import { SystemsOverview } from "@/components/systems-overview"
import { UsageSummaryChart } from "@/components/usage-summary-chart"
import { AlertCard } from "@/components/alert-card"
import { SystemStatusCard } from "@/components/system-status-card"
import { Activity, Cpu, Network, AlertTriangle } from "lucide-react"
import { getDashboardSummary } from "@/lib/api"

interface DashboardData {
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
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await getDashboardSummary()
        setData(summary)
      } catch {
        // Silently fail — will show fallback data
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const totalSystems = data?.total_systems ?? 0
  const onlineSystems = data?.online_systems ?? 0
  const avgCpu = data?.avg_cpu ?? 0
  const activeAlerts = data?.active_alerts ?? 0
  const recentAlerts = data?.recent_alerts ?? []

  const cpuStatus = avgCpu > 80 ? "high" : avgCpu > 60 ? "warning" : "normal"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SystemStatusCard
          title="Total Systems"
          value={String(totalSystems)}
          status="normal"
          icon={<Activity className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="Online Systems"
          value={String(onlineSystems)}
          status={onlineSystems > 0 ? "normal" : "warning"}
          icon={<Network className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="Avg CPU Usage"
          value={`${Math.round(avgCpu)}%`}
          status={cpuStatus}
          icon={<Cpu className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="Active Alerts"
          value={String(activeAlerts)}
          status={activeAlerts > 0 ? "high" : "normal"}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <div className="rounded-xl border bg-card text-card-foreground">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Usage Overview</h3>
            </div>
            <div className="p-6 pt-0">
              <UsageSummaryChart />
            </div>
          </div>
        </div>
        <div className="col-span-3">
          <div className="rounded-xl border bg-card text-card-foreground">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Recent Alerts</h3>
            </div>
            <div className="p-6 pt-0 space-y-4">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => {
                  const severity = alert.type === "HIGH_CPU" ? "high" : alert.type === "HIGH_MEMORY" ? "high" : "medium"
                  const timeAgo = getTimeAgo(alert.timestamp)
                  return (
                    <AlertCard
                      key={alert.id}
                      title={alert.type.replace(/_/g, " ")}
                      description={`${alert.computer_id}: ${alert.message}`}
                      timestamp={timeAgo}
                      severity={severity}
                    />
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">No active alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <SystemsOverview />
    </div>
  )
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}
