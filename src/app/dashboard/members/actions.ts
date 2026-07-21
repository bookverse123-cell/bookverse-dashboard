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

export type AddUnassignedMembershipInput = {
  fullName: string;
  phone: string;
  email?: string;
  duration: 1 | 2 | 3 | 4 | 6;
  startDate: string;
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

  const [sy, sm, sd] = input.startDate.split("-").map(Number);
  const targetMonth = sm - 1 + input.duration;
  const lastDayOfTarget = new Date(Date.UTC(sy, targetMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(sd, lastDayOfTarget);
  const endDate = new Date(Date.UTC(sy, targetMonth, clampedDay)).toISOString().slice(0, 10);

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
