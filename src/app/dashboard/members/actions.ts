"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data";
import { isBatchOption, type BatchOption } from "@/lib/batches";
import { revalidatePath } from "next/cache";

const DEMO_ERROR = "Connect Supabase first (see README) — demo data is read-only.";

export type DailyPassInput = {
  full_name: string;
  phone: string;
  date: string;
  amount: number;
};

type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer" | "other" | "upi_cash";
type ConversionMode = "current_cycle" | "next_month";

const PAYMENT_METHODS = new Set(["cash", "upi", "card", "bank_transfer", "other", "upi_cash"]);

function addDaysToIsoDate(startDate: string, days: number) {
  const [year, month, day] = startDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function normalizePaymentDetails(input: {
  amount: number;
  paymentMethod: string;
  cashAmount?: number;
  upiAmount?: number;
}) {
  if (!PAYMENT_METHODS.has(input.paymentMethod)) {
    return { error: "Invalid payment method" };
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "Amount paid must be greater than zero" };
  }

  if (input.paymentMethod !== "upi_cash") {
    return {
      payment: {
        amount: input.amount,
        method: input.paymentMethod,
        cash_amount: null as number | null,
        upi_amount: null as number | null,
      },
    };
  }

  const cashAmount = Number(input.cashAmount ?? 0);
  const upiAmount = Number(input.upiAmount ?? 0);

  if (!Number.isFinite(cashAmount) || !Number.isFinite(upiAmount)) {
    return { error: "Enter valid split amounts for UPI and cash" };
  }

  if (cashAmount <= 0 || upiAmount <= 0) {
    return { error: "UPI + Cash requires both cash and UPI amounts" };
  }

  const total = Number((cashAmount + upiAmount).toFixed(2));
  const expected = Number(input.amount.toFixed(2));
  if (total !== expected) {
    return { error: "Cash + UPI must exactly match amount paid" };
  }

  return {
    payment: {
      amount: expected,
      method: input.paymentMethod,
      cash_amount: cashAmount,
      upi_amount: upiAmount,
    },
  };
}

export type AddUnassignedMembershipInput = {
  fullName: string;
  phone: string;
  email?: string;
  duration?: 1 | 2 | 3 | 4 | 6;
  startDate: string;
  endDate?: string;
  amountPaid: number;
  batch: BatchOption;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  upiAmount?: number;
  remarks?: string;
};

