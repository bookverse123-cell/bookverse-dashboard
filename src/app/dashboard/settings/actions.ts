"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/data";
import { revalidatePath } from "next/cache";

const DEMO_ERROR = "Connect Supabase first (see README) — demo data is read-only.";

export async function updatePlanPrice(planId: string, price: number) {
  if (!isSupabaseConfigured()) return { error: DEMO_ERROR };

  const supabase = await createClient();
  const { error } = await supabase
    .from("membership_plans")
    .update({ price })
    .eq("id", planId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/seats");
  return { success: true };
}
