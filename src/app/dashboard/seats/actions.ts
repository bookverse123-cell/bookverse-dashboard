"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data";
import { revalidatePath } from "next/cache";

export type AssignSeatInput = {
  seatId: string;
  fullName: string;
  phone: string;
  email?: string;
  planId: string;
  startDate: string;
  amountPaid: number;
  paymentMethod: string;
};

function revalidateAll() {
  revalidatePath("/dashboard/seats");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/finance");
}

export async function assignSeat(input: AssignSeatInput) {
  if (!isSupabaseConfigured()) {
    return {
      error:
        "Connect Supabase first (see README) — demo data is read-only.",
    };
  }

  const supabase = await createClient();

  // 1. find or create the member by phone number
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

  // 2. look up the plan to compute the membership end date
  const { data: plan, error: planError } = await supabase
    .from("membership_plans")
    .select("duration_months")
    .eq("id", input.planId)
    .single();

  if (planError || !plan) {
    return { error: "Selected plan was not found" };
  }

  const start = new Date(input.startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + plan.duration_months);
  const endDate = end.toISOString().slice(0, 10);

  // 3. create the membership
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      member_id: memberId,
      seat_id: input.seatId,
      plan_id: input.planId,
      start_date: input.startDate,
      end_date: endDate,
      amount_paid: input.amountPaid,
      status: "active",
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

  // 4. record the payment
  await supabase.from("payments").insert({
    membership_id: membership.id,
    amount: input.amountPaid,
    payment_date: input.startDate,
    method: input.paymentMethod,
  });

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
