import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <>
      <Topbar title="Overview" subtitle="Today at a glance" />
      <div className="space-y-6 px-6 py-6 lg:px-10">

        {/* 4 KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-ink-line/10 bg-white/60 p-5">
              <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
              <Skeleton className="mb-2 h-8 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>

        {/* Chart + donuts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>

        {/* This month + renewals */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-ink-line/10 bg-white/60 p-5">
            <Skeleton className="mb-3 h-3 w-20" />
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Skeleton className="mb-2 h-8 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div>
                <Skeleton className="mb-2 h-8 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>

      </div>
    </>
  );
}
