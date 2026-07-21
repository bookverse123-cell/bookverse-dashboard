"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data";
import { isBatchOption, type BatchOption } from "@/lib/batches";
import { revalidatePath } from "next/cache";

export type AssignSeatInput = {
  seatId: string;
  fullName: string;
  phone: string;
  email?: string;
  duration: 1 | 2 | 3;
  startDate: string;
  amountPaid: number;
  batch: BatchOption;
  paymentMethod: "cash" | "upi" | "card" | "bank_transfer" | "other" | "upi_cash";
  cashAmount?: number;
  upiAmount?: number;
  remarks?: string;
};

const PAYMENT_METHODS = new Set(["cash", "upi", "card", "bank_transfer", "other", "upi_cash"]);

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

function revalidateAll() {
  revalidatePath("/dashboard/seats");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/finance");
}

function revalidateMemberPage(memberId: string) {
  revalidatePath(`/dashboard/members/${memberId}`);
}

export async function assignSeat(input: AssignSeatInput) {
  if (!isSupabaseConfigured()) {
    return {
      error: "Connect Supabase first (see README) — demo data is read-only.",
    };
  }

  if (!isBatchOption(input.batch)) {
    return { error: "Invalid batch selected" };
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

  // find or create member by phone
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

  const [sy, sm, sd] = input.startDate.split("-").map(Number);
  const targetMonth = sm - 1 + input.duration; // 0-indexed months
  const lastDayOfTarget = new Date(Date.UTC(sy, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(sd, lastDayOfTarget);
  const endDate = new Date(Date.UTC(sy, targetMonth, clampedDay)).toISOString().slice(0, 10);

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      member_id: memberId,
      seat_id: input.seatId,
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
    return {
      error:
        membershipError?.message ??
        "Failed to create membership (the seat may already be occupied)",
    };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    membership_id: membership.id,
    amount: payment.amount,
    payment_date: input.startDate,
    method: payment.method,
    cash_amount: payment.cash_amount,
    upi_amount: payment.upi_amount,
  });
  if (paymentError) return { error: paymentError.message };

  revalidateAll();
  return { success: true };
}

export async function endMembership(membershipId: string) {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Connect Supabase first (see README) — demo data is read-only.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ status: "cancelled" })
    .eq("id", membershipId);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export type RenewInput = {
  membershipId: string;
  amount: number;
  duration: 1 | 2 | 3;
  startFrom: "today" | "end_date";
  batch: BatchOption;
  paymentMethod: "cash" | "upi" | "card" | "bank_transfer" | "other" | "upi_cash";
  cashAmount?: number;
  upiAmount?: number;
  remarks?: string;
};

export async function renewMembership(input: RenewInput) {
  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase first — demo data is read-only." };
  }

  if (!isBatchOption(input.batch)) {
    return { error: "Invalid batch selected" };
  }

  const paymentDetails = normalizePaymentDetails({
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize payment details" };

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("memberships")
    .select("id, member_id, seat_id, end_date, status")
    .eq("id", input.membershipId)
    .single();

  if (fetchError || !current) {
    return { error: "Membership not found" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const newStart = input.startFrom === "today" ? today : current.end_date;
  const [ry, rm, rd] = newStart.split("-").map(Number);
  const rTargetMonth = rm - 1 + input.duration;
  const rLastDay = new Date(Date.UTC(ry, rTargetMonth + 1, 0)).getUTCDate();
  const rClampedDay = Math.min(rd, rLastDay);
  const newEnd = new Date(Date.UTC(ry, rTargetMonth, rClampedDay)).toISOString().slice(0, 10);

  // Close previous membership period so history stays intact.
  const previousStatus: "expired" | "cancelled" = newStart >= current.end_date ? "expired" : "cancelled";
  const { error: closeError } = await supabase
    .from("memberships")
    .update({
      status: previousStatus,
    })
    .eq("id", input.membershipId);

  if (closeError) return { error: closeError.message };

  const { data: newMembership, error: insertError } = await supabase
    .from("memberships")
    .insert({
      member_id: current.member_id,
      seat_id: current.seat_id,
      start_date: newStart,
      end_date: newEnd,
      amount_paid: input.amount,
      batch: input.batch,
      status: "active",
      remarks: input.remarks ?? null,
    })
    .select("id")
    .single();

  if (insertError || !newMembership) {
    await supabase
      .from("memberships")
      .update({ status: current.status })
      .eq("id", input.membershipId);
    return { error: insertError?.message ?? "Failed to create renewed membership" };
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    membership_id: newMembership.id,
    amount: payment.amount,
    payment_date: today,
    method: payment.method,
    cash_amount: payment.cash_amount,
    upi_amount: payment.upi_amount,
  });
  if (paymentError) {
    await supabase.from("memberships").delete().eq("id", newMembership.id);
    await supabase
      .from("memberships")
      .update({ status: current.status })
      .eq("id", input.membershipId);
    return { error: paymentError.message };
  }

  revalidateAll();
  revalidateMemberPage(current.member_id);
  return { success: true };
}

export type ChangeSeatInput = {
  membershipId: string;
  targetSeatId: string;
};

export async function changeSeat(input: ChangeSeatInput) {
  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase first — demo data is read-only." };
  }

  const supabase = await createClient();

  const { data: current, error: membershipError } = await supabase
    .from("memberships")
    .select("id, member_id, seat_id, status")
    .eq("id", input.membershipId)
    .single();

  if (membershipError || !current) {
    return { error: "Membership not found" };
  }

  if (current.status !== "active") {
    return { error: "Only active memberships can change seats" };
  }

  if (current.seat_id === input.targetSeatId) {
    return { success: true };
  }

  const { data: targetSeat, error: seatError } = await supabase
    .from("seat_status")
    .select("seat_id, is_active, occupancy_status")
    .eq("seat_id", input.targetSeatId)
    .maybeSingle();

  if (seatError || !targetSeat) {
    return { error: "Target seat not found" };
  }

  if (!targetSeat.is_active) {
    return { error: "Target seat is not active" };
  }

  if (targetSeat.occupancy_status !== "available") {
    return { error: "Target seat is already assigned" };
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ seat_id: input.targetSeatId })
    .eq("id", input.membershipId)
    .eq("status", "active");

  if (updateError) {
    return {
      error:
        updateError.code === "23505"
          ? "Target seat was assigned just now. Pick another seat."
          : updateError.message,
    };
  }

  revalidateAll();
  revalidateMemberPage(current.member_id);
  return { success: true };
}

export async function sendManualReminder(membershipId: string) {
  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase first — demo data is read-only." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke(
    "send-membership-reminders",
    { body: { membershipId } }
  );
  if (error) return { error: error.message };
  revalidatePath("/dashboard/seats");
  return { success: true, data };
}
