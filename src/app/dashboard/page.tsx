import { Armchair, Sofa, Users, AlertTriangle } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { OccupancyDonut } from "@/components/dashboard/OccupancyDonut";
import { RevenueChart } from "@/components/finance/RevenueChart";
import { RenewalsList } from "@/components/dashboard/RenewalsList";
import { getKPIs, getFinanceMonthly, getExpiringMemberships, getExpenditures } from "@/lib/data";

export default async function DashboardOverviewPage() {
  const [kpis, finance, renewals, expenditures] = await Promise.all([
    getKPIs(),
    getFinanceMonthly(),
    getExpiringMemberships(),
    getExpenditures(),
  ]);

  const latestMonth = finance.data[finance.data.length - 1];
  const monthlyRevenue = latestMonth
    ? latestMonth.membershipRevenue + latestMonth.cafeteriaRevenue + (latestMonth.lockerRevenue ?? 0)
    : 0;
  const monthlyProfit = latestMonth
    ? latestMonth.membershipRevenue +
      (latestMonth.lockerRevenue ?? 0) +
      latestMonth.cafeteriaRevenue -
      latestMonth.cafeteriaExpense -
      latestMonth.expenditure
    : 0;

  return (
    <>
      <Topbar title="Overview" subtitle="Today at a glance" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={<Armchair size={18} />}
            label="Reading hall occupancy"
            value={`${kpis.libraryOccupied}/${kpis.libraryTotal}`}
            accent="terracotta"
            delay={0}
          />
          <KPICard
            icon={<Sofa size={18} />}
            label="Premium lounge occupancy"
            value={`${kpis.loungeOccupied}/${kpis.loungeTotal}`}
            accent="brass"
            delay={0.05}
          />
          <KPICard
            icon={<Users size={18} />}
            label="Active members"
            value={`${kpis.activeMembers}`}
            accent="sage"
            delay={0.1}
          />
          <KPICard
            icon={<AlertTriangle size={18} />}
            label="Renewals due (≤3 days)"
            value={`${kpis.expiringSoon}`}
            accent="ink"
            delay={0.15}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={finance.data} expenditures={expenditures.data} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <OccupancyDonut
              label="Reading hall"
              occupied={kpis.libraryOccupied}
              total={kpis.libraryTotal}
              delay={0.15}
            />
            <OccupancyDonut
              label="Premium lounge"
              occupied={kpis.loungeOccupied}
              total={kpis.loungeTotal}
              delay={0.2}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-ink-line/10 bg-white/60 p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-text/40">
              This month
            </p>
            <div className="mt-3 grid grid-cols-2 gap-6 sm:grid-cols-2">
              <div>
                <p className="font-display text-2xl text-ink-text">
                  ₹{monthlyRevenue.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-ink-text/50">Total revenue (membership + café)</p>
              </div>
              <div>
                <p className="font-display text-2xl text-sage">
                  ₹{monthlyProfit.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-ink-text/50">Net profit after expenses &amp; expenditures</p>
              </div>
            </div>
          </div>
          <RenewalsList renewals={renewals.data} />
        </div>
      </div>
    </>
  );
}
