"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data";
import { revalidatePath } from "next/cache";

const DEMO_ERROR = "Connect Supabase first (see README) — demo data is read-only.";
type LockerPaymentMethod = "cash" | "upi" | "cash_upi";

function normalizeLockerPayment(input: {
  price: number;
  paymentMethod: LockerPaymentMethod;
  cashAmount?: number;
  upiAmount?: number;
}) {
  const price = Number(input.price ?? 0);
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Locker price must be zero or greater" };
  }

  if (input.paymentMethod !== "cash_upi") {
    return {
      payment: {
        price,
        payment_method: input.paymentMethod,
        cash_amount: null as number | null,
        upi_amount: null as number | null,
      },
    };
  }

  const cashAmount = Number(input.cashAmount ?? 0);
  const upiAmount = Number(input.upiAmount ?? 0);

  if (!Number.isFinite(cashAmount) || !Number.isFinite(upiAmount)) {
    return { error: "Enter valid split amounts for cash and UPI" };
  }
  if (cashAmount <= 0 || upiAmount <= 0) {
    return { error: "Cash + UPI requires both split amounts" };
  }

  const total = Number((cashAmount + upiAmount).toFixed(2));
  const expected = Number(price.toFixed(2));
  if (total !== expected) {
    return { error: "Cash + UPI must exactly match locker price" };
  }

  return {
    payment: {
      price: expected,
      payment_method: "cash_upi" as const,
      cash_amount: cashAmount,
      upi_amount: upiAmount,
    },
  };
}

function revalidateAll() {
  revalidatePath("/dashboard/lockers");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
}

export async function allocateLocker(input: {
  lockerId: string;
  memberId: string;
  assignedAt: string;
  price: number;
  paymentMethod: LockerPaymentMethod;
  cashAmount?: number;
  upiAmount?: number;
  notes?: string;
}) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };
  const paymentDetails = normalizeLockerPayment({
    price: input.price,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize locker payment" };

  const supabase = await createClient();

  const { data: locker, error: lockerError } = await supabase
    .from("lockers")
    .select("id, is_active")
    .eq("id", input.lockerId)
    .maybeSingle();

  if (lockerError || !locker) return { error: "Locker not found" };
  if (!locker.is_active) return { error: "Locker is not active" };

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("id", input.memberId)
    .maybeSingle();

  if (memberError || !member) return { error: "Member not found" };

  const { error } = await supabase.from("locker_allocations").insert({
    locker_id: input.lockerId,
    member_id: input.memberId,
    assigned_at: input.assignedAt,
    price: payment.price,
    payment_method: payment.payment_method,
    cash_amount: payment.cash_amount,
    upi_amount: payment.upi_amount,
    notes: input.notes ?? null,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function updateLockerAllocation(input: {
  allocationId: string;
  memberId: string;
  assignedAt: string;
  price: number;
  paymentMethod: LockerPaymentMethod;
  cashAmount?: number;
  upiAmount?: number;
  notes?: string;
}) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };
  const paymentDetails = normalizeLockerPayment({
    price: input.price,
    paymentMethod: input.paymentMethod,
    cashAmount: input.cashAmount,
    upiAmount: input.upiAmount,
  });
  if (paymentDetails.error) return { error: paymentDetails.error };
  const payment = paymentDetails.payment;
  if (!payment) return { error: "Failed to normalize locker payment" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("locker_allocations")
    .update({
      member_id: input.memberId,
      assigned_at: input.assignedAt,
      price: payment.price,
      payment_method: payment.payment_method,
      cash_amount: payment.cash_amount,
      upi_amount: payment.upi_amount,
      notes: input.notes ?? null,
    })
    .eq("id", input.allocationId)
    .eq("status", "active");

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function releaseLocker(input: { allocationId: string; releasedAt?: string }) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();
  const releaseDate = input.releasedAt ?? new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .from("locker_allocations")
    .update({ status: "released", released_at: releaseDate })
    .eq("id", input.allocationId)
    .eq("status", "active");

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}
