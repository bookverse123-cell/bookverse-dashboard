import { Users, UserCheck, AlertTriangle, IndianRupee } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { MembersTable } from "@/components/members/MembersTable";
import { getMemberships, getDailyPasses, getSeatStatuses } from "@/lib/data";

export default async function MembersPage() {
  const [{ data: rows }, { data: dailyPasses }, { seats }] = await Promise.all([
    getMemberships(),
    getDailyPasses(),
    getSeatStatuses(),
  ]);

  function isNewerMembership(a: (typeof rows)[number], b: (typeof rows)[number]) {
    if (a.start_date !== b.start_date) return a.start_date > b.start_date;
    if (a.end_date !== b.end_date) return a.end_date > b.end_date;
    if (a.status !== b.status) return a.status === "active";
    return false;
  }

  const latestByMember = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const personKey = row.phone.trim();
    const existing = latestByMember.get(personKey);
    if (!existing) {
      latestByMember.set(personKey, row);
      continue;
    }

    if (isNewerMembership(row, existing)) {
      latestByMember.set(personKey, row);
    }
  }
  const latestRows = Array.from(latestByMember.values());

  const active = latestRows.filter((r) => r.status === "active" && r.days_until_expiry >= 0).length;
  const renewalDue = latestRows.filter(
    (r) => r.status === "active" && r.days_until_expiry >= 0 && r.days_until_expiry <= 3
  ).length;
  const overdue = latestRows.filter((r) => r.status === "active" && r.days_until_expiry < 0).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const membershipFees = rows
    .filter((r) => r.start_date <= todayStr)
    .reduce((sum, r) => sum + r.amount_paid, 0);
  const dailyPassFees = dailyPasses.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = membershipFees + dailyPassFees;

  return (
    <>
      <Topbar title="Members" subtitle="Latest membership status for each member" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPICard icon={<Users size={18} />} label="Total members" value={`${latestRows.length}`} accent="ink" />
          <KPICard icon={<Users size={18} />} label="Daily pass visitors" value={`${dailyPasses.length}`} accent="brass" delay={0.03} />
          <KPICard icon={<UserCheck size={18} />} label="Active memberships" value={`${active}`} accent="sage" delay={0.05} />
          <KPICard icon={<AlertTriangle size={18} />} label="Renewal due / overdue" value={`${renewalDue + overdue}`} accent="brass" delay={0.1} />
          <KPICard
            icon={<IndianRupee size={18} />}
            label={`Memberships ₹${membershipFees.toLocaleString("en-IN")} · Passes ₹${dailyPassFees.toLocaleString("en-IN")}`}
            value={`₹${totalCollected.toLocaleString("en-IN")}`}
            accent="terracotta"
            delay={0.15}
          />
        </div>

        <MembersTable rows={latestRows} dailyPasses={dailyPasses} allSeats={seats} />
      </div>
    </>
  );
}
