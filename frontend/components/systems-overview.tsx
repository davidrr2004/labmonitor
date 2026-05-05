"use client"

import { useState, useEffect, useCallback } from "react"
import { MoreHorizontal, Power, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  getComputers,
  getResourceHistory,
  connectWebSocket,
  type WSMessage,
  type Computer,
} from "@/lib/api"

interface SystemDisplay {
  id: string
  status: string
  cpuUsage: number
  memoryUsage: number
  networkUsage: number
  lastActive: string
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp)
  if (date.getFullYear() <= 1) return "Never"
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export function SystemsOverview() {
  const [systemsData, setSystemsData] = useState<SystemDisplay[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSystems = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const computersRes = await getComputers()
      const computers = computersRes.data || []

      // Fetch latest resource for each computer
      const systemDisplays: SystemDisplay[] = await Promise.all(
        computers.map(async (comp: Computer) => {
          let cpuUsage = 0
          let memoryUsage = 0
          let networkUsage = 0

          if (comp.is_online) {
            try {
              const historyRes = await getResourceHistory(comp.system_id, 1, 20)
              if (historyRes.data && historyRes.data.length > 0) {
                const latest = historyRes.data[0]
                const maxNetwork = Math.max(
                  ...historyRes.data.map((entry) => entry.network_in + entry.network_out),
                )
                const latestNetwork = latest.network_in + latest.network_out
                cpuUsage = Math.round(latest.cpu)
                memoryUsage = Math.round(latest.memory)
                networkUsage = maxNetwork > 0
                  ? Math.round((latestNetwork / maxNetwork) * 100)
                  : 0
              }
            } catch {
              // use defaults
            }
          }

          return {
            id: comp.system_id,
            status: comp.is_online ? "online" : "offline",
            cpuUsage,
            memoryUsage,
            networkUsage,
            lastActive: formatTimeAgo(comp.last_seen),
          }
        }),
      )

      setSystemsData(systemDisplays)
    } catch {
      // keep empty state on error
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSystems(true)
    const ws = connectWebSocket((msg: WSMessage) => {
      if (msg.type === "resource_update") {
        fetchSystems()
      }
    })
    const interval = setInterval(() => fetchSystems(), 10000)

    return () => {
      ws?.close()
      clearInterval(interval)
    }
  }, [fetchSystems])

  const getStatusVariant = (status: string) => {
    return status === "online" ? "secondary" : "destructive"
  }

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return "bg-red-500"
    if (usage >= 60) return "bg-orange-500"
    if (usage >= 40) return "bg-yellow-500"
    return "bg-green-500"
  }

  const handleRestart = (id: string) => {
    alert(`Restarting system ${id}`)
  }

  const handleShutdown = (id: string) => {
    alert(`Shutting down system ${id}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{systemsData.length} Systems</Badge>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
          >
            {systemsData.filter((s) => s.status === "online").length} Online
          </Badge>
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
          >
            {systemsData.filter((s) => s.status === "offline").length} Offline
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchSystems(true)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>System ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>CPU Usage</TableHead>
              <TableHead>Memory Usage</TableHead>
              <TableHead>Network Usage</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && systemsData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading systems...
                </TableCell>
              </TableRow>
            )}
            {!loading && systemsData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No systems registered
                </TableCell>
              </TableRow>
            )}
            {systemsData.map((system) => (
              <TableRow key={system.id}>
                <TableCell className="font-medium">{system.id}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(system.status)}>{system.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={system.cpuUsage}
                      className="h-2 w-16"
                      indicatorClassName={getUsageColor(system.cpuUsage)}
                    />
                    <span className="text-xs">{system.cpuUsage}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={system.memoryUsage}
                      className="h-2 w-16"
                      indicatorClassName={getUsageColor(system.memoryUsage)}
                    />
                    <span className="text-xs">{system.memoryUsage}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={system.networkUsage}
                      className="h-2 w-16"
                      indicatorClassName={getUsageColor(system.networkUsage)}
                    />
                    <span className="text-xs">{system.networkUsage}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{system.lastActive}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRestart(system.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Restart
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShutdown(system.id)}>
                        <Power className="mr-2 h-4 w-4" />
                        Shutdown
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
