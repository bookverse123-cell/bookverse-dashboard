import { TrendingUp, TrendingDown, PiggyBank, Percent } from "lucide-react";
import { Topbar } from "@/components/dashboard/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { FinanceTabs } from "@/components/finance/FinanceTabs";
import {
  getFinanceMonthly,
  getExpenseBreakdown,
  getCafeteriaExpenses,
  getCafeteriaSales,
  getExpenditures,
} from "@/lib/data";

export default async function FinancePage() {
  const [monthly, breakdown, expenses, sales, expenditures] = await Promise.all([
    getFinanceMonthly(),
    getExpenseBreakdown(),
    getCafeteriaExpenses(),
    getCafeteriaSales(),
    getExpenditures(),
  ]);

  const totalRevenue = monthly.data.reduce(
    (sum, m) => sum + m.membershipRevenue + m.cafeteriaRevenue + (m.lockerRevenue ?? 0),
    0
  );
  const totalExpenses = monthly.data.reduce((sum, m) => sum + m.cafeteriaExpense, 0);
  const totalExpenditure = monthly.data.reduce((sum, m) => sum + m.expenditure, 0);
  const profit = totalRevenue - totalExpenses - totalExpenditure;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  return (
    <>
      <Topbar title="Finance" subtitle="All-time revenue, expenses, and expenditures" />
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
          expenditures={expenditures.data}
        />
      </div>
    </>
  );
}
