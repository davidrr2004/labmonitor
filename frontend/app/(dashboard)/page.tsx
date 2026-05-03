import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsageCharts } from "@/components/usage-charts"

export default function UsageAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Usage Analysis</h1>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="daily" className="mt-0">
          <UsageCharts period="daily" />
        </TabsContent>

        <TabsContent value="weekly" className="mt-0">
          <UsageCharts period="weekly" />
        </TabsContent>

        <TabsContent value="monthly" className="mt-0">
          <UsageCharts period="monthly" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

