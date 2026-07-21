import { Topbar } from "@/components/dashboard/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SeatsLoading() {
  return (
    <>
      <Topbar title="Seat Map" subtitle="Loading floor plan…" />
      <div className="px-6 py-6 lg:px-10">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {Array.from({ length: 30 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    </>
  );
}
