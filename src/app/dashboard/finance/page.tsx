import { TrendingUp, TrendingDown, PiggyBank, Percent } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { FinanceTabs } from "@/components/finance/FinanceTabs";
import { DemoBanner } from "@/components/dashboard/DemoBanner";
import {
  getFinanceMonthly,
  getExpenseBreakdown,
  getCafeteriaExpenses,
  getCafeteriaSales,
  getInvestments,
} from "@/lib/data";

export default async function FinancePage() {
  const [monthly, breakdown, expenses, sales, investments] = await Promise.all([
    getFinanceMonthly(),
    getExpenseBreakdown(),
    getCafeteriaExpenses(),
    getCafeteriaSales(),
    getInvestments(),
  ]);

  const latest = monthly.data[monthly.data.length - 1];
  const revenue = latest ? latest.membershipRevenue + latest.cafeteriaRevenue : 0;
  const expenseTotal = latest ? latest.cafeteriaExpense : 0;
  const profit = revenue - expenseTotal - (latest?.investment ?? 0);
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const isDemo = monthly.isDemo || breakdown.isDemo || expenses.isDemo || sales.isDemo || investments.isDemo;

  return (
    <>
      <Topbar title="Finance" subtitle="Revenue, expenses, and investments at a glance" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        {isDemo && <DemoBanner />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard icon={<TrendingUp size={18} />} label="This month's revenue" value={`₹${revenue.toLocaleString("en-IN")}`} accent="sage" />
          <KPICard icon={<TrendingDown size={18} />} label="This month's expenses" value={`₹${expenseTotal.toLocaleString("en-IN")}`} accent="terracotta" delay={0.05} />
          <KPICard icon={<PiggyBank size={18} />} label="Net profit" value={`₹${profit.toLocaleString("en-IN")}`} accent="brass" delay={0.1} />
          <KPICard icon={<Percent size={18} />} label="Profit margin" value={`${margin}`} suffix="%" accent="ink" delay={0.15} />
        </div>

        <FinanceTabs
          monthly={monthly.data}
          expenseBreakdown={breakdown.data}
          expenses={expenses.data}
          sales={sales.data}
          investments={investments.data}
        />
      </div>
    </>
  );
}
