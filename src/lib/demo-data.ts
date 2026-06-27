// Demo data — used as a graceful fallback so the dashboard renders nicely
// before Supabase is connected. Shapes mirror the `seat_status` view and
// other Supabase queries used throughout the app, so swapping to real data
// is seamless once env vars are set.

export type Zone = "library" | "lounge";
export type OccupancyStatus = "available" | "occupied" | "expired";

export type SeatStatus = {
  seat_id: string;
  seat_code: string;
  zone: Zone;
  pos_x: number;
  pos_y: number;
  is_active: boolean;
  membership_id: string | null;
  start_date: string | null;
  end_date: string | null;
  membership_status: string | null;
  member_id: string | null;
  full_name: string | null;
  phone: string | null;
  photo_url: string | null;
  occupancy_status: OccupancyStatus;
  days_until_expiry: number | null;
};

const DEMO_NAMES = [
  "Aarav Mehta", "Priya Sharma", "Rohan Kapoor", "Ananya Singh", "Vikram Rao",
  "Ishita Verma", "Karan Malhotra", "Sneha Joshi", "Aditya Nair", "Pooja Reddy",
  "Rahul Gupta", "Neha Chawla", "Siddharth Bose", "Tanya Khanna", "Arjun Pillai",
  "Meera Iyer", "Yash Agarwal", "Divya Menon", "Nikhil Saxena", "Riya Kapoor",
  "Sahil Khurana", "Kavya Pillai", "Manish Tiwari", "Shreya Dutta", "Akash Jain",
  "Simran Kaur", "Rohit Bansal", "Anjali Desai", "Varun Chopra", "Nisha Goel",
];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildLibrarySeats(): { seat_code: string; pos_x: number; pos_y: number }[] {
  const seats: { seat_code: string; pos_x: number; pos_y: number }[] = [];
  let seatNum = 1;
  for (let ty = 1; ty <= 5; ty++) {
    for (let tx = 1; tx <= 5; tx++) {
      for (let sy = 1; sy <= 2; sy++) {
        for (let sx = 1; sx <= 2; sx++) {
          seats.push({
            seat_code: `L-${String(seatNum).padStart(3, "0")}`,
            pos_x: 8 + (tx - 1) * 12 + (sx - 1) * 4,
            pos_y: 14 + (ty - 1) * 14 + (sy - 1) * 5,
          });
          seatNum++;
        }
      }
    }
  }
  return seats;
}

function buildLoungeSeats(): { seat_code: string; pos_x: number; pos_y: number }[] {
  const seats: { seat_code: string; pos_x: number; pos_y: number }[] = [];
  let seatNum = 1;
  for (let ty = 1; ty <= 5; ty++) {
    for (let tx = 1; tx <= 2; tx++) {
      for (let sx = 1; sx <= 2; sx++) {
        seats.push({
          seat_code: `P-${String(seatNum).padStart(2, "0")}`,
          pos_x: 78 + (tx - 1) * 12 + (sx - 1) * 5,
          pos_y: 14 + (ty - 1) * 14,
        });
        seatNum++;
      }
    }
  }
  return seats;
}

export function getDemoSeatStatuses(): SeatStatus[] {
  const today = new Date();
  const library = buildLibrarySeats().map((s, i) => ({ ...s, zone: "library" as Zone, idx: i }));
  const lounge = buildLoungeSeats().map((s, i) => ({ ...s, zone: "lounge" as Zone, idx: i + 200 }));
  const all = [...library, ...lounge];

  return all.map((seat, i) => {
    const r = seededRandom(i * 7.13);
    const isActive = true;

    // ~58% occupancy overall
    if (r > 0.58) {
      return {
        seat_id: `demo-${seat.seat_code}`,
        seat_code: seat.seat_code,
        zone: seat.zone,
        pos_x: seat.pos_x,
        pos_y: seat.pos_y,
        is_active: isActive,
        membership_id: null,
        start_date: null,
        end_date: null,
        membership_status: null,
        member_id: null,
        full_name: null,
        phone: null,
        photo_url: null,
        occupancy_status: "available" as OccupancyStatus,
        days_until_expiry: null,
      };
    }

    const name = DEMO_NAMES[i % DEMO_NAMES.length];
    // spread expiry: some overdue, some expiring in 1-3 days, most further out
    const dayOffset = Math.floor(seededRandom(i * 3.71) * 60) - 2; // -2..57
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + dayOffset);
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - (i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 1));

    const occupancy_status: OccupancyStatus = dayOffset < 0 ? "expired" : "occupied";

    return {
      seat_id: `demo-${seat.seat_code}`,
      seat_code: seat.seat_code,
      zone: seat.zone,
      pos_x: seat.pos_x,
      pos_y: seat.pos_y,
      is_active: isActive,
      membership_id: `demo-membership-${i}`,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      membership_status: "active",
      member_id: `demo-member-${i}`,
      full_name: name,
      phone: `+9198${String(10000000 + i * 137).slice(0, 8)}`,
      photo_url: null,
      occupancy_status,
      days_until_expiry: dayOffset,
    };
  });
}

export type MembershipRow = {
  membership_id: string;
  member_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  seat_code: string;
  zone: Zone;
  plan_label: string;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  days_until_expiry: number;
};

