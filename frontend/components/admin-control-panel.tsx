"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, ChevronDown, Power, RefreshCw, Search, Shield, Trash2, Computer } from "lucide-react"

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
import { getComputers } from "@/lib/api"

interface SystemEntry {
  id: string
  status: string
  system_id: string
  college: string
  lab_name: string
  last_seen: string
}

// Sample data for processes
const processes = [
  { id: 1, name: "chrome.exe", cpu: 12.5, memory: 350, user: "student", status: "running" },
  { id: 2, name: "vscode.exe", cpu: 8.2, memory: 280, user: "student", status: "running" },
  { id: 3, name: "explorer.exe", cpu: 1.5, memory: 120, user: "system", status: "running" },
  { id: 4, name: "java.exe", cpu: 15.8, memory: 420, user: "student", status: "running" },
  { id: 5, name: "python.exe", cpu: 5.3, memory: 180, user: "student", status: "running" },
  { id: 6, name: "svchost.exe", cpu: 0.8, memory: 90, user: "system", status: "running" },
  { id: 7, name: "node.exe", cpu: 7.2, memory: 250, user: "student", status: "running" },
  { id: 8, name: "malware.exe", cpu: 25.0, memory: 500, user: "unknown", status: "suspicious" },
]

export function AdminControlPanel() {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"shutdown" | "restart" | "terminate" | null>(null)
  const [targetId, setTargetId] = useState<string | number | null>(null)
  const [isActionInProgress, setIsActionInProgress] = useState(false)
  const [actionProgress, setActionProgress] = useState(0)
  const [systems, setSystems] = useState<SystemEntry[]>([])

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const result = await getComputers()
        const mapped = (result.data || []).map((c) => ({
          id: c.system_id,
          status: c.is_online ? "online" : "offline",
          system_id: c.system_id,
          college: c.college,
          lab_name: c.lab_name,
          last_seen: c.last_seen,
        }))
        setSystems(mapped)
      } catch { /* keep existing */ }
    }
    fetchSystems()
    const interval = setInterval(fetchSystems, 10000)
    return () => clearInterval(interval)
  }, [])

  const filteredSystems = systems.filter(
    (system) =>
      system.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.lab_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSystemAction = (action: "shutdown" | "restart", id: string) => {
    setActionType(action)
    setTargetId(id)
    setIsConfirmDialogOpen(true)
  }

  const handleTerminateProcess = (id: number) => {
    setActionType("terminate")
    setTargetId(id)
    setIsConfirmDialogOpen(true)
  }

  const executeAction = () => {
    setIsConfirmDialogOpen(false)
    setIsActionInProgress(true)
    setActionProgress(0)

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

      // Show success message or update state
      alert(
        `${actionType === "shutdown" ? "Shutdown" : actionType === "restart" ? "Restart" : "Termination"} completed successfully`,
      )
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
                    <TableHead>College</TableHead>
                    <TableHead className="hidden md:table-cell">Lab Name</TableHead>
                    <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
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
                      <TableCell>{system.college}</TableCell>
                      <TableCell className="hidden md:table-cell">{system.lab_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{system.last_seen ? new Date(system.last_seen).toLocaleString() : "N/A"}</TableCell>
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
            <Button variant="outline" className="flex-1 sm:flex-initial">
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
                <CardTitle>Process Management</CardTitle>
                <CardDescription>Monitor and control processes running on {selectedSystem}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search processes..." className="max-w-sm" />
                </div>

                <div className="rounded-md border overflow-hidden">
                  <ScrollArea className="h-[300px] md:h-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Process Name</TableHead>
                          <TableHead>CPU Usage</TableHead>
                          <TableHead className="hidden md:table-cell">Memory (MB)</TableHead>
                          <TableHead className="hidden md:table-cell">User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processes.map((process) => (
                          <TableRow key={process.id}>
                            <TableCell className="font-medium">{process.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={process.cpu}
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
                            <TableCell className="hidden md:table-cell">{process.memory} MB</TableCell>
                            <TableCell className="hidden md:table-cell">{process.user}</TableCell>
                            <TableCell>
                              <Badge
                                variant={process.status === "suspicious" ? "destructive" : "outline"}
                                className={
                                  process.status === "suspicious"
                                    ? ""
                                    : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                }
                              >
                                {process.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleTerminateProcess(process.id)}>
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
              {actionType === "terminate" && `Are you sure you want to terminate process ID ${targetId}?`}
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

