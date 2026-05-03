import { AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva("relative rounded-lg p-3 flex items-start gap-3", {
  variants: {
    severity: {
      low: "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
      medium: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
      high: "bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
      critical: "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300",
    },
  },
  defaultVariants: {
    severity: "medium",
  },
})

interface AlertCardProps {
  title: string
  description: string
  timestamp: string
  severity: "low" | "medium" | "high" | "critical"
}

export function AlertCard({ title, description, timestamp, severity }: AlertCardProps) {
  const Icon = severity === "critical" ? AlertCircle : severity === "high" ? AlertTriangle : Info

  return (
    <div className={cn(alertVariants({ severity }))}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{title}</h3>
          <span className="text-xs opacity-70">{timestamp}</span>
        </div>
        <p className="text-sm">{description}</p>
      </div>
    </div>
  )
}