export function getDemoMemberships(): MembershipRow[] {
  const seats = getDemoSeatStatuses().filter((s) => s.full_name);
  return seats.map((s, i) => {
    const months = i % 3 === 0 ? 6 : i % 2 === 0 ? 3 : 1;
    const price = s.zone === "library"
      ? { 1: 1500, 3: 4000, 6: 7500 }[months]!
      : { 1: 3000, 3: 8000, 6: 15000 }[months]!;
    return {
      membership_id: s.membership_id!,
      member_id: s.member_id!,
      full_name: s.full_name!,
      phone: s.phone!,
      email: null,
      seat_code: s.seat_code,
      zone: s.zone,
      plan_label: `${s.zone === "library" ? "Library" : "Premium Lounge"} — ${months} Month${months > 1 ? "s" : ""}`,
      amount_paid: price,
      start_date: s.start_date!,
      end_date: s.end_date!,
      status: s.occupancy_status === "expired" ? "expired" : "active",
      days_until_expiry: s.days_until_expiry!,
    };
  });
}

export type LedgerRow = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
};

function recentDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function getDemoCafeteriaExpenses(): LedgerRow[] {
  return [
    { id: "demo-exp-1", description: "Weekly grocery restock", category: "Groceries & Snacks", amount: 6200, date: recentDate(1) },
    { id: "demo-exp-2", description: "Milk & coffee supplies", category: "Groceries & Snacks", amount: 2400, date: recentDate(3) },
    { id: "demo-exp-3", description: "Electricity bill", category: "Utilities", amount: 8400, date: recentDate(5) },
    { id: "demo-exp-4", description: "AC servicing", category: "Maintenance", amount: 3200, date: recentDate(8) },
    { id: "demo-exp-5", description: "Staff salaries", category: "Staff Wages", amount: 42000, date: recentDate(10) },
    { id: "demo-exp-6", description: "Instagram ad campaign", category: "Marketing", amount: 3000, date: recentDate(12) },
    { id: "demo-exp-7", description: "Water cans", category: "Groceries & Snacks", amount: 1100, date: recentDate(14) },
    { id: "demo-exp-8", description: "Internet bill", category: "Utilities", amount: 1999, date: recentDate(16) },
  ];
}

export function getDemoCafeteriaSales(): LedgerRow[] {
  return [
    { id: "demo-sale-1", description: "Coffee & snacks counter", category: "Daily sales", amount: 1850, date: recentDate(0) },
    { id: "demo-sale-2", description: "Coffee & snacks counter", category: "Daily sales", amount: 2100, date: recentDate(1) },
    { id: "demo-sale-3", description: "Coffee & snacks counter", category: "Daily sales", amount: 1640, date: recentDate(2) },
    { id: "demo-sale-4", description: "Coffee & snacks counter", category: "Daily sales", amount: 2390, date: recentDate(3) },
    { id: "demo-sale-5", description: "Coffee & snacks counter", category: "Daily sales", amount: 1980, date: recentDate(4) },
    { id: "demo-sale-6", description: "Coffee & snacks counter", category: "Daily sales", amount: 2230, date: recentDate(5) },
    { id: "demo-sale-7", description: "Coffee & snacks counter", category: "Daily sales", amount: 1760, date: recentDate(6) },
  ];
}

export function getDemoInvestments(): LedgerRow[] {
  return [
    { id: "demo-inv-1", description: "New reading chairs (x20)", category: "Furniture", amount: 35000, date: recentDate(40) },
    { id: "demo-inv-2", description: "Premium lounge sofas", category: "Furniture", amount: 18000, date: recentDate(15) },
    { id: "demo-inv-3", description: "Air purifiers", category: "Equipment", amount: 9500, date: recentDate(60) },
    { id: "demo-inv-4", description: "Signage & branding", category: "Branding", amount: 6000, date: recentDate(90) },
  ];
}

export function getDemoKPIs() {
  const seats = getDemoSeatStatuses();
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

export function getDemoFinanceMonthly() {
  // last 6 months
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month, i) => ({
    month,
    membershipRevenue: 95000 + i * 8000 + (i % 2 === 0 ? 4000 : -2000),
    cafeteriaRevenue: 22000 + i * 1500,
    cafeteriaExpense: 14000 + i * 1200,
    investment: i === 1 ? 35000 : i === 4 ? 18000 : 0,
  }));
}

export function getDemoExpenseBreakdown() {
  return [
    { category: "Groceries & Snacks", amount: 28000 },
    { category: "Utilities", amount: 14500 },
    { category: "Maintenance", amount: 9200 },
    { category: "Staff Wages", amount: 42000 },
    { category: "Marketing", amount: 6000 },
  ];
}

export function getDemoRecentMembers() {
  const seats = getDemoSeatStatuses().filter((s) => s.full_name);
  return seats.slice(0, 8).map((s) => ({
    member_id: s.member_id!,
    full_name: s.full_name!,
    phone: s.phone!,
    seat_code: s.seat_code,
    zone: s.zone,
    start_date: s.start_date!,
    end_date: s.end_date!,
    days_until_expiry: s.days_until_expiry!,
  }));
}

export type MembershipPlan = {
  id: string;
  zone: Zone;
  duration_months: 1 | 3 | 6;
  price: number;
  label: string;
};

export function getDemoMembershipPlans(): MembershipPlan[] {
  return [
    { id: "demo-plan-l1", zone: "library", duration_months: 1, price: 1500, label: "Library — 1 Month" },
    { id: "demo-plan-l3", zone: "library", duration_months: 3, price: 4000, label: "Library — 3 Months" },
    { id: "demo-plan-l6", zone: "library", duration_months: 6, price: 7500, label: "Library — 6 Months" },
    { id: "demo-plan-p1", zone: "lounge", duration_months: 1, price: 3000, label: "Premium Lounge — 1 Month" },
    { id: "demo-plan-p3", zone: "lounge", duration_months: 3, price: 8000, label: "Premium Lounge — 3 Months" },
    { id: "demo-plan-p6", zone: "lounge", duration_months: 6, price: 15000, label: "Premium Lounge — 6 Months" },
  ];
}
