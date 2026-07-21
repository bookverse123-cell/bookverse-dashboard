import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function FinanceLoading() {
  return (
    <>
      <Topbar title="Finance" subtitle="All-time revenue, expenses, and investments" />
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

        {/* Tabs + chart */}
        <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
          {/* Tab bar */}
          <div className="mb-6 flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-lg" />
            ))}
          </div>
          {/* Chart area */}
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>

      </div>
    </>
  );
}
