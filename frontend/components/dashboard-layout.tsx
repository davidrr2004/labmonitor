"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, Computer, Home, LogOut, Settings, User } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout, getStoredUser } from "@/lib/api"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user = getStoredUser()

  const username = (user?.username as string) || "User"
  const role = (user?.role as string) || "admin"
  const initials = username.substring(0, 2).toUpperCase()

  const handleLogout = () => {
    logout()
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader className="relative flex h-[120px] items-start justify-between border-b px-6 pt-6">
            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Lab Monitor</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[80px] overflow-hidden">
              <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-primary/10" />
              <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-primary/5" />
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-1 overflow-y-auto">
            <SidebarMenu className="space-y-2 p-4">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3 text-base">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/usage-analysis"}>
                  <Link href="/usage-analysis" className="flex items-center gap-4 px-4 py-3 text-base">
                    <BarChart3 className="h-5 w-5" />
                    <span>Usage Analysis</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin-control"}>
                  <Link href="/admin-control" className="flex items-center gap-4 px-4 py-3 text-base">
                    <Computer className="h-5 w-5" />
                    <span>Admin Control</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarSeparator className="my-4" />
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/profile"}>
                  <Link href="/profile" className="flex items-center gap-4 px-4 py-3 text-base">
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                  <Link href="/settings" className="flex items-center gap-4 px-4 py-3 text-base">
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-sm">
                  <span className="font-medium">{username}</span>
                  <span className="text-xs text-muted-foreground capitalize">{role}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
              <ModeToggle />
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-2">
              <ModeToggle className="md:hidden" />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="mx-auto py-6 px-4 md:px-6 h-full">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
