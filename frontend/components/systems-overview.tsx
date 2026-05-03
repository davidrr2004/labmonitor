"use client"

import { useState } from "react"
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

// Sample data for systems
const systems = [
  {
    id: "LAB-PC-01",
    status: "online",
    cpuUsage: 42,
    memoryUsage: 35,
    networkUsage: 20,
    lastActive: "2 minutes ago",
  },
  {
    id: "LAB-PC-02",
    status: "online",
    cpuUsage: 28,
    memoryUsage: 45,
    networkUsage: 15,
    lastActive: "5 minutes ago",
  },
  {
    id: "LAB-PC-03",
    status: "offline",
    cpuUsage: 0,
    memoryUsage: 0,
    networkUsage: 0,
    lastActive: "2 hours ago",
  },
  {
    id: "LAB-PC-04",
    status: "online",
    cpuUsage: 92,
    memoryUsage: 78,
    networkUsage: 65,
    lastActive: "1 minute ago",
  },
  {
    id: "LAB-PC-05",
    status: "offline",
    cpuUsage: 0,
    memoryUsage: 0,
    networkUsage: 0,
    lastActive: "32 minutes ago",
  },
]

export function SystemsOverview() {
  const [systemsData, setSystemsData] = useState(systems)

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
        <Button variant="outline" size="sm">
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

