"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, ChevronDown, Power, RefreshCw, Search, Shield, Trash2, Computer, Activity, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getComputers,
  requestAppUsage,
  createCommand,
  type Computer as ComputerType,
  type AppUsageEntry,
} from "@/lib/api"

interface SystemDisplay {
  id: string
  status: string
  ip: string
  os: string
  lastBoot: string
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

export function AdminControlPanel() {
  const [systems, setSystems] = useState<SystemDisplay[]>([])
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [processSearch, setProcessSearch] = useState("")
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"shutdown" | "restart" | "terminate" | null>(null)
  const [targetId, setTargetId] = useState<string | number | null>(null)
  const [isActionInProgress, setIsActionInProgress] = useState(false)
  const [actionProgress, setActionProgress] = useState(0)
  const [loading, setLoading] = useState(true)

  // App usage state
  const [processes, setProcesses] = useState<AppUsageEntry[]>([])
  const [appUsageLoading, setAppUsageLoading] = useState(false)
  const [appUsageError, setAppUsageError] = useState<string | null>(null)
  const [snapshotTime, setSnapshotTime] = useState<string | null>(null)

  const fetchSystems = useCallback(async () => {
    try {
      const res = await getComputers()
      const computers = res.data || []
      const mapped: SystemDisplay[] = computers.map((comp: ComputerType) => ({
        id: comp.system_id,
        status: comp.is_online ? "online" : "offline",
        ip: `${comp.college} / ${comp.lab_name}`,
        os: comp.college,
        lastBoot: formatTimeAgo(comp.last_seen),
      }))
      setSystems(mapped)
    } catch {
      // keep empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSystems()
  }, [fetchSystems])

  // Reset process data when selecting a different system
  useEffect(() => {
    setProcesses([])
    setAppUsageError(null)
    setSnapshotTime(null)
    setProcessSearch("")
  }, [selectedSystem])

  const filteredSystems = systems.filter(
    (system) =>
      system.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.ip.includes(searchTerm) ||
      system.os.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredProcesses = processes.filter(
    (p) =>
      p.name.toLowerCase().includes(processSearch.toLowerCase()) ||
      p.username.toLowerCase().includes(processSearch.toLowerCase()),
  )

  const handleSystemAction = (action: "shutdown" | "restart", id: string) => {
    setActionType(action)
    setTargetId(id)
    setIsConfirmDialogOpen(true)
  }

  const handleTerminateProcess = (id: string) => {
    setActionType("terminate")
    setTargetId(id)
    setIsConfirmDialogOpen(true)
  }

  const handleGetAppUsage = async (systemId: string) => {
    setAppUsageLoading(true)
    setAppUsageError(null)
    setProcesses([])
    setSnapshotTime(null)

    try {
      const result = await requestAppUsage(systemId)
      setProcesses(result.entries || [])
      setSnapshotTime(result.snapshot?.captured_at || null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch app usage"
      setAppUsageError(message)
    } finally {
      setAppUsageLoading(false)
    }
  }

  const executeAction = () => {
    setIsConfirmDialogOpen(false)
    setIsActionInProgress(true)
    setActionProgress(0)

    const systemId = typeof targetId === "string" ? targetId : null

    if (actionType === "shutdown" && systemId) {
      createCommand(systemId, "SHUTDOWN").catch(() => {})
    } else if (actionType === "restart" && systemId) {
      createCommand(systemId, "RESTART").catch(() => {})
    }

    // Simulate progress
    const interval = setInterval(() => {
      setActionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsActionInProgress(false)
          return 100
        }
        return prev + 10
      })
    }, 300)

    // Simulate action completion
    setTimeout(() => {
      clearInterval(interval)
      setIsActionInProgress(false)
      setActionProgress(100)
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Control</CardTitle>
          <CardDescription>Monitor and control lab computers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-4">
            <Input
              placeholder="Search systems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-sm"
            />
            <Select>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Systems</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-hidden">
            <ScrollArea className="h-[400px] md:h-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">System ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="hidden md:table-cell">Operating System</TableHead>
                    <TableHead className="hidden md:table-cell">Last Boot</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Loading systems...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && filteredSystems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No systems found
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredSystems.map((system) => (
                    <TableRow
                      key={system.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedSystem(system.id === selectedSystem ? null : system.id)}
                    >
                      <TableCell className="font-medium">{system.id}</TableCell>
                      <TableCell>
                        <Badge variant={system.status === "online" ? "secondary" : "destructive"}>{system.status}</Badge>
                      </TableCell>
                      <TableCell>{system.ip}</TableCell>
                      <TableCell className="hidden md:table-cell">{system.os}</TableCell>
                      <TableCell className="hidden md:table-cell">{system.lastBoot}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSystemAction("restart", system.id)
                            }}
                            disabled={system.status === "offline"}
                            className="hidden sm:flex"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Restart
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSystemAction("shutdown", system.id)
                            }}
                            disabled={system.status === "offline"}
                          >
                            <Power className="h-4 w-4 sm:mr-1" />
                            <span className="hidden sm:inline">Shutdown</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{filteredSystems.length} Systems</Badge>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
            >
              {filteredSystems.filter((s) => s.status === "online").length} Online
            </Badge>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => { setLoading(true); fetchSystems() }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex-1 sm:flex-initial">
                  <Shield className="h-4 w-4 mr-2" />
                  Mass Action
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mass System Action</DialogTitle>
                  <DialogDescription>
                    Apply an action to multiple systems at once. This will affect all online systems.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restart">Restart All Systems</SelectItem>
                        <SelectItem value="shutdown">Shutdown All Systems</SelectItem>
                        <SelectItem value="update">Update All Systems</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Apply Action</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardFooter>
      </Card>

      {selectedSystem && (
        <Collapsible open={!!selectedSystem} className="space-y-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3 font-semibold">
              <div className="flex items-center gap-2">
                <Computer className="h-5 w-5" />
                <span>System Details: {selectedSystem}</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Process Management</CardTitle>
                    <CardDescription>
                      Monitor and control processes running on {selectedSystem}
                      {snapshotTime && (
                        <span className="ml-2 text-xs opacity-70">
                          (snapshot: {new Date(snapshotTime).toLocaleString()})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleGetAppUsage(selectedSystem)}
                    disabled={appUsageLoading}
                    size="sm"
                  >
                    {appUsageLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fetching…
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Get App Usage
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {appUsageError && (
                  <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {appUsageError}
                  </div>
                )}

                <div className="flex items-center space-x-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search processes..."
                    className="max-w-sm"
                    value={processSearch}
                    onChange={(e) => setProcessSearch(e.target.value)}
                  />
                </div>

                <div className="rounded-md border overflow-hidden">
                  <ScrollArea className="h-[300px] md:h-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Process Name</TableHead>
                          <TableHead>PID</TableHead>
                          <TableHead>CPU Usage</TableHead>
                          <TableHead className="hidden md:table-cell">Memory (MB)</TableHead>
                          <TableHead className="hidden md:table-cell">User</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appUsageLoading && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Waiting for agent to respond…
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                        {!appUsageLoading && filteredProcesses.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              {processes.length === 0
                                ? 'Click "Get App Usage" to fetch running processes'
                                : "No processes match your search"}
                            </TableCell>
                          </TableRow>
                        )}
                        {!appUsageLoading &&
                          filteredProcesses.map((process) => (
                            <TableRow key={process.id}>
                              <TableCell className="font-medium">{process.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{process.pid}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={Math.min(process.cpu, 100)}
                                    className="h-2 w-16"
                                    indicatorClassName={
                                      process.cpu > 20
                                        ? "bg-red-500"
                                        : process.cpu > 10
                                          ? "bg-orange-500"
                                          : "bg-green-500"
                                    }
                                  />
                                  <span className="text-xs">{process.cpu}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {process.memory_mb.toFixed(1)} MB
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {process.username || "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTerminateProcess(process.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Terminate
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {actionType === "shutdown" && `Are you sure you want to shut down ${targetId}?`}
              {actionType === "restart" && `Are you sure you want to restart ${targetId}?`}
              {actionType === "terminate" && `Are you sure you want to terminate this process?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isActionInProgress}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "shutdown" ? "Shutting down" : actionType === "restart" ? "Restarting" : "Terminating"} in
              progress
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Progress value={actionProgress} className="h-2" />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {actionProgress < 100 ? "Please wait..." : "Completed!"}
            </p>
          </div>
          <DialogFooter>
            <Button disabled={actionProgress < 100} onClick={() => setIsActionInProgress(false)}>
              {actionProgress < 100 ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {actionProgress < 100 ? "Processing..." : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
