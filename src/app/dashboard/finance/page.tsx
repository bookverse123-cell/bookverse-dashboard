import { TrendingUp, TrendingDown, PiggyBank, Percent } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { FinanceTabs } from "@/components/finance/FinanceTabs";
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

  const totalRevenue = monthly.data.reduce(
    (sum, m) => sum + m.membershipRevenue + m.cafeteriaRevenue,
    0
  );
  const totalExpenses = monthly.data.reduce((sum, m) => sum + m.cafeteriaExpense, 0);
  const totalInvestment = monthly.data.reduce((sum, m) => sum + m.investment, 0);
  const profit = totalRevenue - totalExpenses - totalInvestment;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  return (
    <>
      <Topbar title="Finance" subtitle="All-time revenue, expenses, and investments" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            icon={<TrendingUp size={18} />}
            label="Total revenue (all time)"
            value={`₹${totalRevenue.toLocaleString("en-IN")}`}
            accent="sage"
          />
          <KPICard
            icon={<TrendingDown size={18} />}
            label="Total expenses (all time)"
            value={`₹${totalExpenses.toLocaleString("en-IN")}`}
            accent="terracotta"
            delay={0.05}
          />
          <KPICard
            icon={<PiggyBank size={18} />}
            label="Net profit (all time)"
            value={`₹${profit.toLocaleString("en-IN")}`}
            accent="brass"
            delay={0.1}
          />
          <KPICard
            icon={<Percent size={18} />}
            label="Profit margin"
            value={`${margin}`}
            suffix="%"
            accent="ink"
            delay={0.15}
          />
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
