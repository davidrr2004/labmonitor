"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const defaultData = [
  { time: "8:00", cpu: 30, network: 20, power: 45 },
  { time: "9:00", cpu: 40, network: 25, power: 50 },
  { time: "10:00", cpu: 45, network: 30, power: 55 },
  { time: "11:00", cpu: 70, network: 40, power: 65 },
  { time: "12:00", cpu: 65, network: 45, power: 70 },
  { time: "13:00", cpu: 55, network: 35, power: 60 },
  { time: "14:00", cpu: 50, network: 30, power: 55 },
  { time: "15:00", cpu: 60, network: 45, power: 65 },
]

interface UsageSummaryChartProps {
  data?: Array<{ time: string; cpu: number; network: number; power: number }>
}

export function UsageSummaryChart({ data }: UsageSummaryChartProps) {
  const chartData = data && data.length > 0 ? data : defaultData

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNetwork" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="time" className="text-xs" />
          <YAxis className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
            }}
          />
          <Area
            type="monotone"
            dataKey="cpu"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorCpu)"
            name="CPU Usage (%)"
          />
          <Area
            type="monotone"
            dataKey="network"
            stroke="hsl(var(--secondary))"
            fillOpacity={1}
            fill="url(#colorNetwork)"
            name="Network Usage (%)"
          />
          <Area
            type="monotone"
            dataKey="power"
            stroke="hsl(var(--accent))"
            fillOpacity={1}
            fill="url(#colorPower)"
            name="Power Usage (%)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
