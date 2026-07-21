import { createClient } from "@/lib/supabase/server";
import type { SeatStatus, MembershipRow, LedgerRow, DailyPassRow, LockerStatus } from "@/lib/types";

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
    .eq("is_active", true)
    .order("seat_code");

  if (error || !data) return { seats: [] };
  return { seats: data as SeatStatus[] };
}

export async function getLockerStatuses(): Promise<{ lockers: LockerStatus[] }> {
  if (!isSupabaseConfigured()) {
    return {
      lockers: Array.from({ length: 27 }, (_, index) => ({
        locker_id: `demo-locker-${index + 1}`,
        locker_code: `LK-${String(index + 1).padStart(2, "0")}`,
        is_active: true,
        allocation_id: null,
        member_id: null,
        full_name: null,
        phone: null,
        assigned_at: null,
        allocation_status: null,
      })),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locker_status")
    .select("*")
    .eq("is_active", true)
    .order("locker_code");

  if (error || !data) return { lockers: [] };
  return { lockers: data as LockerStatus[] };
}

export async function getKPIs() {
  const { seats } = await getSeatStatuses();
  const supabase = await createClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: activeMembershipRows } = await supabase
    .from("memberships")
    .select("member_id")
    .eq("status", "active")
    .gte("end_date", todayStr);

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
    activeMembers:
      activeMembershipRows?.length
        ? new Set(activeMembershipRows.map((row) => row.member_id)).size
        : seats.filter((s) => s.full_name).length,
  };
}

export async function getFinanceMonthly() {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [
    { data: membershipPayments },
    { data: cafeteriaSales },
    { data: cafeteriaExpenses },
    { data: expenditureRows },
    { data: dailyPassRows },
  ] = await Promise.all([
    supabase.from("payments").select("payment_date, amount").lte("payment_date", todayStr),
    supabase.from("cafeteria_sales").select("sale_date, amount"),
    supabase.from("cafeteria_expenses").select("expense_date, amount"),
    supabase.from("investments").select("investment_date, amount"),
    supabase.from("daily_passes").select("date, amount"),
  ]);

  if (!membershipPayments) return { data: [] };

  type Row = {
    monthKey: string;
    month: string;
    membershipRevenue: number;
    cafeteriaRevenue: number;
    cafeteriaExpense: number;
    expenditure: number;
  };

  const map = new Map<string, Row>();

  function getEntry(dateStr: string): Row {
    const key = dateStr.slice(0, 7);
    if (!map.has(key)) {
      map.set(key, {
        monthKey: key,
        month: new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { month: "short" }),
        membershipRevenue: 0,
        cafeteriaRevenue: 0,
        cafeteriaExpense: 0,
        expenditure: 0,
      });
    }
    return map.get(key)!;
  }

  for (const payment of membershipPayments) {
    getEntry(payment.payment_date).membershipRevenue += Number(payment.amount);
  }
  for (const s of cafeteriaSales ?? []) {
    getEntry(s.sale_date).cafeteriaRevenue += Number(s.amount);
  }
  for (const e of cafeteriaExpenses ?? []) {
    getEntry(e.expense_date).cafeteriaExpense += Number(e.amount);
  }
  for (const item of expenditureRows ?? []) {
    getEntry(item.investment_date).expenditure += Number(item.amount);
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
  const [{ data: cafeteriaRows, error: cafeteriaError }, { data: expenditureRows, error: expenditureError }] = await Promise.all([
    supabase.from("cafeteria_expenses").select("category, amount"),
    supabase.from("investments").select("category, amount"),
  ]);

  if (cafeteriaError || expenditureError) return { data: [] };
  if (!cafeteriaRows?.length && !expenditureRows?.length) return { data: [] };

  const map = new Map<string, number>();
  for (const row of cafeteriaRows ?? []) {
    const key = `Café · ${row.category}`;
    map.set(key, (map.get(key) ?? 0) + Number(row.amount));
  }
  for (const row of expenditureRows ?? []) {
    const key = `Expenditure · ${row.category}`;
    map.set(key, (map.get(key) ?? 0) + Number(row.amount));
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

export async function getExpenditures(): Promise<{ data: LedgerRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("investments")
    .select("id, title, category, amount, investment_date, payment_method, cash_amount, upi_amount")
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
      payment_method:
        r.payment_method === "cash" || r.payment_method === "upi" || r.payment_method === "cash_upi"
          ? r.payment_method
          : undefined,
      cash_amount: r.cash_amount !== null ? Number(r.cash_amount) : null,
      upi_amount: r.upi_amount !== null ? Number(r.upi_amount) : null,
    })),
  };
}

