"use client"

import { Activity } from "lucide-react"

export function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-primary/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      {/* Header */}
      <div className="relative z-10 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Lab Monitor</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Lab Monitor. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
