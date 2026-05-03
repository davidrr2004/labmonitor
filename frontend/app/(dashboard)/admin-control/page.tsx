import { AdminControlPanel } from "@/components/admin-control-panel"

export default function AdminControlPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Control</h1>
      </div>

      <AdminControlPanel />
    </div>
  )
} 