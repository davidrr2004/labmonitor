import { SystemsOverview } from "@/components/systems-overview"
import { UsageSummaryChart } from "@/components/usage-summary-chart"
import { AlertCard } from "@/components/alert-card"
import { SystemStatusCard } from "@/components/system-status-card"
import { Activity, Cpu, Network, Power } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SystemStatusCard
          title="Total Systems"
          value="24"
          status="normal"
          icon={<Activity className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="CPU Usage"
          value="65%"
          status="warning"
          icon={<Cpu className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="Network Load"
          value="45%"
          status="normal"
          icon={<Network className="h-4 w-4" />}
        />
        <SystemStatusCard
          title="Power Usage"
          value="82%"
          status="high"
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
              <AlertCard
                title="High CPU Usage"
                description="LAB-PC-04 is experiencing unusually high CPU usage (92%)"
                timestamp="2 minutes ago"
                severity="high"
              />
              <AlertCard
                title="System Offline"
                description="LAB-PC-03 has gone offline unexpectedly"
                timestamp="2 hours ago"
                severity="critical"
              />
              <AlertCard
                title="Update Available"
                description="System updates are available for 3 computers"
                timestamp="1 hour ago"
                severity="low"
              />
            </div>
          </div>
        </div>
      </div>

      <SystemsOverview />
    </div>
  )
} 