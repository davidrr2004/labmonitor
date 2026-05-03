"use client"

import dynamic from 'next/dynamic'

const UsageCharts = dynamic(
  () => import('@/components/usage-charts').then((mod) => mod.UsageCharts),
  {
  loading: () => <div>Loading charts...</div>,
  ssr: false
  }
)

export function ClientCharts({ period }: { period: "daily" | "weekly" | "monthly" }) {
  return <UsageCharts period={period} />
} 