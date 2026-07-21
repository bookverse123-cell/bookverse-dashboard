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
};

export async function addDailyPass(input: DailyPassInput) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.from("daily_passes").insert({
    full_name: input.full_name,
    phone: input.phone,
    date: input.date,
    amount: 200,
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
