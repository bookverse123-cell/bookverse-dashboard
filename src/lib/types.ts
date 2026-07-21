import type { BatchOption } from "@/lib/batches";

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

export type MembershipRow = {
  membership_id: string;
  member_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  seat_code: string;
  zone: Zone | null;
  is_unassigned: boolean;
  duration_months: number;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  days_until_expiry: number;
  batch: BatchOption | null;
  remarks: string | null;
};

export type PaymentEntry = {
  amount: number;
  payment_date: string;
  method: string;
  cash_amount: number | null;
  upi_amount: number | null;
};

export type MemberHistoryEntry = {
  membership_id: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  amount_paid: number;
  batch: BatchOption | null;
  status: "active" | "expired" | "cancelled";
  remarks: string | null;
  payments: PaymentEntry[];
};

export type MemberDetail = {
  member_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  memberships: MemberHistoryEntry[];
};

export type LedgerRow = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  payment_method?: "cash" | "upi" | "cash_upi";
  cash_amount?: number | null;
  upi_amount?: number | null;
};

export type DailyPassRow = {
  id: string;
  full_name: string;
  phone: string;
  date: string;
  amount: number;
};
