import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MemberDetailLoading() {
  return (
    <>
      <Topbar title="Member" subtitle="Member journey" />
      <div className="space-y-6 px-6 py-6 lg:px-10">

        {/* Back link */}
        <Skeleton className="h-4 w-20" />

        {/* Member header card */}
        <div className="rounded-2xl border border-parchment-line bg-white/60 p-6">
          <Skeleton className="mb-3 h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="mt-2 h-3 w-36" />
        </div>

        {/* 3 stat tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-parchment-line bg-white/60 p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-parchment-line bg-white/60 p-6">
          <Skeleton className="mb-6 h-3 w-36" />
          <div className="relative">
            {Array.from({ length: 3 }).map((_, i) => {
              const isLast = i === 2;
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <Skeleton className="mt-1 h-3 w-3 rounded-full" />
                    {!isLast && <div className="mt-1 w-px grow bg-parchment-line" />}
                  </div>
                  <div className={`${isLast ? "mb-0" : "mb-6"} flex-1 rounded-xl border border-parchment-line bg-white/60 p-4`}>
                    <div className="flex justify-between">
                      <div>
                        <Skeleton className="mb-1.5 h-4 w-48" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="mt-3 flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </>
  );
}