export async function addUnassignedMembership(input: AddUnassignedMembershipInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };
  if (!isBatchOption(input.batch)) return { error: "Invalid batch selected" };

  const paymentDetails = normalizePaymentDetails({
    amount: input.amountPaid,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();

  let memberId: string;
  const { data: existingMember } = await supabase
    .from("members")
    .select("id")
    .eq("phone", input.phone)
    .maybeSingle();

  if (existingMember) {
    memberId = existingMember.id;
  } else {
    const { data: newMember, error: memberError } = await supabase
      .from("members")
      .insert({
        full_name: input.fullName,
        phone: input.phone,
        email: input.email || null,
      })
      .select("id")
      .single();

    if (memberError || !newMember) {
      return { error: memberError?.message ?? "Failed to create member" };
    }
    memberId = newMember.id;
  }

  let endDate = input.endDate;
  if (endDate) {
    if (endDate <= input.startDate) {
      return { error: "End date must be after start date" };
    }
  } else {
    if (!input.duration) {
      return { error: "Duration is required" };
    }
    endDate = addDaysToIsoDate(input.startDate, input.duration * 30);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      member_id: memberId,
      seat_id: null,
      start_date: input.startDate,
      end_date: endDate,
      amount_paid: input.amountPaid,
      batch: input.batch,
      status: "active",
      remarks: input.remarks ?? null,
    })
    .select("id")
    .single();

  if (membershipError || !membership) {
    return { error: membershipError?.message ?? "Failed to create unassigned membership" };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    membership_id: membership.id,
    amount: payment.amount,
    payment_date: input.startDate,
    method: payment.method,
    cash_amount: payment.cash_amount,
    upi_amount: payment.upi_amount,
  });

  if (paymentError) {
    await supabase.from("memberships").delete().eq("id", membership.id);
    return { error: paymentError.message };
  }

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${memberId}`);
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/seats");
  return { success: true };
}

export async function addDailyPass(input: DailyPassInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Daily pass amount must be greater than zero" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("daily_passes").insert({
    full_name: input.full_name,
    phone: input.phone,
    date: input.date,
    amount,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDailyPass(id: string) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from("daily_passes").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMembershipBatch(input: {
  membershipId: string;
  memberId: string;
  batch: BatchOption;
}) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };
  if (!isBatchOption(input.batch)) return { error: "Invalid batch selected" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ batch: input.batch })
    .eq("id", input.membershipId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${input.memberId}`);
  revalidatePath("/dashboard/seats");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function convertMembershipTo24x7(input: {
  membershipId: string;
  memberId: string;
  seatId: string;
  mode: ConversionMode;
  startDate: string;
  duration?: 1 | 2 | 3 | 4 | 6;
  endDate?: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  upiAmount?: number;
  remarks?: string;
}) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  if (!input.startDate) return { error: "Start date is required" };
  if (!input.seatId) return { error: "Select a seat" };

  const paymentDetails = normalizePaymentDetails({
    amount: input.amountPaid,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("memberships")
    .select("id, member_id, seat_id, start_date, end_date, status, batch")
    .eq("id", input.membershipId)
    .maybeSingle();

  if (currentError || !current) return { error: "Membership not found" };
  if (current.member_id !== input.memberId) return { error: "Membership does not belong to the selected member" };
  if (current.status !== "active") return { error: "Only active memberships can be converted" };

  const { data: seat, error: seatError } = await supabase
    .from("seat_status")
    .select("seat_id, is_active, occupancy_status")
    .eq("seat_id", input.seatId)
    .maybeSingle();

  if (seatError || !seat) return { error: "Seat not found" };
  if (!seat.is_active) return { error: "Seat is not active" };
  if (seat.occupancy_status !== "available") return { error: "Selected seat is already occupied" };

  const currentEndDate = current.end_date;
  const today = new Date().toISOString().slice(0, 10);

  const newStartDate = input.startDate;
  let newEndDate = input.endDate ?? currentEndDate;

  if (input.mode === "current_cycle") {
    if (newStartDate > currentEndDate) {
      return { error: "Start date must be on or before the current batch end date" };
    }
    if (newStartDate < current.start_date) {
      return { error: "Start date cannot be before the current membership starts" };
    }
    newEndDate = currentEndDate;
  } else {
    if (newStartDate < currentEndDate) {
      return { error: "Next month conversion must start on or after the current batch end date" };
    }

    if (input.endDate) {
      if (input.endDate <= newStartDate) {
        return { error: "End date must be after start date" };
      }
      newEndDate = input.endDate;
    } else {
      if (!input.duration) {
        return { error: "Duration is required" };
      }
      newEndDate = addDaysToIsoDate(newStartDate, input.duration * 30);
    }
  }

  if (input.mode === "current_cycle") {
    const { error: closeError } = await supabase
      .from("memberships")
      .update({
        end_date: newStartDate,
        status: "cancelled",
      })
      .eq("id", current.id);

    if (closeError) {
      return { error: closeError.message ?? "Failed to update current membership" };
    }
  }

  const { data: newMembership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      member_id: input.memberId,
      seat_id: input.seatId,
      start_date: newStartDate,
      end_date: newEndDate,
      amount_paid: input.amountPaid,
      batch: "24x7 Batch",
      status: "active",
      remarks: input.remarks ?? null,
    })
    .select("id")
    .single();

  if (membershipError || !newMembership) {
    if (input.mode === "current_cycle") {
      await supabase
        .from("memberships")
        .update({
          end_date: currentEndDate,
          status: current.status,
        })
        .eq("id", current.id);
    }
    return { error: membershipError?.message ?? "Failed to create 24x7 membership" };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    membership_id: newMembership.id,
    amount: payment.amount,
    payment_date: today,
    method: payment.method,
    cash_amount: payment.cash_amount,
    upi_amount: payment.upi_amount,
    notes: input.remarks ?? null,
  });

  if (paymentError) {
    await supabase.from("memberships").delete().eq("id", newMembership.id);
    if (input.mode === "current_cycle") {
      await supabase
        .from("memberships")
        .update({
          end_date: currentEndDate,
          status: current.status,
        })
        .eq("id", current.id);
    }
    return { error: paymentError.message };
  }

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${input.memberId}`);
  revalidatePath("/dashboard/seats");
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMembershipRecord(input: {
  membershipId: string;
  memberId: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  batch: BatchOption;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  upiAmount?: number;
  remarks?: string;
}) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };
  if (!isBatchOption(input.batch)) return { error: "Invalid batch selected" };

  if (!input.startDate || !input.endDate) {
    return { error: "Start and end dates are required" };
  }
  if (input.endDate <= input.startDate) {
    return { error: "End date must be after start date" };
  }

  const paymentDetails = normalizePaymentDetails({
    amount: input.amountPaid,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();

  const { data: current, error: currentError } = await supabase
    .from("memberships")
    .select("id, member_id, start_date, end_date")
    .eq("id", input.membershipId)
    .maybeSingle();

  if (currentError || !current) return { error: "Membership not found" };
  if (current.member_id !== input.memberId) return { error: "Membership does not belong to the selected member" };

  const { error: membershipError } = await supabase
    .from("memberships")
    .update({
      start_date: input.startDate,
      end_date: input.endDate,
      amount_paid: input.amountPaid,
      batch: input.batch,
      remarks: input.remarks ?? null,
    })
    .eq("id", input.membershipId);

  if (membershipError) return { error: membershipError.message };

  const { data: paymentRow, error: paymentFetchError } = await supabase
    .from("payments")
    .select("id")
    .eq("membership_id", input.membershipId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (paymentFetchError) return { error: paymentFetchError.message };

  if (paymentRow) {
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        amount: payment.amount,
        payment_date: input.paymentDate,
        method: payment.method,
        cash_amount: payment.cash_amount,
        upi_amount: payment.upi_amount,
      })
      .eq("id", paymentRow.id);

    if (paymentError) return { error: paymentError.message };
  } else {
    const { error: paymentError } = await supabase.from("payments").insert({
      membership_id: input.membershipId,
      amount: payment.amount,
      payment_date: input.paymentDate,
      method: payment.method,
      cash_amount: payment.cash_amount,
      upi_amount: payment.upi_amount,
    });

    if (paymentError) return { error: paymentError.message };
  }

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${input.memberId}`);
  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function pauseMembership(input: {
  membershipId: string;
  memberId: string;
}) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("memberships")
    .select("id, member_id, status")
    .eq("id", input.membershipId)
    .maybeSingle();

  if (fetchError || !current) return { error: "Membership not found" };
  if (current.member_id !== input.memberId) return { error: "Membership does not belong to this member" };
  if (current.status !== "active") return { error: "Only active memberships can be paused" };

  const today = new Date().toISOString().slice(0, 10);

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ status: "paused", paused_at: today, seat_id: null })
    .eq("id", input.membershipId);

  if (updateError) return { error: updateError.message };

  await supabase.from("membership_events").insert({
    membership_id: input.membershipId,
    event_type: "paused",
    event_date: today,
  });

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${input.memberId}`);
  revalidatePath("/dashboard/seats");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function resumeMembership(input: {
  membershipId: string;
  memberId: string;
  seatId: string;
}) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("memberships")
    .select("id, member_id, status, paused_at, end_date, total_paused_days")
    .eq("id", input.membershipId)
    .maybeSingle();

  if (fetchError || !current) return { error: "Membership not found" };
  if (current.member_id !== input.memberId) return { error: "Membership does not belong to this member" };
  if (current.status !== "paused") return { error: "Membership is not paused" };
  if (!current.paused_at) return { error: "Paused date missing" };

  const { data: seat, error: seatError } = await supabase
    .from("seat_status")
    .select("seat_id, is_active, occupancy_status")
    .eq("seat_id", input.seatId)
    .maybeSingle();

  if (seatError || !seat) return { error: "Seat not found" };
  if (!seat.is_active) return { error: "Seat is not active" };
  if (seat.occupancy_status !== "available") return { error: "Selected seat is already occupied" };

  const today = new Date().toISOString().slice(0, 10);
  const pausedDate = new Date(current.paused_at);
  const todayDate = new Date(today);
  const daysPaused = Math.round((todayDate.getTime() - pausedDate.getTime()) / 86400000);

  const newEndDate = addDaysToIsoDate(current.end_date, daysPaused);
  const newTotalPausedDays = (current.total_paused_days ?? 0) + daysPaused;

  const { error: updateError } = await supabase
    .from("memberships")
    .update({
      status: "active",
      paused_at: null,
      total_paused_days: newTotalPausedDays,
      end_date: newEndDate,
      seat_id: input.seatId,
    })
    .eq("id", input.membershipId);

  if (updateError) return { error: updateError.message };

  await supabase.from("membership_events").insert({
    membership_id: input.membershipId,
    event_type: "resumed",
    event_date: today,
    note: `${daysPaused} day${daysPaused !== 1 ? "s" : ""} paused — end date extended to ${newEndDate}`,
  });

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${input.memberId}`);
  revalidatePath("/dashboard/seats");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMemberProfile(input: {
  memberId: string;
  fullName: string;
  phone: string;
  email?: string;
}) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email?.trim() ?? "";

  if (!fullName) return { error: "Member name is required" };
  if (!phone) return { error: "Phone number is required" };

  const supabase = await createClient();

  const { data: duplicate, error: duplicateError } = await supabase
    .from("members")
    .select("id")
    .eq("phone", phone)
    .neq("id", input.memberId)
    .maybeSingle();

  if (duplicateError) return { error: duplicateError.message };
  if (duplicate) return { error: "Another member already uses this phone number" };

  const { error } = await supabase
    .from("members")
    .update({
      full_name: fullName,
      phone,
      email: email || null,
    })
    .eq("id", input.memberId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/members");
  revalidatePath(`/dashboard/members/${input.memberId}`);
  revalidatePath("/dashboard/seats");
  revalidatePath("/dashboard/lockers");
  revalidatePath("/dashboard");
  return { success: true };
}
