"use client"

import { useEffect, useState } from "react"
import { UsageCharts } from "@/components/usage-charts"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getComputers, type Computer } from "@/lib/api"

export default function UsageAnalysisPage() {
  const [systems, setSystems] = useState<Computer[]>([])
  const [selectedSystem, setSelectedSystem] = useState("all")
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily")

  useEffect(() => {
    getComputers()
      .then((res) => setSystems(res.data || []))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Usage Analysis</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select value={selectedSystem} onValueChange={setSelectedSystem}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {systems.map((sys) => (
                <SelectItem key={sys.system_id} value={sys.system_id}>
                  {sys.system_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={(v) => setPeriod(v as "daily" | "weekly" | "monthly")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="weekly">Weekly View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto">Export Data</Button>
        </div>
      </div>

      <UsageCharts period={period} computerId={selectedSystem} />
    </div>
  )
}
