"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data";
import { revalidatePath } from "next/cache";

const DEMO_ERROR = "Connect Supabase first (see README) — demo data is read-only.";

function revalidateAll() {
  revalidatePath("/dashboard/lockers");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard");
}

export async function allocateLocker(input: { lockerId: string; memberId: string; assignedAt: string; notes?: string }) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

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
    notes: input.notes ?? null,
    status: "active",
  });

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
