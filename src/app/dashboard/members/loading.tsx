import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MembersLoading() {
  return (
    <>
      <Topbar title="Members" subtitle="Every membership, past and present, in one table" />
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

        {/* Table card */}
        <div className="rounded-2xl border border-ink-line/10 bg-white/60 p-5 sm:p-6">
          {/* Search + filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full sm:max-w-xs" />
            <Skeleton className="h-10 w-48" />
          </div>
          {/* Table rows */}
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <div className="flex-1">
                  <Skeleton className="mb-1.5 h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-12 rounded-md" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
