import { Users, UserCheck, AlertTriangle, IndianRupee } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { MembersTable } from "@/components/members/MembersTable";
import { getMemberships, getDailyPasses } from "@/lib/data";

export default async function MembersPage() {
  const [{ data: rows }, { data: dailyPasses }] = await Promise.all([
    getMemberships(),
    getDailyPasses(),
  ]);

  const active = rows.filter((r) => r.status === "active" && r.days_until_expiry >= 0).length;
  const renewalDue = rows.filter(
    (r) => r.status === "active" && r.days_until_expiry >= 0 && r.days_until_expiry <= 3
  ).length;
  const overdue = rows.filter((r) => r.status === "active" && r.days_until_expiry < 0).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const membershipFees = rows
    .filter((r) => r.start_date <= todayStr)
    .reduce((sum, r) => sum + r.amount_paid, 0);
  const dailyPassFees = dailyPasses.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = membershipFees + dailyPassFees;

  return (
    <>
      <Topbar title="Members" subtitle="Every membership, past and present, in one table" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard icon={<Users size={18} />} label="Total members" value={`${rows.length + dailyPasses.length}`} accent="ink" />
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

        <MembersTable rows={rows} dailyPasses={dailyPasses} />
      </div>
    </>
  );
}
