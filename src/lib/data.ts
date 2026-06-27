import { createClient } from "@/lib/supabase/server";
import {
  getDemoSeatStatuses,
  getDemoKPIs,
  getDemoFinanceMonthly,
  getDemoExpenseBreakdown,
  getDemoRecentMembers,
  getDemoMembershipPlans,
  getDemoMemberships,
  getDemoCafeteriaExpenses,
  getDemoCafeteriaSales,
  getDemoInvestments,
  type SeatStatus,
  type MembershipPlan,
  type MembershipRow,
  type LedgerRow,
} from "@/lib/demo-data";

export function isSupabaseConfigured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR_SUPABASE")
  );
}

export async function getSeatStatuses(): Promise<{
  seats: SeatStatus[];
  isDemo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { seats: getDemoSeatStatuses(), isDemo: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seat_status")
    .select("*")
    .order("seat_code");

  if (error || !data) {
    return { seats: getDemoSeatStatuses(), isDemo: true };
  }

  return { seats: data as SeatStatus[], isDemo: false };
}

export async function getKPIs() {
  const { seats, isDemo } = await getSeatStatuses();

  if (isDemo) {
    return { ...getDemoKPIs(), isDemo };
  }

  const library = seats.filter((s) => s.zone === "library");
  const lounge = seats.filter((s) => s.zone === "lounge");
  const occupiedLibrary = library.filter((s) => s.occupancy_status !== "available").length;
  const occupiedLounge = lounge.filter((s) => s.occupancy_status !== "available").length;
  const expiringSoon = seats.filter(
    (s) => s.days_until_expiry !== null && s.days_until_expiry >= 0 && s.days_until_expiry <= 3
  ).length;

  return {
    libraryTotal: library.length,
    libraryOccupied: occupiedLibrary,
    loungeTotal: lounge.length,
    loungeOccupied: occupiedLounge,
    expiringSoon,
    activeMembers: seats.filter((s) => s.full_name).length,
    isDemo,
  };
}

export async function getFinanceMonthly() {
  if (!isSupabaseConfigured()) {
    return { data: getDemoFinanceMonthly(), isDemo: true };
  }

  const supabase = await createClient();
  const [{ data: revenue }, { data: expenses }] = await Promise.all([
    supabase.from("monthly_revenue").select("*"),
    supabase.from("monthly_expenses").select("*"),
  ]);

  if (!revenue || !expenses) {
    return { data: getDemoFinanceMonthly(), isDemo: true };
  }

  type Row = {
    month: string;
    membershipRevenue: number;
    cafeteriaRevenue: number;
    cafeteriaExpense: number;
    investment: number;
  };

  const monthsMap = new Map<string, Row>();

  const monthLabel = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short" });

  for (const row of revenue) {
    const key = row.month;
    const entry =
      monthsMap.get(key) ??
      ({ month: monthLabel(key), membershipRevenue: 0, cafeteriaRevenue: 0, cafeteriaExpense: 0, investment: 0 } as Row);
    if (row.source === "membership") entry.membershipRevenue += Number(row.total);
    if (row.source === "cafeteria") entry.cafeteriaRevenue += Number(row.total);
    monthsMap.set(key, entry);
  }

  for (const row of expenses) {
    const key = row.month;
    const entry =
      monthsMap.get(key) ??
      ({ month: monthLabel(key), membershipRevenue: 0, cafeteriaRevenue: 0, cafeteriaExpense: 0, investment: 0 } as Row);
    if (row.source === "cafeteria") entry.cafeteriaExpense += Number(row.total);
    if (row.source === "investment") entry.investment += Number(row.total);
    monthsMap.set(key, entry);
  }

  const sortedKeys = Array.from(monthsMap.keys()).sort();
  const data = sortedKeys.map((k) => monthsMap.get(k)!);

  return { data, isDemo: false };
}

export async function getExpenseBreakdown() {
  if (!isSupabaseConfigured()) {
    return { data: getDemoExpenseBreakdown(), isDemo: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafeteria_expenses")
    .select("category, amount");

  if (error || !data) {
    return { data: getDemoExpenseBreakdown(), isDemo: true };
  }
  if (data.length === 0) return { data: [], isDemo: false };

  const map = new Map<string, number>();
  for (const row of data) {
    map.set(row.category, (map.get(row.category) ?? 0) + Number(row.amount));
  }

  return {
    data: Array.from(map.entries()).map(([category, amount]) => ({ category, amount })),
    isDemo: false,
  };
}

export async function getCafeteriaExpenses(): Promise<{ data: LedgerRow[]; isDemo: boolean }> {
  if (!isSupabaseConfigured()) {
    return { data: getDemoCafeteriaExpenses(), isDemo: true };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafeteria_expenses")
    .select("id, description, category, amount, expense_date")
    .order("expense_date", { ascending: false })
    .limit(50);

  if (error || !data) return { data: getDemoCafeteriaExpenses(), isDemo: true };

  return {
    data: data.map((r) => ({
      id: r.id,
      description: r.description ?? "",
      category: r.category,
      amount: Number(r.amount),
      date: r.expense_date,
    })),
    isDemo: false,
  };
}

export async function getCafeteriaSales(): Promise<{ data: LedgerRow[]; isDemo: boolean }> {
  if (!isSupabaseConfigured()) {
    return { data: getDemoCafeteriaSales(), isDemo: true };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafeteria_sales")
    .select("id, description, amount, sale_date")
    .order("sale_date", { ascending: false })
    .limit(50);

  if (error || !data) return { data: getDemoCafeteriaSales(), isDemo: true };

  return {
    data: data.map((r) => ({
      id: r.id,
      description: r.description ?? "",
      category: "Sale",
      amount: Number(r.amount),
      date: r.sale_date,
    })),
    isDemo: false,
  };
}

export async function getInvestments(): Promise<{ data: LedgerRow[]; isDemo: boolean }> {
  if (!isSupabaseConfigured()) {
    return { data: getDemoInvestments(), isDemo: true };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .select("id, title, category, amount, investment_date")
    .order("investment_date", { ascending: false })
    .limit(50);

  if (error || !data) return { data: getDemoInvestments(), isDemo: true };

  return {
    data: data.map((r) => ({
      id: r.id,
      description: r.title,
      category: r.category,
      amount: Number(r.amount),
      date: r.investment_date,
    })),
    isDemo: false,
  };
}

export async function getMembershipPlans(): Promise<{
  data: MembershipPlan[];
  isDemo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { data: getDemoMembershipPlans(), isDemo: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("is_active", true)
    .order("zone")
    .order("duration_months");

  if (error || !data || data.length === 0) {
    return { data: getDemoMembershipPlans(), isDemo: true };
  }

  return { data: data as MembershipPlan[], isDemo: false };
}

type MembershipJoinRow = {
  id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  amount_paid: number;
  members: { id: string; full_name: string; phone: string; email: string | null } | null;
  seats: { seat_code: string; zone: "library" | "lounge" } | null;
  membership_plans: { label: string } | null;
};

export async function getMemberships(): Promise<{
  data: MembershipRow[];
  isDemo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { data: getDemoMemberships(), isDemo: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "id, start_date, end_date, status, amount_paid, members(id, full_name, phone, email), seats(seat_code, zone), membership_plans(label)"
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { data: getDemoMemberships(), isDemo: true };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: MembershipRow[] = (data as unknown as MembershipJoinRow[])
    .filter((row) => row.members && row.seats)
    .map((row) => {
      const end = new Date(row.end_date);
      const days = Math.round((end.getTime() - today.getTime()) / 86400000);
      return {
        membership_id: row.id,
        member_id: row.members!.id,
        full_name: row.members!.full_name,
        phone: row.members!.phone,
        email: row.members!.email,
        seat_code: row.seats!.seat_code,
        zone: row.seats!.zone,
        plan_label: row.membership_plans?.label ?? "—",
        amount_paid: Number(row.amount_paid),
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        days_until_expiry: days,
      };
    });

  return { data: rows, isDemo: false };
}

export async function getExpiringMemberships() {
  if (!isSupabaseConfigured()) {
    return { data: getDemoRecentMembers(), isDemo: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expiring_memberships")
    .select("*")
    .order("days_left");

  if (error || !data) {
    return { data: getDemoRecentMembers(), isDemo: true };
  }

  return {
    data: data.map((row) => ({
      member_id: row.member_id,
      full_name: row.full_name,
      phone: row.phone,
      seat_code: row.seat_code,
      zone: row.zone,
      start_date: "",
      end_date: row.end_date,
      days_until_expiry: row.days_left,
    })),
    isDemo: false,
  };
}
