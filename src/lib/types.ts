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
  zone: Zone;
  plan_label: string;
  amount_paid: number;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  days_until_expiry: number;
};

export type LedgerRow = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
};

export type DailyPassRow = {
  id: string;
  full_name: string;
  phone: string;
  date: string;
  amount: number;
};

export type MembershipPlan = {
  id: string;
  zone: Zone;
  duration_months: 1 | 3 | 6;
  price: number;
  label: string;
};
