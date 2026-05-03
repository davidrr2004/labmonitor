import type { ReactNode } from "react"
import { cva } from "class-variance-authority"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const statusVariants = cva("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", {
  variants: {
    status: {
      online: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      offline: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      normal: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      warning: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      high: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    },
  },
  defaultVariants: {
    status: "normal",
  },
})

interface SystemStatusCardProps {
  title: string
  value: string
  status: "online" | "offline" | "normal" | "warning" | "high"
  icon: ReactNode
}

export function SystemStatusCard({ title, value, status, icon }: SystemStatusCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="rounded-full bg-primary/10 p-1 text-primary">{icon}</div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <h3 className="text-2xl font-semibold">{value}</h3>
          <div className={cn(statusVariants({ status }))}>{status.charAt(0).toUpperCase() + status.slice(1)}</div>
        </div>
      </CardContent>
    </Card>
  )
}

