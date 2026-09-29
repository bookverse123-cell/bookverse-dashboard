import { Topbar } from "@/components/dashboard/Topbar";
import { FinanceTabs } from "@/components/finance/FinanceTabs";
import {
  getFinanceMonthly,
  getFinanceBreakoutMonthly,
  getCafeteriaExpenses,
  getCafeteriaSales,
  getExpenditures,
  getMembershipMonthly,
  getMembershipPayments,
  getLockerAllocationFinanceRows,
} from "@/lib/data";

export default async function FinancePage() {
  const [
    monthly,
    breakoutMonthly,
    expenses,
    sales,
    expenditures,
    membershipMonthly,
    membershipPayments,
    lockerAllocations,
  ] = await Promise.all([
    getFinanceMonthly(),
    getFinanceBreakoutMonthly(),
    getCafeteriaExpenses(),
    getCafeteriaSales(),
    getExpenditures(),
    getMembershipMonthly(),
    getMembershipPayments(),
    getLockerAllocationFinanceRows(),
  ]);

  return (
    <>
      <Topbar title="Finance" subtitle="Select a billing cycle to verify all finances" />
      <div className="space-y-6 px-6 py-6 lg:px-10">
        <FinanceTabs
          monthly={monthly.data}
          breakoutMonthly={breakoutMonthly.data}
          expenses={expenses.data}
          sales={sales.data}
          expenditures={expenditures.data}
          membershipMonthly={membershipMonthly.data}
          membershipPayments={membershipPayments.data}
          lockerAllocations={lockerAllocations.data}
        />
      </div>
    </>
  );
}