type MembershipJoinRow = {
  id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  amount_paid: number;
  batch: import("./batches").BatchOption | null;
  remarks: string | null;
  members: { id: string; full_name: string; phone: string; email: string | null } | null;
  seats: { seat_code: string; zone: "library" | "lounge" } | null;
};

export async function getMemberships(): Promise<{ data: MembershipRow[] }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select(
      "id, start_date, end_date, status, amount_paid, batch, remarks, members(id, full_name, phone, email), seats(seat_code, zone)"
    )
    .order("created_at", { ascending: false });

  if (error || !data) return { data: [] };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: MembershipRow[] = (data as unknown as MembershipJoinRow[])
    .filter((row) => row.members)
    .map((row) => {
      const start = new Date(row.start_date);
      const end = new Date(row.end_date);
      const days = Math.round((end.getTime() - today.getTime()) / 86400000);
      const duration_months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return {
        membership_id: row.id,
        member_id: row.members!.id,
        full_name: row.members!.full_name,
        phone: row.members!.phone,
        email: row.members!.email,
        seat_code: row.seats?.seat_code ?? "Unassigned",
        zone: row.seats?.zone ?? null,
        is_unassigned: !row.seats,
        duration_months,
        amount_paid: Number(row.amount_paid),
        start_date: row.start_date,
        end_date: row.end_date,
        status: row.status,
        days_until_expiry: days,
        batch: row.batch,
        remarks: row.remarks,
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

export async function getMemberDetail(memberId: string): Promise<import("./types").MemberDetail | null> {
  if (!isSupabaseConfigured()) {
    return {
      member_id: memberId,
      full_name: "Ankit Sharma",
      phone: "+919417249290",
      email: "ankit@example.com",
      memberships: [
        {
          membership_id: "demo-1",
          start_date: "2026-04-15",
          end_date: "2026-05-15",
          duration_months: 1,
          amount_paid: 2200,
          batch: "Morning Batch",
          status: "expired",
          remarks: null,
          payments: [{ amount: 2200, payment_date: "2026-04-15", method: "cash", cash_amount: null, upi_amount: null }],
        },
        {
          membership_id: "demo-2",
          start_date: "2026-05-15",
          end_date: "2026-07-15",
          duration_months: 2,
          amount_paid: 4200,
          batch: "Evening Batch",
          status: "expired",
          remarks: "Paid in advance",
          payments: [{ amount: 4200, payment_date: "2026-05-15", method: "upi", cash_amount: null, upi_amount: null }],
        },
        {
          membership_id: "demo-3",
          start_date: "2026-07-15",
          end_date: "2026-08-15",
          duration_months: 1,
          amount_paid: 2300,
          batch: "24x7 Batch",
          status: "active",
          remarks: null,
          payments: [{ amount: 2300, payment_date: "2026-07-15", method: "cash", cash_amount: null, upi_amount: null }],
        },
      ],
    };
  }

  const supabase = await createClient();

  const [{ data: member, error: memberError }, { data: memberships, error: membershipsError }] = await Promise.all([
    supabase
      .from("members")
      .select("id, full_name, phone, email")
      .eq("id", memberId)
      .single(),
    supabase
      .from("memberships")
      .select("id, start_date, end_date, status, amount_paid, batch, remarks, payments(amount, payment_date, method, cash_amount, upi_amount)")
      .eq("member_id", memberId)
      .order("start_date", { ascending: true }),
  ]);

  if (memberError || !member || membershipsError || !memberships) return null;

  const historyEntries: import("./types").MemberHistoryEntry[] = memberships.map((m: {
    id: string;
    start_date: string;
    end_date: string;
    status: "active" | "expired" | "cancelled";
    amount_paid: number;
    batch: import("./batches").BatchOption | null;
    remarks: string | null;
    payments: { amount: number; payment_date: string; method: string; cash_amount: number | null; upi_amount: number | null }[];
  }) => {
    const start = new Date(m.start_date);
    const end = new Date(m.end_date);
    const duration_months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    return {
      membership_id: m.id,
      start_date: m.start_date,
      end_date: m.end_date,
      duration_months,
      amount_paid: Number(m.amount_paid),
      batch: m.batch,
      status: m.status,
      remarks: m.remarks,
      payments: (m.payments ?? []).map((p) => ({
        amount: Number(p.amount),
        payment_date: p.payment_date,
        method: p.method,
        cash_amount: p.cash_amount === null ? null : Number(p.cash_amount),
        upi_amount: p.upi_amount === null ? null : Number(p.upi_amount),
      })),
    };
  });

  return {
    member_id: member.id,
    full_name: member.full_name,
    phone: member.phone,
    email: member.email,
    memberships: historyEntries,
  };
}
