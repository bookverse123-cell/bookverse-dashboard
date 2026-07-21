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
  paymentMethod: string;
  remarks?: string;
};

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
    amount: input.amountPaid,
    payment_date: input.startDate,
    method: input.paymentMethod,
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
  paymentMethod: string;
  remarks?: string;
};

export async function renewMembership(input: RenewInput) {
  if (!isSupabaseConfigured()) {
    return { error: "Connect Supabase first — demo data is read-only." };
  }

  if (!isBatchOption(input.batch)) {
    return { error: "Invalid batch selected" };
  }

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
    amount: input.amount,
    payment_date: today,
    method: input.paymentMethod,
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
