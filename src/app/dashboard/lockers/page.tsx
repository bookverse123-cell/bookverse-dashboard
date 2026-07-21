import { LockKeyhole, Unlock, Users } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { LockersBoard } from "@/components/lockers/LockersBoard";
import { getLockerStatuses, getMemberships } from "@/lib/data";

export default async function LockersPage() {
  const [{ lockers }, { data: memberships }] = await Promise.all([
    getLockerStatuses(),
    getMemberships(),
  ]);

  const activeMemberships = memberships.filter(
    (membership) => membership.status === "active" && membership.days_until_expiry >= 0,
  );

  const memberMap = new Map<string, (typeof activeMemberships)[number]>();
  for (const membership of activeMemberships) {
    const existing = memberMap.get(membership.member_id);
    if (!existing || membership.end_date > existing.end_date) {
      memberMap.set(membership.member_id, membership);
    }
  }

  const memberOptions = Array.from(memberMap.values())
    .map((membership) => ({
      member_id: membership.member_id,
      full_name: membership.full_name,
      phone: membership.phone,
      seat_code: membership.seat_code,
    }))
    .sort((left, right) => left.full_name.localeCompare(right.full_name));

  const allocated = lockers.filter((locker) => locker.allocation_status === "active").length;
  const available = lockers.length - allocated;

  return (
    <>
      <Topbar title="Lockers" subtitle="Allocate 27 lockers to active members" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KPICard icon={<LockKeyhole size={18} />} label="Total lockers" value={`${lockers.length}`} accent="ink" />
          <KPICard icon={<Unlock size={18} />} label="Available lockers" value={`${available}`} accent="sage" delay={0.05} />
          <KPICard icon={<Users size={18} />} label="Allocated lockers" value={`${allocated}`} accent="terracotta" delay={0.1} />
        </div>

        <LockersBoard lockers={lockers} members={memberOptions} />
      </div>
    </>
  );
}
