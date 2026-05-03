"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Power, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { getComputers } from "@/lib/api"

interface SystemData {
  id: string
  system_id: string
  college: string
  lab_name: string
  last_seen: string
  is_online: boolean
  created_at: string
}

export function SystemsOverview() {
  const [systemsData, setSystemsData] = useState<SystemData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSystems = async () => {
    try {
      const result = await getComputers()
      setSystemsData(result.data || [])
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystems()
    const interval = setInterval(fetchSystems, 10000)
    return () => clearInterval(interval)
  }, [])

  const getStatusVariant = (isOnline: boolean) => {
    return isOnline ? "secondary" : "destructive"
  }

  const handleRestart = (id: string) => {
    alert(`Restarting system ${id}`)
  }

  const handleShutdown = (id: string) => {
    alert(`Shutting down system ${id}`)
  }

  const getTimeAgo = (timestamp: string): string => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const onlineCount = systemsData.filter((s) => s.is_online).length
  const offlineCount = systemsData.filter((s) => !s.is_online).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{systemsData.length} Systems</Badge>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
          >
            {onlineCount} Online
          </Badge>
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
          >
            {offlineCount} Offline
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSystems} disabled={loading}>
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
              <TableHead>College</TableHead>
              <TableHead>Lab Name</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemsData.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No systems registered yet. Run the monitoring agent to register a system.
                </TableCell>
              </TableRow>
            ) : (
              systemsData.map((system) => (
                <TableRow key={system.id}>
                  <TableCell className="font-medium">{system.system_id}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(system.is_online)}>
                      {system.is_online ? "online" : "offline"}
                    </Badge>
                  </TableCell>
                  <TableCell>{system.college}</TableCell>
                  <TableCell>{system.lab_name}</TableCell>
                  <TableCell className="text-sm">{getTimeAgo(system.last_seen)}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleRestart(system.system_id)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Restart
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShutdown(system.system_id)}>
                          <Power className="mr-2 h-4 w-4" />
                          Shutdown
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
