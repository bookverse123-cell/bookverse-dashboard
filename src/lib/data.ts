import { createClient } from "@/lib/supabase/server";
import type { SeatStatus, MembershipPlan, MembershipRow, LedgerRow, DailyPassRow } from "@/lib/types";

export function isSupabaseConfigured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR_SUPABASE")
  );
}

export async function getSeatStatuses(): Promise<{ seats: SeatStatus[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seat_status")
    .select("*")
    .order("seat_code");

  if (error || !data) return { seats: [] };
  return { seats: data as SeatStatus[] };
}

export async function getKPIs() {
  const { seats } = await getSeatStatuses();

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
  };
}

export async function getFinanceMonthly() {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [
    { data: memberships },
    { data: cafeteriaSales },
    { data: cafeteriaExpenses },
    { data: investmentRows },
    { data: dailyPassRows },
  ] = await Promise.all([
    supabase.from("memberships").select("start_date, amount_paid").lte("start_date", todayStr),
    supabase.from("cafeteria_sales").select("sale_date, amount"),
    supabase.from("cafeteria_expenses").select("expense_date, amount"),
    supabase.from("investments").select("investment_date, amount"),
    supabase.from("daily_passes").select("date, amount"),
  ]);

  if (!memberships) return { data: [] };

  type Row = {
    month: string;
    membershipRevenue: number;
    cafeteriaRevenue: number;
    cafeteriaExpense: number;
    investment: number;
  };

  const map = new Map<string, Row>();

  function getEntry(dateStr: string): Row {
    const key = dateStr.slice(0, 7);
    if (!map.has(key)) {
      map.set(key, {
        month: new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short" }),
        membershipRevenue: 0,
        cafeteriaRevenue: 0,
        cafeteriaExpense: 0,
        investment: 0,
      });
    }
    return map.get(key)!;
  }

  for (const m of memberships) {
    getEntry(m.start_date).membershipRevenue += Number(m.amount_paid);
  }
  for (const s of cafeteriaSales ?? []) {
    getEntry(s.sale_date).cafeteriaRevenue += Number(s.amount);
  }
  for (const e of cafeteriaExpenses ?? []) {
    getEntry(e.expense_date).cafeteriaExpense += Number(e.amount);
  }
  for (const inv of investmentRows ?? []) {
    getEntry(inv.investment_date).investment += Number(inv.amount);
  }
  for (const p of dailyPassRows ?? []) {
    getEntry(p.date).membershipRevenue += Number(p.amount);
  }

  const sortedKeys = Array.from(map.keys()).sort();
  return { data: sortedKeys.map((k) => map.get(k)!) };
}

export async function getDailyPasses(): Promise<{ data: DailyPassRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_passes")
    .select("id, full_name, phone, date, amount")
    .order("date", { ascending: false })
    .limit(200);

  if (error || !data) return { data: [] };

  return {
    data: data.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      phone: r.phone,
      date: r.date,
      amount: Number(r.amount),
    })),
  };
}

export async function getExpenseBreakdown() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafeteria_expenses")
    .select("category, amount");

  if (error || !data || data.length === 0) return { data: [] };

  const map = new Map<string, number>();
  for (const row of data) {
    map.set(row.category, (map.get(row.category) ?? 0) + Number(row.amount));
  }

  return {
    data: Array.from(map.entries()).map(([category, amount]) => ({ category, amount })),
  };
}

export async function getCafeteriaExpenses(): Promise<{ data: LedgerRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafeteria_expenses")
    .select("id, description, category, amount, expense_date")
    .order("expense_date", { ascending: false })
    .limit(50);

  if (error || !data) return { data: [] };

  return {
    data: data.map((r) => ({
      id: r.id,
      description: r.description ?? "",
      category: r.category,
      amount: Number(r.amount),
      date: r.expense_date,
    })),
  };
}

export async function getCafeteriaSales(): Promise<{ data: LedgerRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafeteria_sales")
    .select("id, description, amount, sale_date")
    .order("sale_date", { ascending: false })
    .limit(50);

  if (error || !data) return { data: [] };

  return {
    data: data.map((r) => ({
      id: r.id,
      description: r.description ?? "",
      category: "Sale",
      amount: Number(r.amount),
      date: r.sale_date,
    })),
  };
}

export async function getInvestments(): Promise<{ data: LedgerRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .select("id, title, category, amount, investment_date")
    .order("investment_date", { ascending: false })
    .limit(50);

  if (error || !data) return { data: [] };

  return {
    data: data.map((r) => ({
      id: r.id,
      description: r.title,
      category: r.category,
      amount: Number(r.amount),
      date: r.investment_date,
    })),
  };
}

export async function getMembershipPlans(): Promise<{ data: MembershipPlan[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("is_active", true)
    .order("zone")
    .order("duration_months");

  if (error || !data) return { data: [] };
  return { data: data as MembershipPlan[] };
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

export async function getMemberships(): Promise<{ data: MembershipRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "id, start_date, end_date, status, amount_paid, members(id, full_name, phone, email), seats(seat_code, zone), membership_plans(label)"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return { data: [] };

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

  return { data: rows };
}

export async function getExpiringMemberships() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expiring_memberships")
    .select("*")
    .order("days_left");

  if (error || !data) return { data: [] };

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
  };
}
