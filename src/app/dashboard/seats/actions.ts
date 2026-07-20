"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data";
import { revalidatePath } from "next/cache";

export type AssignSeatInput = {
  seatId: string;
  fullName: string;
  phone: string;
  email?: string;
  duration: 1 | 2 | 3;
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
      error: "Connect Supabase first (see README) — demo data is read-only.",
    };
  }

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

  const start = new Date(input.startDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + input.duration);
  const endDate = end.toISOString().slice(0, 10);

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .insert({
      member_id: memberId,
      seat_id: input.seatId,
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

export type RenewInput = {
  membershipId: string;
  amount: number;
  duration: 1 | 2 | 3;
  startFrom: "today" | "end_date";
  paymentMethod: string;
};

export async function renewMembership(input: RenewInput) {
  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase first — demo data is read-only." };
  }

  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("memberships")
    .select("end_date")
    .eq("id", input.membershipId)
    .single();

  if (fetchError || !current) {
    return { error: "Membership not found" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const newStart = input.startFrom === "today" ? today : current.end_date;
  const startDate = new Date(newStart);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + input.duration);
  const newEnd = endDate.toISOString().slice(0, 10);

  const { error: updateError } = await supabase
    .from("memberships")
    .update({
      end_date: newEnd,
      amount_paid: input.amount,
      status: "active",
    })
    .eq("id", input.membershipId);

  if (updateError) return { error: updateError.message };

  await supabase.from("payments").insert({
    membership_id: input.membershipId,
    amount: input.amount,
    payment_date: today,
    method: input.paymentMethod,
  });

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
