import { Topbar } from "@/components/dashboard/Topbar";
import { FloorPlan } from "@/components/seats/FloorPlan";
import { getSeatStatuses } from "@/lib/data";

export default async function SeatsPage() {
  const { seats } = await getSeatStatuses();

  const libraryCount = seats.filter((s) => s.zone === "library").length;
  const loungeCount = seats.filter((s) => s.zone === "lounge").length;
  const occupied = seats.filter((s) => s.occupancy_status !== "available").length;

  return (
    <>
      <Topbar
        title="Seat Map"
        subtitle={`${libraryCount} reading hall seats · ${loungeCount} premium lounge seats · ${occupied} currently occupied`}
      />
      <div className="px-6 py-6 lg:px-10">
        <FloorPlan seats={seats} />
      </div>
    </>
  );
}
