import { UsageCharts } from "@/components/usage-charts"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UsageAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Usage Analysis</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              <SelectItem value="LAB-PC-01">Lab PC 01</SelectItem>
              <SelectItem value="LAB-PC-02">Lab PC 02</SelectItem>
              <SelectItem value="LAB-PC-03">Lab PC 03</SelectItem>
              <SelectItem value="LAB-PC-04">Lab PC 04</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="daily">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="weekly">Weekly View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto">Export Data</Button>
        </div>
      </div>

      <UsageCharts period="daily" />
    </div>
  )
} 